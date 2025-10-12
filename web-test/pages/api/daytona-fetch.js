import { Daytona } from '@daytonaio/sdk';

// Scheduled content discovery using Daytona containers (for daily automation)
// This endpoint creates a long-running Daytona container that can run daily scraping jobs
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let sandbox = null;

  try {
    const {
      topic,
      schedule = 'daily', // daily, hourly, once
      action = 'start' // start, stop, status
    } = req.method === 'POST' ? req.body : req.query;

    if (!topic && action === 'start') {
      res.status(400).json({ error: 'Topic is required to start scheduled scraping' });
      return;
    }

    const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY;
    const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
    const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

    if (!DAYTONA_API_KEY) {
      res.status(500).json({ error: 'Daytona API key not configured' });
      return;
    }

    console.log('🔍 [DAYTONA-FETCH] Action:', action, 'Topic:', topic);

    // Initialize Daytona SDK
    const daytona = new Daytona({
      apiKey: DAYTONA_API_KEY,
      serverUrl: process.env.DAYTONA_API_URL || 'https://app.daytona.io/api'
    });

    if (action === 'start') {
      // Create persistent Daytona sandbox for scheduled scraping
      console.log('🔍 [DAYTONA-FETCH] Creating Daytona sandbox for scheduled scraping...');
      sandbox = await daytona.create({
        language: 'python',
        // Try to enable network access (may be restricted by tier)
        networkAllowList: '0.0.0.0/0' // Full internet access
      });

      console.log('✓ [DAYTONA-FETCH] Sandbox created:', sandbox.id);

      // Python script for scheduled scraping
      const schedulerScript = `
import json
import sys
import time
from datetime import datetime

# Configuration
TOPIC = """${topic.replace(/"/g, '\\"')}"""
SCHEDULE = "${schedule}"
BROWSERBASE_API_KEY = """${BROWSERBASE_API_KEY || 'NOT_SET'}"""
BROWSERBASE_PROJECT_ID = """${BROWSERBASE_PROJECT_ID || 'NOT_SET'}"""

print(f"🤖 Daytona Scheduled Scraper Started", file=sys.stderr)
print(f"📋 Topic: {TOPIC}", file=sys.stderr)
print(f"⏰ Schedule: {SCHEDULE}", file=sys.stderr)
print(f"🆔 Browserbase Project: {BROWSERBASE_PROJECT_ID}", file=sys.stderr)

# Install dependencies
try:
    import subprocess
    print("📦 Installing dependencies...", file=sys.stderr)
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", "requests"])
    import requests
    print("✓ Dependencies installed", file=sys.stderr)
except Exception as e:
    print(f"❌ Dependency installation failed: {e}", file=sys.stderr)
    sys.exit(1)

def scrape_youtube_simple(topic):
    """Simplified YouTube scraping using Browserbase API"""
    try:
        # Create Browserbase session
        print(f"🌐 Creating Browserbase session for: {topic}", file=sys.stderr)

        session_response = requests.post(
            'https://www.browserbase.com/v1/sessions',
            headers={
                'X-BB-API-Key': BROWSERBASE_API_KEY,
                'Content-Type': 'application/json'
            },
            json={'projectId': BROWSERBASE_PROJECT_ID},
            timeout=30
        )

        if session_response.status_code != 200:
            print(f"❌ Browserbase session failed: {session_response.text}", file=sys.stderr)
            return {"error": "Failed to create Browserbase session", "results": []}

        session_data = session_response.json()
        session_id = session_data.get('id')

        print(f"✓ Browserbase session created: {session_id}", file=sys.stderr)

        # Note: Full scraping would require Playwright which has network issues in Daytona
        # This is a placeholder for the scheduled job structure

        return {
            "success": True,
            "topic": topic,
            "timestamp": datetime.now().isoformat(),
            "session_id": session_id,
            "message": "Scraper container running - full implementation requires network access"
        }

    except Exception as e:
        print(f"❌ Scraping error: {e}", file=sys.stderr)
        return {"error": str(e), "results": []}

# Determine run frequency
if SCHEDULE == "once":
    print("▶️ Running scraper once...", file=sys.stderr)
    result = scrape_youtube_simple(TOPIC)
    print(json.dumps(result))
elif SCHEDULE == "hourly":
    print("▶️ Starting hourly scraper (will run indefinitely)...", file=sys.stderr)
    iteration = 0
    while True:
        iteration += 1
        print(f"\\n🔄 Iteration {iteration} at {datetime.now().isoformat()}", file=sys.stderr)
        result = scrape_youtube_simple(TOPIC)
        print(json.dumps(result))
        print(f"⏳ Sleeping for 1 hour...", file=sys.stderr)
        time.sleep(3600)  # 1 hour
elif SCHEDULE == "daily":
    print("▶️ Starting daily scraper (will run indefinitely)...", file=sys.stderr)
    iteration = 0
    while True:
        iteration += 1
        print(f"\\n🔄 Iteration {iteration} at {datetime.now().isoformat()}", file=sys.stderr)
        result = scrape_youtube_simple(TOPIC)
        print(json.dumps(result))
        print(f"⏳ Sleeping for 24 hours...", file=sys.stderr)
        time.sleep(86400)  # 24 hours
else:
    print(f"❌ Invalid schedule: {SCHEDULE}", file=sys.stderr)
    sys.exit(1)
`;

      // Execute scheduler script
      console.log('🔍 [DAYTONA-FETCH] Starting scheduler...');
      const execResult = await sandbox.process.codeRun(schedulerScript);

      console.log('✓ [DAYTONA-FETCH] Scheduler started');

      // Parse results
      const output = execResult.artifacts?.stdout || execResult.result || '';
      let schedulerStatus;

      try {
        // Try to parse JSON from output
        const lines = output.split('\n').filter(line => line.trim().startsWith('{'));
        if (lines.length > 0) {
          schedulerStatus = JSON.parse(lines[0]);
        } else {
          schedulerStatus = { message: 'Scheduler started', output: output.substring(0, 500) };
        }
      } catch (e) {
        schedulerStatus = { message: 'Scheduler started', raw_output: output.substring(0, 500) };
      }

      return res.status(200).json({
        success: true,
        action: 'started',
        sandboxId: sandbox.id,
        topic: topic,
        schedule: schedule,
        status: schedulerStatus,
        message: `Daytona container ${sandbox.id} started for ${schedule} scraping of "${topic}"`,
        note: 'Container will run in background. Use GET /api/daytona-fetch?sandboxId=<id> to check status'
      });

    } else if (action === 'status') {
      return res.status(200).json({
        success: true,
        message: 'Status check not yet implemented - use Daytona dashboard to monitor containers',
        note: 'Visit https://app.daytona.io to view running sandboxes'
      });

    } else if (action === 'stop') {
      return res.status(200).json({
        success: true,
        message: 'Stop not yet implemented - use Daytona dashboard to stop containers',
        note: 'Visit https://app.daytona.io to manage sandboxes'
      });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use: start, stop, or status' });
    }

  } catch (error) {
    console.error('Daytona fetch error:', error);

    res.status(500).json({
      error: 'Daytona scheduled fetch failed',
      message: error.message,
      note: 'Make sure you have Daytona credits and proper network access (Tier 3/4)'
    });
  }
}
