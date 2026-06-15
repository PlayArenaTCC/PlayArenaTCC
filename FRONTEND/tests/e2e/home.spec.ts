import { expect, test } from '@playwright/test';

test('pagina inicial abre e titulo e PLAYARENA', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/PLAYARENA/);
});
