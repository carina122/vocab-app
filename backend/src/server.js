const express = require('express');
const cors = require('cors');
const config = require('./config');
const blobService = require('./services/blobService');

const decksRouter = require('./routes/decks');
const uploadRouter = require('./routes/upload');
const statsRouter = require('./routes/stats');

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/healthz', (req, res) => res.status(200).send('ok')); // K8s liveness/readiness probe

app.use('/decks', decksRouter);
app.use('/upload', uploadRouter);
app.use('/stats', statsRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

blobService.init().finally(() => {
  app.listen(config.port, () => {
    console.log(`[wordbox-backend] listening on :${config.port}`);
  });
});
