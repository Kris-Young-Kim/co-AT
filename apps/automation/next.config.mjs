/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
