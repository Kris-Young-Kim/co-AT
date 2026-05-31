// v0.1.5
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { externalDir: true },
  serverExternalPackages: ['exceljs', 'xlsx'],
  transpilePackages: ['@co-at/ui', '@co-at/lib', '@co-at/auth', '@co-at/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
