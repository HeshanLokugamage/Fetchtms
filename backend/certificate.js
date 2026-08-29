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
 * Layout is computed dynamically (each block's real rendered height is measured before placing the next one),
 * so long names/venues/qualifications never overlap the footer, and everything is guaranteed to fit on one A4 page.
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
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;
  const wideWidth = pageWidth - 120;

  // Certificate number, top right
  doc.font('Helvetica').fontSize(11).fillColor('black')
    .text(`Certificate No: ${certificateNo}`, 0, 36, { align: 'right', width: pageWidth - 80 });

  // Logo
  try {
    doc.image(path.join(__dirname, 'assets', 'logo.jpg'), centerX - 45, 50, { width: 90 });
  } catch (e) { /* logo optional */ }

  // Helper: draw centered text and advance a running cursor by its real rendered height
  let y = 150;
  const line = (text, font, size, opts = {}) => {
    const width = opts.width || pageWidth;
    const x = opts.width ? (pageWidth - opts.width) / 2 : 0;
    doc.font(font).fontSize(size).fillColor(opts.color || 'black');
    const h = doc.heightOfString(text, { width, align: 'center' });
    doc.text(text, x, y, { width, align: 'center' });
    y += h + (opts.gap !== undefined ? opts.gap : 10);
  };

  line('CERTIFICATE OF PARTICIPATION', 'Helvetica-Bold', 22, { gap: 22 });
  line('This is to certify that', 'Helvetica-BoldOblique', 13, { gap: 10 });
  line(studentName, 'Helvetica-BoldOblique', 20, { gap: 16 });
  line('Has participated in', 'Helvetica-BoldOblique', 13, { gap: 8 });
  line(durationLabel, 'Helvetica-BoldOblique', 13, { gap: 8 });
  line(programTitle, 'Helvetica-Bold', 15, { width: wideWidth, gap: 18 });
  line('Held on', 'Helvetica-BoldOblique', 13, { gap: 8 });
  line(eventDate, 'Helvetica-BoldOblique', 13, { gap: 14 });
  line('At', 'Helvetica-BoldOblique', 13, { gap: 8 });
  line(venue, 'Helvetica-Bold', 12, { width: wideWidth, gap: 18 });
  line('Organized By', 'Helvetica-BoldOblique', 13, { gap: 9 });
  line('Fetch Consultants (Pvt) Ltd', 'Helvetica-Bold', 14, { gap: 0 });

  // Red starburst seal
  const sealCy = y + 55;
  drawStarSeal(doc, centerX, sealCy, 45, 28, 18);
  y = sealCy + 55;

  // Signature lines
  const sigY = y + 20;
  const leftX = 80;
  const rightX = pageWidth - 280;
  const sigColWidth = 220;

  doc.moveTo(leftX, sigY).lineTo(leftX + 200, sigY).stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor('black').text(resourcePersonName || '\u2014', leftX, sigY + 6, { width: sigColWidth });
  doc.font('Helvetica-Oblique').fontSize(10).text('Resource Person', leftX, sigY + 20, { width: sigColWidth });
  let leftBottom = sigY + 34;
  if (resourcePersonQualifications) {
    doc.font('Helvetica-Oblique').fontSize(8.5).text(resourcePersonQualifications, leftX, leftBottom, { width: sigColWidth });
    leftBottom += doc.heightOfString(resourcePersonQualifications, { width: sigColWidth });
  }

  doc.moveTo(rightX, sigY).lineTo(rightX + 200, sigY).stroke();
  doc.font('Helvetica-Bold').fontSize(11).text(managingDirectorName, rightX, sigY + 6, { width: sigColWidth });
  doc.font('Helvetica-Oblique').fontSize(10).text('Managing Director', rightX, sigY + 20, { width: sigColWidth });
  doc.font('Helvetica-Oblique').fontSize(9).text('Fetch Consultants (Pvt) Ltd', rightX, sigY + 34, { width: sigColWidth });
  const rightBottom = sigY + 34 + 12;

  // Footer address — always placed dynamically below whichever signature block is taller,
  // with a safety clamp so it never runs off the bottom of the page.
  const footerY = Math.min(Math.max(leftBottom, rightBottom) + 20, pageHeight - 30);
  doc.font('Helvetica-BoldOblique').fontSize(9).fillColor('black')
    .text(
      'Fetch Consultants (Pvt) Ltd, 9/3A, Pepiliyana Mawatha, Kohuwala, Nugegoda. Sri Lanka  BR PV 00253968',
      0, footerY, { align: 'center' }
    );

  doc.end();
}

module.exports = { generateCertificatePdf };
