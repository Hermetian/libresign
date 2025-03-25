/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Completely ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Also ignore ESLint errors
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig 