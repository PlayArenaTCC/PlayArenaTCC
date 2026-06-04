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

function getTemporaryUserBlockState(user, now = new Date()) {
  const start = user?.bloqueada_inicio_em ? new Date(user.bloqueada_inicio_em) : null;
  const end = user?.bloqueada_fim_em ? new Date(user.bloqueada_fim_em) : null;
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

function isUserTemporarilyBlocked(user, now = new Date()) {
  return getTemporaryUserBlockState(user, now).active;
}

async function clearExpiredTemporaryUserBlock(user, now = new Date()) {
  if (!user || !getTemporaryUserBlockState(user, now).expired) {
    return false;
  }

  await user.update({
    bloqueada_inicio_em: null,
    bloqueada_fim_em: null,
    motivo_bloqueio: null,
  });
  return true;
}

function formatTemporaryBlockMessage(user) {
  const end = user?.bloqueada_fim_em ? new Date(user.bloqueada_fim_em) : null;
  const formattedEnd = end && !Number.isNaN(end.getTime())
    ? end.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: SAO_PAULO_TIME_ZONE,
    })
    : 'o periodo definido';
  const reason = String(user?.motivo_bloqueio || 'Nao informado.').trim();

  return `Sua conta está temporariamente bloqueada até ${formattedEnd}. Motivo: ${reason}`;
}

function withEffectiveUserStatus(user, now = new Date()) {
  const data = user?.toJSON ? user.toJSON() : { ...user };
  const blockState = getTemporaryUserBlockState(data, now);
  const baseStatus = data.status || 'ativo';

  return {
    ...data,
    status_base: baseStatus,
    status: baseStatus === 'ativo' && blockState.active ? 'bloqueado_temporariamente' : baseStatus,
    temporariamente_bloqueado: blockState.active,
    bloqueio_agendado: blockState.scheduled,
  };
}

module.exports = {
  buildLocalDateTime,
  clearExpiredTemporaryUserBlock,
  formatTemporaryBlockMessage,
  getTemporaryUserBlockState,
  isUserTemporarilyBlocked,
  withEffectiveUserStatus,
};
