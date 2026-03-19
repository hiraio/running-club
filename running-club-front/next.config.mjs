/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // 운영: Vercel → 백엔드 프록시 (모바일 크로스도메인 쿠키 차단 우회)
    // 로컬: NEXT_PUBLIC_API_URL=http://localhost:8080 이면 프록시 불필요
    const backend = process.env.API_BACKEND_URL || "https://nd-running-club.duckdns.org";
    if (process.env.NEXT_PUBLIC_API_URL) return []; // 로컬 개발 시 프록시 비활성
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/logout", destination: `${backend}/logout` },
      { source: "/join", destination: `${backend}/join` },
      { source: "/photos/:path*", destination: `${backend}/photos/:path*` },
    ];
  },
};

export default nextConfig;
