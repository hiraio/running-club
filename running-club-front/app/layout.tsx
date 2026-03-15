import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/AuthGuard";
import { NavigationWrapper } from "@/components/NavigationWrapper";

export const metadata: Metadata = {
  title: "러닝 클럽",
  description: "러닝 클럽 대회 관리 시스템",
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
