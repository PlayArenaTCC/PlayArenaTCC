const CPF_CNPJ_INVALID_MESSAGE = 'Informe um CPF ou CNPJ v\u00e1lido.';

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function calculateCpfCheckDigit(baseDigits) {
  const factor = baseDigits.length + 1;
  const sum = baseDigits
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
  const remainder = (sum * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}

function isValidCpf(value) {
  const digits = onlyDigits(value);

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const firstCheckDigit = calculateCpfCheckDigit(digits.slice(0, 9));
  const secondCheckDigit = calculateCpfCheckDigit(digits.slice(0, 10));

  return firstCheckDigit === Number(digits[9]) && secondCheckDigit === Number(digits[10]);
}

function calculateCnpjCheckDigit(baseDigits) {
  const weights = baseDigits.length === 12
    ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = baseDigits
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = sum % 11;

  return remainder < 2 ? 0 : 11 - remainder;
}

function isValidCnpj(value) {
  const digits = onlyDigits(value);

  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const firstCheckDigit = calculateCnpjCheckDigit(digits.slice(0, 12));
  const secondCheckDigit = calculateCnpjCheckDigit(digits.slice(0, 13));

  return firstCheckDigit === Number(digits[12]) && secondCheckDigit === Number(digits[13]);
}

function isValidCpfOrCnpj(value) {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return isValidCpf(digits);
  }

  if (digits.length === 14) {
    return isValidCnpj(digits);
  }

  return false;
}

function getCpfError(value) {
  const digits = onlyDigits(value);

  if (!digits) {
    return 'Informe o CPF.';
  }

  if (digits.length !== 11) {
    return 'CPF deve ter 11 d\u00edgitos.';
  }

  if (/^(\d)\1+$/.test(digits)) {
    return 'CPF inv\u00e1lido: todos os d\u00edgitos s\u00e3o iguais.';
  }

  if (!isValidCpf(digits)) {
    return 'CPF inv\u00e1lido. Confira os n\u00fameros digitados.';
  }

  return '';
}

function getCpfCnpjError(value) {
  return isValidCpfOrCnpj(value) ? '' : CPF_CNPJ_INVALID_MESSAGE;
}

module.exports = {
  CPF_CNPJ_INVALID_MESSAGE,
  getCpfCnpjError,
  getCpfError,
  isValidCnpj,
  isValidCpf,
  isValidCpfOrCnpj,
  onlyDigits,
};
