import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/AuthGuard";
import { NavigationWrapper } from "@/components/NavigationWrapper";

export const metadata: Metadata = {
  title: "ND Running Club",
  description: "함께 달리는 즐거움 — 팀 대항전, 개인 랭킹, 기록 인증",
  openGraph: {
    title: "ND Running Club",
    description: "함께 달리는 즐거움 — 팀 대항전, 개인 랭킹, 기록 인증",
    siteName: "ND Running Club",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>
          <AuthGuard>
            <NavigationWrapper>
              <main>{children}</main>
            </NavigationWrapper>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
