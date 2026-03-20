import { redirect } from 'next/navigation';

import { isSupabaseConfigured } from '@/lib/auth/supabase';
import { getSessionUser } from '@/lib/auth/session';
import { resolveLocale } from '@/lib/i18n/routing';
import { ServerButton, ServerButtonLink, ServerChip, ServerInput } from '@/components/ui/server';

export default async function SignInPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = resolveLocale((await params).locale);
  const checkEmail = (await searchParams).checkEmail === '1';
  const user = await getSessionUser();
  if (user) {
    redirect(`/${locale}/favorites`);
  }

  const copy =
    locale === 'it'
      ? {
          title: 'Salva la tua routine',
          demoTag: 'Accesso demo',
          demoLead: 'Quando Supabase non è configurato, usiamo una sessione firmata locale per i flussi gated.',
          email: 'Email',
          continue: 'Continua',
          supabaseTag: 'Supabase Auth',
          supabaseLead: 'Attiva accesso reale con magic link o Google OAuth.',
          magicLink: 'Invia magic link',
          google: 'Continua con Google',
          checkEmail: 'Controlla la tua email: il magic link è stato inviato.',
          mode: 'Modalità',
          live: 'Auth reale attiva',
          fallback: 'Fallback demo locale'
        }
      : {
          title: 'Save your routine',
          demoTag: 'Demo sign-in',
          demoLead: 'When Supabase is not configured, this app uses a local signed session for gated flows.',
          email: 'Email',
          continue: 'Continue',
          supabaseTag: 'Supabase Auth',
          supabaseLead: 'Enable real login with magic link or Google OAuth.',
          magicLink: 'Send magic link',
          google: 'Continue with Google',
          checkEmail: 'Check your inbox. We sent a magic link.',
          mode: 'Mode',
          live: 'Live auth enabled',
          fallback: 'Local demo fallback'
        };

  return (
    <section className="detail-hero">
      <div className="panel form-stack">
        <p className="eyebrow">{isSupabaseConfigured ? copy.supabaseTag : copy.demoTag}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{isSupabaseConfigured ? copy.supabaseLead : copy.demoLead}</p>
        {checkEmail ? (
          <div>
            <ServerChip tone="meta">
              {copy.checkEmail}
            </ServerChip>
          </div>
        ) : null}

        {isSupabaseConfigured ? (
          <>
            <form action="/api/auth/magic-link" method="post" className="form-stack">
              <input type="hidden" name="locale" value={locale} />
              <ServerInput name="email" type="email" label={copy.email} required placeholder="you@example.com" />
              <ServerButton className="button-primary" type="submit">
                {copy.magicLink}
              </ServerButton>
            </form>
            <form action="/api/auth/oauth" method="post" className="form-stack">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="provider" value="google" />
              <ServerButton className="button-ghost" type="submit">
                {copy.google}
              </ServerButton>
            </form>
          </>
        ) : (
          <form action="/api/auth/demo" method="post" className="form-stack">
            <input type="hidden" name="locale" value={locale} />
            <ServerInput name="email" type="email" label={copy.email} required placeholder="you@example.com" />
            <ServerButton className="button-primary" type="submit">
              {copy.continue}
            </ServerButton>
          </form>
        )}
      </div>
      <div className="panel">
        <p className="eyebrow">{copy.mode}</p>
        <p className="lead">{isSupabaseConfigured ? copy.live : copy.fallback}</p>
        <div className="site-actions">
          <ServerButtonLink href={`/${locale}`} className="button-ghost">
            {locale === 'it' ? 'Torna alla home' : 'Back to home'}
          </ServerButtonLink>
        </div>
      </div>
    </section>
  );
}
