const crypto = require('crypto');

function getVerificationCodeLength() {
  const length = Number(process.env.SMS_CODE_LENGTH || 6);

  if (!Number.isInteger(length) || length < 4 || length > 8) {
    return 6;
  }

  return length;
}

function getSmsProvider() {
  const provider = String(process.env.SMS_PROVIDER || 'local').trim().toLowerCase();

  if (provider === 'twilio') {
    return 'twilio_verify';
  }

  return provider;
}

function isProviderManagedOtp() {
  return getSmsProvider() === 'twilio_verify';
}

function generateVerificationCode() {
  const length = getVerificationCodeLength();
  let code = '';

  for (let index = 0; index < length; index += 1) {
    code += String(crypto.randomInt(0, 10));
  }

  return code;
}

async function sendVerificationSms({ phoneE164, code }) {
  const provider = getSmsProvider();
  const message = `Seu código de verificação PlayArena e: ${code}`;

  if (provider === 'twilio_verify') {
    throw new Error('Twilio Verify gera e envia o código diretamente. Use startProviderVerification.');
  }

  if (provider === 'zenvia') {
    return sendWithZenvia({ phoneE164, message });
  }

  console.info(`[SMS local] Enviando código PlayArena para ${phoneE164}: ${code}`);

  return {
    provider: 'local',
    messageId: null,
  };
}

async function startProviderVerification({ phoneE164 }) {
  const provider = getSmsProvider();

  if (provider !== 'twilio_verify') {
    throw new Error('Nenhum provedor gerenciado de OTP configurado.');
  }

  return startTwilioVerification({ phoneE164 });
}

async function checkProviderVerification({ phoneE164, code }) {
  const provider = getSmsProvider();

  if (provider !== 'twilio_verify') {
    throw new Error('Nenhum provedor gerenciado de OTP configurado.');
  }

  return checkTwilioVerification({ phoneE164, code });
}

async function sendWithZenvia({ phoneE164, message }) {
  const token = process.env.ZENVIA_API_TOKEN;
  const from = process.env.ZENVIA_SMS_FROM;
  const endpoint = process.env.ZENVIA_SMS_ENDPOINT || 'https://api.zenvia.com/v2/channels/sms/messages';

  if (!token || !from) {
    throw new Error('ZENVIA_API_TOKEN e ZENVIA_SMS_FROM precisam estar configurados.');
  }

  if (typeof fetch !== 'function') {
    throw new Error('Esta versão do Node não possui fetch global para enviar SMS.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-TOKEN': token,
    },
    body: JSON.stringify({
      from,
      to: phoneE164,
      contents: [
        {
          type: 'text',
          text: message,
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.message || data.error || response.statusText;
    throw new Error(`Falha ao enviar SMS pela Zenvia: ${detail}`);
  }

  return {
    provider: 'zenvia',
    messageId: data.id || null,
  };
}

function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_VERIFY_SERVICE_SID precisam estar configurados.');
  }

  return {
    accountSid,
    authToken,
    serviceSid,
  };
}

function buildTwilioAuthHeader(accountSid, authToken) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
}

async function twilioVerifyRequest(path, body) {
  if (typeof fetch !== 'function') {
    throw new Error('Esta versão do Node não possui fetch global para chamar a Twilio.');
  }

  const { accountSid, authToken, serviceSid } = getTwilioCredentials();
  const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}${path}`, {
    method: 'POST',
    headers: {
      Authorization: buildTwilioAuthHeader(accountSid, authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.message || data.error_message || data.error || response.statusText;
    throw new Error(`Falha na Twilio Verify: ${detail}`);
  }

  return data;
}

async function startTwilioVerification({ phoneE164 }) {
  const data = await twilioVerifyRequest('/Verifications', {
    To: phoneE164,
    Channel: 'sms',
    Locale: 'pt-BR',
  });

  return {
    provider: 'twilio_verify',
    messageId: data.sid || null,
  };
}

async function checkTwilioVerification({ phoneE164, code }) {
  const data = await twilioVerifyRequest('/VerificationCheck', {
    To: phoneE164,
    Code: code,
  });

  return {
    provider: 'twilio_verify',
    approved: data.status === 'approved',
    status: data.status,
  };
}

module.exports = {
  checkProviderVerification,
  generateVerificationCode,
  getSmsProvider,
  isProviderManagedOtp,
  sendVerificationSms,
  startProviderVerification,
};
