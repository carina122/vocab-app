const express = require('express');
const { v4: uuid } = require('uuid');
const blobService = require('../services/blobService');

const router = express.Router();

// GET /api/decks — list all decks (summary only)
router.get('/', async (req, res) => {
  const decks = await blobService.listDecks();
  res.json(decks.map((d) => ({
    id: d.id, name: d.name, language: d.language,
    cardCount: d.cards.length, createdAt: d.createdAt,
  })));
});

// POST /api/decks — create a deck directly (e.g. manual entry, not via upload)
router.post('/', async (req, res) => {
  const { name, language, cards } = req.body;
  if (!name || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'name and cards[] are required' });
  }
  const deck = {
    id: uuid(),
    name,
    language: language || 'auto',
    createdAt: new Date().toISOString(),
    cards: cards.map((c) => ({ id: uuid(), known: false, reviews: 0, ...c })),
  };
  await blobService.saveDeck(deck);
  res.status(201).json(deck);
});

// GET /api/decks/:id — full deck with cards
router.get('/:id', async (req, res) => {
  const deck = await blobService.getDeck(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  res.json(deck);
});

// DELETE /api/decks/:id
router.delete('/:id', async (req, res) => {
  await blobService.deleteDeck(req.params.id);
  res.status(204).end();
});

// GET /api/decks/:id/cards
router.get('/:id/cards', async (req, res) => {
  const deck = await blobService.getDeck(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  res.json(deck.cards);
});

// POST /api/decks/:id/cards/:cardId/review  { result: "known" | "learning" }
router.post('/:id/cards/:cardId/review', async (req, res) => {
  const { result } = req.body;
  if (!['known', 'learning'].includes(result)) {
    return res.status(400).json({ error: 'result must be "known" or "learning"' });
  }
  const deck = await blobService.getDeck(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  const card = deck.cards.find((c) => c.id === req.params.cardId);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  card.known = result === 'known';
  card.reviews = (card.reviews || 0) + 1;
  card.lastReviewed = new Date().toISOString();

  await blobService.saveDeck(deck);
  res.json(card);
});

module.exports = router;
