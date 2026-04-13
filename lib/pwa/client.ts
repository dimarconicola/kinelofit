export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWA_DISMISS_KEY = 'kinelo:pwa-install-dismissed-at';
export const PWA_DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 14;

export const detectStandalone = () => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
};

export const detectIos = (userAgent?: string) => {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /iPhone|iPad|iPod/i.test(ua);
};

export const detectMobile = (userAgent?: string) => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 820px)').matches) {
    return true;
  }

  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
};

export const detectInAppBrowser = (userAgent?: string) => {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /Instagram|FBAN|FBAV|Line\/|TikTok|Twitter|LinkedInApp/i.test(ua);
};

export const readPwaDismissedAt = () => {
  if (typeof window === 'undefined') return 0;

  const rawValue = window.localStorage.getItem(PWA_DISMISS_KEY);
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isPwaDismissed = (now = Date.now()) => {
  const dismissedAt = readPwaDismissedAt();
  return dismissedAt > 0 && now - dismissedAt < PWA_DISMISS_COOLDOWN_MS;
};

export const markPwaDismissed = (timestamp = Date.now()) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PWA_DISMISS_KEY, String(timestamp));
};

export const clearPwaDismissed = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PWA_DISMISS_KEY);
};
