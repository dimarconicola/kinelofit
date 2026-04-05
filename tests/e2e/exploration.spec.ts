import { expect, test } from '@playwright/test';

import { expectNoTechnicalCopy } from './helpers';

test.describe('critical public exploration', () => {
  test('anonymous visitor can explore Palermo classes across filters and views', async ({ page }) => {
    await page.goto('/it');
    await expect(page.getByRole('heading', { name: 'Scopri la lezione ideale nella tua città.' })).toBeVisible();

    await page.locator('a[href="/it/palermo/classes"]').first().click();
    await expect(page).toHaveURL(/\/it\/palermo\/classes/);
    await expect(page.getByRole('heading', { name: 'Lezioni' })).toBeVisible();
    await expectNoTechnicalCopy(page);

    await page.getByRole('button', { name: 'Mostra filtri' }).click();
    await page.getByLabel('Giorno').selectOption('mon');
    await page.getByLabel('Mattina').check();
    await page.getByRole('button', { name: 'Applica' }).click();

    await expect(page).toHaveURL(/weekday=mon/);
    await expect(page).toHaveURL(/time_bucket=morning/);

    await page.getByRole('button', { name: 'Vista mappa' }).click();
    await expect(page).toHaveURL(/view=map/);
    await expect(page).toHaveURL(/weekday=mon/);
    await expect(page.getByText(/studi in mappa/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sfoglia tutte le sedi' })).toBeVisible();

    const fallbackMarkers = page.locator('.fallback-map-marker');
    if ((await fallbackMarkers.count()) > 0) {
      await fallbackMarkers.first().click();
    } else {
      await page.locator('.classes-map-venue-item').first().click();
    }

    await expect(page).toHaveURL(/venue=/);
    await expect(page.getByText('Dettaglio sede')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/view=map/);
    await expect(page).toHaveURL(/venue=/);
    await expect(page.getByText('Dettaglio sede')).toBeVisible();

    await page.getByRole('button', { name: 'Calendario' }).click();
    await expect(page).toHaveURL(/view=calendar/);
    await expect(page).toHaveURL(/weekday=mon/);
    await expect(page.getByRole('button', { name: 'Settimana successiva' })).toBeVisible();
    await page.getByRole('button', { name: 'Settimana successiva' }).click();
    await expect(page).toHaveURL(/week_offset=1/);
  });

  test('mobile map view stays map-first with a bottom sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/it/palermo/classes?view=map');

    await expect(page.locator('.classes-map-layout')).toBeVisible();
    await expect(page.locator('.classes-map-stage-canvas')).toBeVisible();
    await expect(page.locator('.classes-map-sheet')).toBeVisible();
    await expect(page.locator('.map-overview-panel')).toHaveCount(0);
    await expectNoTechnicalCopy(page);
  });

  test('single class route is public and shareable', async ({ page }) => {
    await page.goto('/it/palermo/studios/yoga-your-life');

    const shareButton = page.getByRole('button', { name: 'Condividi' }).first();
    await expect(shareButton).toBeVisible();
    const shareUrl = await shareButton.getAttribute('data-share-url');
    expect(shareUrl).toContain('/it/palermo/classes/');

    const sharePath = new URL(shareUrl!).pathname;
    await page.goto(sharePath);

    await expect(page).toHaveURL(/\/it\/palermo\/classes\/.+/);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Apri studio' })).toBeVisible();
    await expectNoTechnicalCopy(page);
  });

  test('studio details keep Italian pricing and expose direct links', async ({ page }) => {
    await page.goto('/it/palermo/studios/ashtanga-shala-sicilia');

    await expect(page.getByText('Carnet 8 lezioni a 65 EUR; carnet 16 lezioni a 110 EUR.').first()).toBeVisible();
    await expect(page.getByText('8 lessons 65 EUR; 16 lessons 110 EUR')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Salva studio' })).toBeVisible();
    await expectNoTechnicalCopy(page);

    const externalLinks = page.locator('a[href^="http"]');
    await expect(externalLinks.first()).toBeVisible();
  });

  test('teachers directory is public and alphabetical', async ({ page }) => {
    await page.goto('/it/palermo/teachers');

    await expect(page.getByRole('heading', { name: 'Le tue guide a Palermo' })).toBeVisible();
    const names = (await page.locator('.teacher-directory-copy > .eyebrow').allTextContents()).map((item) => item.trim()).filter(Boolean);
    expect(names.length).toBeGreaterThan(3);
    expect(names.slice(0, 6)).toEqual([...names.slice(0, 6)].sort((left, right) => left.localeCompare(right, 'it')));
    await expect(page.getByRole('link', { name: /Apri profilo/i }).first()).toBeVisible();
    await expectNoTechnicalCopy(page);
  });

  test('studios directory supports list and map browsing', async ({ page }) => {
    await page.goto('/it/palermo/studios');

    await expect(page.getByRole('heading', { name: 'Dove praticare a Palermo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Studi in ordine alfabetico' })).toBeVisible();
    await expect(page.locator('.studios-directory-list-card').first()).toBeVisible();
    await expect(page.locator('.studios-directory-list-card h3').first()).toBeVisible();

    await page.getByRole('button', { name: 'Vista mappa' }).click();
    await expect(page).toHaveURL(/view=map/);
    await expect(page.getByRole('heading', { name: 'Tutte le sedi sulla mappa' })).toBeVisible();

    await page.locator('.studios-map-list-item').first().click();
    await expect(page).toHaveURL(/venue=/);
    await expect(page.getByRole('link', { name: 'Apri studio' })).toBeVisible();
    await expectNoTechnicalCopy(page);
  });
});
