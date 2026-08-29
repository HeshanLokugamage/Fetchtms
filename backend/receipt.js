const PDFDocument = require('pdfkit');
const path = require('path');

/**
 * Generates a payment receipt PDF and pipes it to outStream.
 * @param {object} data { receiptNo, receiptDate, studentName, amount, paymentMethodName, description }
 */
function generateReceiptPdf(data, outStream) {
  const { receiptNo, receiptDate, studentName, amount, paymentMethodName, description } = data;

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

  doc.font('Helvetica-Bold').fontSize(20).text('PAYMENT RECEIPT', 0, 50, { align: 'right' });
  doc.font('Helvetica').fontSize(10)
    .text(`Receipt No: ${receiptNo}`, 0, 78, { align: 'right' })
    .text(`Date: ${receiptDate}`, 0, 92, { align: 'right' });

  doc.moveTo(50, 120).lineTo(pageWidth - 50, 120).stroke();

  let y = 150;
  doc.font('Helvetica').fontSize(12).text('Received with thanks from:', 50, y);
  y += 20;
  doc.font('Helvetica-Bold').fontSize(14).text(studentName, 50, y);

  y += 40;
  doc.font('Helvetica').fontSize(12).text('The sum of (LKR):', 50, y);
  y += 20;
  doc.font('Helvetica-Bold').fontSize(18).text(Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2 }), 50, y);

  y += 40;
  doc.font('Helvetica').fontSize(11).text(`Payment Method: ${paymentMethodName || '\u2014'}`, 50, y);
  y += 20;
  doc.text(`Description: ${description || '\u2014'}`, 50, y, { width: pageWidth - 100 });

  const sigY = y + 80;
  doc.moveTo(pageWidth - 250, sigY).lineTo(pageWidth - 50, sigY).stroke();
  doc.font('Helvetica').fontSize(10).text('Authorized Signature', pageWidth - 250, sigY + 6);

  doc.font('Helvetica-BoldOblique').fontSize(9).fillColor('black')
    .text(
      'Fetch Consultants (Pvt) Ltd, 9/3A, Pepiliyana Mawatha, Kohuwala, Nugegoda. Sri Lanka  BR PV 00253968',
      0, doc.page.height - 50, { align: 'center' }
    );

  doc.end();
}

module.exports = { generateReceiptPdf };
