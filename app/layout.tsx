import type { Metadata, Viewport } from 'next';

import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { defaultLocale } from '@/lib/catalog/constants';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  manifest: '/manifest.webmanifest',
  applicationName: 'kinelo.fit',
  title: {
    default: 'kinelo.fit',
    template: '%s · kinelo.fit'
  },
  description: 'Palermo-seeded local discovery for yoga-led mind-body routines.',
  openGraph: {
    title: 'kinelo.fit',
    description: 'Find the right yoga and mind-body class in your city.',
    type: 'website'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'kinelo.fit'
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-icon-192', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4a5d4e'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={defaultLocale}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
