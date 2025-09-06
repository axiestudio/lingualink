/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages (moved from experimental in Next.js 15+)
  serverExternalPackages: ['@neondatabase/serverless'],

  // Experimental features
  experimental: {
    // Add any experimental features here if needed
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for Windows file permission issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'lingualink.tech'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Output configuration
  output: 'standalone',
  
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
