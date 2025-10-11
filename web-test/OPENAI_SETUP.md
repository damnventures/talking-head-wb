# 🤖 OpenAI API Setup & Rate Limits

## Rate Limit Error (429) - What's Happening

The error you're seeing indicates that your OpenAI API key has hit rate limits. Here's what to do:

### Immediate Solutions:

1. **Wait 60 seconds** - Rate limits reset quickly
2. **Try fewer requests** - Don't spam the chat
3. **Check your OpenAI account** - You might need to add credits

### Check Your OpenAI Account:

1. Go to: https://platform.openai.com/usage
2. Check if you have:
   - ✅ Available credits/balance
   - ✅ Valid payment method
   - ✅ API access enabled

### Rate Limits by Tier:

- **Free Tier**: Very limited requests per minute
- **Paid Tier**: Much higher limits
- **Your API Key**: `sk-proj-hu8T8...` (configured in the app)

### Fix the Rate Limit:

#### Option 1: Add Credits
1. Go to https://platform.openai.com/account/billing
2. Add payment method
3. Purchase credits ($5-10 minimum)

#### Option 2: Upgrade Tier
1. Use the API more to reach higher usage tiers
2. Higher tiers = higher rate limits

#### Option 3: Wait & Test Slowly
1. Wait 60 seconds between requests
2. Test with short messages first

## 🎯 Current Status:

- ✅ **Avatar Fixed**: Now uses your model `68ea9e6ec138a9c842570bf9.glb`
- ✅ **Camera Fixed**: Focused on head/face area
- ✅ **Error Handling**: Better messages for rate limits
- ⚠️  **API Limits**: Need to check OpenAI account

## 🔧 Testing Steps:

1. **Refresh Browser**: Clear any cached errors
2. **Load Avatar**: Should show your head properly centered
3. **Wait 60 seconds**: Let rate limits reset
4. **Send 1 message**: Test slowly
5. **Check Response**: Should work if credits available

## 💰 OpenAI Pricing (for reference):

- **GPT-3.5-turbo**: ~$0.002 per 1K tokens
- **Typical message**: ~50-200 tokens
- **Cost per message**: ~$0.0001-0.0004 (very cheap!)

The rate limit is likely due to free tier restrictions, not cost.

## 🚨 Next Steps:

1. **Check**: https://platform.openai.com/usage
2. **Add Credits**: If balance is $0
3. **Test Again**: After adding credits
4. **Contact OpenAI**: If issues persist

Your API key is properly configured in the app - it's just a billing/usage limit issue!