const { Resend } = require('resend');
const config = require('../config');

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${config.appBaseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set - verification link for ${toEmail}: ${verifyUrl}`);
    return;
  }

  await resend.emails.send({
    from: config.emailFrom,
    to: toEmail,
    subject: 'E-posta adresini doğrula',
    html: `
      <p>Merhaba,</p>
      <p>Staj başvuru sistemine kaydını tamamlamak için aşağıdaki linke tıklayarak e-posta adresini doğrula:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Bu linkin süresi 24 saat sonra dolar.</p>
    `,
  });
}

module.exports = { sendVerificationEmail };
