const PDFDocument = require('pdfkit');
const path = require('path');

/**
 * Generates a transcript PDF and pipes it to the given writable stream.
 * @param {object} data { studentName, courseName, courseCode, moduleRows, overallResult, managingDirectorName }
 *   moduleRows: [{ module_name, credits, eval_type, marks, grade }]
 */
function generateTranscriptPdf(data, outStream) {
  const { studentName, courseName, courseCode, moduleRows, overallResult, managingDirectorName = 'L H C Goonawardhana' } = data;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(outStream);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;

  try {
    doc.image(path.join(__dirname, 'assets', 'logo.jpg'), centerX - 40, 40, { width: 80 });
  } catch (e) { /* logo optional */ }

  doc.font('Helvetica-Bold').fontSize(20).text('Fetch Consultants (Pvt) Ltd', 0, 135, { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(16).text('ACADEMIC TRANSCRIPT', 0, 165, { align: 'center' });

  let y = 210;
  doc.font('Helvetica-Bold').fontSize(12).text('Student Name:', 60, y);
  doc.font('Helvetica').text(studentName, 200, y);

  y += 20;
  doc.font('Helvetica-Bold').text('Course:', 60, y);
  doc.font('Helvetica').text(`${courseCode ? courseCode + ' \u2014 ' : ''}${courseName}`, 200, y);

  y += 40;

  // Table header
  const colX = { module: 60, credits: 300, eval: 370, marks: 450, grade: 510 };
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Module', colX.module, y);
  doc.text('Credits', colX.credits, y);
  doc.text('Type', colX.eval, y);
  doc.text('Marks', colX.marks, y);
  doc.text('Grade', colX.grade, y);
  y += 5;
  doc.moveTo(60, y + 12).lineTo(pageWidth - 60, y + 12).stroke();
  y += 22;

  doc.font('Helvetica').fontSize(11);
  moduleRows.forEach(row => {
    const rowHeight = Math.max(22, doc.heightOfString(row.module_name, { width: 230 }) + 8);
    doc.text(row.module_name, colX.module, y, { width: 230 });
    doc.text(String(row.credits ?? '\u2014'), colX.credits, y);
    doc.text(row.eval_type || '\u2014', colX.eval, y);
    doc.text(row.marks !== null && row.marks !== undefined ? String(row.marks) : 'Pending', colX.marks, y);
    doc.text(row.grade || '\u2014', colX.grade, y);
    y += rowHeight;
  });

  y += 20;
  doc.font('Helvetica-Bold').fontSize(12).text(`Overall Result: ${overallResult}`, 60, y);

  // Signature block for the Managing Director, placed dynamically below the table
  // (never at a fixed y) so it can never collide with a long module list.
  const sigY = y + 50;
  const sigX = pageWidth - 250;
  doc.moveTo(sigX, sigY).lineTo(sigX + 200, sigY).stroke();
  doc.font('Helvetica-Bold').fontSize(11).text(managingDirectorName, sigX, sigY + 6, { width: 200 });
  doc.font('Helvetica-Oblique').fontSize(10).text('Managing Director', sigX, sigY + 20, { width: 200 });
  doc.font('Helvetica-Oblique').fontSize(9).text('Fetch Consultants (Pvt) Ltd', sigX, sigY + 34, { width: 200 });

  // Footer address — placed dynamically below the signature, clamped so it always stays on this one page.
  const footerY = Math.min(sigY + 34 + 20, pageHeight - 30);
  doc.font('Helvetica-Oblique').fontSize(9)
    .text(
      'Fetch Consultants (Pvt) Ltd, 9/3A, Pepiliyana Mawatha, Kohuwala, Nugegoda. Sri Lanka  BR PV 00253968',
      0, footerY, { align: 'center' }
    );

  doc.end();
}

module.exports = { generateTranscriptPdf };
