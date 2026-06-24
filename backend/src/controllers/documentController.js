const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { sendEmail } = require('../config/mail');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const os = require('os');
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// POST /api/documents/offer-letters
const createOfferLetter = async (req, res, next) => {
  try {
    const { candidate_name, candidate_email, candidate_phone, designation, department, salary, joining_date, valid_until } = req.body;
    if (!candidate_name || !candidate_email) return res.status(400).json({ success: false, message: 'Candidate name and email are required.' });

    const count = await query('SELECT COUNT(*) FROM offer_letters');
    const offerNumber = `OFFER-${String(parseInt(count.rows[0].count) + 1).padStart(4, '0')}`;

    const result = await query(
      `INSERT INTO offer_letters (offer_number, candidate_name, candidate_email, candidate_phone, designation, department, salary, joining_date, valid_until, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [offerNumber, candidate_name, candidate_email, candidate_phone, designation, department, salary, joining_date, valid_until, req.user.userId]
    );

    res.status(201).json({ success: true, message: 'Offer letter created.', data: result.rows[0] });
  } catch (error) { next(error); }
};

// GET /api/documents/offer-letters
const getOfferLetters = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM offer_letters ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

// POST /api/documents/offer-letters/:id/generate-pdf
const generateOfferLetterPdf = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM offer_letters WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Offer letter not found.' });
    const ol = result.rows[0];

    const uploadsDir = path.join(__dirname, '../../uploads/offer-letters');
    ensureDir(uploadsDir);
    const filename = `offer_letter_${ol.offer_number}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Margins are 50 on left/right/top/bottom
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ── 1. Decorative Header (Waves) ───────────────────
    // Light blue wave background
    doc.fillColor('#e0f2fe')
       .moveTo(0, 0)
       .lineTo(595, 0)
       .lineTo(595, 20)
       .bezierCurveTo(400, 20, 200, 110, 0, 100)
       .closePath()
       .fill();

    // Dark blue main wave
    doc.fillColor('#0f70b7')
       .moveTo(0, 0)
       .lineTo(595, 0)
       .lineTo(595, 12)
       .bezierCurveTo(400, 12, 200, 95, 0, 85)
       .closePath()
       .fill();

    // ── 2. Company Logo (Top Right) ────────────────────
    const logoPath = 'c:/Users/Bharg/OneDrive/Desktop/CRM/HPS.png';
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 395, 38, { width: 130 });
    } else {
      // Graceful fallback
      console.warn("Logo file HPS.png not found at path: " + logoPath);
      doc.fillColor('#0f70b7')
         .circle(430, 40, 14)
         .fill();
      doc.fillColor('white')
         .rect(423.5, 32, 3.5, 16).fill()
         .rect(433, 32, 3.5, 16).fill()
         .rect(427, 38, 6, 4).fill();

      // Draw 'HPS' text next to it
      doc.fillColor('#0f70b7')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('HPS', 452, 30);

      // Draw 'HARSHA PERFECT SOLUTIONS' subtitles
      doc.fillColor('#0f70b7')
         .fontSize(7)
         .font('Helvetica-Bold')
         .text('HARSHA PERFECT', 410, 56, { width: 135, align: 'right' });
      doc.text('SOLUTIONS', 410, 64, { width: 135, align: 'right' });
    }

    // ── 3. Date Helpers & Variables ─────────────────────
    const formatDateWithSlashes = (dateStr) => {
      if (!dateStr) return 'TBD';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'TBD';
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const formatDateWithHyphens = (dateStr) => {
      if (!dateStr) return 'TBD';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'TBD';
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    const formattedDate = formatDateWithSlashes(ol.created_at || new Date());
    const formattedJoiningDate = formatDateWithHyphens(ol.joining_date);
    const formattedEndDate = formatDateWithHyphens(ol.valid_until);
    
    // Statically use internship layout and designation names as requested
    const isIntern = true;
    const displayDesignation = 'SDE Intern';
    const docDesignation = 'Software Development Engineer (SDE) Intern';
    const leftMargin = 50;

    // ── 4. Document Title ─────────────────────────────────
    doc.y = 120; // Starting y position below header
    const docTitle = `Internship Offer Letter - ${displayDesignation}`;
      
    doc.fillColor('#111827') // slate-900
       .fontSize(16)
       .font('Times-Bold')
       .text(docTitle, leftMargin, doc.y, { align: 'center', width: 495 });

    doc.moveDown(0.4);

    // ── 5. Company Address & Date (Left side) ─────────────
    doc.x = leftMargin; // Explicitly reset x pointer to left margin
    
    doc.fillColor('#111827')
       .fontSize(9.5)
       .font('Times-Bold').text('HPS OPC Pvt Ltd', { lineGap: 1 })
       .font('Times-Roman').text('31-7-67, Assam Gardens,', { lineGap: 1 })
       .text('Visakhapatnam,', { lineGap: 1 })
       .text('Andhra Pradesh - 530020', { lineGap: 1 })
       .font('Times-Bold').text('+91 92466 15251', { lineGap: 1 })
       .text('director@thehps.in', { lineGap: 1 })
       .font('Times-Roman').text('Website: thehps.in', { lineGap: 1 })
       .text(`Date: ${formattedDate}`, { lineGap: 1 })
       .moveDown(0.2)
       .font('Times-Bold').text(`Subject: Offer Letter for ${displayDesignation}`, { lineGap: 2 });

    doc.moveDown(0.4);

    // ── 6. Salutation & Introduction ─────────────────────
    doc.fillColor('#111827')
       .fontSize(9.5)
       .font('Times-Roman')
       .text('Dear ', { continued: true })
       .font('Times-Bold')
       .text(`${ol.candidate_name},`);
       
    doc.moveDown(0.3);

    doc.font('Times-Roman')
       .text('We are pleased to offer you the position of ', { continued: true, lineGap: 2 })
       .font('Times-Bold')
       .text(`${docDesignation}`, { continued: true })
       .font('Times-Roman')
       .text(' at HPS (OPC) Pvt. Ltd., commencing from ', { continued: true })
       .font('Times-Bold')
       .text(`${formattedJoiningDate}`, { continued: true })
       .font('Times-Roman')
       .text(' to ', { continued: true })
       .font('Times-Bold')
       .text(`${formattedEndDate}. `, { continued: true })
       .font('Times-Roman')
       .text(
         isIntern
           ? 'This internship is part of our initiative to nurture emerging talent in software engineering and modern development practices.'
           : 'We believe your skills and experience will be a valuable asset to our organization, and we look forward to a mutually beneficial association.',
         { continued: false }
       );

    doc.moveDown(0.4);

    // ── 7. Projects & Responsibilities List ───────────────
    doc.text(
      isIntern
        ? 'During your internship, you will work closely with our Engineering Team on real-world software development projects involving:'
        : 'In this role, you will work closely with our Engineering Team on real-world projects and be responsible for:',
      { lineGap: 2 }
    );
    
    doc.moveDown(0.2);

    const responsibilities = [
      'Designing and developing scalable applications',
      'Writing clean, efficient, and maintainable code',
      'Working on data structures, algorithms, and system design fundamentals',
      'Debugging, testing, and optimizing application performance',
      'Collaborating with cross-functional teams to deliver high-quality software solutions'
    ];

    responsibilities.forEach(resp => {
      doc.font('Times-Roman')
         .text('• ', leftMargin + 15, doc.y, { continued: true })
         .text(resp, { lineGap: 1.5, paragraphGap: 0.5 });
    });

    doc.moveDown(0.3);
    doc.x = leftMargin; // Reset x pointer

    doc.text(
      `This opportunity will provide hands-on experience in building robust systems and exposure to industry-standard development workflows and tools. You are expected to dedicate ${isIntern ? '20' : '40'} hours per week, maintain a high level of professionalism, meet project deadlines, and actively collaborate with the team.`,
      { lineGap: 2 }
    );

    doc.moveDown(0.4);

    // ── 8. Details Section ────────────────────────────────
    doc.font('Times-Bold').text(isIntern ? 'Internship Details:' : 'Employment Details:', { underline: true });
    doc.moveDown(0.2);

    const salaryVal = parseFloat(ol.salary || 0);
    const compensationLabel = isIntern ? 'Stipend' : 'Salary';
    const compensationVal = salaryVal > 0 
      ? `₹${salaryVal.toLocaleString('en-IN')}/month` 
      : 'Confidential';

    const details = [
      ['Location', 'Hybrid'],
      [compensationLabel, compensationVal],
      ['Start Date', formattedJoiningDate],
      ['End Date', formattedEndDate]
    ];

    details.forEach(([label, value]) => {
      doc.font('Times-Roman')
         .text('• ', leftMargin + 15, doc.y, { continued: true })
         .font('Times-Bold')
         .text(`${label}: `, { continued: true })
         .font('Times-Roman')
         .text(value, { paragraphGap: 0.5 });
    });

    doc.moveDown(0.4);
    doc.x = leftMargin; // Reset x pointer

    // ── 9. Terms & Conditions ──────────────────────────────
    doc.font('Times-Bold').text('Terms & Conditions:');
    doc.moveDown(0.2);

    const terms = [
      'You are required to maintain confidentiality of all company marketing strategies and data.',
      isIntern 
        ? 'A final report and presentation summarizing your contributions must be submitted at the end of the internship.'
        : 'You are expected to adhere to all company policies, guidelines, and code of conduct.',
      `Based on your performance and contribution, the ${isIntern ? 'internship' : 'engagement'} may be extended, and you may be considered for a full-time role/advancement at HPS(OPC) Pvt. Ltd.`
    ];

    terms.forEach((term, index) => {
      doc.font('Times-Roman')
         .text(`${index + 1}. `, leftMargin + 15, doc.y, { continued: true })
         .text(term, { lineGap: 1.5, paragraphGap: 0.5 });
    });

    doc.moveDown(0.4);
    doc.x = leftMargin; // Reset x pointer

    doc.text(
      `To confirm your acceptance of this offer, please visit our office in person at your earliest convenience. This will allow us to complete the onboarding formalities and provide further instructions for your ${isIntern ? 'internship' : 'onboarding'}.`,
      { lineGap: 2 }
    );

    doc.moveDown(0.8);

    // ── 10. Signature Block ────────────────────────────────
    const currentY = doc.y;
    
    doc.font('Times-Bold').text('Warm regards,', leftMargin, currentY);
    doc.moveDown(2.2);
    doc.font('Times-Bold').text('Dr. P. Satheesh')
       .font('Times-Roman').text('Director')
       .font('Times-Bold').text('Harsha Perfect Solutions OPC Pvt. Ltd.');

    doc.font('Times-Bold')
       .text('Candidate Signature', 390, currentY + 38, { width: 150, align: 'center' });

    // ── 11. Decorative Footer (Waves) ───────────────────
    // Light blue footer wave
    doc.fillColor('#e0f2fe')
       .moveTo(0, 842)
       .lineTo(595, 842)
       .lineTo(595, 795)
       .bezierCurveTo(450, 805, 150, 745, 0, 835)
       .closePath()
       .fill();

    // Dark blue footer wave
    doc.fillColor('#0f70b7')
       .moveTo(0, 842)
       .lineTo(595, 842)
       .lineTo(595, 805)
       .bezierCurveTo(450, 815, 150, 755, 0, 842)
       .closePath()
       .fill();

    doc.end();
    await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });
    await query("UPDATE offer_letters SET pdf_url = $1, status = 'Generated' WHERE id = $2", [`/uploads/offer-letters/${filename}`, ol.id]);

    res.json({ success: true, message: 'Offer letter PDF generated.', data: { pdfUrl: `/uploads/offer-letters/${filename}` } });
  } catch (error) { next(error); }
};

