'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { switchLocalePath } from '@/lib/i18n/routing';
import type { Locale } from '@/lib/catalog/types';
import { useAuthStatus } from '@/components/providers/AuthStatusProvider';

interface SiteHeaderProps {
  locale: Locale;
  dict: Record<string, string>;
}

export function SiteHeader({ locale, dict }: SiteHeaderProps) {
  const pathname = usePathname();
  const alternate = locale === 'en' ? 'it' : 'en';
  const [menuOpen, setMenuOpen] = useState(false);
  const { signedInEmail, loading } = useAuthStatus();
  const menuCopy = locale === 'it' ? { open: 'Menu', close: 'Chiudi' } : { open: 'Menu', close: 'Close' };

  const navItems = [
    { href: `/${locale}/palermo/classes`, label: dict.classes },
    { href: `/${locale}/palermo/studios`, label: dict.studios },
    { href: `/${locale}/palermo/teachers`, label: dict.teachers },
    { href: `/${locale}/favorites`, label: dict.favorites },
    { href: `/${locale}/schedule`, label: dict.schedule }
  ];
  const mobileNavId = `mobile-nav-${locale}`;

  return (
    <div className="site-header-wrap">
      <div className="site-shell site-header">
        <NextLink href={`/${locale}`} className="brand-mark" onClick={() => setMenuOpen(false)}>
          <span className="brand-orbit" />
          <span className="brand-word">{dict.brand}</span>
        </NextLink>

        <nav className="site-nav site-nav-primary">
          {navItems.map((item) => (
            <NextLink key={item.href} href={item.href}>
              {item.label}
            </NextLink>
          ))}
        </nav>

        <div className="site-actions site-actions-primary">
          <NextLink href={switchLocalePath(pathname, alternate)} className="button locale-toggle">
            {alternate.toUpperCase()}
          </NextLink>
          {signedInEmail ? (
            <div className="account-cluster">
              <NextLink href={`/${locale}/account`} className="button button-account-label" title={signedInEmail}>
                {signedInEmail}
              </NextLink>
              <form action="/api/auth/signout" method="post">
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="button button-ghost button-signout">
                  {dict.signOut}
                </button>
              </form>
            </div>
          ) : loading ? (
            <span className="button button-ghost button-signin" aria-hidden="true">
              {dict.signIn}
            </span>
          ) : (
            <NextLink href={`/${locale}/sign-in`} className="button button-signin">
              {dict.signIn}
            </NextLink>
          )}
          <button
            type="button"
            className="button mobile-menu-toggle"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls={mobileNavId}
            aria-label={menuOpen ? menuCopy.close : menuCopy.open}
          >
            {menuOpen ? menuCopy.close : menuCopy.open}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="site-shell mobile-nav-panel" id={mobileNavId}>
          {navItems.map((item) => (
            <NextLink key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </NextLink>
          ))}
          {signedInEmail ? (
            <div className="mobile-account-panel">
              <NextLink href={`/${locale}/account`} className="button button-account-label mobile-account-label" title={signedInEmail} onClick={() => setMenuOpen(false)}>
                {signedInEmail}
              </NextLink>
              <form action="/api/auth/signout" method="post" className="mobile-nav-form">
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="button button-ghost button-signout">
                  {dict.signOut}
                </button>
              </form>
            </div>
          ) : loading ? null : (
            <NextLink href={`/${locale}/sign-in`} className="button button-signin mobile-nav-action" onClick={() => setMenuOpen(false)}>
              {dict.signIn}
            </NextLink>
          )}
          <NextLink href={switchLocalePath(pathname, alternate)} className="button locale-toggle mobile-nav-action" onClick={() => setMenuOpen(false)}>
            {alternate.toUpperCase()}
          </NextLink>
        </div>
      ) : null}
    </div>
  );
}
