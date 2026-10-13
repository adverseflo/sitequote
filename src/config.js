require('dotenv').config();

const config = {
  nebiusKey: process.env.NEBIUS_API_KEY || '',
  nebiusBaseUrl: (process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1').replace(/\/$/, ''),
  model: process.env.NEMOTRON_MODEL || 'nvidia/nemotron-3-super-120b-a12b',
  tavilyKey: process.env.TAVILY_API_KEY || '',
  labourRate: Number(process.env.LABOUR_RATE || 35),
  vatRate: Number(process.env.VAT_RATE || 0.2),
  port: Number(process.env.PORT || 3000),
  mock: process.env.MOCK === '1' || process.argv.includes('--mock'),
};

module.exports = config;
