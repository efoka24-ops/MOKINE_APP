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
