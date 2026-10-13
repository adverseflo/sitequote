# SiteQuote

AI agent that turns a job description into an itemised builder's quote, using **NVIDIA Nemotron** on **Nebius Token Factory** and live UK prices from **Tavily**.

Built for the [Nebius x NVIDIA Global AI Hackathon 2026](https://nebiusglobalaihackathon.devpost.com/).

## What it does

1. A builder describes the job in plain English, e.g. *"knock through kitchen wall, fit steel beam, replaster both sides"*.
2. **Nemotron** breaks it into tasks (with labour hours) and materials (with quantities and UK units).
3. **Tavily** searches live UK supplier prices for every material.
4. **Nemotron** reads the search results and picks a per-unit price for each material, with a link to the source.
5. The app totals materials, labour and VAT. The builder edits any line, then downloads a PDF quote.

## How we use NVIDIA Nemotron and Nebius Token Factory

- All model calls go through **Nebius Token Factory's OpenAI-compatible API** (`https://api.tokenfactory.nebius.com/v1`). See `src/nemotron.js`.
- The default model is **`nvidia/nemotron-3-super-120b-a12b`**. It's set in `.env` (`NEMOTRON_MODEL`), so you can switch models without changing code. Run `npm run models` to list the Nemotron models available to your key.
- Nemotron runs twice per quote:
  - **Job breakdown** (`src/agent.js`, `BREAKDOWN_PROMPT`): turns the description into structured JSON for tasks and materials.
  - **Price extraction** (`src/agent.js`, `PRICING_PROMPT`): reads Tavily's search results and gives one per-unit price per material, converting pack prices where needed.
- We use prompt engineering with structured JSON output and a single automatic retry if the JSON is malformed. No fine-tuning.

<!-- [UPDATE] Add what Token Factory did for your workflow: response speed, how easy it was to swap models, cost per quote, etc. -->

## Setup

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone https://github.com/adverseflo/sitequote.git
cd sitequote
npm install
cp .env.example .env    # on Windows: copy .env.example .env
```

Open `.env` and add your keys:

- `NEBIUS_API_KEY`: from [Nebius Token Factory](https://tokenfactory.nebius.com)
- `TAVILY_API_KEY`: from [Tavily](https://tavily.com)

Then:

```bash
npm run models   # check the Nemotron model ID works with your key
npm start        # open http://localhost:3000
```

### No keys yet? Use mock mode

```bash
npm run mock
```

This returns a sample quote without calling any APIs, so you can work on the frontend or the PDF straight away.

## Project layout

| Path | What it is |
| --- | --- |
| `src/server.js` | Express server: `/api/quote`, `/api/pdf`, `/api/health` |
| `src/agent.js` | The agent: breakdown → price search → price extraction → totals |
| `src/nemotron.js` | Nemotron calls via Token Factory, plus JSON extraction |
| `src/tavily.js` | Tavily price searches |
| `src/totals.js` | Quote maths (materials, labour, VAT) |
| `src/pdf.js` | PDF quote export |
| `src/mock.js` | Sample data for mock mode |
| `public/` | The web app (plain HTML, CSS and JS) |
| `scripts/check-models.js` | Lists the Nemotron models your key can use |

## Tests

```bash
npm test
```

## License

MIT
