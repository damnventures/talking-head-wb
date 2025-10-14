import '../src/styles.css'
import Script from 'next/script'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Load config from API (environment variables)
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        window.CONFIG = config;
        console.log('✓ Config loaded from environment variables');
        // Dispatch event to notify components that config is ready
        window.dispatchEvent(new Event('config-loaded'));
      })
      .catch(err => {
        console.error('Failed to load config:', err);
        // Fallback: try loading from static config.js (local development)
        const script = document.createElement('script');
        script.src = '/config.js';
        script.onload = () => window.dispatchEvent(new Event('config-loaded'));
        script.onerror = () => {
          console.warn('⚠ No config available - using defaults');
          window.CONFIG = {}; // Empty config
          window.dispatchEvent(new Event('config-loaded'));
        };
        document.head.appendChild(script);
      });
  }, []);

  return (
    <>
      <Script
        id="importmap"
        type="importmap"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "imports": {
              "three": "/modules/three.js",
              "three/addons/": "/modules/three-addons/"
            }
          })
        }}
      />
      <Component {...pageProps} />
    </>
  )
}