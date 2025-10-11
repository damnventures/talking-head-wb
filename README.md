# TalkBitch - Ready Player Me Avatar Chat iOS App

An iOS app that combines Ready Player Me avatars with OpenAI chat capabilities for smart NPC conversations.

## Features

- Ready Player Me avatar integration
- OpenAI ChatGPT-powered conversations
- Avatar animations during dialogue
- iOS TestFlight ready
- Clean, simple chat interface

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
│   ├── ConversationManager.cs    # Main chat logic with OpenAI integration
│   └── AvatarLoader.cs          # Ready Player Me avatar loading
├── Scenes/
│   └── MainScene.unity          # Main scene with UI and avatar setup
├── Animations/
│   └── AvatarController.controller # Animator for avatar states
└── Prefabs/                     # (Ready for your avatar prefabs)
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
- **OpenAI Unity Package**: `https://github.com/srcnalt/OpenAI-Unity.git`
- Unity UI Components (built-in)

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

### Recommended Enhancements
1. **Voice Integration**: Add Pipecat for speech-to-text/text-to-speech
2. **More Animations**: Import Ready Player Me animation library
3. **Character Profiles**: Multiple avatar personalities
4. **Cloud Save**: Sync conversations across devices
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