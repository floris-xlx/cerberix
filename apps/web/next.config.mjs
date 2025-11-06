/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@cerberix/config',
    '@cerberix/db',
    '@cerberix/types',
    '@cerberix/utils',
    '@cerberix/queue'
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb'
    }
  }
};

export default nextConfig;


