// Production Configuration - Environment variables
// This file will be used on Vercel with environment variables

window.CONFIG = {
    // OpenAI Configuration
    OPENAI_API_KEY: process.env.VERCEL_ENV ?
        (typeof window !== 'undefined' && window.VITE_OPENAI_API_KEY) || 'PLACEHOLDER_OPENAI_KEY' :
        'PLACEHOLDER_OPENAI_KEY',

    // ElevenLabs Configuration (for high-quality TTS via Pipecat)
    ELEVENLABS_API_KEY: process.env.VERCEL_ENV ?
        (typeof window !== 'undefined' && window.VITE_ELEVENLABS_API_KEY) || 'PLACEHOLDER_ELEVENLABS_KEY' :
        'PLACEHOLDER_ELEVENLABS_KEY',

    // Ready Player Me Configuration
    RPM_SUBDOMAIN: 'talking-head-5ujkzr',
    RPM_APP_ID: '68ea95b878accbce7496609b',
    RPM_ORG_ID: '6393b25e42f042dec41108d1'
};