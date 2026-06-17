import nodemailer from 'nodemailer';

const getTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mx-dc03.ewodi.net',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'infos@trugroup.cm',
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const FROM = `"${process.env.SMTP_FROM_NAME || 'Mokine'}" <${process.env.SMTP_FROM_EMAIL || 'infos@trugroup.cm'}>`;
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const baseHtml = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;color:#333}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
  .header{background:#178A3B;padding:24px 32px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:22px}
  .body{padding:32px}
  .body p{line-height:1.7;margin:0 0 16px}
  .btn{display:inline-block;margin:16px 0;padding:12px 28px;background:#178A3B;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold}
  .footer{background:#f9f9f9;padding:16px 32px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>🐄 Mokine</h1></div>
  <div class="body">${content}</div>
  <div class="footer">© ${new Date().getFullYear()} Mokine — CM TRU GROUP · Garoua, Cameroun · infos@trugroup.cm</div>
</div>
</body></html>`;

const send = async ({ to, subject, html }) => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[Email] Échec envoi à', to, '—', err.message);
  }
};

// ── Welcome email after registration ──────────────────────────────────────
export const sendWelcomeEmail = async (user) => {
  const roleLabel = { farmer: 'Éleveur', veterinarian: 'Vétérinaire', vendor: 'Fournisseur' }[user.role] || user.role;
  await send({
    to: user.email,
    subject: '🎉 Bienvenue sur Mokine !',
    html: baseHtml(`
      <p>Bonjour <strong>${user.name}</strong>,</p>
      <p>Nous sommes ravis de vous accueillir sur <strong>Mokine</strong>, la plateforme de santé animale connectée.</p>
      <p>Votre compte <strong>${roleLabel}</strong> a été créé avec succès.</p>
      <p>Vous pouvez dès maintenant accéder à votre tableau de bord :</p>
      <a href="${APP_URL}/dashboard" class="btn">Accéder à mon espace →</a>
      <p>Si vous avez des questions, écrivez-nous à <a href="mailto:infos@trugroup.cm">infos@trugroup.cm</a>.</p>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Farm invitation email ──────────────────────────────────────────────────
export const sendFarmInvitationEmail = async ({ to, inviterName, farmName, inviteLink }) => {
  await send({
    to,
    subject: `🐄 Invitation à rejoindre la ferme "${farmName}"`,
    html: baseHtml(`
      <p>Bonjour,</p>
      <p><strong>${inviterName}</strong> vous invite à rejoindre la ferme <strong>${farmName}</strong> sur Mokine.</p>
      <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation :</p>
      <a href="${APP_URL}${inviteLink}" class="btn">Rejoindre la ferme →</a>
      <p>Ce lien est valable 7 jours. Si vous n'avez pas de compte, vous pouvez en créer un gratuitement.</p>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Appointment confirmation ───────────────────────────────────────────────
export const sendAppointmentEmail = async ({ to, userName, vetName, dateTime, reason }) => {
  const date = new Date(dateTime).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
  await send({
    to,
    subject: '📅 Rendez-vous vétérinaire confirmé',
    html: baseHtml(`
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Votre rendez-vous avec <strong>Dr. ${vetName}</strong> est confirmé.</p>
      <p><strong>Date :</strong> ${date}<br><strong>Motif :</strong> ${reason}</p>
      <a href="${APP_URL}/dashboard" class="btn">Voir mes rendez-vous →</a>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Consultation status update ─────────────────────────────────────────────
export const sendConsultationUpdateEmail = async ({ to, userName, status, vetName }) => {
  const labels = { accepted: 'acceptée', refused: 'refusée', closed: 'terminée' };
  const label = labels[status] || status;
  await send({
    to,
    subject: `🩺 Consultation ${label}`,
    html: baseHtml(`
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Votre demande de consultation a été <strong>${label}</strong>${vetName ? ` par Dr. ${vetName}` : ''}.</p>
      <a href="${APP_URL}/dashboard" class="btn">Voir ma consultation →</a>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Order status email ─────────────────────────────────────────────────────
export const sendOrderStatusEmail = async ({ to, userName, orderRef, status }) => {
  const labels = { pending: 'reçue', confirmed: 'confirmée', shipped: 'expédiée', delivered: 'livrée', cancelled: 'annulée' };
  const label = labels[status] || status;
  await send({
    to,
    subject: `🛒 Commande #${orderRef} ${label}`,
    html: baseHtml(`
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Votre commande <strong>#${orderRef}</strong> a été <strong>${label}</strong>.</p>
      <a href="${APP_URL}/dashboard" class="btn">Suivre ma commande →</a>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Password reset email ───────────────────────────────────────────────────
export const sendPasswordResetEmail = async ({ to, userName, resetLink }) => {
  await send({
    to,
    subject: '🔐 Réinitialisation de votre mot de passe Mokine',
    html: baseHtml(`
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Nous avons reçu une demande de réinitialisation de votre mot de passe.</p>
      <a href="${resetLink}" class="btn">Réinitialiser mon mot de passe →</a>
      <p>Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── KYC status email ───────────────────────────────────────────────────────
export const sendKycStatusEmail = async ({ to, userName, status, reason }) => {
  const approved = status === 'approved';
  await send({
    to,
    subject: `📋 Vérification KYC ${approved ? 'approuvée' : 'refusée'}`,
    html: baseHtml(`
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Votre vérification KYC a été <strong>${approved ? 'approuvée ✅' : 'refusée ❌'}</strong>.</p>
      ${!approved && reason ? `<p><strong>Motif :</strong> ${reason}</p>` : ''}
      ${!approved ? '<p>Vous pouvez soumettre à nouveau vos documents depuis votre espace.</p>' : '<p>Votre compte est maintenant pleinement actif.</p>'}
      <a href="${APP_URL}/dashboard" class="btn">Accéder à mon espace →</a>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Reçu de paiement (cashout Camoo confirmé) ─────────────────────────────
export const sendPaymentReceiptEmail = async ({ to, userName, amount, currency = 'XAF', network, transactionId, externalRef, planName, completedAt, paymentId }) => {
  const date = completedAt
    ? new Date(completedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
    : new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  const pdfLink = paymentId ? `${APP_URL.replace('3000', '5000')}/api/pdf/payment-receipt/${paymentId}` : null;
  await send({
    to,
    subject: `✅ Reçu de paiement — ${amount.toLocaleString('fr-FR')} ${currency}`,
    html: baseHtml(`
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Nous confirmons la réception de votre paiement. Voici votre reçu :</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr style="background:#f4f4f4"><td style="padding:10px 14px;font-weight:bold">Montant</td><td style="padding:10px 14px">${amount.toLocaleString('fr-FR')} ${currency}</td></tr>
        ${planName ? `<tr><td style="padding:10px 14px;font-weight:bold">Abonnement</td><td style="padding:10px 14px">${planName}</td></tr>` : ''}
        ${network  ? `<tr style="background:#f4f4f4"><td style="padding:10px 14px;font-weight:bold">Réseau</td><td style="padding:10px 14px;text-transform:capitalize">${network}</td></tr>` : ''}
        <tr><td style="padding:10px 14px;font-weight:bold">Date</td><td style="padding:10px 14px">${date}</td></tr>
        ${transactionId ? `<tr style="background:#f4f4f4"><td style="padding:10px 14px;font-weight:bold">Réf. transaction</td><td style="padding:10px 14px;font-family:monospace;font-size:12px">${transactionId}</td></tr>` : ''}
        ${externalRef  ? `<tr><td style="padding:10px 14px;font-weight:bold">Réf. commande</td><td style="padding:10px 14px;font-family:monospace;font-size:12px">${externalRef}</td></tr>` : ''}
      </table>
      <p style="color:#178A3B;font-weight:bold">Votre abonnement est maintenant actif. 🎉</p>
      <a href="${APP_URL}/dashboard" class="btn">Accéder à mon espace →</a>
      ${pdfLink ? `
      <div style="margin:20px 0;padding:16px;background:#f0faf4;border:1px solid #178A3B;border-radius:8px;text-align:center">
        <p style="margin:0 0 10px;font-weight:bold;color:#178A3B">📄 Télécharger votre reçu en PDF</p>
        <a href="${pdfLink}" style="display:inline-block;padding:10px 24px;background:#178A3B;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
          Télécharger le reçu PDF →
        </a>
      </div>` : ''}
      <p>Conservez ce reçu pour vos archives. Pour toute question : <a href="mailto:infos@trugroup.cm">infos@trugroup.cm</a></p>
      <p>Merci de votre confiance,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Notification d'initiation de paiement ─────────────────────────────────
export const sendPaymentInitiatedEmail = async ({ to, userName, amount, currency = 'XAF', phone, planName, externalRef }) => {
  await send({
    to,
    subject: `⏳ Paiement en attente — ${amount.toLocaleString('fr-FR')} ${currency}`,
    html: baseHtml(`
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Une demande de paiement de <strong>${amount.toLocaleString('fr-FR')} ${currency}</strong> a été envoyée sur votre téléphone <strong>${phone}</strong>.</p>
      ${planName ? `<p><strong>Abonnement :</strong> ${planName}</p>` : ''}
      <p style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px">
        📱 Veuillez valider la demande sur votre téléphone pour confirmer le paiement.
      </p>
      ${externalRef ? `<p style="font-size:12px;color:#888">Réf : <code>${externalRef}</code></p>` : ''}
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Nouveau collier enregistré → notifier l'admin ─────────────────────────
export const sendCollarPendingAdminEmail = async ({ adminEmail, farmerName, farmerEmail, animalName, animalType, collarId, animalId }) => {
  const backofficeUrl = `${APP_URL}/admin/collars`;
  const typeLabels = { cattle: 'Bovin', goat: 'Caprin', sheep: 'Ovin', pig: 'Porcin', chicken: 'Volaille', horse: 'Équin', fish: 'Poisson' };
  const typeLabel = typeLabels[animalType] || animalType;
  await send({
    to: adminEmail,
    subject: `🏷️ Nouveau collier en attente de validation — ${collarId}`,
    html: baseHtml(`
      <p>Bonjour,</p>
      <p>Un nouvel identifiant de collier a été enregistré sur la plateforme et nécessite votre validation.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr style="background:#f4f4f4"><td style="padding:10px 14px;font-weight:bold">N° Collier / Tag</td><td style="padding:10px 14px;font-family:monospace;font-size:14px;font-weight:bold;color:#178A3B">${collarId}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold">Animal</td><td style="padding:10px 14px">${animalName} (${typeLabel})</td></tr>
        <tr style="background:#f4f4f4"><td style="padding:10px 14px;font-weight:bold">Éleveur</td><td style="padding:10px 14px">${farmerName}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold">Email éleveur</td><td style="padding:10px 14px">${farmerEmail}</td></tr>
      </table>
      <p>Rendez-vous dans le back office pour valider ce collier :</p>
      <a href="${backofficeUrl}" class="btn">Valider le collier dans le back office →</a>
      <p style="font-size:12px;color:#888;margin-top:16px">Réf. animal : ${animalId}</p>
      <p>Cordialement,<br>Système Mokine</p>
    `),
  });
};

// ── Collier activé → notifier l'éleveur ───────────────────────────────────
export const sendCollarActivatedEmail = async ({ to, farmerName, animalName, animalType, collarId }) => {
  const typeLabels = { cattle: 'Bovin', goat: 'Caprin', sheep: 'Ovin', pig: 'Porcin', chicken: 'Volaille', horse: 'Équin', fish: 'Poisson' };
  const typeLabel = typeLabels[animalType] || animalType;
  await send({
    to,
    subject: `✅ Collier ${collarId} activé pour ${animalName}`,
    html: baseHtml(`
      <p>Bonjour <strong>${farmerName}</strong>,</p>
      <p>Bonne nouvelle ! Le collier enregistré pour votre animal a été <strong>validé et activé</strong> par l'équipe Mokine.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr style="background:#f0fdf4;border-left:4px solid #178A3B"><td style="padding:10px 14px;font-weight:bold">N° Collier / Tag</td><td style="padding:10px 14px;font-family:monospace;font-size:14px;font-weight:bold;color:#178A3B">${collarId}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold">Animal</td><td style="padding:10px 14px">${animalName} (${typeLabel})</td></tr>
      </table>
      <p style="color:#178A3B;font-weight:bold">✅ Ce collier est maintenant actif et lié à votre animal dans le système Mokine.</p>
      <a href="${APP_URL}/dashboard" class="btn">Voir mon cheptel →</a>
      <p>Pour toute question : <a href="mailto:infos@trugroup.cm">infos@trugroup.cm</a></p>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Collier désactivé → notifier l'éleveur ────────────────────────────────
export const sendCollarDeactivatedEmail = async ({ to, farmerName, animalName, collarId, reason }) => {
  await send({
    to,
    subject: `⚠️ Collier ${collarId} désactivé`,
    html: baseHtml(`
      <p>Bonjour <strong>${farmerName}</strong>,</p>
      <p>Le collier <strong>${collarId}</strong> associé à l'animal <strong>${animalName}</strong> a été <strong>désactivé</strong>.</p>
      ${reason ? `<p><strong>Motif :</strong> ${reason}</p>` : ''}
      <p>Veuillez contacter notre équipe si vous pensez qu'il s'agit d'une erreur.</p>
      <a href="mailto:infos@trugroup.cm" class="btn">Contacter le support →</a>
      <p>À bientôt,<br>L'équipe Mokine</p>
    `),
  });
};

// ── Contact form (message reçu depuis le site) ─────────────────────────────
export const sendContactFormEmail = async ({ senderName, senderEmail, subject, message }) => {
  await send({
    to: process.env.SMTP_FROM_EMAIL || 'infos@trugroup.cm',
    subject: `[Mokine Contact] ${subject}`,
    html: baseHtml(`
      <p><strong>De :</strong> ${senderName} (${senderEmail})</p>
      <p><strong>Sujet :</strong> ${subject}</p>
      <p><strong>Message :</strong></p>
      <p style="white-space:pre-wrap">${message}</p>
    `),
  });
};
