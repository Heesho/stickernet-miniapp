/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental optimizations for better performance
  experimental: {
    // Optimize CSS loading and reduce bundle size
    optimizeCss: true,
    // Enable gzip size reporting in build output
    gzipSize: true,
    // Enable modern JavaScript output for better tree shaking
    esmExternals: true,
    // Optimize server components
    serverComponentsExternalPackages: ['pino-pretty', 'lokijs', 'encoding'],
  },

  // Enable compression in production
  compress: true,

  // Optimize images for miniapp performance
  images: {
    // Use modern image formats for better compression
    formats: ['image/webp', 'image/avif'],
    // Enable image optimization
    unoptimized: false,
    // Configure device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Configure image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Remote patterns for external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'memedepot.com',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.dweb.link',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '*',
      }
    ],
  },

  // Webpack optimizations for miniapp constraints
  webpack: (config, { isServer, dev }) => {
    // Original webpack externals (silence warnings)
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Performance optimizations for production builds
    if (!dev) {
      // Set performance budgets for miniapp constraints
      config.performance = {
        maxAssetSize: 250000, // 250KB per asset
        maxEntrypointSize: 350000, // 350KB for entry points
        hints: 'warning', // Show warnings instead of errors initially
      };

      // Optimize module resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        // Reduce bundle size by aliasing to lighter alternatives where possible
        'react': 'react/index.js',
        'react-dom': 'react-dom/index.js',
      };

      // Advanced splitting for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunk for better caching
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 200000, // 200KB max for vendor chunks
            },
            // Separate onchainkit chunk (large dependency)
            onchainkit: {
              test: /[\\/]node_modules[\\/]@coinbase[\\/]onchainkit[\\/]/,
              name: 'onchainkit',
              chunks: 'all',
              priority: 10,
            },
            // Separate web3 libraries
            web3: {
              test: /[\\/]node_modules[\\/](viem|wagmi|@tanstack)[\\/]/,
              name: 'web3',
              chunks: 'all',
              priority: 5,
            },
            // Common chunk for shared modules
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              maxSize: 150000, // 150KB max for common chunks
            },
          },
        },
      };
    }

    // Client-side specific optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // Enable static optimization where possible
  output: 'standalone', // Optimize for deployment

  // Optimize for miniapp environment
  poweredByHeader: false, // Remove X-Powered-By header for smaller responses
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure build-time environment variables optimization
  env: {
    // Expose build-time optimizations
    BUILD_TIME: new Date().toISOString(),
  },

  // Optimize redirects and rewrites
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Enable caching for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Performance hints
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          // Optimize API response caching
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
};

// Bundle analyzer configuration (use with ANALYZE=true npm run build)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

module.exports = withBundleAnalyzer(nextConfig);