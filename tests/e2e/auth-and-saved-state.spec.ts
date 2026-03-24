import { expect, test } from '@playwright/test';

import { expectNoTechnicalCopy, expectOneOfLocators, expectOneOfTexts } from './helpers';

test.describe('auth surfaces and saved-state degradation', () => {
  test('sign-in surface stays product-grade in both available and unavailable modes', async ({ page }) => {
    await page.goto('/it/sign-in');

    await expect(page.getByRole('heading', { name: /Ritrova i tuoi posti giusti, senza password/i })).toBeVisible();
    await expect(page.getByText('Uno spazio personale leggero e utile')).toBeVisible();
    await expectNoTechnicalCopy(page);
    await expect(page.getByText('Qualcosa si è interrotto')).toHaveCount(0);

    await expectOneOfLocators([
      page.getByRole('button', { name: 'Invia magic link' }),
      page.getByRole('button', { name: 'Continua con Google' }),
      page.getByRole('button', { name: 'Continua' }),
      page.getByText('Accesso temporaneamente non disponibile')
    ]);
  });

  test('favorites and saved schedule never fall into a generic error state', async ({ page }) => {
    await page.goto('/it/favorites');
    await expectNoTechnicalCopy(page);
    await expect(page.getByText('Qualcosa si è interrotto')).toHaveCount(0);
    await expectOneOfTexts(page, [
      'Preferiti e agenda non sono disponibili in questo momento. Le pagine pubbliche restano consultabili.',
      'Accedi per ritrovare studi, insegnanti e classi che hai deciso di seguire.',
      'Preferiti e agenda, senza confonderli'
    ]);

    await page.goto('/it/schedule');
    await expectNoTechnicalCopy(page);
    await expect(page.getByText('Qualcosa si è interrotto')).toHaveCount(0);
    await expectOneOfTexts(page, [
      'L’agenda salvata non è disponibile in questo momento. Continua pure a esplorare il calendario pubblico.',
      'Accedi per tenere insieme solo le lezioni con orario che vuoi davvero fare.',
      'La tua settimana, già filtrata'
    ]);

    await page.goto('/it/account');
    await expectNoTechnicalCopy(page);
    await expect(page.getByText('Qualcosa si è interrotto')).toHaveCount(0);
    await expectOneOfTexts(page, [
      'Il profilo non è disponibile in questo momento. Puoi continuare a esplorare le pagine pubbliche.',
      'Accedi per vedere e aggiornare il tuo profilo.',
      'Profilo, preferiti e digest senza rumore'
    ]);
  });

  test('anonymous save actions redirect to sign-in or show an inline unavailable state', async ({ page }) => {
    await page.goto('/it/palermo/classes');

    const scheduleButton = page.getByRole('button', { name: 'Aggiungi in agenda' }).first();
    await scheduleButton.click();

    const redirectedToSignIn = await page.waitForURL(/\/it\/sign-in/, { timeout: 3_000 }).then(
      () => true,
      () => false
    );

    if (redirectedToSignIn) {
      await expect(page).toHaveURL(/\/it\/sign-in/);
    } else {
      await expect(page.getByText('Agenda temporaneamente non disponibile.')).toBeVisible();
    }

    await page.goto('/it/favorites');
    await expect(page.getByText('Qualcosa si è interrotto')).toHaveCount(0);
  });
});
