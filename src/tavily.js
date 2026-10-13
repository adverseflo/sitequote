// Live price lookups through the Tavily search API.
const config = require('./config');

async function search(query, { maxResults = 5 } = {}) {
  if (!config.tavilyKey) throw new Error('TAVILY_API_KEY is not set (see .env.example)');

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.tavilyKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: maxResults,
      country: 'united kingdom',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tavily error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: (r.content || '').slice(0, 600),
  }));
}

// Search for each material in parallel (small batches to stay polite).
async function searchMaterials(materials, batchSize = 4) {
  const out = [];
  for (let i = 0; i < materials.length; i += batchSize) {
    const batch = materials.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((m) =>
        search(`${m.name} price UK ${m.unit || ''}`.trim()).catch((err) => {
          console.warn(`Search failed for "${m.name}": ${err.message}`);
          return [];
        })
      )
    );
    out.push(...results);
  }
  return out;
}

module.exports = { search, searchMaterials };
