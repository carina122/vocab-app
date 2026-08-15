const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('../config');

/**
 * Thin persistence layer over Azure Blob Storage.
 * Every deck is stored as one JSON blob: wordbox-decks/<deckId>.json
 * Raw uploaded files are archived as-is in wordbox-uploads/<uploadId>-<filename>.
 *
 * If AZURE_STORAGE_CONNECTION_STRING isn't set (e.g. running locally without
 * Azure), falls back to an in-memory store so the API is still fully usable
 * for development — swap in real credentials for anything beyond that.
 */

let client = null;
let deckContainer = null;
let uploadContainer = null;
const memoryStore = new Map(); // fallback: deckId -> deck object

async function init() {
  if (!config.azureStorageConnectionString) {
    console.warn('[blobService] No AZURE_STORAGE_CONNECTION_STRING set — using in-memory store (dev mode only).');
    return;
  }
  client = BlobServiceClient.fromConnectionString(config.azureStorageConnectionString);
  deckContainer = client.getContainerClient(config.containerDecks);
  uploadContainer = client.getContainerClient(config.containerUploads);
  await deckContainer.createIfNotExists();
  await uploadContainer.createIfNotExists();
  console.log(`[blobService] Connected to Azure Blob Storage (containers: ${config.containerDecks}, ${config.containerUploads})`);
}

async function saveDeck(deck) {
  if (!client) { memoryStore.set(deck.id, deck); return deck; }
  const blockBlob = deckContainer.getBlockBlobClient(`${deck.id}.json`);
  const body = JSON.stringify(deck);
  await blockBlob.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
  return deck;
}

async function getDeck(deckId) {
  if (!client) return memoryStore.get(deckId) || null;
  const blockBlob = deckContainer.getBlockBlobClient(`${deckId}.json`);
  if (!(await blockBlob.exists())) return null;
  const buf = await blockBlob.downloadToBuffer();
  return JSON.parse(buf.toString('utf-8'));
}

async function listDecks() {
  if (!client) return Array.from(memoryStore.values());
  const decks = [];
  for await (const blob of deckContainer.listBlobsFlat()) {
    const blockBlob = deckContainer.getBlockBlobClient(blob.name);
    const buf = await blockBlob.downloadToBuffer();
    decks.push(JSON.parse(buf.toString('utf-8')));
  }
  return decks;
}

async function deleteDeck(deckId) {
  if (!client) { return memoryStore.delete(deckId); }
  const blockBlob = deckContainer.getBlockBlobClient(`${deckId}.json`);
  await blockBlob.deleteIfExists();
  return true;
}

/** Archive the raw uploaded file (audit trail / re-processing by the serverless function) */
async function archiveUpload(uploadId, filename, buffer, contentType) {
  if (!client) return `memory://${uploadId}-${filename}`;
  const blockBlob = uploadContainer.getBlockBlobClient(`${uploadId}-${filename}`);
  await blockBlob.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: contentType || 'application/octet-stream' },
  });
  return blockBlob.url;
}

module.exports = { init, saveDeck, getDeck, listDecks, deleteDeck, archiveUpload };
