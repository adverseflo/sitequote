const test = require('node:test');
const assert = require('node:assert');
const { computeTotals } = require('../src/totals');
const { extractJson } = require('../src/nemotron');

test('totals add materials, labour and VAT', () => {
  const t = computeTotals({
    materials: [{ quantity: 2, unit_price: 10 }, { quantity: 1, unit_price: 5.5 }],
    tasks: [{ labour_hours: 3 }],
    labour_rate: 30,
    vat_rate: 0.2,
  });
  assert.deepStrictEqual(t, { materials: 25.5, labour_hours: 3, labour: 90, subtotal: 115.5, vat: 23.1, total: 138.6 });
});

test('extractJson handles code fences, reasoning and trailing text', () => {
  assert.deepStrictEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepStrictEqual(extractJson('<think>hmm {not json}</think>{"a":[1,2]}'), { a: [1, 2] });
  assert.deepStrictEqual(extractJson('Here you go: [{"x":"}"}] hope that helps'), [{ x: '}' }]);
});
