// server/config/vertexClient.js

// Load environment variables
require("dotenv").config();
const path = require("path");

// ✅ Resolve path to Vertex AI key from project root
const credentialsPath = path.resolve(__dirname, "..", "..", process.env.GOOGLE_APPLICATION_CREDENTIALS_VERTEX);
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

const { PredictionServiceClient } = require("@google-cloud/aiplatform").v1;

// Instantiate Vertex AI Prediction client
const client = new PredictionServiceClient();

/**
 * Get an embedding for the given text using Vertex AI’s textembedding-gecko@001 model
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector
 */
async function getEmbedding(text) {
  // Limit input size to avoid exceeding model limits
  const snippet = text.slice(0, 2000);

  // Vertex AI model endpoint
  const endpoint =
    "projects/constitutionvault-1b5d1/locations/us-central1/publishers/google/models/textembedding-gecko@001";

  const [response] = await client.predict({
    endpoint,
    instances: [{ content: snippet }],
    parameters: {}
  });

  return response.predictions[0].embedding;
}

module.exports = { getEmbedding };
