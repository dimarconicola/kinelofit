import createMDX from '@next/mdx';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import path from 'node:path';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX({
  extension: /\.(md|mdx)$/
});

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  outputFileTracingRoot: currentDir,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  }
};

export default withMDX(nextConfig);
