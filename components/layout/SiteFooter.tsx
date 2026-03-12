import Link from 'next/link';

import type { Locale } from '@/lib/catalog/types';

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="site-shell site-footer">
      <div>
        <p className="footer-title">kinelo.fit</p>
        <p className="footer-copy">Palermo-seeded local discovery for yoga-led mind-body routines.</p>
      </div>
      <div className="footer-links">
        <Link href={`/${locale}/palermo`}>Palermo</Link>
        <Link href={`/${locale}/palermo/classes`}>Classes</Link>
        <Link href={`/${locale}/admin`}>Admin</Link>
      </div>
    </footer>
  );
}
