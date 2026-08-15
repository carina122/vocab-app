/**
 * api.js — thin REST client for the WordBox backend microservice.
 * The backend URL is injected at container start (see nginx env substitution
 * in entrypoint) or defaults to same-origin /api for local docker-compose.
 */
const API_BASE = window.__WORDBOX_API__ || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const body = await res.json(); msg = body.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

const WordBoxAPI = {
  // Decks
  listDecks: () => request('/decks'),
  getDeck: (id) => request(`/decks/${id}`),
  createDeck: (deck) => request('/decks', { method: 'POST', body: JSON.stringify(deck) }),
  deleteDeck: (id) => request(`/decks/${id}`, { method: 'DELETE' }),

  // Cards
  listCards: (deckId) => request(`/decks/${deckId}/cards`),
  reviewCard: (deckId, cardId, result) =>
    request(`/decks/${deckId}/cards/${cardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ result }), // "known" | "learning"
    }),

  // Upload — multipart, so bypass the JSON `request` helper
  uploadVocabFile: async (file, deckName) => {
    const form = new FormData();
    form.append('file', file);
    form.append('deckName', deckName || file.name.replace(/\.[^.]+$/, ''));
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
    if (!res.ok) {
      let msg = 'Upload failed';
      try { const body = await res.json(); msg = body.error || msg; } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  },

  // Stats
  getStats: () => request('/stats'),
};

window.WordBoxAPI = WordBoxAPI;
