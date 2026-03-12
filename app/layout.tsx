import type { Metadata } from 'next';

import './globals.css';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: 'kinelo.fit',
    template: '%s · kinelo.fit'
  },
  description: 'Palermo-seeded local discovery for yoga-led mind-body routines.',
  openGraph: {
    title: 'kinelo.fit',
    description: 'Find the right yoga and mind-body class in your city.',
    type: 'website'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
