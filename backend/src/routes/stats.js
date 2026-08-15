const express = require('express');
const blobService = require('../services/blobService');

const router = express.Router();

// GET /api/stats — aggregate progress across all decks
router.get('/', async (req, res) => {
  const decks = await blobService.listDecks();

  let totalReviewed = 0, known = 0, learning = 0;
  const byDeck = decks.map((d) => {
    const reviewed = d.cards.filter((c) => c.reviews > 0);
    const deckKnown = d.cards.filter((c) => c.known).length;
    totalReviewed += reviewed.length;
    known += deckKnown;
    learning += reviewed.length - deckKnown;
    return { name: d.name, known: deckKnown, total: d.cards.length };
  });

  res.json({
    totalReviewed,
    known,
    learning,
    streakDays: totalReviewed > 0 ? 1 : 0, // placeholder: wire up to real per-day review log
    byDeck,
  });
});

module.exports = router;
