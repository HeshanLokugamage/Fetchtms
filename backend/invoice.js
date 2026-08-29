const PDFDocument = require('pdfkit');
const path = require('path');

/**
 * Generates an invoice PDF for a course registration and pipes it to outStream.
 * @param {object} data { invoiceNo, invoiceDate, studentName, studentAddress, studentContact,
 *                         courseCode, courseName, courseDescription, fee }
 */
function generateInvoicePdf(data, outStream) {
  const {
    invoiceNo, invoiceDate, studentName, studentAddress, studentContact,
    courseCode, courseName, courseDescription, fee
  } = data;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(outStream);

  const pageWidth = doc.page.width;

  try {
    doc.image(path.join(__dirname, 'assets', 'logo.jpg'), 50, 45, { width: 55 });
  } catch (e) { /* logo optional */ }

  doc.font('Helvetica-Bold').fontSize(16).text('Fetch Consultants (Pvt) Ltd', 120, 50);
  doc.font('Helvetica').fontSize(9).fillColor('#555')
    .text('9/3A, Pepiliyana Mawatha, Kohuwala, Nugegoda, Sri Lanka', 120, 70)
    .text('BR PV 00253968', 120, 82);
  doc.fillColor('black');

  doc.font('Helvetica-Bold').fontSize(20).text('INVOICE', 0, 50, { align: 'right' });
  doc.font('Helvetica').fontSize(10)
    .text(`Invoice No: ${invoiceNo}`, 0, 78, { align: 'right' })
    .text(`Date: ${invoiceDate}`, 0, 92, { align: 'right' });

  doc.moveTo(50, 120).lineTo(pageWidth - 50, 120).stroke();

  let y = 140;
  doc.font('Helvetica-Bold').fontSize(11).text('Billed To', 50, y);
  y += 18;
  doc.font('Helvetica').fontSize(11).text(studentName, 50, y);
  if (studentAddress) { y += 15; doc.fontSize(10).text(studentAddress, 50, y, { width: 300 }); }
  if (studentContact) { y += 15; doc.fontSize(10).text(`Contact: ${studentContact}`, 50, y); }

  y += 40;
  const colX = { desc: 50, code: 330, amount: 430 };
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Description', colX.desc, y);
  doc.text('Course Code', colX.code, y);
  doc.text('Amount (LKR)', colX.amount, y);
  y += 5;
  doc.moveTo(50, y + 12).lineTo(pageWidth - 50, y + 12).stroke();
  y += 22;

  doc.font('Helvetica').fontSize(10);
  doc.text(courseName, colX.desc, y, { width: 260 });
  doc.text(courseCode, colX.code, y);
  doc.text(Number(fee).toLocaleString('en-LK', { minimumFractionDigits: 2 }), colX.amount, y);
  if (courseDescription) {
    y += 15;
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#555').text(courseDescription, colX.desc, y, { width: 260 });
    doc.fillColor('black');
  }

  y += 40;
  doc.moveTo(300, y).lineTo(pageWidth - 50, y).stroke();
  y += 10;
  doc.font('Helvetica-Bold').fontSize(12).text('Total Due (LKR):', 300, y);
  doc.text(Number(fee).toLocaleString('en-LK', { minimumFractionDigits: 2 }), colX.amount, y);

  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#555')
    .text('Please settle this invoice at the Fetch Consultants (Pvt) Ltd office or via bank transfer, and retain your payment receipt.', 50, y + 40, { width: pageWidth - 100 });

  doc.font('Helvetica-BoldOblique').fontSize(9).fillColor('black')
    .text(
      'Fetch Consultants (Pvt) Ltd, 9/3A, Pepiliyana Mawatha, Kohuwala, Nugegoda. Sri Lanka  BR PV 00253968',
      0, doc.page.height - 50, { align: 'center' }
    );

  doc.end();
}

module.exports = { generateInvoicePdf };
