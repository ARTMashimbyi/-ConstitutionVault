// server/config/vertexClient.js

require("dotenv").config();
const fs = require("fs");
const os = require("os");
const path = require("path");

// Determine credentials for Vertex AI
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  // In Azure: Write the JSON to a temp file and point GOOGLE_APPLICATION_CREDENTIALS there
  const tempFilePath = path.join(os.tmpdir(), "vertex-service-account.json");
  fs.writeFileSync(tempFilePath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, "utf8");
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_VERTEX) {
  // Local dev: Path from .env (or fallback)
  const credentialsPath = path.resolve(__dirname, "..", "..", process.env.GOOGLE_APPLICATION_CREDENTIALS_VERTEX);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}

// Now import the client
const { PredictionServiceClient } = require("@google-cloud/aiplatform").v1;
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
