// Next.js API route to proxy Argue requests and bypass CORS
export default async function handler(req, res) {
  // Set CORS headers to allow our frontend
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
    // Use the Shrinked API key from environment variables or fallback
    const shrinkedApiKey = process.env.SHRINKED_API_KEY || '371266e010bcb7674532903e8678256a7d3292b3731a0dfba4ff6e2b6de5149b';

    console.log('DEBUG - API Request Body:', JSON.stringify(req.body, null, 2));
    console.log('DEBUG - Using Shrinked API Key:', shrinkedApiKey.substring(0, 10) + '...');

    // Forward the request to the actual Craig API using the Shrinked API key
    const response = await fetch('https://craig.shrinked.ai/api/argue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shrinkedApiKey}`
      },
      body: JSON.stringify(req.body)
    });

    console.log('DEBUG - Craig API Response Status:', response.status);
    console.log('DEBUG - Craig API Response Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('DEBUG - Craig API Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('DEBUG - API request failed with data:', data);
      res.status(response.status).json({ error: data.error || 'API request failed' });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Argue API proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}