/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 이미지 품질 설정
    qualities: [75, 90],
    // 원격 이미지 도메인 허용
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
    ],
    // 이미지 최적화 포맷
    formats: ['image/avif', 'image/webp'],
    // 디바이스별 이미지 크기 최적화
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 컴파일러 최적화
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 실험적 기능
  experimental: {
    // 최적화된 패키지 임포트
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'lucide-react',
      'date-fns',
    ],
  },
};

export default nextConfig;

