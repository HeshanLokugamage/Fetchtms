const PDFDocument = require('pdfkit');
const path = require('path');

// Draws a many-pointed star (the red seal) centered at (cx, cy)
function drawStarSeal(doc, cx, cy, outerR, innerR, points) {
  const step = Math.PI / points;
  doc.save();
  doc.moveTo(cx + outerR * Math.cos(0), cy + outerR * Math.sin(0));
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step;
    doc.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  doc.closePath();
  doc.fill('#e30613');
  doc.restore();
}

/**
 * Generates the Certificate of Participation PDF and pipes it to the given writable stream (e.g. an HTTP response).
 * @param {object} data
 *  certificateNo, studentName, programTitle, durationLabel (e.g. "One Day Training Program on"),
 *  eventDate (display string), venue, resourcePersonName, resourcePersonQualifications, managingDirectorName
 */
function generateCertificatePdf(data, outStream) {
  const {
    certificateNo,
    studentName,
    programTitle,
    durationLabel = 'Training Program on',
    eventDate,
    venue,
    resourcePersonName,
    resourcePersonQualifications,
    managingDirectorName = 'L H C Goonawardhana'
  } = data;

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(outStream);

  const pageWidth = doc.page.width;
  const centerX = pageWidth / 2;

  // Certificate number, top right
  doc.font('Helvetica').fontSize(11).fillColor('black')
    .text(`Certificate No: ${certificateNo}`, 0, 40, { align: 'right', width: pageWidth - 80 });

  // Logo
  try {
    doc.image(path.join(__dirname, 'assets', 'logo.jpg'), centerX - 60, 60, { width: 120 });
  } catch (e) { /* logo optional */ }

  let y = 200;
  doc.font('Helvetica-Bold').fontSize(26).fillColor('black')
    .text('CERTIFICATE OF PARTICIPATION', 0, y, { align: 'center' });

  y += 55;
  doc.font('Helvetica-BoldOblique').fontSize(14).text('This is to certify that', 0, y, { align: 'center' });

  y += 30;
  doc.font('Helvetica-BoldOblique').fontSize(22).text(studentName, 0, y, { align: 'center' });

  y += 40;
  doc.font('Helvetica-BoldOblique').fontSize(14).text('Has participated in', 0, y, { align: 'center' });

  y += 25;
  doc.font('Helvetica-BoldOblique').fontSize(14).text(durationLabel, 0, y, { align: 'center' });

  y += 25;
  doc.font('Helvetica-Bold').fontSize(16).text(programTitle, 60, y, { align: 'center', width: pageWidth - 120 });

  y += 45;
  doc.font('Helvetica-BoldOblique').fontSize(14).text('Held on', 0, y, { align: 'center' });

  y += 25;
  doc.font('Helvetica-BoldOblique').fontSize(14).text(eventDate, 0, y, { align: 'center' });

  y += 30;
  doc.font('Helvetica-BoldOblique').fontSize(14).text('At', 0, y, { align: 'center' });

  y += 22;
  doc.font('Helvetica-Bold').fontSize(13).text(venue, 60, y, { align: 'center', width: pageWidth - 120 });

  y += 45;
  doc.font('Helvetica-BoldOblique').fontSize(14).text('Organized By', 0, y, { align: 'center' });

  y += 24;
  doc.font('Helvetica-Bold').fontSize(15).text('Fetch Consultants (Pvt) Ltd', 0, y, { align: 'center' });

  // Red starburst seal
  drawStarSeal(doc, centerX, y + 100, 70, 45, 18);

  // Signature lines
  const sigY = y + 200;
  const leftX = 80;
  const rightX = pageWidth - 280;

  doc.moveTo(leftX, sigY).lineTo(leftX + 200, sigY).stroke();
  doc.font('Helvetica-Bold').fontSize(11).text(resourcePersonName || '—', leftX, sigY + 6);
  doc.font('Helvetica-Oblique').fontSize(10).text('Resource Person', leftX, sigY + 20);
  if (resourcePersonQualifications) {
    doc.font('Helvetica-Oblique').fontSize(9).text(resourcePersonQualifications, leftX, sigY + 34, { width: 220 });
  }

  doc.moveTo(rightX, sigY).lineTo(rightX + 200, sigY).stroke();
  doc.font('Helvetica-Bold').fontSize(11).text(managingDirectorName, rightX, sigY + 6);
  doc.font('Helvetica-Oblique').fontSize(10).text('Managing Director', rightX, sigY + 20);
  doc.font('Helvetica-Oblique').fontSize(9).text('Fetch Consultants (Pvt) Ltd', rightX, sigY + 34);

  // Footer address
  doc.font('Helvetica-BoldOblique').fontSize(9).fillColor('black')
    .text(
      'Fetch Consultants (Pvt) Ltd, 9/3A, Pepiliyana Mawatha, Kohuwala, Nugegoda. Sri Lanka  BR PV 00253968',
      0, doc.page.height - 50, { align: 'center' }
    );

  doc.end();
}

module.exports = { generateCertificatePdf };
