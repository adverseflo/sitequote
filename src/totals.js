// Shared quote maths. The frontend has a copy of this logic in public/app.js.
function computeTotals(quote) {
  const materials = (quote.materials || []).reduce(
    (sum, m) => sum + (Number(m.quantity) || 0) * (Number(m.unit_price) || 0),
    0
  );
  const hours = (quote.tasks || []).reduce((sum, t) => sum + (Number(t.labour_hours) || 0), 0);
  const labour = hours * (Number(quote.labour_rate) || 0);
  const subtotal = materials + labour;
  const vat = subtotal * (Number(quote.vat_rate) || 0);
  return {
    materials: round2(materials),
    labour_hours: round2(hours),
    labour: round2(labour),
    subtotal: round2(subtotal),
    vat: round2(vat),
    total: round2(subtotal + vat),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { computeTotals };
