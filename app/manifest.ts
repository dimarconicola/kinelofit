import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'kinelo.fit',
    short_name: 'kinelo.fit',
    description: 'Calendario cittadino per lezioni, studi e pratiche benessere a Palermo.',
    start_url: '/it',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'browser'],
    orientation: 'portrait',
    background_color: '#f6efe6',
    theme_color: '#4a5d4e',
    categories: ['health', 'lifestyle', 'navigation'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/pwa-icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/pwa-icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: '/pwa-screenshot-mobile',
        sizes: '1179x2556',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'kinelo.fit mobile app home'
      },
      {
        src: '/pwa-screenshot-wide',
        sizes: '1600x900',
        type: 'image/png',
        form_factor: 'wide',
        label: 'kinelo.fit Palermo discovery surface'
      }
    ],
    shortcuts: [
      {
        name: 'Calendario Palermo',
        short_name: 'Calendario',
        url: '/it/palermo/classes',
        icons: [{ src: '/pwa-icon-192', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Studi Palermo',
        short_name: 'Studi',
        url: '/it/palermo/studios',
        icons: [{ src: '/pwa-icon-192', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Agenda salvata',
        short_name: 'Agenda',
        url: '/it/schedule',
        icons: [{ src: '/pwa-icon-192', sizes: '192x192', type: 'image/png' }]
      }
    ]
  };
}
