import { AccountDigestForm } from '@/components/account/AccountDigestForm';
import { AccountProfileForm } from '@/components/account/AccountProfileForm';
import { ServerButtonLink, ServerChip } from '@/components/ui/server';
import { getSessionUser } from '@/lib/auth/session';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
import { resolveLocale } from '@/lib/i18n/routing';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';
import { getDigestSubscription, getUserProfile, listUserFavorites, listUserSchedule } from '@/lib/runtime/store';

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const [user, capabilities, catalog] = await Promise.all([getSessionUser(), getRuntimeCapabilities(), getCatalogSnapshot()]);

  const copy =
    locale === 'it'
      ? {
          signInNeeded: 'Accedi per vedere e aggiornare il tuo profilo.',
          signIn: 'Accedi',
          unavailable: 'Il profilo non è disponibile in questo momento. Puoi continuare a esplorare le pagine pubbliche.',
          back: 'Torna a Palermo',
          eyebrow: 'Account',
          title: 'Il tuo profilo',
          lead: 'Gestisci come ti presenti dentro kinelo.fit e tieni sotto controllo i tuoi salvataggi.',
          email: 'Email account',
          provider: 'Metodo di accesso',
          digest: 'Digest attivo',
          favorites: 'Preferiti',
          schedule: 'Agenda salvata',
          homeCity: 'Città base',
          shortcuts: 'Accessi rapidi',
          viewFavorites: 'Apri preferiti',
          viewSchedule: 'Apri agenda',
          providerSupabase: 'Supabase',
          providerDemo: 'Demo locale',
          digestOn: 'Attivo',
          digestOff: 'Non attivo'
        }
      : {
          signInNeeded: 'Sign in to view and update your profile.',
          signIn: 'Sign in',
          unavailable: 'Account is temporarily unavailable. You can keep exploring public pages.',
          back: 'Back to Palermo',
          eyebrow: 'Account',
          title: 'Your profile',
          lead: 'Manage how you appear inside kinelo.fit and keep an eye on what you saved.',
          email: 'Account email',
          provider: 'Access method',
          digest: 'Digest status',
          favorites: 'Favorites',
          schedule: 'Saved schedule',
          homeCity: 'Home city',
          shortcuts: 'Quick links',
          viewFavorites: 'Open favorites',
          viewSchedule: 'Open schedule',
          providerSupabase: 'Supabase',
          providerDemo: 'Local demo',
          digestOn: 'Active',
          digestOff: 'Inactive'
        };

  if (capabilities.authMode === 'unavailable' || capabilities.storeMode !== 'database') {
    return (
      <div className="empty-state">
        <p>{copy.unavailable}</p>
        <ServerButtonLink href={`/${locale}/palermo`} className="button-primary">
          {copy.back}
        </ServerButtonLink>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state">
        <p>{copy.signInNeeded}</p>
        <ServerButtonLink href={`/${locale}/sign-in`} className="button-primary">
          {copy.signIn}
        </ServerButtonLink>
      </div>
    );
  }

  const [profile, favorites, schedule] = await Promise.all([
    getUserProfile(user.id, user.email),
    listUserFavorites(user.id),
    listUserSchedule(user.id)
  ]);
  const digestSubscription = await getDigestSubscription(user.email, profile.homeCitySlug);

  const cityOptions = catalog.cities.map((city) => ({
    slug: city.slug,
    label: city.name[locale]
  }));
  const homeCityLabel = cityOptions.find((city) => city.slug === profile.homeCitySlug)?.label ?? profile.homeCitySlug;

  return (
    <section className="detail-hero profile-hero">
      <div className="panel profile-main">
        <div className="profile-main-layout">
          <div className="profile-main-copy">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="lead">{copy.lead}</p>
            <div className="profile-chip-row">
              <ServerChip tone="meta">{copy.email}: {user.email}</ServerChip>
              <ServerChip tone="meta">{copy.homeCity}: {homeCityLabel}</ServerChip>
            </div>
            <AccountProfileForm locale={locale} profile={profile} cityOptions={cityOptions} />
          </div>
        </div>
      </div>

      <div className="profile-side-stack">
        <div className="panel profile-side">
          <p className="eyebrow">{copy.provider}</p>
          <h2>{user.provider === 'supabase' ? copy.providerSupabase : copy.providerDemo}</h2>
          <div className="classes-stat-grid profile-metrics">
            <div>
              <strong>{favorites.length}</strong>
              <span>{copy.favorites}</span>
            </div>
            <div>
              <strong>{schedule.length}</strong>
              <span>{copy.schedule}</span>
            </div>
            <div>
              <strong>{digestSubscription ? copy.digestOn : copy.digestOff}</strong>
              <span>{copy.digest}</span>
            </div>
          </div>
          <AccountDigestForm locale={locale} citySlug={profile.homeCitySlug} subscription={digestSubscription} />
          <div className="profile-side-actions">
            <ServerButtonLink href={`/${locale}/favorites`} className="button-ghost">
              {copy.viewFavorites}
            </ServerButtonLink>
            <ServerButtonLink href={`/${locale}/schedule`} className="button-ghost">
              {copy.viewSchedule}
            </ServerButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
