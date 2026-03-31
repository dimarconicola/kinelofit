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
      { protocol: 'https', hostname: 'static.wixstatic.com' },
      { protocol: 'https', hostname: 'www.centroculturarishi.it' },
      { protocol: 'https', hostname: 'lirp.cdn-website.com' },
      { protocol: 'https', hostname: 'www.grandmaspilates.com' },
      { protocol: 'https', hostname: 'www.palermopilates.it' },
      { protocol: 'https', hostname: 'sahajayoga.it' },
      { protocol: 'https', hostname: 'www.taijistudiopalermo.it' },
      { protocol: 'https', hostname: 'www.yoganandapalermo.it' },
      { protocol: 'https', hostname: 'www.yogacity.it' },
      { protocol: 'https', hostname: 'primary.jwwb.nl' },
      { protocol: 'https', hostname: 'youareyoga.it' },
      { protocol: 'https', hostname: 'www.circopificio.it' },
      { protocol: 'https', hostname: 'www.diariapalermo.org' },
      { protocol: 'https', hostname: 'www.desireeburgio.it' }
    ]
  }
};

export default withMDX(nextConfig);
