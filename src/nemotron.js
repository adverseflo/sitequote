// Calls NVIDIA Nemotron through Nebius Token Factory's OpenAI-compatible API.
const config = require('./config');

async function chat(messages, { temperature = 0.2, maxTokens = 4000 } = {}) {
  if (!config.nebiusKey) throw new Error('NEBIUS_API_KEY is not set (see .env.example)');

  const res = await fetch(`${config.nebiusBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.nebiusKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token Factory error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    usage: data.usage || null,
  };
}

// Models sometimes wrap JSON in code fences or add reasoning first.
// Pull out the first complete JSON object or array.
function extractJson(text) {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through to bracket scanning
  }

  const start = cleaned.search(/[{[]/);
  if (start === -1) throw new Error('No JSON found in model output');
  const open = cleaned[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error('Unterminated JSON in model output');
}

async function chatJson(messages, opts) {
  const { text, usage } = await chat(messages, opts);
  try {
    return { json: extractJson(text), usage };
  } catch (err) {
    // One retry: tell the model what went wrong.
    const retry = await chat(
      [
        ...messages,
        { role: 'assistant', content: text },
        { role: 'user', content: `That was not valid JSON (${err.message}). Reply with ONLY the JSON, nothing else.` },
      ],
      opts
    );
    return { json: extractJson(retry.text), usage: retry.usage };
  }
}

module.exports = { chat, chatJson, extractJson };
