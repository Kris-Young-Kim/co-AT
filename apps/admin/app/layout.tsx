export const dynamic = 'force-dynamic'

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@/components/providers/clerk-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ClientOnlyProviders } from "@/components/layout/client-only-providers";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminMobileBottomNav } from "@/components/layout/admin-mobile-bottom-nav";
import { RegulationChatbotFloating } from "@/components/features/chat/RegulationChatbotFloating";
import { hasManagerPermission } from "@co-at/auth";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app";

export const metadata: Metadata = {
  title: "GWATC 어드민",
  description: "GWATC 통합 관리 시스템",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const showUsersManagement = await hasManagerPermission();

  return (
    <ClerkProvider>
      <QueryProvider>
        <html lang="ko" suppressHydrationWarning>
          <body suppressHydrationWarning>
            <div className="flex min-h-screen flex-col pb-16 md:pb-0">
              <AdminHeader showUsersManagement={showUsersManagement} />
              <div className="flex flex-1">
                <AdminSidebar showUsersManagement={showUsersManagement} />
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
              <AdminMobileBottomNav />
              <RegulationChatbotFloating />
            </div>
            <ClientOnlyProviders />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
