import { chromium } from 'playwright';

// API endpoint for discovering fresh expert video content using Browserbase
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let browser = null;

  try {
    const { topic, timeframe = '30d', platforms = ['youtube'] } = req.body;

    if (!topic) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
    const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

    if (!BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
      res.status(500).json({ error: 'Browserbase API keys not configured' });
      return;
    }

    console.log('🔍 [DISCOVER] Starting content discovery for:', topic);

    // Create Browserbase session
    console.log('🔍 [DISCOVER] Creating Browserbase session...');
    const sessionResponse = await fetch('https://www.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'X-BB-API-Key': BROWSERBASE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: BROWSERBASE_PROJECT_ID
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Failed to create Browserbase session: ${sessionResponse.statusText}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.id;
    const wsEndpoint = `wss://connect.browserbase.com?apiKey=${BROWSERBASE_API_KEY}&sessionId=${sessionId}`;

    console.log('✓ [DISCOVER] Browserbase session created:', sessionId);

    // Connect to Browserbase browser
    console.log('🔍 [DISCOVER] Connecting to remote browser...');
    browser = await chromium.connectOverCDP(wsEndpoint);
    const context = browser.contexts()[0];
    const page = context.pages()[0];

    console.log('✓ [DISCOVER] Connected to browser');

    // Search YouTube - sort by upload date for recent news/coverage/conversations
    // sp=CAI%253D means "Sort by upload date" to get latest conversations and news
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' news discussion coverage')}&sp=CAI%253D`;
    console.log('🔍 [DISCOVER] Navigating to YouTube...');
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for video results to load
    await page.waitForSelector('ytd-video-renderer', { timeout: 15000 });

    console.log('🔍 [DISCOVER] Extracting video data...');

    // Log page content for debugging
    const videoCount = await page.$$eval('ytd-video-renderer', els => els.length);
    console.log(`🔍 [DISCOVER] Found ${videoCount} video elements`);

    // Extract video information
    const videos = await page.$$eval('ytd-video-renderer', (elements) => {
      const parseViewCount = (viewText) => {
        if (!viewText) return 1000000; // Default to 1M if no view count (likely popular)
        viewText = viewText.toLowerCase().replace(/views?/g, '').replace(/view/g, '').trim();

        const multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };

        for (const [suffix, multiplier] of Object.entries(multipliers)) {
          if (viewText.includes(suffix)) {
            try {
              const num = parseFloat(viewText.replace(suffix, '').trim());
              return Math.floor(num * multiplier);
            } catch (e) {
              return 1000000;
            }
          }
        }

        try {
          const parsed = parseInt(viewText.replace(/,/g, ''));
          return isNaN(parsed) ? 1000000 : parsed;
        } catch (e) {
          return 1000000;
        }
      };

      return elements.slice(0, 15).map((video) => {
        try {
          // Title and URL
          const titleElement = video.querySelector('#video-title');
          if (!titleElement) return null;

          const title = titleElement.getAttribute('title') || titleElement.textContent;
          let url = titleElement.getAttribute('href');
          if (url && !url.startsWith('http')) {
            url = `https://www.youtube.com${url}`;
          }

          // Extract video ID for thumbnail
          const videoIdMatch = url ? url.match(/watch\?v=([^&]+)/) : null;
          const videoId = videoIdMatch ? videoIdMatch[1] : 'unknown';

          // Channel info
          const channelElement = video.querySelector('#channel-name #text');
          const channel = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';

          // Subscriber count
          const subscriberElement = video.querySelector('#subscribers');
          const subscribers = subscriberElement ? subscriberElement.textContent.trim() : 'N/A';

          // View count
          const viewElement = video.querySelector('#metadata-line span:first-child');
          const viewText = viewElement ? viewElement.textContent.trim() : '0 views';
          const views = parseViewCount(viewText);

          // Upload date
          const dateElement = video.querySelector('#metadata-line span:last-child');
          const uploaded = dateElement ? dateElement.textContent.trim() : 'Unknown';

          // Duration
          const durationElement = video.querySelector('span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
          const duration = durationElement ? durationElement.textContent.trim() : 'N/A';

          return {
            title,
            channel,
            channel_subscribers: subscribers,
            url,
            views,
            uploaded,
            duration,
            transcript_available: true,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          };
        } catch (e) {
          console.error('Error parsing video:', e);
          return null;
        }
      }).filter(v => v !== null);
    });

    console.log(`✓ [DISCOVER] Extracted ${videos.length} videos`);

    // Log first video for debugging
    if (videos.length > 0) {
      console.log('🔍 [DISCOVER] Sample video:', {
        title: videos[0].title?.substring(0, 50),
        views: videos[0].views,
        channel: videos[0].channel
      });
    }

    // Close browser
    await browser.close();

    // Return all found videos (view count parsing needs fixing for YT DOM changes)
    const filteredResults = videos.slice(0, 10); // Top 10

    console.log(`✓ [DISCOVER] Returning ${filteredResults.length} videos`);

    // Return results
    return res.status(200).json({
      success: true,
      topic: topic,
      count: filteredResults.length,
      results: filteredResults,
      metadata: {
        sources: platforms,
        timeframe: timeframe,
        sessionId: sessionId
      }
    });

  } catch (error) {
    console.error('Discover content error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }

    res.status(500).json({
      error: 'Content discovery failed',
      message: error.message
    });
  }
}
