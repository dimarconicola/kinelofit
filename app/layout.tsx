import type { Metadata } from 'next';

import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { defaultLocale } from '@/lib/catalog/data';
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
  },
  icons: {
    icon: '/icon.svg'
  }
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
