// Pipecat TTS API endpoint for ElevenLabs with word-level timing alignment
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
    const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = req.body; // Adam - Deep, narrative male voice (realistic)

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

    // Use ElevenLabs /text-to-speech-with-timestamps endpoint for alignment data
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
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

    const data = await response.json();

    // Extract audio and alignment data
    // ElevenLabs returns: { audio_base64, alignment: { characters, character_start_times_seconds, character_end_times_seconds } }
    const audioBuffer = Buffer.from(data.audio_base64, 'base64');
    const alignment = data.alignment;

    // Convert character-level timestamps to word-level timestamps in milliseconds
    const words = [];
    const wtimes = []; // Start times in milliseconds
    const wdurations = []; // Durations in milliseconds

    if (alignment && alignment.characters && alignment.character_start_times_seconds) {
      let currentWord = '';
      let wordStartTime = null;

      for (let i = 0; i < alignment.characters.length; i++) {
        const char = alignment.characters[i];
        const startTime = alignment.character_start_times_seconds[i] * 1000; // Convert to ms
        const endTime = alignment.character_end_times_seconds[i] * 1000; // Convert to ms

        // Check if character is a word boundary (space or punctuation)
        if (char === ' ' || char === '.' || char === ',' || char === '!' || char === '?') {
          if (currentWord.length > 0) {
            words.push(currentWord);
            wtimes.push(wordStartTime);
            wdurations.push(startTime - wordStartTime); // Duration from word start to current position
            currentWord = '';
            wordStartTime = null;
          }
        } else {
          if (wordStartTime === null) {
            wordStartTime = startTime;
          }
          currentWord += char;
        }
      }

      // Add the last word if exists
      if (currentWord.length > 0 && wordStartTime !== null) {
        words.push(currentWord);
        wtimes.push(wordStartTime);
        const lastEndTime = alignment.character_end_times_seconds[alignment.characters.length - 1] * 1000;
        wdurations.push(lastEndTime - wordStartTime);
      }
    }

    console.log('Generated word alignment:', { wordCount: words.length, words: words.slice(0, 5) });

    // Return JSON with audio and alignment data for TalkingHead
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      audio: audioBuffer.toString('base64'), // Base64 encoded audio
      words: words,
      wtimes: wtimes, // Milliseconds
      wdurations: wdurations // Milliseconds
    });

  } catch (error) {
    console.error('Pipecat TTS error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  }
}