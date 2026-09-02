import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  // Packages that must be require()d at runtime rather than bundled. `ws` in
  // particular breaks when bundled: its frame masker falls back to a JS
  // implementation that the bundler mangles, so every Neon WebSocket dies with
  // "mask is not a function".
  serverExternalPackages: [
    'exceljs',
    'bcryptjs',
    'ws',
    '@neondatabase/serverless',
    '@prisma/adapter-neon',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  typedRoutes: false,
}

export default nextConfig
