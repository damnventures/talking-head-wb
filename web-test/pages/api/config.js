// Config API - Serves environment variables to frontend
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Return config from environment variables
  res.status(200).json({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    SHRINKED_API_KEY: process.env.SHRINKED_API_KEY || '',
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
    RPM_SUBDOMAIN: process.env.RPM_SUBDOMAIN || 'talking-head-5ujkzr',
    RPM_APP_ID: process.env.RPM_APP_ID || '68ea95b878accbce7496609b',
    RPM_ORG_ID: process.env.RPM_ORG_ID || '6393b25e42f042dec41108d1'
  });
}
