import { expect, test } from '@playwright/test';
import { providedCredentials } from './support/credentials';
import { captureVisual, loginViaUi, logoutViaUi, resetBrowserSession } from './support/ui';

test.describe('autenticacao e acesso por perfil', () => {
  for (const credentials of Object.values(providedCredentials)) {
    test(`${credentials.label} faz login e logout`, async ({ page }, testInfo) => {
      await loginViaUi(page, credentials);
      await captureVisual(page, testInfo, `${credentials.expectedProfile}-dashboard`);

      await logoutViaUi(page);
      await captureVisual(page, testInfo, `${credentials.expectedProfile}-logout`);
    });
  }

  test('tela de login cobre suporte, validacao e troca de tipo de cadastro', async ({ page }, testInfo) => {
    await resetBrowserSession(page);

    await page.locator('input[name="email"]').fill('email-sem-arroba');
    await page.getByRole('button', { name: /^Entrar$/ }).click();
    await expect(page.locator('input[name="email"]')).not.toHaveJSProperty('validationMessage', '');

    await page.getByRole('button', { name: /Suporte/ }).click();
    await expect(page.getByRole('dialog')).toContainText(/Suporte PlayArena/);
    await captureVisual(page, testInfo, 'login-suporte');
    await page.getByRole('button', { name: /Fechar suporte/ }).click();

    await page.getByRole('button', { name: /Ainda/ }).click();
    await expect(page.locator('.auth-account-type')).toBeVisible();
    await page.locator('.auth-account-type button').filter({ hasText: /Propriet/ }).click();
    await expect(page.locator('input[name="nome_empresa"]')).toBeVisible();
    await captureVisual(page, testInfo, 'cadastro-proprietario');
  });
});
