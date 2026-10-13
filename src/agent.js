// The SiteQuote agent: job description -> tasks + materials -> live prices -> quote.
const config = require('./config');
const { chatJson } = require('./nemotron');
const { searchMaterials } = require('./tavily');
const { computeTotals } = require('./totals');

const BREAKDOWN_PROMPT = `You are an experienced UK building estimator.
Break the job into tasks and materials for a quote.

Rules:
- Use UK trade terms and UK units (m, m2, m3, bags, sheets, lengths, each).
- Estimate realistic quantities, including normal wastage (about 10%).
- Labour hours are for one tradesperson.
- Only include materials the job actually needs. Do not invent extras.
- If the description is vague, make sensible assumptions and list them.

Reply with ONLY this JSON, no other text:
{
  "summary": "one-line job summary",
  "assumptions": ["..."],
  "tasks": [{ "name": "...", "labour_hours": 0 }],
  "materials": [{ "name": "specific product, e.g. 12.5mm plasterboard 2400x1200", "quantity": 0, "unit": "sheet" }]
}`;

const PRICING_PROMPT = `You extract UK retail prices from search results.
For each material, pick the most relevant price from its search results.

Rules:
- Price per ONE unit as given in the material's "unit" (convert if the result is per pack, per m2, etc.).
- Prices in GBP including VAT, as numbers.
- Use the URL of the result you took the price from.
- If no result has a usable price, give your best typical UK estimate and set "source" to "estimate".

Reply with ONLY a JSON array in the same order as the input, no other text:
[{ "unit_price": 0, "source": "url or estimate", "note": "short note, e.g. 'pack of 10, price divided'" }]`;

async function breakdownJob(description) {
  const { json } = await chatJson([
    { role: 'system', content: BREAKDOWN_PROMPT },
    { role: 'user', content: description },
  ]);
  return {
    summary: String(json.summary || ''),
    assumptions: Array.isArray(json.assumptions) ? json.assumptions.map(String) : [],
    tasks: (json.tasks || []).map((t) => ({
      name: String(t.name || ''),
      labour_hours: Number(t.labour_hours) || 0,
    })),
    materials: (json.materials || []).map((m) => ({
      name: String(m.name || ''),
      quantity: Number(m.quantity) || 0,
      unit: String(m.unit || 'each'),
    })),
  };
}

async function priceMaterials(materials) {
  if (materials.length === 0) return [];
  const results = await searchMaterials(materials);

  const payload = materials.map((m, i) => ({
    material: m.name,
    unit: m.unit,
    search_results: results[i],
  }));

  const { json } = await chatJson([
    { role: 'system', content: PRICING_PROMPT },
    { role: 'user', content: JSON.stringify(payload) },
  ]);

  const prices = Array.isArray(json) ? json : [];
  return materials.map((m, i) => {
    const p = prices[i] || {};
    // VAT is added once on the whole quote, so store ex-VAT unit prices.
    const incVat = Number(p.unit_price) || 0;
    return {
      ...m,
      unit_price: round2(incVat / (1 + config.vatRate)),
      source: p.source || 'estimate',
      note: p.note || '',
    };
  });
}

async function buildQuote(description, { labourRate = config.labourRate } = {}) {
  const started = Date.now();
  const breakdown = await breakdownJob(description);
  const materials = await priceMaterials(breakdown.materials);

  const quote = {
    description,
    summary: breakdown.summary,
    assumptions: breakdown.assumptions,
    tasks: breakdown.tasks,
    materials,
    labour_rate: labourRate,
    vat_rate: config.vatRate,
    model: config.model,
  };
  quote.totals = computeTotals(quote);
  quote.elapsed_ms = Date.now() - started;
  return quote;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { buildQuote, breakdownJob, priceMaterials };
