import { expect, type Page, type TestInfo } from '@playwright/test';

type LoginCredentials = {
  email: string;
  password: string;
  expectedProfile?: string;
};

export async function resetBrowserSession(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

export async function loginViaUi(page: Page, credentials: LoginCredentials) {
  await resetBrowserSession(page);
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="senha"]').fill(credentials.password);
  await page.getByRole('button', { name: /^Entrar$/ }).click();

  await expect(page.locator('.app-header')).toBeVisible();

  if (credentials.expectedProfile) {
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem('playarena:session') || 'null'));
    expect(session?.usuario?.perfil).toBe(credentials.expectedProfile);
  }
}

export async function logoutViaUi(page: Page) {
  await page.getByRole('button', { name: /^Sair$/ }).click();
  await expect(page.locator('.auth-panel')).toBeVisible();
}

export async function navigateByText(page: Page, label: RegExp | string) {
  const button = page.locator('.main-nav .nav-link').filter({ hasText: label }).first();
  await expect(button).toBeVisible();
  await button.click();
}

export async function captureVisual(page: Page, testInfo: TestInfo, name: string) {
  if (testInfo.project.name === 'webkit') {
    return;
  }

  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const path = testInfo.outputPath(`${safeName}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

export async function dismissToast(page: Page) {
  const toast = page.locator('.toast');

  if (await toast.isVisible().catch(() => false)) {
    await toast.getByRole('button', { name: /Fechar aviso/ }).click();
  }
}

export async function expectToast(page: Page, message: RegExp | string) {
  await expect(page.locator('.toast')).toContainText(message);
}
