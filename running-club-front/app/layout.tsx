import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { NavigationWrapper } from "@/components/NavigationWrapper";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <AuthProvider>
          <NavigationWrapper>
            <main>{children}</main>
          </NavigationWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
