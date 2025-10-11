# 🔧 TalkBitch Setup Guide

## Required API Keys & Credentials

This project requires external API keys that are NOT included in the repository for security reasons.

### 1. OpenAI API Key

1. Go to https://platform.openai.com/
2. Create an account or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-proj-` or `sk-`)

### 2. Ready Player Me Credentials

1. Go to https://studio.readyplayer.me/
2. Create a developer account
3. Create a new application
4. Note down:
   - **Subdomain**: Your custom subdomain
   - **App ID**: Application identifier
   - **Org ID**: Organization identifier (optional)

## Setup Methods

### For Web Testing (Quick Start)

```bash
cd web-test
cp config.example.js config.js
# Edit config.js with your API keys
```

### For Unity Development

1. Open project in Unity
2. Find ConversationManager script
3. Set API key in the inspector field
4. Ready Player Me credentials in AvatarLoader

## File Structure

```
├── Assets/Scripts/ConversationManager.cs  # Set OpenAI key in inspector
├── Assets/Scripts/AvatarLoader.cs         # Configure RPM credentials
├── web-test/config.js                     # Web version config (ignored by git)
└── web-test/config.example.js             # Template for configuration
```

## Security

- ✅ API keys are in gitignore
- ✅ Only example configs are committed
- ✅ Real credentials stay local
- ✅ GitHub secret scanning protection active

## Testing

### Web Version
```bash
cd web-test
cp config.example.js config.js
# Add your keys to config.js
./run.sh
```

### Unity Version
1. Open in Unity
2. Set API key in ConversationManager inspector
3. Set RPM credentials in AvatarLoader
4. Test in Play mode

## Troubleshooting

### "Config not loaded" Error
- Make sure config.js exists in web-test/
- Check that your API keys are properly formatted

### Unity "API Key not set" Error
- Set the OpenAI API key in ConversationManager inspector
- Don't leave the default placeholder value

### 429 Rate Limit Errors
- Add credits to your OpenAI account
- Wait between requests if on free tier

## Next Steps

1. **Get API Keys**: Follow links above
2. **Configure Locally**: Use the methods described
3. **Test Web Version**: Quick way to verify setup
4. **Unity Development**: Full iOS app development
5. **TestFlight Deploy**: Build and distribute iOS app