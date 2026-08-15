module.exports = {
  port: process.env.PORT || 4000,

  // Azure Blob Storage — injected via K8s Secret in production,
  // via .env / docker-compose for local dev.
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  containerDecks: process.env.AZURE_CONTAINER_DECKS || 'wordbox-decks',
  containerUploads: process.env.AZURE_CONTAINER_UPLOADS || 'wordbox-uploads',

  // CORS origin for the frontend microservice (Ingress hostname in AKS)
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
