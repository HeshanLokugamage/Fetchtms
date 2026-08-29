const PDFDocument = require('pdfkit');
const path = require('path');

/**
 * Generates a transcript PDF and pipes it to the given writable stream.
 * @param {object} data { studentName, courseName, courseCode, moduleRows, overallResult }
 *   moduleRows: [{ module_name, credits, eval_type, marks, grade }]
 */
function generateTranscriptPdf(data, outStream) {
  const { studentName, courseName, courseCode, moduleRows, overallResult } = data;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(outStream);

  const pageWidth = doc.page.width;
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
  doc.font('Helvetica').text(`${courseCode ? courseCode + ' — ' : ''}${courseName}`, 200, y);

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
    doc.text(row.module_name, colX.module, y, { width: 230 });
    doc.text(String(row.credits ?? '—'), colX.credits, y);
    doc.text(row.eval_type || '—', colX.eval, y);
    doc.text(row.marks !== null && row.marks !== undefined ? String(row.marks) : 'Pending', colX.marks, y);
    doc.text(row.grade || '—', colX.grade, y);
    y += 22;
  });

  y += 20;
  doc.font('Helvetica-Bold').fontSize(12).text(`Overall Result: ${overallResult}`, 60, y);

  doc.font('Helvetica-Oblique').fontSize(9)
    .text(
      'Fetch Consultants (Pvt) Ltd, 9/3A, Pepiliyana Mawatha, Kohuwala, Nugegoda. Sri Lanka  BR PV 00253968',
      0, doc.page.height - 50, { align: 'center' }
    );

  doc.end();
}

module.exports = { generateTranscriptPdf };
