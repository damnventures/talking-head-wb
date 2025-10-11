/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  transpilePackages: [
    '@readyplayerme/visage',
    '@react-three/drei',
    '@react-three/fiber',
    '@react-three/postprocessing',
    'three-stdlib',
    'suspend-react'
  ],
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig;