import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/AuthShell';
import { getSessionUser } from '@/lib/auth/session';
import { resolveLocale } from '@/lib/i18n/routing';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';
import { ServerButton, ServerButtonLink, ServerInput } from '@/components/ui/server';

export default async function SignInPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = resolveLocale((await params).locale);
  const resolvedSearchParams = await searchParams;
  const checkEmail = resolvedSearchParams.checkEmail === '1';
  const hasError = resolvedSearchParams.error === '1';
  const [user, capabilities] = await Promise.all([getSessionUser(), getRuntimeCapabilities()]);
  if (user) {
    redirect(`/${locale}/favorites`);
  }

  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Accedi',
          title: 'Ritrova i tuoi posti giusti, senza password',
          lead: 'Ti basta la mail: apri il link, conferma e ritrovi preferiti e agenda personale dentro kinelo.fit.',
          email: 'Email',
          continue: 'Continua',
          magicLink: 'Invia magic link',
          google: 'Continua con Google',
          checkEmail: 'Link inviato. Apri la mail e conferma l’accesso da questo dispositivo.',
          checkEmailEyebrow: 'Controlla la tua inbox',
          authError: 'Non siamo riusciti a completare l’accesso. Riprova tra poco.',
          unavailableTitle: 'Accesso temporaneamente non disponibile',
          unavailableLead: 'Le pagine pubbliche restano consultabili. Riprova tra poco per salvare preferiti e agenda.',
          savedTitle: 'Cosa ritrovi dopo l’accesso',
          savedLead: 'Preferiti per seguire studi e insegnanti, agenda per tenere traccia delle lezioni che vuoi fare.',
          stepsEyebrow: 'Cosa ritrovi',
          stepsTitle: 'Uno spazio personale leggero e utile',
          stepsLead: 'Non stiamo costruendo l’ennesima area account ingombrante. Solo ciò che serve per tornare sulle scelte giuste.',
          steps: [
            'Preferiti per seguire studi, insegnanti e classi che vuoi confrontare con calma.',
            'Agenda salvata per raccogliere solo gli slot con orario che vuoi davvero fare questa settimana.',
            'Accesso con magic link: niente password da ricordare, niente attrito inutile.'
          ],
          chips: ['Senza password', 'Preferiti + agenda', 'Palermo-first'],
          helpTitle: 'Hai già inviato il link?',
          helpLead: 'Se non lo vedi subito, controlla spam o la tab Promozioni. Il bottone nella mail ti riporta qui già autenticato.'
        }
      : {
          eyebrow: 'Sign in',
          title: 'Get back to the right places without a password',
          lead: 'Use your email, open the link, and jump back into your saved favorites and schedule inside kinelo.fit.',
          email: 'Email',
          continue: 'Continue',
          magicLink: 'Send magic link',
          google: 'Continue with Google',
          checkEmail: 'Link sent. Open your inbox and confirm sign-in on this device.',
          checkEmailEyebrow: 'Check your inbox',
          authError: 'We could not complete sign-in. Please try again shortly.',
          unavailableTitle: 'Sign-in is temporarily unavailable',
          unavailableLead: 'Public pages remain available. Try again later to save favorites and schedule items.',
          savedTitle: 'What you get after sign-in',
          savedLead: 'Favorites help you follow studios and teachers. Saved schedule keeps track of the class times you plan to attend.',
          stepsEyebrow: 'What stays with you',
          stepsTitle: 'A light account, not a noisy dashboard',
          stepsLead: 'The goal is simple: make it easy to come back to the right classes and the right people.',
          steps: [
            'Favorites for studios, teachers, and classes you want to keep comparing.',
            'A saved schedule with the actual time slots you plan to attend this week.',
            'Passwordless access through magic link, with less friction on mobile.'
          ],
          chips: ['Passwordless', 'Favorites + schedule', 'Palermo-first'],
          helpTitle: 'Already sent the link?',
          helpLead: 'If it does not show up right away, check spam or Promotions. The email button brings you back already signed in.'
        };

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      lead={copy.lead}
      sideEyebrow={copy.stepsEyebrow}
      sideTitle={copy.stepsTitle}
      sideLead={copy.stepsLead}
      sideItems={copy.steps}
      chips={copy.chips}
    >
      <div className="form-stack auth-form-stack">
        {checkEmail ? (
          <div className="auth-status-card auth-status-card-success">
            <p className="eyebrow">{copy.checkEmailEyebrow}</p>
            <p className="lead">{copy.checkEmail}</p>
            <p className="muted">{copy.helpLead}</p>
          </div>
        ) : null}
        {hasError ? (
          <div className="empty-state-inline auth-status-card">
            <p className="muted">{copy.authError}</p>
          </div>
        ) : null}

        {capabilities.authMode === 'unavailable' ? (
          <div className="empty-state-inline auth-status-card">
            <p className="lead">{copy.unavailableTitle}</p>
            <p className="muted">{copy.unavailableLead}</p>
          </div>
        ) : capabilities.authMode === 'supabase' ? (
          <>
            <form action="/api/auth/magic-link" method="post" className="form-stack auth-form-card">
              <input type="hidden" name="locale" value={locale} />
              <ServerInput name="email" type="email" label={copy.email} required placeholder="you@example.com" />
              <ServerButton className="button-primary" type="submit">
                {copy.magicLink}
              </ServerButton>
            </form>
            <form action="/api/auth/oauth" method="post" className="form-stack auth-form-card auth-form-card-secondary">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="provider" value="google" />
              <ServerButton className="button-ghost" type="submit">
                {copy.google}
              </ServerButton>
            </form>
          </>
        ) : (
          <form action="/api/auth/demo" method="post" className="form-stack auth-form-card">
            <input type="hidden" name="locale" value={locale} />
            <ServerInput name="email" type="email" label={copy.email} required placeholder="you@example.com" />
            <ServerButton className="button-primary" type="submit">
              {copy.continue}
            </ServerButton>
          </form>
        )}
        <div className="auth-help-card">
          <p className="eyebrow">{copy.savedTitle}</p>
          <p className="lead">{copy.savedLead}</p>
          <p className="muted">{copy.helpTitle}</p>
          <div className="site-actions">
            <ServerButtonLink href={`/${locale}`} className="button-ghost">
              {locale === 'it' ? 'Torna alla home' : 'Back to home'}
            </ServerButtonLink>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
