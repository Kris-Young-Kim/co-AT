import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@/components/providers/clerk-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ClientOnlyProviders } from "@/components/layout/client-only-providers";
import { PwaInstallBanner } from "@co-at/ui/pwa-install-banner";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app";
const siteName = "GWATC AX PLATFORM";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#4338ca",
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GWATC AX PLATFORM | 강원특별자치도 통합 관리 플랫폼",
    template: "%s | GWATC AX PLATFORM",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GWATC",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#4338ca",
    "msapplication-tap-highlight": "no",
  },
  description: "강원특별자치도 보조기기센터에서 제공하는 상담, 체험, 맞춤형 지원, 사후관리, 교육홍보 등 5대 핵심 서비스를 신청하고 관리할 수 있는 통합 플랫폼입니다.",
  keywords: [
    "보조기기센터",
    "강원특별자치도",
    "장애인보조기기",
    "상담서비스",
    "대여서비스",
    "맞춤제작",
    "사후관리",
    "보조기기",
    "재활보조기기",
    "GWATC",
  ],
  authors: [{ name: "GWATC AX PLATFORM" }],
  creator: "GWATC AX PLATFORM",
  publisher: "GWATC AX PLATFORM",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: baseUrl,
    siteName,
    title: "GWATC AX PLATFORM | 강원특별자치도 통합 관리 플랫폼",
    description: "강원특별자치도 보조기기센터에서 제공하는 상담, 체험, 맞춤형 지원, 사후관리, 교육홍보 등 5대 핵심 서비스를 신청하고 관리할 수 있는 통합 플랫폼입니다.",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "GWATC AX PLATFORM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GWATC AX PLATFORM | 강원특별자치도 통합 관리 플랫폼",
    description: "강원특별자치도 보조기기센터에서 제공하는 상담, 체험, 맞춤형 지원, 사후관리, 교육홍보 등 5대 핵심 서비스를 신청하고 관리할 수 있는 통합 플랫폼입니다.",
    images: [`${baseUrl}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console: https://search.google.com/search-console/
    // → 속성 추가 → URL 접두어 → gwatc.cloud → HTML 태그 인증 선택
    // → content="..." 값만 복사해서 아래에 입력
    // google: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    //
    // Naver Search Advisor: https://searchadvisor.naver.com/
    // → 사이트 등록 → 사이트 소유 확인 → HTML 태그 선택
    // → content="..." 값만 복사해서 아래에 입력
    // other: {
    //   "naver-site-verification": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    // },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <html lang="ko" suppressHydrationWarning>
          <head>
            <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          </head>
          <body suppressHydrationWarning>
            {children}
            <ClientOnlyProviders />
            <PwaInstallBanner />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}

