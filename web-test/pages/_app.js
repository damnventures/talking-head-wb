import '../src/styles.css'
import Script from 'next/script'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Script
        src="/config.js"
        strategy="beforeInteractive"
      />
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