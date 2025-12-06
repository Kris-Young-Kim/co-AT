import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Co-AT | GWATC 통합 케어 플랫폼",
  description: "강원특별자치도 보조기기센터 통합 업무 협업 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

