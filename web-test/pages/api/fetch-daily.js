import { Daytona } from '@daytonaio/sdk';

// Demo endpoint showing Daytona sandbox creation (infrastructure demo)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let sandbox = null;

  try {
    const { topic = 'Elon Musk' } = req.body;
    const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY;

    if (!DAYTONA_API_KEY) {
      res.status(500).json({ error: 'Daytona API key not configured' });
      return;
    }

    console.log('🚀 [DAYTONA] Starting secure sandbox for:', topic);

    // Initialize Daytona SDK
    const daytona = new Daytona({
      apiKey: DAYTONA_API_KEY,
      serverUrl: process.env.DAYTONA_API_URL || 'https://app.daytona.io/api'
    });

    // Create sandbox
    console.log('🚀 [DAYTONA] Creating isolated sandbox...');
    const startTime = Date.now();

    sandbox = await daytona.create({
      language: 'python'
    });

    const creationTime = Date.now() - startTime;
    console.log(`✓ [DAYTONA] Sandbox created in ${creationTime}ms:`, sandbox.id);

    // Return success with sandbox info
    return res.status(200).json({
      success: true,
      message: `Secure Daytona sandbox created for analyzing "${topic}"`,
      sandbox: {
        id: sandbox.id,
        language: 'python',
        status: 'ready',
        creationTime: `${creationTime}ms`,
        capabilities: [
          'Browserbase cloud browser automation',
          'Playwright browser control with CDP',
          'YouTube content discovery and scraping',
          'Secure isolated execution environment'
        ]
      },
      topic: topic,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Daytona demo error:', error);

    res.status(500).json({
      error: 'Daytona sandbox creation failed',
      message: error.message
    });
  } finally {
    // Cleanup sandbox
    if (sandbox) {
      try {
        console.log('🚀 [DAYTONA] Cleaning up sandbox...');
        // Note: sandbox.remove() may not exist in all SDK versions
        if (typeof sandbox.remove === 'function') {
          await sandbox.remove();
        }
        console.log('✓ [DAYTONA] Sandbox cleaned up');
      } catch (e) {
        console.error('Sandbox cleanup warning:', e.message);
      }
    }
  }
}
