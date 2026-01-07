import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@/components/providers/clerk-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AccessibilityToolbar } from "@/components/accessibility/accessibility-toolbar";
import { KeyboardNavigator } from "@/components/accessibility/keyboard-navigator";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app";
const siteName = "GWATC 보조기기센터";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GWATC 보조기기센터 | 강원특별자치도 통합 케어 플랫폼",
    template: "%s | GWATC 보조기기센터",
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
  authors: [{ name: "GWATC 보조기기센터" }],
  creator: "GWATC 보조기기센터",
  publisher: "GWATC 보조기기센터",
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
    title: "GWATC 보조기기센터 | 강원특별자치도 통합 케어 플랫폼",
    description: "강원특별자치도 보조기기센터에서 제공하는 상담, 체험, 맞춤형 지원, 사후관리, 교육홍보 등 5대 핵심 서비스를 신청하고 관리할 수 있는 통합 플랫폼입니다.",
    images: [
      {
        url: `${baseUrl}/og-image.jpg`, // TODO: 실제 OG 이미지 추가 필요
        width: 1200,
        height: 630,
        alt: "GWATC 보조기기센터",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GWATC 보조기기센터 | 강원특별자치도 통합 케어 플랫폼",
    description: "강원특별자치도 보조기기센터에서 제공하는 상담, 체험, 맞춤형 지원, 사후관리, 교육홍보 등 5대 핵심 서비스를 신청하고 관리할 수 있는 통합 플랫폼입니다.",
    images: [`${baseUrl}/og-image.jpg`], // TODO: 실제 OG 이미지 추가 필요
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
    // TODO: Google Search Console 및 Naver Search Advisor 인증 코드 추가 필요
    // google: "your-google-verification-code",
    // other: {
    //   "naver-site-verification": "your-naver-verification-code",
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
        <html lang="ko">
          <body>
            {children}
            <AccessibilityToolbar />
            <KeyboardNavigator />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}

