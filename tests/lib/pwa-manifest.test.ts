import { describe, expect, it } from 'vitest';

import manifest from '@/app/manifest';

describe('pwa manifest', () => {
  it('publishes standalone install metadata and shortcuts', () => {
    const value = manifest();

    expect(value.name).toBe('kinelo.fit');
    expect(value.display).toBe('standalone');
    expect(value.start_url).toBe('/it');
    expect(value.icons?.length).toBeGreaterThanOrEqual(2);
    expect(value.shortcuts?.map((item) => item.url)).toEqual(['/it/palermo/classes', '/it/palermo/studios', '/it/schedule']);
    expect(value.screenshots?.length).toBe(2);
  });
});
