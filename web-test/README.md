# TalkBitch - Local Web Test

Quick web-based version to test the Ready Player Me + OpenAI integration locally.

## 🔧 First Time Setup (Required)

### 1. Configure API Keys
```bash
cd web-test
cp config.example.js config.js
# Edit config.js with your real API keys
```

**Edit `config.js` with your credentials:**
- OpenAI API Key
- Ready Player Me Subdomain
- Ready Player Me App ID

### 2. Run Server

#### Option A: One-Click Run
```bash
./run.sh
```

#### Option B: Manual Python Server
```bash
cd web-test
python3 server.py
```

#### Option C: Direct Browser (Limited)
Simply open `index.html` in your browser (some features may not work due to CORS).

## 🌐 Access

Once running, open: **http://localhost:8080**

## ✨ Features

- **Ready Player Me Integration**: Load and display 3D avatars
- **OpenAI Chat**: Real-time conversations with ChatGPT
- **Responsive Design**: Works on desktop and mobile
- **Visual Feedback**: Avatar animations during conversations
- **Real-time Status**: Connection indicators and typing states

## 🎮 How to Use

1. **Load Avatar**:
   - Use the default avatar URL or paste your own Ready Player Me URL
   - Click "Load Avatar" to display your 3D avatar

2. **Start Chatting**:
   - Type messages in the chat input
   - Press Enter or click Send
   - Watch your avatar respond with AI-powered conversations

3. **Get Your Own Avatar**:
   - Visit https://readyplayer.me/
   - Create your custom avatar
   - Copy the avatar URL (.glb link)
   - Paste it into the avatar URL field

## 🔧 Troubleshooting

### Avatar Not Loading
- Check that the URL is a valid Ready Player Me avatar URL
- Ensure it ends with `.glb`
- Try one of the sample URLs provided

### Chat Not Working
- Check browser console for errors
- Verify internet connection
- OpenAI API rate limits may apply

### Server Won't Start
- Port 8080 might be in use - check for other local servers
- Try `python server.py` directly
- Use a different port by editing `server.py`

## 🔗 Ready Player Me URLs

Sample avatar URLs you can test:
- `https://models.readyplayer.me/6418c950d06b1fd91c8a8de5.glb`
- `https://models.readyplayer.me/632d65e99aa4cf6dd5c64e7c.glb`

Create your own at: https://readyplayer.me/

## 📱 Mobile Support

The web app is fully responsive and works on:
- iPhone/iPad Safari
- Android Chrome
- Desktop browsers

## 🔄 Differences from Unity Version

This web version provides:
- ✅ Instant testing without Unity installation
- ✅ Cross-platform compatibility
- ✅ Easy avatar URL testing
- ❌ Limited 3D interactions (compared to Unity)
- ❌ No native iOS features

## 🚀 Next Steps

Once you've tested here, the Unity iOS version provides:
- Native iOS performance
- Advanced 3D avatar interactions
- App Store/TestFlight distribution
- Better offline capabilities
- Native iOS integrations