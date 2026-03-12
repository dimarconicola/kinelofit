import { HtmlLangSync } from '@/components/layout/HtmlLangSync';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getSessionUser } from '@/lib/auth/session';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const user = await getSessionUser();

  return (
    <>
      <HtmlLangSync locale={locale} />
      <SiteHeader locale={locale} dict={dict} signedInEmail={user?.email} />
      <main className="site-shell site-main" lang={locale}>
        {children}
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
