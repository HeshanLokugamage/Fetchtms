const PDFDocument = require('pdfkit');
const path = require('path');

const RESULT_COLORS = {
  Pass: '#2e7d32',
  Fail: '#c62828',
  'In Progress': '#f57c00',
  'No Modules': '#777777'
};

/**
 * Generates a paginated course-wise report PDF and pipes it to outStream.
 * @param {object} data { courseLabel, statusLabel, rows }
 *   rows: [{ course_code, course_name, student_name, fee, paid, balance, moduleMarks, overallResult }]
 */
function generateCourseWiseReportPdf(data, outStream) {
  const { courseLabel, statusLabel, rows } = data;

  const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
  doc.pipe(outStream);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const marginBottom = 50;

  const colX = { course: 40, student: 190, fee: 340, paid: 400, balance: 460, marks: 520, result: 730 };
  const colWidths = { course: 145, student: 145, fee: 55, paid: 55, balance: 55, marks: 205, result: 70 };

  function drawPageHeader(isFirstPage) {
    if (isFirstPage) {
      try {
        doc.image(path.join(__dirname, 'assets', 'logo.jpg'), 40, 30, { width: 40 });
      } catch (e) { /* logo optional */ }
      doc.font('Helvetica-Bold').fontSize(16).text('Fetch Consultants (Pvt) Ltd', 90, 35);
      doc.font('Helvetica-Bold').fontSize(13).text('Training Course-wise Report', 90, 55);
      doc.font('Helvetica').fontSize(9).fillColor('#555')
        .text(`Course filter: ${courseLabel}    |    Status filter: ${statusLabel}    |    Generated: ${new Date().toLocaleDateString('en-GB')}`, 90, 72);
      doc.fillColor('black');
      return 105;
    }
    return 40;
  }

  function drawTableHeader(y) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('white');
    doc.rect(40, y, pageWidth - 80, 20).fill('#2e7d32');
    doc.fillColor('white');
    doc.text('Course', colX.course, y + 5, { width: colWidths.course });
    doc.text('Student', colX.student, y + 5, { width: colWidths.student });
    doc.text('Fee', colX.fee, y + 5, { width: colWidths.fee });
    doc.text('Paid', colX.paid, y + 5, { width: colWidths.paid });
    doc.text('Balance', colX.balance, y + 5, { width: colWidths.balance });
    doc.text('Modules & Marks', colX.marks, y + 5, { width: colWidths.marks });
    doc.text('Result', colX.result, y + 5, { width: colWidths.result });
    doc.fillColor('black');
    return y + 26;
  }

  let y = drawTableHeader(drawPageHeader(true));
  let rowIndex = 0;

  rows.forEach(row => {
    const marksText = row.moduleMarks.length === 0
      ? '\u2014'
      : row.moduleMarks.map(mm => `${mm.module_name}: ${mm.marks !== null ? `${mm.marks} (${mm.grade})` : 'Pending'}`).join('\n');

    doc.font('Helvetica').fontSize(9);
    const marksHeight = doc.heightOfString(marksText, { width: colWidths.marks });
    const rowHeight = Math.max(20, marksHeight + 8);

    if (y + rowHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = drawTableHeader(drawPageHeader(false));
    }

    if (rowIndex % 2 === 0) {
      doc.rect(40, y, pageWidth - 80, rowHeight).fill('#f7faf7');
      doc.fillColor('black');
    }

    doc.font('Helvetica').fontSize(9).fillColor('black');
    doc.text(row.course_code ? `${row.course_code}\n${row.course_name}` : (row.course_name || '\u2014'), colX.course, y + 4, { width: colWidths.course });
    doc.text(row.student_name || '\u2014', colX.student, y + 4, { width: colWidths.student });
    doc.text(String(row.fee), colX.fee, y + 4, { width: colWidths.fee });
    doc.text(String(row.paid), colX.paid, y + 4, { width: colWidths.paid });
    doc.text(String(row.balance), colX.balance, y + 4, { width: colWidths.balance });
    doc.text(marksText, colX.marks, y + 4, { width: colWidths.marks });
    doc.font('Helvetica-Bold').fillColor(RESULT_COLORS[row.overallResult] || 'black');
    doc.text(row.overallResult, colX.result, y + 4, { width: colWidths.result });
    doc.fillColor('black');

    y += rowHeight;
    rowIndex++;
  });

  if (rows.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(11).text('No records match this filter.', 40, y + 10);
  }

  doc.end();
}

module.exports = { generateCourseWiseReportPdf };
