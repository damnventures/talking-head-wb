
# Context-Aware AI Evaluation Platform

**The Battle: Generic AI vs. Context-Enriched AI with Unlimited Memory**

![WhatsApp Image 2025-10-12 at 14 21 41](https://github.com/user-attachments/assets/f28d6d0b-1460-417a-ad68-efe7f8b1896d)

This platform visualizes the fundamental difference between generic AI (zero context) and context-aware AI with unlimited memory. Watch as two identical avatars—one with no context, one with rich personalized data—respond to the same questions. Real-time W&B Weave scoring reveals the quality gap.

## Core Concept

**Generic AI (OpenAI GPT-4o)**
- Zero personal context
- Surface-level responses
- No memory of your data

**Context-Enriched AI (Craig)**
- Unlimited memory via Capsule API
- Deep personalized responses backed by your data
- Real-time content discovery using Browserbase + Daytona

The platform provides real-time scoring across 4 dimensions: Context Utilization, Evidence Density, Specificity, and Emotional Authenticity.

## Features

-   **Avatar System**: Ready Player Me avatars with word-level lip-sync and facial animations
-   **Dual Chat Modes**: Switch between generic AI and context-enriched Craig mode
-   **Voice Synthesis**: ElevenLabs TTS with sentence-level streaming for low-latency responses
-   **Content Discovery**: `/fetch` command uses Browserbase to scrape fresh expert content from YouTube
-   **Sandbox Infrastructure**: `/fetch-daily` demonstrates Daytona secure sandboxes for scheduled scraping
-   **W&B Weave Evaluation**: Real-time response scoring to quantify context impact
-   **Multi-Platform**: Web demo + iOS app for mobile testing

## Quick Start

### Web Demo (Recommended)

```bash
cd web-test
npm install
npm run dev
```

Visit `http://localhost:3000` to see the evaluation platform in action.

### iOS App

1. Open the Unity project (Unity 2022.3.25f1+)
2. Set your Ready Player Me avatar URL in the `AvatarLoader` script
3. Build for iOS and deploy to TestFlight

## Environment Variables

```bash
# Core APIs
VITE_OPENAI_API_KEY=sk-proj-your-openai-key-here
VITE_ELEVENLABS_API_KEY=sk_your-elevenlabs-key-here
SHRINKED_API_KEY=your-shrinked-api-key

# Content Discovery (optional)
BROWSERBASE_API_KEY=your-browserbase-key
BROWSERBASE_PROJECT_ID=your-project-id
DAYTONA_API_KEY=your-daytona-key
```

## Usage

**Chat Commands:**
- Type normally to chat with the selected AI model
- `/fetch <topic>` - Discover fresh expert content from YouTube (e.g., `/fetch SpaceX`)
- `/fetch-daily <topic>` - Initialize Daytona sandbox for scheduled scraping

**Model Selection:**
- **OpenAI GPT-4o**: Generic AI with zero context
- **Craig**: Context-enriched AI (requires Capsule ID from Shrinked.ai)

## W&B Weave Evaluation

Real-time scoring quantifies the difference between generic and context-enriched AI:

**Evaluation Metrics (0-100):**
- **Context Utilization**: How effectively the response uses personal context
- **Evidence Density**: Number of specific citations and references
- **Specificity**: Concrete details vs. generic statements
- **Authenticity**: Genuineness of voice and emotional tone

Scores appear automatically below each AI response. Craig (context-enriched) consistently outperforms generic AI by 40-60 points.

## Architecture

```
web-test/                           # Web evaluation platform
├── pages/api/
│   ├── argue-prompt.js            # Craig system prompt
│   ├── discover-content.js        # Browserbase YouTube scraper
│   ├── fetch-daily.js             # Daytona sandbox demo
│   └── pipecat-tts.js             # ElevenLabs TTS with word alignment
├── src/
│   ├── index.jsx                  # Main React app
│   └── styles.css                 # UI styling
└── public/modules/
    └── talkinghead.mjs            # Avatar lip-sync engine

Assets/                             # Unity iOS app
├── Scripts/
│   ├── ConversationManager.cs     # Dual-mode chat
│   ├── AvatarLoader.cs            # Ready Player Me integration
│   └── PipecatTTS.cs              # ElevenLabs TTS
└── Scenes/
    └── MainScene.unity            # Main scene
```

## Tech Stack

- **Frontend**: React with Ready Player Me avatars
- **APIs**: OpenAI GPT-4o, Shrinked.ai Capsule API, ElevenLabs TTS
- **Content Discovery**: Browserbase (cloud browser), Playwright (CDP automation)
- **Infrastructure**: Daytona (secure sandboxes), Vercel (serverless functions)
- **Evaluation**: W&B Weave (real-time scoring)
- **Mobile**: Unity + Ready Player Me SDK

---

**Built by Shrinked AI** • [W&B Dashboard](https://wandb.ai/shrinked-ai/craig-evaluation)
