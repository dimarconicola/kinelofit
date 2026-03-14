import { redirect } from 'next/navigation';
import NextLink from 'next/link';
import { Button, Chip, Input } from '@heroui/react';

import { isSupabaseConfigured } from '@/lib/auth/supabase';
import { getSessionUser } from '@/lib/auth/session';
import { resolveLocale } from '@/lib/i18n/routing';

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
            <Chip radius="full" variant="flat" className="meta-pill">
              {copy.checkEmail}
            </Chip>
          </div>
        ) : null}

        {isSupabaseConfigured ? (
          <>
            <form action="/api/auth/magic-link" method="post" className="form-stack">
              <input type="hidden" name="locale" value={locale} />
              <Input name="email" type="email" label={copy.email} required placeholder="you@example.com" />
              <Button className="button button-primary" color="primary" radius="full" type="submit">
                {copy.magicLink}
              </Button>
            </form>
            <form action="/api/auth/oauth" method="post" className="form-stack">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="provider" value="google" />
              <Button className="button button-ghost" variant="ghost" radius="full" type="submit">
                {copy.google}
              </Button>
            </form>
          </>
        ) : (
          <form action="/api/auth/demo" method="post" className="form-stack">
            <input type="hidden" name="locale" value={locale} />
            <Input name="email" type="email" label={copy.email} required placeholder="you@example.com" />
            <Button className="button button-primary" color="primary" radius="full" type="submit">
              {copy.continue}
            </Button>
          </form>
        )}
      </div>
      <div className="panel">
        <p className="eyebrow">{copy.mode}</p>
        <p className="lead">{isSupabaseConfigured ? copy.live : copy.fallback}</p>
        <div className="site-actions">
          <Button as={NextLink} href={`/${locale}`} variant="light" radius="full">
            {locale === 'it' ? 'Torna alla home' : 'Back to home'}
          </Button>
        </div>
      </div>
    </section>
  );
}
