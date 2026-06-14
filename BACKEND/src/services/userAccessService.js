const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

function normalizeDate(value) {
  const text = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : text;
}

function normalizeTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function buildLocalDateTime(date, time) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);

  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  const value = new Date(`${normalizedDate}T${normalizedTime}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function getTemporaryAccountBlockState(account, now = new Date()) {
  const start = account?.bloqueada_inicio_em ? new Date(account.bloqueada_inicio_em) : null;
  const end = account?.bloqueada_fim_em ? new Date(account.bloqueada_fim_em) : null;
  const hasValidRange = start
    && end
    && !Number.isNaN(start.getTime())
    && !Number.isNaN(end.getTime())
    && end > start;

  if (!hasValidRange) {
    return {
      active: false,
      scheduled: false,
      expired: false,
    };
  }

  return {
    active: now >= start && now < end,
    scheduled: now < start,
    expired: now >= end,
  };
}

function getTemporaryUserBlockState(user, now = new Date()) {
  return getTemporaryAccountBlockState(user, now);
}

function isAccountTemporarilyBlocked(account, now = new Date()) {
  return getTemporaryAccountBlockState(account, now).active;
}

function isUserTemporarilyBlocked(user, now = new Date()) {
  return isAccountTemporarilyBlocked(user, now);
}

async function clearExpiredTemporaryAccountBlock(account, now = new Date()) {
  if (!account || !getTemporaryAccountBlockState(account, now).expired) {
    return false;
  }

  await account.update({
    bloqueada_inicio_em: null,
    bloqueada_fim_em: null,
    motivo_bloqueio: null,
  });
  return true;
}

async function clearExpiredTemporaryUserBlock(user, now = new Date()) {
  return clearExpiredTemporaryAccountBlock(user, now);
}

function formatTemporaryBlockMessage(account) {
  const end = account?.bloqueada_fim_em ? new Date(account.bloqueada_fim_em) : null;
  const formattedEnd = end && !Number.isNaN(end.getTime())
    ? end.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: SAO_PAULO_TIME_ZONE,
    })
    : 'o período definido';
  const reason = String(account?.motivo_bloqueio || 'Não informado.').trim();

  return `Sua conta esta temporariamente bloqueada até ${formattedEnd}. Motivo: ${reason}`;
}

function getBaseAccountStatus(data, role = 'usuario') {
  if (role === 'usuario') {
    return data.status || 'ativo';
  }

  return data.ativo === false ? 'inativo' : 'ativo';
}

function withEffectiveAccountStatus(account, role = 'usuario', now = new Date()) {
  const data = account?.toJSON ? account.toJSON() : { ...account };
  const blockState = getTemporaryAccountBlockState(data, now);
  const baseStatus = getBaseAccountStatus(data, role);

  return {
    ...data,
    status_base: baseStatus,
    status: baseStatus === 'ativo' && blockState.active ? 'bloqueado_temporariamente' : baseStatus,
    temporariamente_bloqueado: blockState.active,
    bloqueio_agendado: blockState.scheduled,
  };
}

function withEffectiveUserStatus(user, now = new Date()) {
  return withEffectiveAccountStatus(user, 'usuario', now);
}

module.exports = {
  buildLocalDateTime,
  clearExpiredTemporaryAccountBlock,
  clearExpiredTemporaryUserBlock,
  formatTemporaryBlockMessage,
  getTemporaryAccountBlockState,
  getTemporaryUserBlockState,
  isAccountTemporarilyBlocked,
  isUserTemporarilyBlocked,
  withEffectiveAccountStatus,
  withEffectiveUserStatus,
};
