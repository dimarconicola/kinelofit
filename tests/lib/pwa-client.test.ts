import { describe, expect, it, vi } from 'vitest';

import {
  PWA_DISMISS_COOLDOWN_MS,
  clearPwaDismissed,
  detectInAppBrowser,
  detectIos,
  detectMobile,
  isPwaDismissed,
  markPwaDismissed
} from '@/lib/pwa/client';

describe('pwa client helpers', () => {
  it('detects iOS and embedded browsers from user agents', () => {
    expect(detectIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)')).toBe(true);
    expect(detectIos('Mozilla/5.0 (Android 14; Mobile)')).toBe(false);
    expect(detectInAppBrowser('Mozilla/5.0 Instagram 341.0.0.0')).toBe(true);
    expect(detectInAppBrowser('Mozilla/5.0 Safari/605.1.15')).toBe(false);
  });

  it('detects mobile from viewport or user agent', () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: true })
    });

    expect(detectMobile('Mozilla/5.0 (Macintosh)')).toBe(true);
    vi.unstubAllGlobals();
    expect(detectMobile('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
    expect(detectMobile('Mozilla/5.0 (Android 14; Mobile)')).toBe(true);
  });

  it('tracks dismiss cooldown in localStorage', () => {
    clearPwaDismissed();
    expect(isPwaDismissed(1_000)).toBe(false);

    markPwaDismissed(5_000);
    expect(isPwaDismissed(5_000 + PWA_DISMISS_COOLDOWN_MS - 1)).toBe(true);
    expect(isPwaDismissed(5_000 + PWA_DISMISS_COOLDOWN_MS + 1)).toBe(false);
  });
});
