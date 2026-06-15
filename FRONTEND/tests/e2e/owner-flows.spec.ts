import { expect, test } from '@playwright/test';
import { createReservationForOwnerValidation } from './support/api';
import { seededCredentials, testCourt } from './support/credentials';
import { futureDateISO } from './support/dates';
import { captureVisual, expectToast, loginViaUi, navigateByText } from './support/ui';

test.describe('fluxos visuais do proprietario', () => {
  test('gerencia espaco, adiciona horario e valida codigo de reserva', async ({ page, request }, testInfo) => {
    const reservation = await createReservationForOwnerValidation(request, testInfo);
    const extraScheduleDate = futureDateISO(45, testInfo);

    await loginViaUi(page, seededCredentials.proprietario);
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible();
    await captureVisual(page, testInfo, 'proprietario-dashboard');

    await navigateByText(page, /Meus Espa/);
    await expect(page.getByRole('heading', { name: /Meus Espa/ })).toBeVisible();

    const courtCard = page.locator('article.owner-card').filter({ hasText: testCourt.name }).first();
    await expect(courtCard).toBeVisible();
    await courtCard.getByRole('button', { name: /Gerenciar/ }).click();
    await expect(courtCard.locator('.owner-schedule-manager')).toBeVisible();
    await captureVisual(page, testInfo, 'proprietario-gerenciar-horarios');

    const scheduleForm = courtCard.locator('form.schedule-form').last();
    await scheduleForm.getByRole('button', { name: /Data/ }).click();
    await scheduleForm.locator('input[type="date"]').fill(extraScheduleDate);
    await scheduleForm.locator('input[type="time"]').first().fill('21:00');
    await scheduleForm.locator('input[type="time"]').nth(1).fill('22:00');
    await scheduleForm.locator('input[type="number"]').fill('130');
    await scheduleForm.getByRole('button', { name: /Adicionar hor/ }).click();
    await expect(courtCard.locator('.owner-schedule-time').filter({ hasText: /21:00/ }).first()).toBeVisible();

    await navigateByText(page, /^Reservas$/);
    await expect(page.getByRole('heading', { name: /Gerenciar Reservas/ })).toBeVisible();

    const reservationRow = page.locator('.owner-reservation-row').filter({ hasText: testCourt.name }).first();
    await expect(reservationRow).toBeVisible({ timeout: 15000 });
    await captureVisual(page, testInfo, 'proprietario-reservas');

    await reservationRow.getByRole('button', { name: /Validar/ }).click();
    await expect(page.getByRole('heading', { name: /Validar/ })).toBeVisible();
    await page.locator('.owner-code-validation-modal input').fill(reservation.reserva.codigo_reserva);
    await captureVisual(page, testInfo, 'proprietario-validar-codigo');

    await page.locator('.owner-code-validation-modal').getByRole('button', { name: /Validar c/ }).click();
    await expectToast(page, /validado|validada|conclu/);
    await captureVisual(page, testInfo, 'proprietario-codigo-validado');
  });

  test('abre suporte, perfil e configuracoes do proprietario', async ({ page }, testInfo) => {
    await loginViaUi(page, seededCredentials.proprietario);

    await navigateByText(page, /Suporte/);
    await expect(page.getByRole('heading', { name: /Suporte/ })).toBeVisible();
    await captureVisual(page, testInfo, 'proprietario-suporte');

    await navigateByText(page, /Config/);
    await expect(page.getByRole('heading', { name: /Config/ })).toBeVisible();
    await captureVisual(page, testInfo, 'proprietario-configuracoes');

    await page.getByRole('button', { name: /Abrir meu perfil/ }).click();
    await expect(page.getByRole('heading', { name: /Meu Perfil Empresarial/ })).toBeVisible();
    await captureVisual(page, testInfo, 'proprietario-perfil');
  });
});
