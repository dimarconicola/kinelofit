import type { Locale } from '@/lib/catalog/types';
import { ServerLink } from '@/components/ui/server';

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy =
    locale === 'it'
      ? 'Discovery locale per yoga, mind-body e attività bambini a Palermo.'
      : 'Local discovery for yoga, mind-body, and kids activities in Palermo.';
  const meta = `© ${new Date().getFullYear()} kinelo.fit · Palermo-first city utility`;
  const labels =
    locale === 'it'
      ? {
          classes: 'Lezioni',
          teachers: 'Insegnanti',
          whoWeAre: 'Chi siamo',
          suggestCalendar: 'Suggerisci calendario',
          privacy: 'Privacy Policy',
          cookies: 'Cookies'
        }
      : {
          classes: 'Lessons',
          teachers: 'Teachers',
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
          <ServerLink href={`/${locale}/palermo`}>Palermo</ServerLink>
          <ServerLink href={`/${locale}/palermo/classes`}>{labels.classes}</ServerLink>
          <ServerLink href={`/${locale}/palermo/teachers`}>{labels.teachers}</ServerLink>
          <ServerLink href={`/${locale}/who-we-are`}>{labels.whoWeAre}</ServerLink>
          <ServerLink href={`/${locale}/privacy-policy`}>{labels.privacy}</ServerLink>
          <ServerLink href={`/${locale}/cookies`}>{labels.cookies}</ServerLink>
        </div>
        <div className="footer-secondary-link">
          <ServerLink href={`/${locale}/suggest-calendar`}>{labels.suggestCalendar}</ServerLink>
        </div>
      </div>
    </footer>
  );
}
