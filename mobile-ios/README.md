# TalkingHead Mobile (iOS) - React Native + Expo

React Native mobile app with Three.js avatar rendering using Ready Player Me avatars.

## Tech Stack

- **React Native** with Expo
- **Three.js** (v0.166.0) for 3D rendering
- **expo-gl** for WebGL/OpenGL-ES bridge
- **expo-three** for Three.js integration
- **Ready Player Me** for avatar system

## Prerequisites

- Node.js 16+ and npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your iOS device (download from App Store)
- Physical iOS device (simulator doesn't work well with expo-gl)

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile-ios
   npm install
   ```

2. **Update Vercel API URL:**

   Open `App.js` and update line 19:
   ```javascript
   const API_BASE_URL = 'https://your-actual-vercel-url.vercel.app';
   ```

   Get your Vercel URL from the web-test deployment.

3. **Start the development server:**
   ```bash
   npm start
   ```

## Running on iOS Device

### Option 1: Expo Go (Recommended for Testing)

1. Install **Expo Go** from the App Store on your iPhone
2. Make sure your iPhone and computer are on the same WiFi network
3. Run `npm start` in the mobile-ios directory
4. Scan the QR code with your iPhone camera
5. Tap the notification to open in Expo Go

### Option 2: Tunnel (if same network doesn't work)

1. Run:
   ```bash
   npm start -- --tunnel
   ```
2. Scan the QR code (this will be slower but works across networks)

### Option 3: Build Native App

For production or if you need better performance:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account (create one if needed)
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile preview
```

## Project Structure

```
mobile-ios/
├── App.js                    # Main React Native app
├── lib/
│   ├── talkinghead.js       # TalkingHead library (ported from web)
│   ├── dynamicbones.js      # Dynamic bones physics
│   └── playback-worklet.js  # Audio worklet (web only)
├── components/              # React components (future)
├── assets/                  # Images, fonts
├── metro.config.js          # Metro bundler config for .glb files
├── app.json                 # Expo configuration
└── package.json             # Dependencies

```

## Features

✅ **Implemented:**
- Three.js scene with expo-gl
- Ready Player Me avatar loading (.glb)
- Chat UI with message history
- AI model selection (GPT-4o / Craig)
- Capsule ID input for Craig mode
- API integration ready

🚧 **TODO:**
- Integrate TalkingHead library for lip-sync
- Add text-to-speech (TTS) audio playback
- Implement avatar animations
- Add avatar creator modal (WebView)
- Optimize performance for mobile
- Add error handling and loading states

## Configuration

### Avatar URL

Default avatar is set in `App.js`:
```javascript
const [avatarUrl, setAvatarUrl] = useState('https://models.readyplayer.me/6790ea53904cea3d6a69c07c.glb');
```

Change this to use a different Ready Player Me avatar.

### API Endpoints

The app calls your Vercel API:
- **OpenAI mode:** `/api/chat`
- **Craig mode:** `/api/argue-prompt`

Make sure these endpoints are deployed and accessible.

## Debugging

### View logs:

```bash
# In the terminal where you ran npm start
# Press 'j' to open dev tools
```

### Common Issues:

1. **"Unable to resolve module"**
   - Clear cache: `npm start -- --clear`
   - Reinstall: `rm -rf node_modules && npm install`

2. **"Invariant Violation" or GL errors**
   - Make sure you're using a physical device (not simulator)
   - Check that expo-gl is properly installed

3. **Avatar not loading**
   - Check console logs for errors
   - Verify the avatar URL is accessible
   - Ensure network permissions are granted

4. **Black screen**
   - Check that renderer is initialized
   - Verify camera position and lookAt
   - Add console.log statements in onContextCreate

## Performance Optimization

For mobile devices, consider:
- Lower polygon count avatars
- Reduce texture sizes
- Lower frame rate (30fps instead of 60fps)
- Disable shadows and post-processing
- Use simpler lighting

## Next Steps

1. **Test the basic app** - Make sure avatar loads and rotates
2. **Connect to Vercel** - Update API_BASE_URL and test chat
3. **Integrate TalkingHead** - Port full TalkingHead functionality
4. **Add TTS** - Implement text-to-speech with lip-sync
5. **Optimize** - Profile and improve performance

## Notes

- **Audio Worklets:** Not supported in React Native. Will need to use standard Web Audio API or react-native-sound
- **Stats module:** Removed for mobile (performance monitoring)
- **File loading:** .glb files work, but need to be accessible via HTTPS

## Resources

- [Expo GL Documentation](https://docs.expo.dev/versions/latest/sdk/gl-view/)
- [expo-three GitHub](https://github.com/expo/expo-three)
- [Ready Player Me Docs](https://docs.readyplayer.me/)
- [Three.js Documentation](https://threejs.org/docs/)
