/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
  serverExternalPackages: ['@react-pdf/renderer'],
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
