# Next.js Build Optimizer Expert Guide

This guide explains how to use the Next.js Build Optimizer Expert subagent for optimizing your Stickernet miniapp build performance.

## Agent Overview

The Next.js Build Optimizer Expert is specialized in:
- Bundle analysis and size optimization
- Core Web Vitals improvement
- Mobile-specific performance optimization
- Deployment pipeline optimization
- Webpack configuration tuning

## Quick Start

### 1. Initial Build Analysis

First, let's analyze your current build and identify optimization opportunities:

```bash
# Install bundle analyzer
npm install @next/bundle-analyzer --save-dev

# Analyze current bundle
ANALYZE=true npm run build
```

### 2. Install Core Performance Tools

```bash
# Install essential performance monitoring tools
npm install web-vitals --save
npm install @lhci/cli --save-dev

# For miniapp-specific optimizations
npm install next-pwa --save-dev
```

### 3. Basic Next.js Config Optimizations

The agent will help optimize your `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental optimizations
  experimental: {
    optimizeCss: true,
    gzipSize: true,
  },
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      // Your existing patterns
    ],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize webpack
  webpack: (config, { isServer }) => {
    // Existing webpack config
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Add performance optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
};
```

## Key Optimization Areas

### 1. Bundle Size Optimization

**Current Dependencies Analysis:**
- `@coinbase/onchainkit`: Large Web3 library - optimize imports
- `@tanstack/react-query`: Good for data caching
- `viem` & `wagmi`: Web3 libraries - check for tree shaking

**Optimization Strategies:**
```javascript
// Use specific imports instead of full library
import { Avatar } from '@coinbase/onchainkit/identity';
// Instead of: import { OnchainKitProvider } from '@coinbase/onchainkit';

// Implement dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

### 2. Image Optimization

Your project has several images that need optimization:

```javascript
// Optimize images in /public folder
import Image from 'next/image';

// Instead of <img src="/hero.png" />
<Image
  src="/hero.png"
  alt="Hero image"
  width={800}
  height={400}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..." // Generate with tools
/>
```

### 3. Font Optimization

```javascript
// In your layout.tsx or _app.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Improves font loading performance
  preload: true,
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      {children}
    </html>
  );
}
```

### 4. Core Web Vitals Monitoring

Add performance monitoring to your app:

```javascript
// lib/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

export function initWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

## Mobile Miniapp Optimizations

### 1. Bundle Size Constraints

For miniapp platforms, maintain strict bundle size limits:

```javascript
// next.config.mjs
const nextConfig = {
  webpack: (config) => {
    // Set performance budgets
    config.performance = {
      maxAssetSize: 250000, // 250KB per asset
      maxEntrypointSize: 350000, // 350KB for entry points
      hints: 'error', // Fail build if exceeded
    };
    
    return config;
  },
};
```

### 2. Progressive Loading

Implement progressive loading for better perceived performance:

```javascript
// components/ProgressiveLoader.tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded" />,
  ssr: false, // Client-side only for miniapps
});

export function ProgressiveLoader() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DynamicComponent />
    </Suspense>
  );
}
```

### 3. Service Worker for Caching

```javascript
// Install next-pwa for service worker
// next.config.mjs
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
  ],
});

module.exports = withPWA(nextConfig);
```

## Performance Monitoring Setup

### 1. Lighthouse CI Integration

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lhci:
    name: Lighthouse
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: npm install, build
        run: |
          npm install
          npm run build
      - name: run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
```

### 2. Bundle Size Monitoring

```json
// package.json scripts
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "bundle-size": "npx bundlewatch",
    "perf": "npm run build && npm run analyze"
  },
  "bundlewatch": {
    "files": [
      {
        "path": ".next/static/js/**/*.js",
        "maxSize": "350kb"
      }
    ]
  }
}
```

## Optimization Checklist

### Immediate Optimizations (High Impact, Low Effort)
- [ ] Enable `next/image` for all images
- [ ] Implement `next/font` for Google Fonts
- [ ] Enable compression in production
- [ ] Add bundle analyzer and check for large dependencies
- [ ] Implement basic code splitting with `next/dynamic`

### Advanced Optimizations (High Impact, Medium Effort)
- [ ] Implement service worker for caching
- [ ] Optimize webpack configuration
- [ ] Set up performance budgets
- [ ] Implement Core Web Vitals monitoring
- [ ] Add progressive loading patterns

### Mobile-Specific Optimizations (Critical for Miniapps)
- [ ] Reduce total bundle size under 350KB
- [ ] Implement network-aware loading
- [ ] Optimize for touch interactions
- [ ] Add offline functionality
- [ ] Test on actual mobile devices

## Build Analysis Commands

```bash
# Analyze bundle composition
npm run analyze

# Check bundle sizes
npx bundlewatch

# Run Lighthouse audit
npx lighthouse http://localhost:3000 --output=html

# Check Core Web Vitals
npm run build && npm start
# Then visit site and check DevTools Performance tab

# Analyze dependencies
npx bundlephobia [package-name]
```

## Performance Targets for Miniapps

- **Bundle Size**: < 350KB total
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **Time to Interactive**: < 3s on 3G
- **Memory Usage**: < 50MB runtime

## Getting Help

When using the Next.js Build Optimizer Expert agent:

1. **Share your build output**: Run `npm run analyze` and share results
2. **Provide performance metrics**: Include Lighthouse scores and Core Web Vitals
3. **Specify constraints**: Mention miniapp platform requirements
4. **Include error logs**: Share any build or performance errors
5. **Describe user experience issues**: Mention specific performance problems

The agent will provide specific optimizations based on your current setup and performance goals.