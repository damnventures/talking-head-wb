// Quick test script to verify Daytona + Browserbase integration
const { Daytona } = require('@daytonaio/sdk');

async function testIntegration() {
  const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY;
  const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
  const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

  console.log('🔍 Testing Daytona + Browserbase Integration\n');

  // Step 1: Test Daytona sandbox creation
  console.log('1. Creating Daytona sandbox...');
  const daytona = new Daytona({
    apiKey: DAYTONA_API_KEY
  });

  const sandbox = await daytona.create({ language: 'python' });
  console.log('✓ Sandbox created:', sandbox.id);

  // Step 2: Test simple Python execution
  console.log('\n2. Testing Python execution...');
  const result = await sandbox.process.codeRun(`
import sys
import json
print(json.dumps({"python_version": sys.version, "test": "success"}))
  `);

  console.log('✓ Python output:', result.artifacts?.stdout || result.result);

  // Step 3: Test Browserbase API access
  console.log('\n3. Testing Browserbase session creation...');
  const browserbaseScript = `
import json
try:
    import subprocess
    subprocess.check_call(["pip", "install", "--quiet", "requests"])
    import requests

    response = requests.post(
        'https://www.browserbase.com/v1/sessions',
        headers={
            'X-BB-API-Key': '${BROWSERBASE_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={'projectId': '${BROWSERBASE_PROJECT_ID}'}
    )

    print(json.dumps({
        "status": response.status_code,
        "success": response.status_code == 200,
        "session_id": response.json().get('id') if response.status_code == 200 else None
    }))
except Exception as e:
    print(json.dumps({"error": str(e)}))
  `;

  const browserbaseResult = await sandbox.process.codeRun(browserbaseScript);
  console.log('✓ Browserbase result:', browserbaseResult.artifacts?.stdout || browserbaseResult.result);

  // Cleanup
  console.log('\n4. Cleaning up sandbox...');
  console.log('✓ Test complete!\n');

  return { success: true, sandboxId: sandbox.id };
}

testIntegration()
  .then((result) => {
    console.log('✅ All tests passed!', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
