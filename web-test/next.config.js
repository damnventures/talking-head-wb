/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  transpilePackages: ['@readyplayerme/visage']
}

module.exports = nextConfig;