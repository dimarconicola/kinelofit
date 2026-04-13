'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { captureException, trackProductEvent } from '@/lib/observability/sentry';
import {
  clearPwaDismissed,
  type BeforeInstallPromptEvent,
  detectInAppBrowser,
  detectIos,
  detectMobile,
  detectStandalone,
  isPwaDismissed,
  markPwaDismissed
} from '@/lib/pwa/client';

type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

type PwaContextValue = {
  isStandalone: boolean;
  isInstallPromptAvailable: boolean;
  isIos: boolean;
  isInAppBrowser: boolean;
  isMobile: boolean;
  dismissed: boolean;
  canShowPrompt: boolean;
  promptInstall: () => Promise<InstallOutcome>;
  dismissPrompt: () => void;
  trackInstallHelpOpened: (context: string) => void;
};

const PwaContext = createContext<PwaContextValue>({
  isStandalone: false,
  isInstallPromptAvailable: false,
  isIos: false,
  isInAppBrowser: false,
  isMobile: false,
  dismissed: false,
  canShowPrompt: false,
  promptInstall: async () => 'unavailable',
  dismissPrompt: () => undefined,
  trackInstallHelpOpened: () => undefined
});

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isEmbeddedBrowser, setIsEmbeddedBrowser] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const promptSeenRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncEnvironment = () => {
      const standalone = detectStandalone();
      const ios = detectIos();
      const inAppBrowser = detectInAppBrowser();
      const mobile = detectMobile();

      setIsStandaloneMode(standalone);
      setIsIosDevice(ios);
      setIsEmbeddedBrowser(inAppBrowser);
      setIsMobileDevice(mobile);
      setDismissed(isPwaDismissed());

      document.documentElement.dataset.standalone = standalone ? 'true' : 'false';
      document.documentElement.dataset.inAppBrowser = inAppBrowser ? 'true' : 'false';
      document.documentElement.dataset.mobile = mobile ? 'true' : 'false';
    };

    syncEnvironment();

    const displayModeMedia = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = () => syncEnvironment();
    displayModeMedia.addEventListener('change', onDisplayModeChange);
    document.addEventListener('visibilitychange', onDisplayModeChange);
    window.addEventListener('pageshow', onDisplayModeChange);

    return () => {
      displayModeMedia.removeEventListener('change', onDisplayModeChange);
      document.removeEventListener('visibilitychange', onDisplayModeChange);
      window.removeEventListener('pageshow', onDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = 'kinelo:pwa-engagement-count';
    const current = Number(window.sessionStorage.getItem(key) ?? '0') + 1;
    window.sessionStorage.setItem(key, String(current));

    if (current > 1) {
      setEngaged(true);
      return;
    }

    const timer = window.setTimeout(() => setEngaged(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
    };

    const onInstalled = () => {
      clearPwaDismissed();
      setDismissed(false);
      setDeferredPrompt(null);
      setIsStandaloneMode(true);
      trackProductEvent('pwa_prompt_accepted', { source: 'browser' });
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_PWA_DEV !== 'true') return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        trackProductEvent('pwa_service_worker_registered');
      } catch (error) {
        captureException(error, { area: 'pwa', action: 'register-service-worker' });
      }
    };

    void register();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        window.requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const dismissPrompt = useCallback(() => {
    markPwaDismissed();
    setDismissed(true);
    trackProductEvent('pwa_prompt_dismissed');
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) {
      return 'unavailable';
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === 'dismissed') {
        markPwaDismissed();
        setDismissed(true);
        trackProductEvent('pwa_prompt_dismissed', { source: 'browser-native' });
      }
      return choice.outcome;
    } catch (error) {
      captureException(error, { area: 'pwa', action: 'prompt-install' });
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const canShowPrompt = engaged && isMobileDevice && !isStandaloneMode && !dismissed && (Boolean(deferredPrompt) || isIosDevice || isEmbeddedBrowser);

  useEffect(() => {
    if (!canShowPrompt || promptSeenRef.current) return;
    promptSeenRef.current = true;
    trackProductEvent('pwa_prompt_seen', {
      hasDeferredPrompt: Boolean(deferredPrompt),
      ios: isIosDevice,
      inAppBrowser: isEmbeddedBrowser
    });
  }, [canShowPrompt, deferredPrompt, isIosDevice, isEmbeddedBrowser]);

  const trackInstallHelpOpened = useCallback((context: string) => {
    trackProductEvent('pwa_install_help_opened', { context, ios: isIosDevice, inAppBrowser: isEmbeddedBrowser });
  }, [isEmbeddedBrowser, isIosDevice]);

  const value = useMemo<PwaContextValue>(
    () => ({
      isStandalone: isStandaloneMode,
      isInstallPromptAvailable: Boolean(deferredPrompt),
      isIos: isIosDevice,
      isInAppBrowser: isEmbeddedBrowser,
      isMobile: isMobileDevice,
      dismissed,
      canShowPrompt,
      promptInstall,
      dismissPrompt,
      trackInstallHelpOpened
    }),
    [canShowPrompt, deferredPrompt, dismissPrompt, dismissed, isEmbeddedBrowser, isIosDevice, isMobileDevice, isStandaloneMode, promptInstall, trackInstallHelpOpened]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export const usePwa = () => useContext(PwaContext);
