/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["react-markdown", "remark-gfm"],
};

export default nextConfig;
