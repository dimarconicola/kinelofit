'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';

import type { Locale } from '@/lib/catalog/types';
import { usePwa } from '@/components/providers/PwaProvider';

interface PwaInstallCalloutProps {
  locale: Locale;
  variant?: 'hero' | 'compact';
  context: 'home' | 'account' | 'schedule';
}

export function PwaInstallCallout({ locale, variant = 'compact', context }: PwaInstallCalloutProps) {
  const { canShowPrompt, dismissPrompt, isInAppBrowser, isInstallPromptAvailable, isIos, isMobile, promptInstall, trackInstallHelpOpened } = usePwa();
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const copy = useMemo(
    () =>
      locale === 'it'
        ? {
            installTitle: 'Aggiungi kinelo.fit alla home',
            installBody: 'Apri calendario, studi e agenda come un’app, direttamente dal telefono.',
            installCta: 'Installa app',
            later: 'Non ora',
            iosTitle: 'Mettila nella schermata Home',
            iosBody: 'Su iPhone o iPad usa Safari: tocca Condividi e poi “Aggiungi a Home”.',
            iosSteps: ['Apri questa pagina in Safari.', 'Tocca il pulsante Condividi.', 'Scegli “Aggiungi a Home”.'],
            iosHelp: 'Mostra passaggi',
            embeddedTitle: 'Aprila nel browser per installarla',
            embeddedBody: 'Instagram e Facebook bloccano spesso l’installazione. Apri kinelo.fit in Safari o Chrome e poi aggiungila alla home.',
            embeddedHint: 'Usa il menu del browser integrato e scegli “Apri nel browser”.',
            working: 'Sto aprendo il prompt…'
          }
        : {
            installTitle: 'Add kinelo.fit to your home screen',
            installBody: 'Open classes, studios, and your saved schedule like an app directly from your phone.',
            installCta: 'Install app',
            later: 'Not now',
            iosTitle: 'Add it to your Home Screen',
            iosBody: 'On iPhone or iPad, open this page in Safari, tap Share, then “Add to Home Screen”.',
            iosSteps: ['Open this page in Safari.', 'Tap the Share button.', 'Choose “Add to Home Screen”.'],
            iosHelp: 'Show steps',
            embeddedTitle: 'Open it in your browser to install',
            embeddedBody: 'Instagram and Facebook often block installation. Open kinelo.fit in Safari or Chrome, then add it to your home screen.',
            embeddedHint: 'Use the in-app browser menu and choose “Open in browser”.',
            working: 'Opening the install prompt…'
          },
    [locale]
  );

  if (!isMobile || !canShowPrompt) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    await promptInstall();
    setIsInstalling(false);
  };

  const handleOpenIosHelp = () => {
    setShowIosSteps((current) => !current);
    trackInstallHelpOpened(context);
  };

  return (
    <div className={clsx('pwa-install-card panel', variant === 'hero' && 'pwa-install-card-hero')}>
      <div className="pwa-install-copy">
        <p className="eyebrow">App</p>
        <h3>{isInAppBrowser ? copy.embeddedTitle : isIos && !isInstallPromptAvailable ? copy.iosTitle : copy.installTitle}</h3>
        <p className="muted">{isInAppBrowser ? copy.embeddedBody : isIos && !isInstallPromptAvailable ? copy.iosBody : copy.installBody}</p>
        {isInAppBrowser ? <p className="muted">{copy.embeddedHint}</p> : null}
        {showIosSteps && isIos && !isInstallPromptAvailable ? (
          <ol className="pwa-install-steps">
            {copy.iosSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
      </div>
      <div className="pwa-install-actions">
        {isInstallPromptAvailable ? (
          <button type="button" className="button button-primary" onClick={handleInstall} disabled={isInstalling}>
            {isInstalling ? copy.working : copy.installCta}
          </button>
        ) : isIos && !isInAppBrowser ? (
          <button type="button" className="button button-primary" onClick={handleOpenIosHelp}>
            {copy.iosHelp}
          </button>
        ) : null}
        <button type="button" className="button button-ghost" onClick={dismissPrompt}>
          {copy.later}
        </button>
      </div>
    </div>
  );
}
