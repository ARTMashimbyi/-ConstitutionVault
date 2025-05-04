// set-cors.js
const { Storage } = require('@google-cloud/storage');
const corsConfig  = require('./cors.json');

async function main() {
  const storage = new Storage();  // uses GOOGLE_APPLICATION_CREDENTIALS
  const bucket  = storage.bucket('constitutionvault-1b5d1.firebasestorage.app');
  await bucket.setMetadata({ cors: corsConfig });
  console.log('✅ CORS configuration applied');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
