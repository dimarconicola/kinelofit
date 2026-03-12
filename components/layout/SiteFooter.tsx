import Link from 'next/link';

import type { Locale } from '@/lib/catalog/types';

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy =
    locale === 'it'
      ? 'Discovery locale per yoga, mind-body e attivita bambini a Palermo.'
      : 'Local discovery for yoga, mind-body, and kids activities in Palermo.';

  return (
    <footer className="site-footer-wrap">
      <div className="site-shell site-footer">
        <p className="footer-title">kinelo.fit</p>
        <p className="footer-copy">{copy}</p>
        <div className="footer-links">
          <Link href={`/${locale}/palermo`}>Palermo</Link>
          <Link href={`/${locale}/palermo/classes`}>{locale === 'it' ? 'Classi' : 'Classes'}</Link>
          <Link href={`/${locale}/who-we-are`}>{locale === 'it' ? 'Chi siamo' : 'Who we are'}</Link>
          <Link href={`/${locale}/suggest-calendar`}>{locale === 'it' ? 'Segnala calendario' : 'Suggest calendar'}</Link>
        </div>
      </div>
    </footer>
  );
}
