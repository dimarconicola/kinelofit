'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button, Link } from '@heroui/react';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuCopy = locale === 'it' ? { open: 'Menu', close: 'Chiudi' } : { open: 'Menu', close: 'Close' };

  const navItems = [
    { href: `/${locale}/palermo/classes`, label: dict.classes },
    { href: `/${locale}/suggest-calendar`, label: dict.suggestCalendar },
    { href: `/${locale}/favorites`, label: dict.favorites },
    { href: `/${locale}/schedule`, label: dict.schedule }
  ];

  return (
    <div className="site-header-wrap">
      <div className="site-shell site-header">
        <Link as={NextLink} href={`/${locale}`} className="brand-mark" onPress={() => setMenuOpen(false)}>
          <span className="brand-orbit" />
          <span className="brand-word">{dict.brand}</span>
        </Link>

        <nav className="site-nav site-nav-primary">
          {navItems.map((item) => (
            <Link key={item.href} as={NextLink} href={item.href} color="foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions site-actions-primary">
          <Button
            as={NextLink}
            href={switchLocalePath(pathname, alternate)}
            variant="light"
            radius="full"
            className="locale-toggle"
          >
            {alternate.toUpperCase()}
          </Button>
          {signedInEmail ? (
            <form action="/api/auth/signout" method="post">
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="flat" radius="full" className="button-account">
                {signedInEmail}
              </Button>
            </form>
          ) : (
            <Button as={NextLink} href={`/${locale}/sign-in`} color="primary" radius="full" className="button-signin">
              {dict.signIn}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            radius="full"
            className="mobile-menu-toggle"
            onPress={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? menuCopy.close : menuCopy.open}
          </Button>
        </div>
      </div>

      {menuOpen ? (
        <div className="site-shell mobile-nav-panel">
          {navItems.map((item) => (
            <Link key={item.href} as={NextLink} href={item.href} color="foreground" onPress={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
