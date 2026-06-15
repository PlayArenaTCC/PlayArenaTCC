const crypto = require('crypto');
const nodemailer = require('nodemailer');

let smtpTransporter = null;
let gmailTransporter = null;

function initSMTPTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error('SMTP_HOST, SMTP_USER e SMTP_PASSWORD precisam estar configurados no .env');
  }

  smtpTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  return smtpTransporter;
}

function initGmailTransporter() {
  if (gmailTransporter) return gmailTransporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('GMAIL_USER e GMAIL_APP_PASSWORD precisam estar configurados no .env');
  }

  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  return gmailTransporter;
}

function getVerificationCodeLength() {
  const length = Number(process.env.EMAIL_CODE_LENGTH || 6);

  if (!Number.isInteger(length) || length < 4 || length > 10) {
    return 6;
  }

  return length;
}

function generateEmailVerificationCode() {
  const length = getVerificationCodeLength();
  let code = '';

  for (let index = 0; index < length; index += 1) {
    code += String(crypto.randomInt(0, 10));
  }

  return code;
}

function getEmailProvider() {
  return String(process.env.EMAIL_PROVIDER || 'local').trim().toLowerCase();
}

async function sendVerificationEmail({ to, code, name }) {
  const provider = getEmailProvider();
  const recipientName = String(name || 'usuario').trim() || 'usuario';
  const subject = 'Código de verificação PlayArena';
  const text = [
    `Ola, ${recipientName}.`,
    '',
    `Seu código de verificação PlayArena e: ${code}`,
    '',
    'Se você não solicitou esse cadastro, ignore este e-mail.',
  ].join('\n');
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Código de verificação PlayArena</h2>
      <p>Ola, ${escapeHtml(recipientName)}.</p>
      <p>Use o código abaixo para concluir seu cadastro:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 20px 0;">${code}</p>
      <p>Se você não solicitou esse cadastro, ignore este e-mail.</p>
    </div>
  `;

  if (provider === 'resend') {
    return sendWithResend({
      html,
      subject,
      text,
      to,
    });
  }

  if (provider === 'smtp') {
    return sendWithSMTP({
      html,
      subject,
      text,
      to,
    });
  }

  if (provider === 'gmail') {
    return sendWithGmail({
      html,
      subject,
      text,
      to,
    });
  }

  void code;

  return {
    provider: 'local',
    messageId: null,
  };
}

async function sendWithGmail({ html, subject, text, to }) {
  try {
    const transporter = initGmailTransporter();
    const fromEmail = process.env.GMAIL_FROM || process.env.GMAIL_USER;

    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
      html,
    });

    return {
      provider: 'gmail',
      messageId: info.messageId || null,
    };
  } catch (error) {
    throw new Error(`Falha ao enviar e-mail via Gmail: ${error.message}`);
  }
}

async function sendWithSMTP({ html, subject, text, to }) {
  try {
    const transporter = initSMTPTransporter();
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
      html,
    });

    return {
      provider: 'smtp',
      messageId: info.messageId || null,
    };
  } catch (error) {
    throw new Error(`Falha ao enviar e-mail via SMTP: ${error.message}`);
  }
}

async function sendWithResend({ html, subject, text, to }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'PlayArena <onboarding@resend.dev>';
  const endpoint = process.env.RESEND_EMAIL_ENDPOINT || 'https://api.resend.com/emails';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY precisa estar configurada.');
  }

  if (typeof fetch !== 'function') {
    throw new Error('Esta versão do Node não possui fetch global para enviar e-mail.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.message || data.error?.message || data.error || response.statusText;
    throw new Error(`Falha ao enviar e-mail pelo Resend: ${detail}`);
  }

  return {
    provider: 'resend',
    messageId: data.id || null,
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  generateEmailVerificationCode,
  getEmailProvider,
  sendVerificationEmail,
};
