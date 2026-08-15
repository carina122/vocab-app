const crypto = require('crypto');

/**
 * ProcessVocabUpload — Azure Function (Blob trigger, Consumption plan).
 *
 * This is the serverless component of the architecture: it fires automatically
 * whenever a raw vocabulary file lands in the `wordbox-uploads` Blob container
 * (put there either by the backend microservice's /api/upload route, or by any
 * future direct-to-storage upload path such as a SAS-token upload from the browser).
 * It parses the file and writes a ready-to-study deck JSON into `wordbox-decks`,
 * decoupling "receiving a file" from "turning it into a deck" — no VM or
 * container needs to stay running for this to happen.
 */
module.exports = async function (context, uploadBlob) {
  const blobName = context.bindingData.name;
  context.log(`ProcessVocabUpload triggered for blob: ${blobName}`);

  try {
    const text = Buffer.isBuffer(uploadBlob) ? uploadBlob.toString('utf-8') : String(uploadBlob);
    const deckName = blobName.replace(/^[0-9a-f-]{36}-/, '').replace(/\.[^.]+$/, '');
    const deck = parseVocabFile(blobName, text, deckName);

    if (deck.cards.length === 0) {
      context.log.warn(`No valid rows found in ${blobName} — skipping deck creation.`);
      return;
    }

    context.bindings.deckOut = JSON.stringify(deck);
    context.log(`Created deck "${deck.name}" with ${deck.cards.length} cards from ${blobName}`);
  } catch (err) {
    context.log.error(`Failed to process ${blobName}: ${err.message}`);
    throw err; // surfaces in Function App monitoring / triggers retry policy
  }
};

// Same parsing logic as backend/src/services/vocabParser.js, kept dependency-free
// so it runs in the Functions runtime without a shared package.
function parseVocabFile(filename, text, deckName) {
  const ext = filename.split('.').pop().toLowerCase();
  let rows = [];

  if (ext === 'json') {
    const data = JSON.parse(text);
    rows = Array.isArray(data) ? data : data.cards || [];
  } else {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const looksLikeHeader = /term/i.test(lines[0] || '') && /translation/i.test(lines[0] || '');
    const dataLines = looksLikeHeader ? lines.slice(1) : lines;
    rows = dataLines.map((line) => {
      const parts = splitCsvLine(line);
      return { term: parts[0], translation: parts[1], example: parts[2] || '' };
    });
  }

  const cards = rows
    .filter((r) => r.term && r.translation)
    .map((r) => ({
      id: crypto.randomUUID(),
      term: String(r.term).trim(),
      translation: String(r.translation).trim(),
      example: r.example ? String(r.example).trim() : '',
      known: false,
      reviews: 0,
    }));

  return {
    id: crypto.randomUUID(),
    name: deckName || filename,
    language: 'auto',
    createdAt: new Date().toISOString(),
    sourceFile: filename,
    cards,
  };
}

function splitCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result.map((s) => s.trim());
}
