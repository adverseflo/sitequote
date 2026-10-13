// Renders a quote as a PDF with pdfkit.
const PDFDocument = require('pdfkit');
const { computeTotals } = require('./totals');

const gbp = (n) => `£${(Number(n) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function renderQuotePdf(quote, stream) {
  const totals = computeTotals(quote);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  const left = 50;
  const right = doc.page.width - 50;
  const width = right - left;

  // Header
  doc.font('Helvetica-Bold').fontSize(20).text(quote.business_name || 'Quotation', left, 50);
  doc.font('Helvetica').fontSize(10).fillColor('#555')
    .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, left, 50, { align: 'right', width })
    .text(quote.client_name ? `For: ${quote.client_name}` : '', { align: 'right', width });
  doc.fillColor('#000').moveDown(2);

  doc.font('Helvetica-Bold').fontSize(12).text('Job');
  doc.font('Helvetica').fontSize(10).text(quote.summary || quote.description || '').moveDown();

  // Table helper
  const cols = [
    { label: 'Item', w: 0.52 },
    { label: 'Qty', w: 0.12, align: 'right' },
    { label: 'Unit price', w: 0.18, align: 'right' },
    { label: 'Amount', w: 0.18, align: 'right' },
  ];
  const drawRow = (cells, bold = false) => {
    if (doc.y > doc.page.height - 120) doc.addPage();
    const y = doc.y;
    let x = left;
    let rowHeight = 0;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    cells.forEach((cell, i) => {
      const w = cols[i].w * width;
      doc.text(String(cell), x + 2, y, { width: w - 4, align: cols[i].align || 'left' });
      rowHeight = Math.max(rowHeight, doc.y - y);
      x += w;
    });
    doc.y = y + rowHeight + 4;
    doc.moveTo(left, doc.y - 2).lineTo(right, doc.y - 2).strokeColor('#ddd').lineWidth(0.5).stroke();
  };
  const section = (title) => {
    doc.moveDown(0.5).font('Helvetica-Bold').fontSize(12).fillColor('#000').text(title, left);
    doc.moveDown(0.3);
    drawRow(cols.map((c) => c.label), true);
  };

  section('Materials');
  (quote.materials || []).forEach((m) => {
    drawRow([m.name, `${m.quantity} ${m.unit}`, gbp(m.unit_price), gbp(m.quantity * m.unit_price)]);
  });

  section('Labour');
  (quote.tasks || []).forEach((t) => {
    drawRow([t.name, `${t.labour_hours} h`, gbp(quote.labour_rate), gbp(t.labour_hours * quote.labour_rate)]);
  });

  // Totals
  doc.moveDown();
  const totalRow = (label, value, bold = false) => {
    const y = doc.y;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10);
    doc.text(label, left + width * 0.5, y, { width: width * 0.3, align: 'right' });
    doc.text(value, left + width * 0.8, y, { width: width * 0.2, align: 'right' });
    doc.moveDown(0.3);
  };
  totalRow('Materials', gbp(totals.materials));
  totalRow('Labour', gbp(totals.labour));
  totalRow('Subtotal', gbp(totals.subtotal));
  totalRow(`VAT (${Math.round((quote.vat_rate || 0) * 100)}%)`, gbp(totals.vat));
  totalRow('Total', gbp(totals.total), true);

  if (quote.assumptions && quote.assumptions.length) {
    doc.moveDown().font('Helvetica-Bold').fontSize(11).text('Assumptions', left);
    doc.font('Helvetica').fontSize(9);
    quote.assumptions.forEach((a) => doc.text(`• ${a}`, left, doc.y, { width }));
  }

  doc.moveDown().font('Helvetica').fontSize(8).fillColor('#777')
    .text('This quote is valid for 30 days. Prices include materials and labour as listed above.', left, doc.y, { width });

  doc.end();
}

module.exports = { renderQuotePdf };
