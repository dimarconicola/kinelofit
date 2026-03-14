import NextLink from 'next/link';
import { Link } from '@heroui/react';

import type { Locale } from '@/lib/catalog/types';

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy =
    locale === 'it'
      ? 'Discovery locale per yoga, mind-body e attività bambini a Palermo.'
      : 'Local discovery for yoga, mind-body, and kids activities in Palermo.';
  const meta = `© ${new Date().getFullYear()} kinelo.fit · Palermo-first city utility`;
  const labels =
    locale === 'it'
      ? {
          classes: 'Classi',
          whoWeAre: 'Chi siamo',
          suggestCalendar: 'Segnala calendario',
          privacy: 'Privacy Policy',
          cookies: 'Cookies'
        }
      : {
          classes: 'Classes',
          whoWeAre: 'Who we are',
          suggestCalendar: 'Suggest calendar',
          privacy: 'Privacy Policy',
          cookies: 'Cookies'
        };

  return (
    <footer className="site-footer-wrap">
      <div className="site-shell site-footer">
        <div className="footer-brand-block">
          <p className="footer-title">kinelo.fit</p>
          <p className="footer-copy">{copy}</p>
          <p className="footer-meta">{meta}</p>
        </div>
        <div className="footer-links">
          <Link as={NextLink} href={`/${locale}/palermo`}>
            Palermo
          </Link>
          <Link as={NextLink} href={`/${locale}/palermo/classes`}>
            {labels.classes}
          </Link>
          <Link as={NextLink} href={`/${locale}/who-we-are`}>
            {labels.whoWeAre}
          </Link>
          <Link as={NextLink} href={`/${locale}/suggest-calendar`}>
            {labels.suggestCalendar}
          </Link>
          <Link as={NextLink} href={`/${locale}/privacy-policy`}>
            {labels.privacy}
          </Link>
          <Link as={NextLink} href={`/${locale}/cookies`}>
            {labels.cookies}
          </Link>
        </div>
      </div>
    </footer>
  );
}
