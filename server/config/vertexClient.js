// server/config/vertexClient.js

// ensure GOOGLE_APPLICATION_CREDENTIALS is set via your .env and dotenv in server.js
require('dotenv').config();

const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;

// instantiate once
const client = new PredictionServiceClient();

/**
 * Get an embedding for the given text using Vertex AI’s textembedding-gecko@001 model
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector
 */
async function getEmbedding(text) {
  // limit length so we don’t overflow the model
  const snippet = text.slice(0, 2000);

  // correct GCP model resource name
  const endpoint =
    'projects/constitutionvault-1b5d1/locations/us-central1/publishers/google/models/textembedding-gecko@001';

  const [response] = await client.predict({
    endpoint,
    instances: [{ content: snippet }],
    parameters: {}
  });

  return response.predictions[0].embedding;
}

module.exports = { getEmbedding };
