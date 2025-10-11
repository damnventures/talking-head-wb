# TalkBitch Web App - Vercel Deployment

React-based web application with Ready Player Me avatars, OpenAI chat, and Craig Argue integration.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Option 1: Deploy from GitHub
1. Push this `web-test` folder to a GitHub repository
2. Connect the repository to Vercel
3. Deploy will automatically use `web-test` as the root directory

### Option 2: Deploy via Vercel CLI
```bash
cd web-test
vercel --prod
```

## ⚙️ Environment Variables

Set these in your Vercel dashboard under Settings → Environment Variables:

```bash
# Required for production
VITE_OPENAI_API_KEY=sk-proj-your-openai-key-here
VITE_ELEVENLABS_API_KEY=sk_your-elevenlabs-key-here
```

## 🎯 Features

- ✅ **Avatar System**: Ready Player Me with facial animations
- ✅ **Dual Chat Modes**: Friendly AI + Craig (argumentative)
- ✅ **Voice Synthesis**: ElevenLabs TTS integration
- ✅ **API Proxy**: `/api/argue` endpoint for Craig integration
- ✅ **CORS Resolved**: Server-side API proxy
- ✅ **Mobile Responsive**: Touch-optimized interface

## 📁 Project Structure

```
web-test/
├── api/argue.js              # Vercel API function for Craig
├── src/index.jsx            # Main React component
├── dist/                    # Build output
├── vercel.json             # Vercel configuration
├── package.json            # Dependencies and scripts
└── webpack.config.js       # Build configuration
```

## 🔑 API Keys Required

1. **OpenAI API Key**: For conversational AI
   - Get from: https://platform.openai.com/
   - Set as: `VITE_OPENAI_API_KEY`

2. **ElevenLabs API Key**: For voice synthesis
   - Get from: https://elevenlabs.io/
   - Set as: `VITE_ELEVENLABS_API_KEY`

3. **Craig Argue Key**: Already configured (`371266e010bcb7674532903e8678256a7d3292b3731a0dfba4ff6e2b6de5149b`)

## 🎮 Usage

### Friendly Chat Mode
- Default conversational AI
- Uses OpenAI GPT-4o
- Natural, helpful responses

### Craig Argue Mode
- Toggle to "Argue" mode
- Enter capsule ID: `68c32cf3735fb4ac0ef3ccbf`
- Get John Oliver-style argumentative responses
- Uses personal context from Signal app capsules

## 📦 Local Development

```bash
npm install
npm run build
npm start
# Opens http://localhost:3000
```

## 🌐 Production URL

After deployment, your app will be available at:
`https://your-project.vercel.app`

## 🛠️ Troubleshooting

### Build Issues
- Ensure Node.js 18+ is installed
- Check package.json dependencies
- Verify API keys are set correctly

### API Issues
- `/api/argue` endpoint handles CORS automatically
- Check Network tab for API call status
- Verify Craig API key and capsule ID

### Avatar Loading
- Ready Player Me CDN may have occasional delays
- Check browser console for WebGL errors
- Ensure stable internet connection

## 📋 Deployment Checklist

- ✅ API keys configured in Vercel environment variables
- ✅ Build completes successfully (`npm run build`)
- ✅ Static assets serve correctly
- ✅ `/api/argue` endpoint responds
- ✅ Avatar loads and animates
- ✅ Voice synthesis works (requires user interaction)

---

**Note:** This is the web version of the TalkBitch Unity iOS app. The Unity version includes the same features optimized for mobile deployment via TestFlight.