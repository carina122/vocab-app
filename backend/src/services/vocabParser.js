const { v4: uuid } = require('uuid');

/**
 * Parses an uploaded vocabulary file (csv / json / txt) into a deck object.
 * Kept dependency-free (no csv library) so this exact logic can be copied
 * verbatim into the Azure Function (serverless/ProcessVocabUpload).
 */
function parseVocabFile(filename, text, deckName) {
  const ext = filename.split('.').pop().toLowerCase();
  let rows = [];

  if (ext === 'json') {
    const data = JSON.parse(text);
    rows = Array.isArray(data) ? data : data.cards || [];
  } else {
    // csv or txt: comma or tab separated, one entry per line
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
      id: uuid(),
      term: String(r.term).trim(),
      translation: String(r.translation).trim(),
      example: r.example ? String(r.example).trim() : '',
      known: false,
      reviews: 0,
    }));

  return {
    id: uuid(),
    name: deckName || filename.replace(/\.[^.]+$/, ''),
    language: 'auto',
    createdAt: new Date().toISOString(),
    sourceFile: filename,
    cards,
  };
}

/** Minimal CSV line splitter that respects double-quoted fields. */
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

module.exports = { parseVocabFile };
