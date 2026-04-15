import { describe, expect, it } from 'vitest';

import { isMobileUserAgent } from '@/lib/runtime/device';

describe('isMobileUserAgent', () => {
  it('detects common mobile user agents', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
    expect(isMobileUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(true);
  });

  it('ignores desktop user agents and missing headers', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe(false);
    expect(isMobileUserAgent(undefined)).toBe(false);
    expect(isMobileUserAgent(null)).toBe(false);
  });
});
