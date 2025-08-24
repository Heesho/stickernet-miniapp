/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode can cause double-rendering issues with OnchainKit
  reactStrictMode: false,
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // Add fallbacks for node modules that OnchainKit might need
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "memedepot.com",
      },
      {
        protocol: "https",
        hostname: "*.ipfs.dweb.link",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
      },
      {
        protocol: "https",
        hostname: "*.discord.com",
      },
      {
        protocol: "https",
        hostname: "*.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "*.discordapp.net",
      },
      {
        protocol: "https",
        hostname: "*",
      },
    ],
    // Disable image optimization for external images to avoid CORS issues
    unoptimized: true,
  },
  // Allow builds to pass even if ESLint config/plugins differ in CI
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
