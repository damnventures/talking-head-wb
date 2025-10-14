// Create anonymous Ready Player Me user
// Documentation: https://docs.readyplayer.me/ready-player-me/integration-guides/api-integration/user-management/anonymous-accounts

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

  try {
    const appId = process.env.RPM_APP_ID || '68ea95b878accbce7496609b';

    // Create anonymous user
    const response = await fetch('https://api.readyplayer.me/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appId: appId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RPM API error:', response.status, errorText);
      throw new Error(`Failed to create anonymous user: ${response.status}`);
    }

    const data = await response.json();

    // Response contains: { id, token, refreshToken, name, isAnonymous }
    res.status(200).json({
      userId: data.id,
      token: data.token,
      refreshToken: data.refreshToken,
      isAnonymous: data.isAnonymous
    });

  } catch (error) {
    console.error('Anonymous user creation error:', error);
    res.status(500).json({
      error: 'Failed to create anonymous user',
      message: error.message
    });
  }
}
