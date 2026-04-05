import { expect, test } from '@playwright/test';

import { expectNoTechnicalCopy, expectOneOfTexts } from './helpers';

test.describe('public submission flows', () => {
  test('suggest calendar returns explicit feedback for a valid public submission', async ({ page }) => {
    await page.goto('/it/suggest-calendar');

    await page.getByLabel('Nome studio o progetto').fill('Test Studio Palermo');
    await page.getByLabel('Nome referente').fill('QA Runner');
    await page.getByLabel('Email').fill(`qa+calendar-${Date.now()}@example.com`);
    await page.getByLabel('URL fonti calendario (una per riga)').fill('https://example.com/schedule');
    await page.getByLabel('Dettagli orari e note').fill('Lunedi e mercoledi 18:30-19:30. Classi di prova su prenotazione.');
    await page.getByLabel('Confermo che i dati inviati sono pubblici o autorizzati alla verifica.').check();
    await page.getByRole('button', { name: 'Invia calendario' }).click();

    await expectOneOfTexts(page, [
      'Ricevuto. Il team verifica e inserisce il calendario nella coda editoriale.',
      'Invio non riuscito. Controlla i campi e riprova.',
      'Invio non riuscito. Invio temporaneamente non disponibile. Riprova tra poco.',
      'Invio non riuscito. Controlla i campi evidenziati e riprova.'
    ]);
    await expectNoTechnicalCopy(page);
  });

  test('claim flow accepts a valid request', async ({ page }) => {
    await page.goto('/it/claim/yoga-city');

    await page.getByLabel('Nome').fill('QA Owner');
    await page.getByLabel('Email').fill(`qa+claim-${Date.now()}@example.com`);
    await page.getByLabel('Ruolo').fill('Manager');
    await page.getByLabel('Note').fill('Vorrei aggiornare contatti e orari pubblici.');
    await page.getByRole('button', { name: 'Invia richiesta' }).click();

    await expect(page.getByText('Richiesta inviata. Il team la verificherà prima della pubblicazione.')).toBeVisible();
    await expectNoTechnicalCopy(page);
  });

  test('digest surface stays readable and non-technical', async ({ page }) => {
    await page.goto('/it');

    const digest = page.locator('#newsletter-digest');
    await expect(digest).toBeVisible();
    await expect(digest.getByRole('heading', { name: 'Muoviti meglio, ogni settimana' })).toBeVisible();
    await expect(digest.getByPlaceholder('nome@email.com')).toBeVisible();
    await expect(digest.getByRole('button', { name: 'Iscriviti al digest' })).toBeVisible();
    await expectNoTechnicalCopy(page);
  });
});
