import { expect, test } from '@playwright/test';
import { seededCredentials, testCourt } from './support/credentials';
import { futureDateISO } from './support/dates';
import { captureVisual, expectToast, loginViaUi, navigateByText } from './support/ui';

test.describe('fluxos visuais do usuario', () => {
  test('busca quadra, cria reserva, consulta detalhes e cancela', async ({ page }, testInfo) => {
    const reservationDate = futureDateISO(14, testInfo);

    await loginViaUi(page, seededCredentials.usuario);
    await page.locator('.search-bar input').fill(testCourt.search);
    await page.locator('.search-bar button').click();

    await expect(page.locator('h1')).toContainText(/Buscar/);
    const courtCard = page.locator('article.court-card').filter({ hasText: testCourt.name }).first();
    await expect(courtCard).toBeVisible();
    await captureVisual(page, testInfo, 'usuario-busca-quadra');

    await courtCard.click();
    await expect(page.getByRole('heading', { name: testCourt.name })).toBeVisible();
    await captureVisual(page, testInfo, 'usuario-detalhe-quadra');

    await page.getByRole('button', { name: /Reservar Agora/ }).click();
    await expect(page.locator('.reservation-modal')).toBeVisible();
    await page.locator('.reservation-modal input[type="date"]').fill(reservationDate);

    const scheduleSelect = page.locator('.reservation-modal label').filter({ hasText: /Hor/ }).locator('select');
    await expect(scheduleSelect).not.toHaveValue('', { timeout: 15000 });
    await scheduleSelect.selectOption({ index: 0 });
    await page.locator('.reservation-modal textarea').fill('Teste visual automatizado do fluxo de reserva.');
    await captureVisual(page, testInfo, 'usuario-modal-reserva');

    await page.getByRole('button', { name: /Revisar reserva/ }).click();
    await expect(page.locator('.reservation-review-summary')).toBeVisible();
    await captureVisual(page, testInfo, 'usuario-revisao-reserva');

    await page.getByRole('button', { name: /Confirmar reserva/ }).click();
    await expect(page.getByRole('heading', { name: /Reserva Confirmada/ })).toBeVisible({ timeout: 20000 });
    await captureVisual(page, testInfo, 'usuario-reserva-confirmada');

    await page.getByRole('button', { name: /Ver minhas reservas/ }).click();
    await expect(page.getByRole('heading', { name: /Minhas Reservas/ })).toBeVisible();

    const reservationRow = page.locator('.reservation-row').filter({ hasText: testCourt.name }).first();
    await expect(reservationRow).toBeVisible();
    await reservationRow.getByRole('button', { name: /Detalhes/ }).click();
    await expect(page.getByRole('heading', { name: /Detalhes da reserva/ })).toBeVisible();
    await captureVisual(page, testInfo, 'usuario-detalhes-reserva');
    await page.locator('.reservation-details-modal .primary-action').click();

    await reservationRow.getByRole('button', { name: /^Cancelar$/ }).click();
    await expect(page.getByRole('heading', { name: /Cancelar reserva/ })).toBeVisible();
    await page.getByRole('button', { name: /Confirmar Cancelamento/ }).click();
    await expectToast(page, /Reserva cancelada/);
    await captureVisual(page, testInfo, 'usuario-reserva-cancelada');
  });

  test('navega por mapa, suporte e configuracoes', async ({ page }, testInfo) => {
    await loginViaUi(page, seededCredentials.usuario);

    await navigateByText(page, /Mapa/);
    await expect(page.locator('.leaflet-container, .map-view, .empty-state').first()).toBeVisible();
    await captureVisual(page, testInfo, 'usuario-mapa');

    await navigateByText(page, /Suporte/);
    await expect(page.getByRole('heading', { name: /Suporte/ })).toBeVisible();
    await captureVisual(page, testInfo, 'usuario-suporte');

    await navigateByText(page, /Config/);
    await expect(page.getByRole('heading', { name: /Config/ })).toBeVisible();
    await page.locator('.settings-switch-row input[type="checkbox"]').first().check();
    await captureVisual(page, testInfo, 'usuario-configuracoes');
  });
});
