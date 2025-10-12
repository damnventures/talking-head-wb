
# Context-Aware AI Evaluation Platform

**Quantifying the value of personalized context in AI responses**

This platform compares generic no-context AI models against context-enriched responses using the W&B Weave evaluation framework. It's built with Ready Player Me avatars, ElevenLabs TTS, and the Craig Argue API to visualize the differences in response quality.

## Features

-   **Avatar System**: Ready Player Me with facial animations and word-level lip-sync.
-   **Dual Chat Modes**: Switch between a friendly AI and the argumentative "Craig" mode.
-   **Voice Synthesis**: ElevenLabs TTS with millisecond-precision timing for realistic voice output.
-   **API Proxy**: A Vercel serverless function (`/api/argue`) for seamless integration with the Craig API, avoiding CORS issues.
-   **Mobile Responsive**: A touch-optimized interface for a great experience on any device.
-   **W&B Weave Integration**: Deep evaluation of response quality with context tracking, helping you understand and improve your models.

## Getting Started

### 1. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

You can deploy this project to Vercel in two ways:

*   **From GitHub**: Push the `web-test` folder to a GitHub repository, connect it to Vercel, and deploy.
*   **Via Vercel CLI**:
    ```bash
    cd web-test
    vercel --prod
    ```

### 2. Set Environment Variables

In your Vercel dashboard, navigate to **Settings → Environment Variables** and add the following:

```bash
# Required for production
VITE_OPENAI_API_KEY=sk-proj-your-openai-key-here
VITE_ELEVENLABS_API_KEY=sk_your-elevenlabs-key-here
```

### 3. Local Development

To run the project locally, follow these steps:

```bash
npm install
npm run dev
```

This will start a development server with hot-reloading at `http://localhost:3000`.

For full feature parity with the production environment, you can use the Vercel CLI:

```bash
vercel dev --listen 3000
```

## W&B Weave Evaluation System

This project uses Weights & Biases (W&B) Weave to evaluate and compare the response quality between the generic no-context AI model and Craig's context-enriched responses.

### Key Evaluation Metrics

*   **Context Utilization Score (0-100)**: Measures how effectively the response leverages personal context.
*   **Evidence Density Score (0-100)**: Counts the number of specific citations and references.
*   **Specificity Score (0-100)**: Measures the level of concrete details versus generic statements.
*   **Emotional Authenticity Score (0-100)**: Assesses the genuineness of the voice and tone.
*   **Factual Grounding Score (0-100)**: Verifies claims against source documents.

### Setup and Usage

1.  **Install W&B Weave**:
    ```bash
    pip install wandb weave
    ```

2.  **Log in to W&B**:
    ```bash
    wandb login
    ```
    You'll be prompted to enter your API key, which you can find at `https://wandb.ai/authorize`.

3.  **Run Evaluations**:
    ```bash
    # Run the evaluation suite
    python evaluate_responses.py --test-set controversial_topics.json

    # Compare models side-by-side
    python compare_models.py --prompt "What's the problem with immigration?" --capsule 68c32cf3735fb4ac0ef3ccbf
    ```

### Trace Visualization

W&B Weave automatically logs the following for in-depth analysis:

*   Input prompts
*   Model responses
*   Latency metrics
*   Cost per request
*   Score breakdowns
*   Citation chains

You can view the traces at: `https://wandb.ai/shrinked-ai/craig-evaluation/weave`

## Project Structure

```
web-test/
├── api/argue.js              # Vercel API function for Craig
├── src/index.jsx            # Main React component
├── dist/                    # Build output
├── vercel.json             # Vercel configuration
├── package.json            # Dependencies and scripts
└── webpack.config.js       # Build configuration
```

## Troubleshooting

*   **Build Issues**: Ensure you have Node.js 18+ installed and that your API keys are set correctly.
*   **Evaluation Issues**: Check that your W&B API key is valid and that the Weave project is initialized correctly.
*   **API Issues**: The `/api/argue` endpoint handles CORS automatically. Check the Network tab in your browser's developer tools for API call status.
*   **Avatar & TTS**: Ready Player Me avatars require specific morph targets. The Web Audio API requires user interaction before audio can be played.

---

**Project:** Context-Aware AI Evaluation Platform
**Organization:** Shrinked AI
**W&B Dashboard:** `https://wandb.ai/shrinked-ai/craig-evaluation`
**Documentation:** See [EVALUATION_PLAN.md](./EVALUATION_PLAN.md) for detailed metrics and implementation.
