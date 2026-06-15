import { expect, test } from '@playwright/test';
import { providedCredentials, seededCredentials, testCourt } from './support/credentials';
import { captureVisual, expectToast, loginViaUi, navigateByText } from './support/ui';

test.describe('fluxos visuais do administrador', () => {
  test.describe.configure({ mode: 'parallel' });

  test('acompanha dashboard, documentos e espacos', async ({ page }, testInfo) => {
    await loginViaUi(page, providedCredentials.admin);
    await expect(page.getByRole('heading', { name: /Painel Administrativo/ })).toBeVisible();
    await captureVisual(page, testInfo, 'admin-dashboard');

    await navigateByText(page, /Documentos/);
    await expect(page.getByRole('heading', { name: /Documentos/ })).toBeVisible();
    await captureVisual(page, testInfo, 'admin-documentos');

    await navigateByText(page, /Espa/);
    await expect(page.getByRole('heading', { name: /Espa/ })).toBeVisible();

    const spaceCard = page.locator('.admin-space-card').filter({ hasText: testCourt.name }).first();
    await expect(spaceCard).toBeVisible();

    if (testInfo.project.name === 'webkit') {
      return;
    }

    await spaceCard.getByRole('button', { name: /Hor/ }).click();
    await expect(spaceCard.locator('.admin-space-schedule-manager')).toBeVisible();
    await captureVisual(page, testInfo, 'admin-espaco-horarios');

    await spaceCard.getByRole('button', { name: /Desativar/ }).click();
    await expect(page.getByRole('heading', { name: /Desativar Espa/ })).toBeVisible();
    await captureVisual(page, testInfo, 'admin-modal-desativar-espaco');
    await page.getByRole('button', { name: /^Cancelar$/ }).click();
  });

  test('gerencia contas de teste sem alterar credenciais principais', async ({ page }, testInfo) => {
    await loginViaUi(page, providedCredentials.admin);
    await navigateByText(page, /Usu/);
    await expect(page.getByRole('heading', { name: /Usu/ })).toBeVisible();

    const targetUserRow = page.locator('.admin-user-row').filter({ hasText: seededCredentials.targetUser.email }).first();
    await expect(targetUserRow).toBeVisible({ timeout: 15000 });
    await captureVisual(page, testInfo, 'admin-usuarios-lista');

    if (testInfo.project.name === 'webkit') {
      const pendingOwnerRow = page.locator('.admin-user-row').filter({ hasText: seededCredentials.pendingOwner.email }).first();
      await expect(pendingOwnerRow).toBeVisible();
      return;
    }

    await targetUserRow.getByRole('button', { name: /Ban tempor/ }).click();
    await expect(page.getByRole('heading', { name: /Ban tempor/ })).toBeVisible();
    await page.locator('.admin-user-block-modal textarea').fill('Teste visual automatizado de ban temporario.');
    await captureVisual(page, testInfo, 'admin-ban-temporario');
    await page.getByRole('button', { name: /Salvar ban/ }).click();
    await expectToast(page, /Bloqueio|bloqueio|ban/);

    await targetUserRow.getByRole('button', { name: /Editar ban tempor/ }).click();
    await page.getByRole('button', { name: /Remover bloqueio/ }).click();
    await expectToast(page, /removido|Bloqueio|bloqueio/);

    const pendingOwnerRow = page.locator('.admin-user-row').filter({ hasText: seededCredentials.pendingOwner.email }).first();
    await expect(pendingOwnerRow).toBeVisible();
    await pendingOwnerRow.getByRole('button', { name: /^Reprovar$/ }).click();
    await expectToast(page, /Propriet/);
    await pendingOwnerRow.getByRole('button', { name: /^Aprovar$/ }).click();
    await expectToast(page, /Propriet/);
    await captureVisual(page, testInfo, 'admin-proprietario-aprovado');
  });
});
