import type { APIRequestContext, TestInfo } from '@playwright/test';
import { seededCredentials, testCourt } from './credentials';
import { futureDateISO } from './dates';

const API_URL = process.env.PLAYARENA_API_URL || 'http://localhost:3333/api';

async function readJson(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok()) {
    throw new Error(`API ${response.status()} ${response.url()}: ${text}`);
  }

  return data;
}

export async function loginApi(request: APIRequestContext, credentials = seededCredentials.usuario) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: credentials.email,
      senha: credentials.password,
    },
  });
  return readJson(response);
}

export async function getSeededCourt(request: APIRequestContext) {
  const response = await request.get(`${API_URL}/quadras`);
  const data = await readJson(response);
  const court = (data.quadras || []).find((item: { nome?: string }) => item.nome === testCourt.name);

  if (!court) {
    throw new Error(`Quadra de teste "${testCourt.name}" nao encontrada.`);
  }

  return court;
}

export async function createReservationForOwnerValidation(request: APIRequestContext, testInfo: TestInfo) {
  const session = await loginApi(request, seededCredentials.usuario);
  const court = await getSeededCourt(request);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const date = futureDateISO(30 + attempt, testInfo);
    const schedulesResponse = await request.get(`${API_URL}/quadras/${court.id}/horarios?data=${date}`);
    const schedulesData = await readJson(schedulesResponse);
    const schedule = (schedulesData.horarios || []).find((item: { hora_inicio?: string }) => (
      String(item.hora_inicio || '').startsWith('18:00')
    )) || schedulesData.horarios?.[0];

    if (!schedule) {
      continue;
    }

    const reservationResponse = await request.post(`${API_URL}/reservas`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      data: {
        quadra_id: court.id,
        horario_disponivel_id: schedule.id,
        data_reserva: date,
        hora_inicio: schedule.hora_inicio,
        hora_fim: schedule.hora_fim,
        forma_pagamento: 'pix',
        observacoes: `Reserva criada pelo Playwright no projeto ${testInfo.project.name}`,
      },
    });

    if (reservationResponse.ok()) {
      const data = await reservationResponse.json();
      return {
        court,
        date,
        reserva: data.reserva,
      };
    }

    if (reservationResponse.status() !== 409) {
      await readJson(reservationResponse);
    }
  }

  throw new Error('Nao foi possivel criar uma reserva ativa para validacao do proprietario.');
}
