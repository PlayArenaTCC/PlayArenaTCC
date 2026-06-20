import { test, expect } from '@playwright/test';
import {
  formatCpf,
  formatPlainCurrency,
  formatPortugueseText,
  isPastISODate,
  todayISO,
} from '../../src/utils/formatters';

test('formatCpf formata corretamente', () => {
  expect(formatCpf('12345678901')).toBe('123.456.789-01');
  expect(formatCpf('invalid')).toBe('invalid');
});

test('formatPlainCurrency produz formato sem casas decimais', () => {
  const out = formatPlainCurrency(1000);
  expect(out).toMatch(/1\.?000/);
});

test('todayISO usa a data local em vez de UTC', () => {
  const date = new Date(2026, 5, 7, 23, 30);

  expect(todayISO(date)).toBe('2026-06-07');
});

test('isPastISODate identifica datas anteriores a referencia', () => {
  expect(isPastISODate('2026-06-06', '2026-06-07')).toBe(true);
  expect(isPastISODate('2026-06-07', '2026-06-07')).toBe(false);
  expect(isPastISODate('2026-06-08', '2026-06-07')).toBe(false);
  expect(isPastISODate('data-invalida', '2026-06-07')).toBe(false);
});

test('formatPortugueseText corrige palavras conhecidas', () => {
  expect(formatPortugueseText('Campo Mourao')).toBe('Campo Mourão');
});
