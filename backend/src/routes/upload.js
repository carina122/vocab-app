const express = require('express');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const blobService = require('../services/blobService');
const { parseVocabFile } = require('../services/vocabParser');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/upload  (multipart/form-data: file, deckName)
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { deckName } = req.body;
  const uploadId = uuid();

  try {
    // 1. Archive the raw file in Azure Blob Storage (audit trail; also what a
    //    Blob-triggered Azure Function would react to in a fully event-driven setup).
    await blobService.archiveUpload(uploadId, req.file.originalname, req.file.buffer, req.file.mimetype);

    // 2. Parse synchronously so the user gets an immediate, usable deck.
    const text = req.file.buffer.toString('utf-8');
    const deck = parseVocabFile(req.file.originalname, text, deckName);

    if (deck.cards.length === 0) {
      return res.status(422).json({ error: 'No valid term/translation rows found in the file' });
    }

    await blobService.saveDeck(deck);
    res.status(201).json({ id: deck.id, name: deck.name, cardCount: deck.cards.length });
  } catch (err) {
    console.error('[upload] failed:', err.message);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
});

module.exports = router;
