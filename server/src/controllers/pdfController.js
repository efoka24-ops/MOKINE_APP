// PDF Generation — US-030/031 Ordonnances numériques avec signature
import PDFDocument from 'pdfkit';
import db from '../db/index.js';

// POST /api/pdf/prescription/:id
export const generatePrescriptionPDF = async (req, res) => {
  try {
    const prescription = await db.prescriptions.findById(req.params.id);
    if (!prescription) return res.status(404).json({ error: 'Ordonnance non trouvée' });

    const vet = await db.users.findById(prescription.veterinarianId);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ordonnance_${prescription.id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });

    // ─── Header ───────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 100).fill('#1B4332');
    doc.fill('#FFFFFF')
       .fontSize(22).font('Helvetica-Bold')
       .text('MOKINEVETO', 50, 25, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
       .text('Plateforme de Télémédecine Vétérinaire', 50, 55, { align: 'center' })
       .text('www.mokineveto.com | contact@mokineveto.com', 50, 72, { align: 'center' });

    doc.fill('#1B4332').rect(0, 100, doc.page.width, 4).fill();

    // ─── Title ────────────────────────────────────────────────
    doc.fill('#1B4332').fontSize(18).font('Helvetica-Bold')
       .text('ORDONNANCE VÉTÉRINAIRE', 50, 120, { align: 'center' });

    doc.fill('#666666').fontSize(10).font('Helvetica')
       .text(`N° ${prescription.id} | Émise le ${new Date(prescription.createdAt).toLocaleDateString('fr-FR')}`, 50, 145, { align: 'center' });

    doc.moveTo(50, 165).lineTo(doc.page.width - 50, 165).strokeColor('#DDDDDD').stroke();

    // ─── Vet Info ─────────────────────────────────────────────
    doc.fill('#1B4332').fontSize(12).font('Helvetica-Bold').text('PRESCRIPTEUR', 50, 180);
    doc.fill('#333333').fontSize(11).font('Helvetica')
       .text(`Dr. ${prescription.veterinarianName}`, 50, 198)
       .text(`Licence: ${vet?.licenseNumber || 'VET-CM-XXXX'}`, 50, 214)
       .text(`Spécialité: ${vet?.specialization || 'Médecine vétérinaire générale'}`, 50, 230);

    // ─── Animal Info ──────────────────────────────────────────
    doc.fill('#1B4332').fontSize(12).font('Helvetica-Bold').text('PATIENT (ANIMAL)', 320, 180);
    doc.fill('#333333').fontSize(11).font('Helvetica')
       .text(`Nom: ${prescription.animalName}`, 320, 198)
       .text(`ID Animal: ${prescription.animalId}`, 320, 214)
       .text(`Date consultation: ${new Date(prescription.createdAt).toLocaleDateString('fr-FR')}`, 320, 230);

    doc.moveTo(50, 255).lineTo(doc.page.width - 50, 255).strokeColor('#DDDDDD').stroke();

    // ─── Medicines ────────────────────────────────────────────
    doc.fill('#1B4332').fontSize(13).font('Helvetica-Bold').text('MÉDICAMENTS PRESCRITS', 50, 270);

    let y = 295;
    prescription.medicines.forEach((med, idx) => {
      doc.rect(50, y, doc.page.width - 100, 70).fill('#F8FBF9').stroke('#DDDDDD');
      doc.fill('#1B4332').fontSize(12).font('Helvetica-Bold')
         .text(`${idx + 1}. ${med.name}`, 65, y + 10);
      doc.fill('#444444').fontSize(10).font('Helvetica')
         .text(`Posologie: ${med.dosage}`, 65, y + 28)
         .text(`Fréquence: ${med.frequency}`, 65, y + 43)
         .text(`Durée: ${med.duration}`, 300, y + 28);
      y += 82;
      if (y > 650) { doc.addPage(); y = 50; }
    });

    // ─── Instructions ─────────────────────────────────────────
    if (prescription.instructions) {
      y += 10;
      doc.fill('#1B4332').fontSize(12).font('Helvetica-Bold').text('INSTRUCTIONS SPÉCIALES', 50, y);
      y += 18;
      doc.rect(50, y, doc.page.width - 100, 60).fill('#FFF9C4');
      doc.fill('#333333').fontSize(10).font('Helvetica').text(prescription.instructions, 60, y + 10, { width: doc.page.width - 120 });
      y += 72;
    }

    // ─── Validity ─────────────────────────────────────────────
    y += 15;
    doc.fill('#E53935').fontSize(10).font('Helvetica-Bold')
       .text(`⚠ Ordonnance valable jusqu'au: ${new Date(prescription.validUntil).toLocaleDateString('fr-FR')}`, 50, y);

    // ─── Signature block ──────────────────────────────────────
    y += 40;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#DDDDDD').stroke();
    y += 15;
    doc.fill('#333333').fontSize(10).font('Helvetica')
       .text('Signature numérique du vétérinaire:', 50, y);
    doc.fill('#1B4332').fontSize(13).font('Helvetica-BoldOblique')
       .text(`Dr. ${prescription.veterinarianName}`, 50, y + 18);

    // Hash d'authenticité
    const hash = Buffer.from(`${prescription.id}-${prescription.veterinarianId}-${prescription.createdAt}`).toString('base64').slice(0, 24);
    doc.fill('#888888').fontSize(8).font('Helvetica')
       .text(`Code d'authenticité: ${hash}`, 50, y + 42)
       .text('Vérifiable sur mokineveto.com/verify', 50, y + 55);

    // ─── Footer ───────────────────────────────────────────────
    doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill('#F0F4F1');
    doc.fill('#888888').fontSize(8).font('Helvetica')
       .text('Ce document est généré électroniquement par MokineVeto. Toute falsification est passible de poursuites.', 50, doc.page.height - 38, { align: 'center' })
       .text('MokineVeto © 2026 — Télémédecine vétérinaire pour l\'Afrique', 50, doc.page.height - 25, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Reçu de paiement PDF ──────────────────────────────────────────────────
export const generatePaymentReceiptPDF = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Chercher par id ou external_reference
    let payment = await db.payments.findById(paymentId).catch(() => null);
    if (!payment) {
      const records = await db.payments.filter(p => p.external_reference === paymentId || p.camooId === paymentId);
      payment = records[0];
    }
    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });

    // Vérification d'appartenance (admin peut tout voir)
    if (req.user.role !== 'admin' && payment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const user = await db.users.findById(payment.userId).catch(() => null);
    const planRows = payment.plan ? await db.subscription_plans.filter(p => p.slug === payment.plan).catch(() => []) : [];
    const planName = planRows[0]?.name || payment.plan || '—';

    const date = payment.completedAt
      ? new Date(payment.completedAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
      : new Date(payment.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });

    const GREEN = '#178A3B';
    const DARK  = '#1a1a1a';
    const GREY  = '#555555';
    const LGREY = '#f5f5f5';

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="recu_mokine_${payment.id}.pdf"`);
      res.setHeader('Content-Length', buf.length);
      res.send(buf);
    });

    const W = doc.page.width;

    // ── Header ────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(GREEN);
    doc.fill('#fff').fontSize(24).font('Helvetica-Bold')
       .text('🐄 MOKINE', 50, 18, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
       .text('Plateforme de Santé Animale Connectée — CM TRU GROUP', 50, 50, { align: 'center' })
       .text('infos@trugroup.cm  |  Garoua, Cameroun', 50, 65, { align: 'center' });

    doc.rect(0, 90, W, 4).fill(GREEN);

    // ── Titre reçu ────────────────────────────────────────────
    doc.fill(GREEN).fontSize(20).font('Helvetica-Bold')
       .text('REÇU DE PAIEMENT', 50, 115, { align: 'center' });

    const statusLabel = payment.status === 'completed' ? '✅ CONFIRMÉ' : '⏳ EN ATTENTE';
    const statusColor = payment.status === 'completed' ? GREEN : '#f59e0b';
    doc.fill(statusColor).fontSize(12).font('Helvetica-Bold')
       .text(statusLabel, 50, 142, { align: 'center' });

    doc.moveTo(50, 165).lineTo(W - 50, 165).strokeColor('#dddddd').lineWidth(1).stroke();

    // ── Montant mis en avant ──────────────────────────────────
    doc.rect(50, 178, W - 100, 70).fill(LGREY).stroke('#e0e0e0');
    doc.fill(GREEN).fontSize(32).font('Helvetica-Bold')
       .text(`${(payment.amount || 0).toLocaleString('fr-FR')} ${payment.currency || 'XAF'}`, 50, 190, { align: 'center' });
    if (payment.fees) {
      doc.fill(GREY).fontSize(10).font('Helvetica')
         .text(`Frais : ${payment.fees} ${payment.currency || 'XAF'}  |  Net reçu : ${(payment.amount - payment.fees).toLocaleString('fr-FR')} ${payment.currency || 'XAF'}`, 50, 232, { align: 'center' });
    }

    // ── Tableau des détails ───────────────────────────────────
    let y = 270;
    const rows = [
      ['Abonnement',       planName],
      ['Réseau',           (payment.network || '—').toUpperCase()],
      ['Téléphone',        payment.phone || '—'],
      ['Méthode',          payment.paymentMethod === 'camoo' ? 'Mobile Money (Camoo)' : payment.paymentMethod || '—'],
      ['Date',             date],
      ['Réf. transaction', payment.camooId || '—'],
      ['Réf. commande',    payment.external_reference || payment.id],
    ];

    rows.forEach(([label, value], i) => {
      const bg = i % 2 === 0 ? '#ffffff' : LGREY;
      doc.rect(50, y, W - 100, 26).fill(bg).stroke('#e8e8e8');
      doc.fill(GREY).fontSize(10).font('Helvetica-Bold').text(label, 65, y + 8);
      doc.fill(DARK).fontSize(10).font('Helvetica').text(String(value), 250, y + 8, { width: W - 310 });
      y += 26;
    });

    // ── Titulaire ─────────────────────────────────────────────
    y += 20;
    doc.moveTo(50, y).lineTo(W - 50, y).strokeColor('#dddddd').lineWidth(1).stroke();
    y += 14;
    doc.fill(GREEN).fontSize(12).font('Helvetica-Bold').text('TITULAIRE', 50, y);
    y += 18;
    doc.fill(DARK).fontSize(11).font('Helvetica')
       .text(user?.name || '—', 50, y)
       .text(user?.email || '—', 50, y + 16)
       .text(user?.phone || '—', 50, y + 32);

    // ── Mention légale ────────────────────────────────────────
    y += 70;
    doc.rect(50, y, W - 100, 42).fill('#e8f5e9').stroke(GREEN);
    doc.fill(GREEN).fontSize(10).font('Helvetica-Bold')
       .text('Ce reçu constitue une preuve de paiement officielle.', 65, y + 8);
    doc.fill(GREY).fontSize(9).font('Helvetica')
       .text('Conservez ce document pour vos archives. Pour toute réclamation : infos@trugroup.cm', 65, y + 24);

    // ── Footer ────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 45, W, 45).fill('#f9f9f9');
    doc.moveTo(0, doc.page.height - 45).lineTo(W, doc.page.height - 45).strokeColor('#e0e0e0').stroke();
    doc.fill('#aaaaaa').fontSize(8).font('Helvetica')
       .text(`Mokine © ${new Date().getFullYear()} — CM TRU GROUP · Garoua, Cameroun`, 50, doc.page.height - 32, { align: 'center' })
       .text(`Document généré le ${new Date().toLocaleString('fr-FR')}`, 50, doc.page.height - 18, { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/pdf/prescription/:id/verify — vérifier authenticité
export const verifyPrescription = async (req, res) => {
  try {
    const prescription = await db.prescriptions.findById(req.params.id);
    if (!prescription) return res.status(404).json({ valid: false, error: 'Ordonnance non trouvée' });

    const isExpired = new Date() > new Date(prescription.validUntil);
    res.status(200).json({
      valid: !isExpired,
      prescription: {
        id: prescription.id,
        animalName: prescription.animalName,
        veterinarianName: prescription.veterinarianName,
        issuedAt: prescription.createdAt,
        validUntil: prescription.validUntil,
        status: isExpired ? 'expired' : 'valid',
        medicineCount: prescription.medicines.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
