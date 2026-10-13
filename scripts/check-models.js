// Lists the Nemotron models your Nebius Token Factory key can use.
// Usage: npm run models
const config = require('../src/config');

(async () => {
  if (!config.nebiusKey) {
    console.error('Set NEBIUS_API_KEY in .env first.');
    process.exit(1);
  }
  const res = await fetch(`${config.nebiusBaseUrl}/models`, {
    headers: { Authorization: `Bearer ${config.nebiusKey}` },
  });
  if (!res.ok) {
    console.error(`Error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const { data = [] } = await res.json();
  const nemotron = data.map((m) => m.id).filter((id) => /nemotron/i.test(id));
  console.log(nemotron.length ? 'Nemotron models available:\n' + nemotron.map((id) => `  ${id}`).join('\n') : 'No Nemotron models found. All models:\n' + data.map((m) => `  ${m.id}`).join('\n'));
  console.log(`\nCurrently configured: ${config.model}${nemotron.includes(config.model) ? ' (found)' : ' (NOT in the list, update NEMOTRON_MODEL in .env)'}`);
})();
