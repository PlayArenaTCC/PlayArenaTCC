import type { TestInfo } from '@playwright/test';

const projectOffsets: Record<string, number> = {
  chromium: 0,
  firefox: 3,
  webkit: 6,
};

export function futureDateISO(daysFromNow: number, testInfo?: TestInfo) {
  const projectOffset = testInfo ? projectOffsets[testInfo.project.name] ?? 0 : 0;
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow + projectOffset);
  return date.toISOString().slice(0, 10);
}

export function ptDateFromISO(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}
