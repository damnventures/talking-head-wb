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
    // Extract the user's OpenAI API key from the request body
    const { userApiKey, ...requestBody } = req.body;

    console.log('DEBUG - API Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('DEBUG - Using User API Key:', userApiKey ? userApiKey.substring(0, 15) + '...' : 'Not provided');

    if (!userApiKey) {
      res.status(400).json({ error: 'User API key is required for Argue mode' });
      return;
    }

    // Forward the request to the actual Craig API using the user's OpenAI API key
    const response = await fetch('https://craig.shrinked.ai/api/argue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userApiKey}`
      },
      body: JSON.stringify(requestBody)
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