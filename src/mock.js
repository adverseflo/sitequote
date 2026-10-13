// Sample quote returned in mock mode, so the frontend can be built without API keys.
const config = require('./config');
const { computeTotals } = require('./totals');

function mockQuote(description, { labourRate = config.labourRate } = {}) {
  const quote = {
    description,
    summary: 'Knock through kitchen wall, install steel beam, replaster both sides',
    assumptions: [
      'Wall is load-bearing, opening about 3m wide',
      'Structural engineer calcs and building control fees not included',
      'Skip hire included for waste',
    ],
    tasks: [
      { name: 'Install temporary supports (acrows and strongboys)', labour_hours: 4 },
      { name: 'Demolish wall section and clear rubble', labour_hours: 10 },
      { name: 'Build padstones and fit steel beam', labour_hours: 8 },
      { name: 'Make good, board and replaster both sides', labour_hours: 14 },
    ],
    materials: [
      { name: 'Steel beam 203x133 UB, 3.6m', quantity: 1, unit: 'length', unit_price: 245, source: 'estimate', note: 'mock data' },
      { name: 'Concrete padstone 440x215x100mm', quantity: 2, unit: 'each', unit_price: 9.5, source: 'estimate', note: 'mock data' },
      { name: 'Acrow prop hire (1 week)', quantity: 4, unit: 'each', unit_price: 12, source: 'estimate', note: 'mock data' },
      { name: '12.5mm plasterboard 2400x1200', quantity: 6, unit: 'sheet', unit_price: 8.75, source: 'estimate', note: 'mock data' },
      { name: 'Thistle MultiFinish plaster 25kg', quantity: 4, unit: 'bag', unit_price: 11.5, source: 'estimate', note: 'mock data' },
      { name: '6 yard skip hire', quantity: 1, unit: 'each', unit_price: 260, source: 'estimate', note: 'mock data' },
    ],
    labour_rate: labourRate,
    vat_rate: config.vatRate,
    model: 'mock',
  };
  quote.totals = computeTotals(quote);
  quote.elapsed_ms = 0;
  return quote;
}

module.exports = { mockQuote };
