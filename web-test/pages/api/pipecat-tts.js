// Pipecat TTS API endpoint for ElevenLabs streaming
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

  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || req.body.apiKey;
    if (!ELEVENLABS_API_KEY) {
      res.status(500).json({ error: 'ElevenLabs API key not configured' });
      return;
    }

    console.log('Pipecat TTS request:', { text: text.substring(0, 50) + '...', voiceId });

    // Stream TTS from ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', response.status, errorText);
      res.status(response.status).json({ error: 'TTS generation failed' });
      return;
    }

    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe the audio stream directly to the client
    const reader = response.body.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Write chunk to response
        res.write(Buffer.from(value));
      }
      res.end();
    } catch (streamError) {
      console.error('Stream error:', streamError);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming failed' });
      }
    }

  } catch (error) {
    console.error('Pipecat TTS error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  }
}