// POST /api/documents/offer-letters/:id/send
const sendOfferLetter = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM offer_letters WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Offer letter not found.' });
    const ol = result.rows[0];
    if (!ol.pdf_url) return res.status(400).json({ success: false, message: 'Generate PDF first.' });

    const filepath = path.join(__dirname, '../../', ol.pdf_url);
    await sendEmail({
      to: ol.candidate_email,
      subject: `Offer Letter from Harsha Perfect Solutions - ${ol.designation}`,
      html: `<div style="font-family:Arial;padding:20px;"><h2>Congratulations, ${ol.candidate_name}!</h2><p>Please find your offer letter attached. We look forward to having you on our team.</p></div>`,
      attachments: [{ filename: `Offer_Letter_${ol.offer_number}.pdf`, path: filepath }],
    });

    await query("UPDATE offer_letters SET status = 'Sent' WHERE id = $1", [ol.id]);
    res.json({ success: true, message: `Offer letter sent to ${ol.candidate_email}` });
  } catch (error) { next(error); }
};

// POST /api/documents/id-cards/generate/:employee_id
const generateIdCard = async (req, res, next) => {
  try {
    const empResult = await query(
      'SELECT * FROM employees WHERE id = $1',
      [req.params.employee_id]
    );
    if (empResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const emp = empResult.rows[0];

    const uploadsDir = path.join(__dirname, '../../uploads/id-cards');
    ensureDir(uploadsDir);

    const filename = `id_card_${emp.employee_code}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Generate QR Code (URL link to the ID Card PDF for scanning)
    const host = getLocalIp();
    const port = process.env.PORT || 5000;
    const qrData = `http://${host}:${port}/uploads/id-cards/${filename}`;
    const qrCodeFilename = `qr_${emp.employee_code}.png`;
    const qrCodePath = path.join(uploadsDir, qrCodeFilename);
    await QRCode.toFile(qrCodePath, qrData, { 
      width: 400, 
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    // [252, 420] fits the template aspect ratio well
    const doc = new PDFDocument({ margin: 0, size: [252, 420] });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ── PAGE 1: FRONT SIDE ──
    // Card background gradient
    const grad = doc.linearGradient(0, 0, 252, 420);
    grad.stop(0, '#2563eb'); // rich blue
    grad.stop(1, '#0284c7'); // sky blue
    doc.rect(0, 0, 252, 420).fill(grad);

    // Circular background overlays (dark navy)
    doc.fillColor('#03224c')
       .circle(-40, 140, 120)
       .fill();
    doc.fillColor('#03224c')
       .circle(290, 390, 130)
       .fill();
    doc.fillColor('#0284c7')
       .circle(20, 420, 60)
       .fill();

    // Logo Card container (White Rounded Rect)
    doc.fillColor('white')
       .roundedRect(60, 15, 132, 40, 6)
       .fill();

    // Logo image or text fallback
    const logoPath = 'c:/Users/Bharg/OneDrive/Desktop/CRM/HPS.png';
    const altLogoPath = 'c:/Users/Bharg/OneDrive/Desktop/CRM/HPS logo.png';
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 66, 18, { fit: [120, 34], align: 'center', valign: 'center' });
    } else if (fs.existsSync(altLogoPath)) {
      doc.image(altLogoPath, 66, 18, { fit: [120, 34], align: 'center', valign: 'center' });
    } else {
      doc.fillColor('#0f70b7')
         .fontSize(15)
         .font('Helvetica-Bold')
         .text('HPS', 60, 28, { align: 'center', width: 132 });
    }

    // Photo Container (Dark rounded container)
    doc.fillColor('#081325')
       .roundedRect(36, 75, 180, 220, 24)
       .fill();

    // Employee photo rendering
    let photoLoaded = false;
    if (emp.photo_url) {
      try {
        if (emp.photo_url.startsWith('http')) {
          const response = await fetch(emp.photo_url);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            doc.image(buffer, 46, 85, { width: 160, height: 200 });
            photoLoaded = true;
          }
        } else {
          const cleanPath = emp.photo_url.startsWith('/') ? emp.photo_url.slice(1) : emp.photo_url;
          const localPath = path.join(__dirname, '../../', cleanPath);
          if (fs.existsSync(localPath)) {
            doc.image(localPath, 46, 85, { width: 160, height: 200 });
            photoLoaded = true;
          }
        }
      } catch (err) {
        console.warn('Failed to load photo for ID card:', err.message);
      }
    }

    if (!photoLoaded) {
      doc.fillColor('#1e293b')
         .roundedRect(46, 85, 160, 200, 16)
         .fill();
      doc.fillColor('#475569')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('NO PHOTO', 46, 175, { align: 'center', width: 160 });
    }

    // Name (Capitalized white bold text)
    const displayName = emp.name ? emp.name.toUpperCase() : 'EMPLOYEE NAME';
    doc.fillColor('white')
       .font('Helvetica-Bold')
       .fontSize(18)
       .text(displayName, 24, 312, { width: 204, lineGap: 2 });

    // Designation (Capitalized dark blue bold text)
    const displayRole = emp.designation ? emp.designation.toUpperCase() : 'EMPLOYEE';
    const roleY = doc.y + 4;
    doc.fillColor('#00376b')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(displayRole, 24, roleY, { width: 204 });

    // ID (Employee Code)
    const displayCode = emp.employee_code ? emp.employee_code.toUpperCase().replace('-', ' ') : '';
    const idY = doc.y + 2;
    doc.fillColor('white')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(`ID: ${displayCode}`, 24, idY, { width: 204 });

    // ── PAGE 2: BACK SIDE ──
    doc.addPage({ margin: 15, size: [252, 420] });
    
    // Background back card
    doc.rect(0, 0, 252, 420).fill('#081325');
    doc.rect(10, 10, 232, 400).strokeColor('#0284c7').lineWidth(1.5).stroke();
    
    // Title
    doc.fillColor('white')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('HARSHA PERFECT SOLUTIONS', 15, 30, { align: 'center', width: 222 });
       
    doc.moveTo(30, 50).lineTo(222, 50).strokeColor('#0284c7').lineWidth(1).stroke();
    
    // Terms of use
    doc.fillColor('#94a3b8')
       .font('Helvetica')
       .fontSize(7.5)
       .text('TERMS AND CONDITIONS', 15, 65, { align: 'center', width: 222, underline: true });
       
    const termsText = [
      'This card is the property of Harsha Perfect Solutions (OPC) Pvt Ltd.',
      'It must be worn and visible at all times while on company premises.',
      'Loss of this card must be reported to HR immediately.',
      'If found, please return to: Assam Gardens, Visakhapatnam, AP - 530020.'
    ];
    
    let currentTermsY = 85;
    termsText.forEach((term, index) => {
      doc.text(`${index + 1}. ${term}`, 25, currentTermsY, { width: 202, lineGap: 1.5 });
      currentTermsY = doc.y + 3;
    });
    
    // QR Code
    doc.fillColor('white')
       .roundedRect(81, 255, 90, 90, 8)
       .fill();
    doc.image(qrCodePath, 86, 260, { width: 80, height: 80 });
    
    doc.fillColor('#94a3b8')
       .fontSize(7.5)
       .font('Helvetica-Bold')
       .text('AUTHORISED SIGNATORY', 15, 385, { align: 'center', width: 222 });

    doc.end();
    await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });

    // Upsert id_card record
    const existing = await query('SELECT id FROM id_cards WHERE employee_id = $1', [emp.id]);
    if (existing.rows.length > 0) {
      await query('UPDATE id_cards SET qr_code_data=$1, qr_code_url=$2, pdf_url=$3, updated_at=NOW() WHERE employee_id=$4',
        [qrData, `/uploads/id-cards/${qrCodeFilename}`, `/uploads/id-cards/${filename}`, emp.id]);
    } else {
      await query('INSERT INTO id_cards (employee_id, qr_code_data, qr_code_url, pdf_url) VALUES ($1,$2,$3,$4)',
        [emp.id, qrData, `/uploads/id-cards/${qrCodeFilename}`, `/uploads/id-cards/${filename}`]);
    }

    res.json({ success: true, message: 'ID card generated.', data: { pdfUrl: `/uploads/id-cards/${filename}` } });
  } catch (error) { next(error); }
};

// GET /api/documents/id-cards
const getIdCards = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT ic.*, e.name, e.employee_code, e.department, e.designation FROM id_cards ic JOIN employees e ON ic.employee_id = e.id ORDER BY ic.generated_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

module.exports = { createOfferLetter, getOfferLetters, generateOfferLetterPdf, sendOfferLetter, generateIdCard, getIdCards };
