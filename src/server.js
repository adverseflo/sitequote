const path = require('path');
const express = require('express');
const config = require('./config');
const { buildQuote } = require('./agent');
const { mockQuote } = require('./mock');
const { renderQuotePdf } = require('./pdf');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mock: config.mock,
    model: config.model,
    nebius_key: Boolean(config.nebiusKey),
    tavily_key: Boolean(config.tavilyKey),
    labour_rate: config.labourRate,
    vat_rate: config.vatRate,
  });
});

app.post('/api/quote', async (req, res) => {
  const description = String(req.body?.description || '').trim();
  if (description.length < 10) {
    return res.status(400).json({ error: 'Describe the job in a bit more detail.' });
  }
  if (description.length > 4000) {
    return res.status(400).json({ error: 'Job description is too long (max 4000 characters).' });
  }
  const labourRate = Number(req.body?.labour_rate) || config.labourRate;

  try {
    const quote = config.mock
      ? mockQuote(description, { labourRate })
      : await buildQuote(description, { labourRate });
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/pdf', (req, res) => {
  const quote = req.body;
  if (!quote || !Array.isArray(quote.materials) || !Array.isArray(quote.tasks)) {
    return res.status(400).json({ error: 'Send a quote object with materials and tasks.' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="quote.pdf"');
  renderQuotePdf(quote, res);
});

app.listen(config.port, () => {
  console.log(`SiteQuote running on http://localhost:${config.port}${config.mock ? ' (mock mode)' : ''}`);
  if (!config.mock && (!config.nebiusKey || !config.tavilyKey)) {
    console.warn('Missing API keys: copy .env.example to .env and fill them in, or run `npm run mock`.');
  }
});
