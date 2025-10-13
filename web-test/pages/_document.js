import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary Meta Tags */}
        <meta name="title" content="Context-Aware AI Evaluation | Generic AI vs Unlimited Memory" />
        <meta name="description" content="Watch two identical avatars respond to the same questions—one with zero context, one with unlimited memory. Real-time scoring reveals the quality gap. Built with OpenAI GPT-4o, Shrinked.ai Capsule API, and W&B Weave." />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://talking-head-wb-gold.vercel.app/" />
        <meta property="og:title" content="Context-Aware AI Evaluation | Generic AI vs Unlimited Memory" />
        <meta property="og:description" content="Watch two identical avatars respond to the same questions—one with zero context, one with unlimited memory. Real-time scoring reveals the quality gap." />
        <meta property="og:image" content="https://github.com/user-attachments/assets/f28d6d0b-1460-417a-ad68-efe7f8b1896d" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://talking-head-wb-gold.vercel.app/" />
        <meta property="twitter:title" content="Context-Aware AI Evaluation | Generic AI vs Unlimited Memory" />
        <meta property="twitter:description" content="Watch two identical avatars respond to the same questions—one with zero context, one with unlimited memory. Real-time scoring reveals the quality gap." />
        <meta property="twitter:image" content="https://github.com/user-attachments/assets/f28d6d0b-1460-417a-ad68-efe7f8b1896d" />

        {/* Additional Meta Tags */}
        <meta name="keywords" content="AI evaluation, context-aware AI, GPT-4, OpenAI, Ready Player Me, avatars, W&B Weave, Capsule API, Shrinked AI" />
        <meta name="author" content="Shrinked AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
