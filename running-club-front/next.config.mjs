/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const backend = process.env.API_BACKEND_URL;
    // 프록시 대상이 없으면 (로컬 개발) rewrites 비활성
    if (!backend) return [];
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/logout", destination: `${backend}/logout` },
      { source: "/join", destination: `${backend}/join` },
      { source: "/photos/:path*", destination: `${backend}/photos/:path*` },
    ];
  },
};

export default nextConfig;
