'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { switchLocalePath } from '@/lib/i18n/routing';
import type { Locale } from '@/lib/catalog/types';

interface SiteHeaderProps {
  locale: Locale;
  dict: Record<string, string>;
  signedInEmail?: string;
}

export function SiteHeader({ locale, dict, signedInEmail }: SiteHeaderProps) {
  const pathname = usePathname();
  const alternate = locale === 'en' ? 'it' : 'en';

  return (
    <header className="site-shell site-header">
      <Link href={`/${locale}`} className="brand-mark">
        <span className="brand-orbit" />
        <span>{dict.brand}</span>
      </Link>
      <nav className="site-nav">
        <Link href={`/${locale}/palermo/classes`}>{dict.classes}</Link>
        <Link href={`/${locale}/favorites`}>{dict.favorites}</Link>
        <Link href={`/${locale}/schedule`}>{dict.schedule}</Link>
        <Link href={`/${locale}/admin`}>{dict.admin}</Link>
      </nav>
      <div className="site-actions">
        <Link href={switchLocalePath(pathname, alternate)} className="ghost-link">
          {alternate.toUpperCase()}
        </Link>
        {signedInEmail ? (
          <form action="/api/auth/signout" method="post">
            <input type="hidden" name="locale" value={locale} />
            <button className="button button-ghost" type="submit">
              {signedInEmail}
            </button>
          </form>
        ) : (
          <Link href={`/${locale}/sign-in`} className="button button-ghost">
            {dict.signIn}
          </Link>
        )}
      </div>
    </header>
  );
}
