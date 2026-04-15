import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('mobile home renders poster-only media', async ({ page }) => {
  await page.goto('/it');

  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.locator('.home-v2-photo-wrap img')).toHaveCount(1);
});
