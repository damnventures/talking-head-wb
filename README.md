# TalkBitch - Ready Player Me Avatar Chat iOS App

An iOS app that combines Ready Player Me avatars with OpenAI chat capabilities for smart NPC conversations.

## Features

✅ **Complete Feature Parity with Web Version:**
- Ready Player Me avatar integration with morph target animations
- OpenAI GPT-4o powered conversations with streaming support
- **Pipecat-style TTS with ElevenLabs integration** (high-quality voices)
- **Dual personality system**: Friendly Chat + Craig (John Oliver style Argue mode)
- **Capsule-based personal context** for Craig mode via Signal app integration
- Advanced avatar facial animations using blend shapes/morph targets
- iOS TestFlight ready with full mobile optimization
- Clean, intuitive dual-mode chat interface

## Setup Requirements

### Unity Version
- Unity 2022.3.25f1 or newer
- iOS Build Support module installed

### API Keys Required (Not Included - Add Your Own)
- **OpenAI API Key**: Get from https://platform.openai.com/
- **Ready Player Me Credentials**:
  - Create account at https://studio.readyplayer.me/
  - Get your Subdomain and App ID
  - Configure in Unity inspector or web config

### Security Note
API keys are NOT included in this repository for security. You must add your own keys locally.

### Development Environment
- macOS with Xcode installed
- Apple Developer account for TestFlight distribution

## Project Structure

```
Assets/
├── Scripts/
│   ├── ConversationManager.cs         # Enhanced dual-mode chat with streaming
│   ├── AvatarLoader.cs               # Ready Player Me avatar with morph targets
│   ├── PipecatTTS.cs                # ElevenLabs TTS integration (Pipecat-style)
│   ├── ArgueAPI.cs                  # Signal app Argue endpoint integration
│   ├── AvatarAnimationController.cs  # Advanced morph target animations
│   └── TalkBitchConfig.cs           # Centralized configuration management
├── Scenes/
│   └── MainScene.unity              # Enhanced UI with model switcher
├── Animations/
│   └── AvatarController.controller   # Animator for avatar states
└── Prefabs/                         # (Ready for your avatar prefabs)
```

## Quick Start

1. **Open in Unity**
   ```bash
   # Clone and open the project in Unity 2022.3+
   # Packages will automatically install via Package Manager
   ```

2. **Set Avatar URL**
   - In the scene, find the AvatarLoader script
   - Replace the placeholder URL with your Ready Player Me avatar URL
   - Format: `https://models.readyplayer.me/YOUR_AVATAR_ID.glb`

3. **Test in Editor**
   - Press Play in Unity
   - Type messages in the input field
   - Chat with your AI avatar

## iOS Build Instructions

### 1. Configure Build Settings
```
File → Build Settings
- Select iOS platform
- Click "Switch Platform"
- Add MainScene to build
```

### 2. Player Settings
Already configured:
- Bundle Identifier: `com.talkbitch.avatarchat`
- Version: 1.0.0
- Minimum iOS Version: 13.0
- Target Device: iPhone & iPad

### 3. Build for iOS
```
File → Build Settings → Build
- Choose output folder
- Unity will generate Xcode project
```

### 4. Xcode Configuration
```bash
# Open generated .xcodeproj in Xcode
# Set your Apple Developer Team
# Configure Signing & Capabilities
# Set deployment target to iOS 13.0+
```

### 5. TestFlight Deployment
```bash
# In Xcode:
# Product → Archive
# Upload to App Store Connect
# Configure TestFlight testing
# Invite beta testers
```

## Dependencies

Automatically managed via Package Manager:

- **Ready Player Me Unity SDK**: `https://github.com/readyplayerme/rpm-unity-sdk-core.git`
- **Direct OpenAI API Integration**: HTTP-based calls (no external package dependency)
- Unity UI Components (built-in)
- UnityWebRequest for API calls (built-in)

## Usage

1. **Load Your Avatar**
   - Update the avatar URL in AvatarLoader.cs
   - Or create a UI to input custom avatar URLs

2. **Chat with AI**
   - Type messages in the input field
   - Press Send or Enter
   - Watch your avatar animate during responses

3. **Customize Behavior**
   - Modify the system prompt in ConversationManager.cs
   - Adjust animation triggers and timings
   - Add voice synthesis for enhanced experience

## Key Scripts

### ConversationManager.cs
- Handles OpenAI API communication
- Manages chat UI interactions
- Triggers avatar animations
- Maintains conversation history

### AvatarLoader.cs
- Loads Ready Player Me avatars
- Manages avatar positioning and setup
- Connects animator to conversation system

## Troubleshooting

### Build Issues
- Ensure iOS Build Support is installed in Unity Hub
- Check Xcode is up to date
- Verify Apple Developer account is active

### Avatar Loading
- Verify avatar URL is correct and accessible
- Check Ready Player Me credentials
- Ensure network connectivity

### OpenAI Integration
- Verify API key is valid and has credits
- Check network permissions in iOS settings
- Monitor rate limits and token usage

## Next Steps

### ✅ Already Implemented Enhancements
1. **✅ Voice Integration**: Full Pipecat-style TTS with ElevenLabs API
2. **✅ Advanced Animations**: Morph target system matching web version
3. **✅ Character Profiles**: Dual personality system (Friendly + Craig/Argue)
4. **✅ Cloud Integration**: Signal app Argue endpoint for personal context
5. **✅ Streaming Responses**: Real-time conversation like web version

### Future Enhancements
1. **Speech-to-Text**: Voice input for hands-free interaction
2. **More Personalities**: Expand beyond Friendly Chat and Craig
3. **Local Avatar Customization**: In-app avatar editor
4. **Conversation History**: Persistent chat storage
5. **Social Features**: Share avatars and conversations

### Integration Points
- Cloudflare Workers for advanced AI reasoning
- R2 storage for media assets
- Analytics for user engagement tracking

## License

This project is set up for your development. Configure licensing as needed for your specific use case.

## Support

For Ready Player Me: https://docs.readyplayer.me/
For OpenAI API: https://platform.openai.com/docs
For Unity iOS builds: https://docs.unity3d.com/Manual/ios.html