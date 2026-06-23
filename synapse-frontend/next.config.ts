import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      react: './node_modules/react',
      'react-dom': './node_modules/react-dom',
    },
  },
};

export default nextConfig;