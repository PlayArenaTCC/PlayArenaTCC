import { test, expect } from '@playwright/test';
import {
  formatCpf,
  formatPlainCurrency,
  formatPortugueseText,
} from '../../src/utils/formatters';

test('formatCpf formata corretamente', () => {
  expect(formatCpf('12345678901')).toBe('123.456.789-01');
  expect(formatCpf('invalid')).toBe('invalid');
});

test('formatPlainCurrency produz formato sem casas decimais', () => {
  const out = formatPlainCurrency(1000);
  expect(out).toMatch(/1\.?000/);
});

test('formatPortugueseText corrige palavras conhecidas', () => {
  expect(formatPortugueseText('Campo Mourao')).toBe('Campo Mourão');
});
