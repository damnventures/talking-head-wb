// Test script for pitch deck capsule

const CAPSULE_ID = '68ebf7dc162919c02535c0bf';
const API_KEY = '371266e010bcb7674532903e8678256a7d3292b3731a0dfba4ff6e2b6de5149b';
const QUESTION = 'What are the key elements of a successful pitch deck?';

async function testPitchDeckCapsule() {
  console.log('🔍 Testing pitch deck capsule...\n');
  console.log(`Capsule ID: ${CAPSULE_ID}`);
  console.log(`Question: ${QUESTION}\n`);

  try {
    // Step 1: Fetch context
    console.log('📥 Step 1: Fetching capsule context...');
    const contextResponse = await fetch(`https://api.shrinked.ai/capsules/${CAPSULE_ID}/context`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (!contextResponse.ok) {
      throw new Error(`Context fetch failed: ${contextResponse.status} ${contextResponse.statusText}`);
    }

    const context = await contextResponse.text();
    console.log(`✓ Context loaded: ${(context.length / 1024).toFixed(1)}KB\n`);
    console.log('Context preview (first 300 chars):');
    console.log(context.substring(0, 300) + '...\n');

    // Step 2: Get Craig's system prompt
    console.log('📋 Step 2: Fetching Craig prompt...');
    const promptResponse = await fetch('http://localhost:3000/api/argue-prompt');
    const { prompt: systemPrompt } = await promptResponse.json();
    console.log('✓ System prompt loaded\n');

    // Step 3: Call Craig worker
    console.log('🤖 Step 3: Calling Craig worker...');
    const workerUrl = 'https://craig-argue-machine.shrinked.workers.dev';
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: context,
        question: QUESTION,
        systemPrompt: systemPrompt
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Craig worker failed: ${response.status} - ${errorData}`);
    }

    // Step 4: Stream response
    console.log('📡 Step 4: Streaming response...\n');
    console.log('--- CRAIG\'S RESPONSE ---\n');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);

          if (parsed.type === 'response' && parsed.content?.chat) {
            process.stdout.write(parsed.content.chat);
            fullResponse += parsed.content.chat;
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }

    console.log('\n\n--- END RESPONSE ---\n');
    console.log(`✓ Response length: ${fullResponse.length} chars`);
    console.log(`✓ Test completed successfully!`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPitchDeckCapsule();
