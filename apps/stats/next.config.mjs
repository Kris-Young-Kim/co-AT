/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { externalDir: true },
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
