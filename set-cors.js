const path    = require('path');
const { Storage } = require('@google-cloud/storage');
const corsConfig  = require('./cors.json');

async function main() {
  const keyPath = path.resolve(__dirname, 'key', 'constitutionvault-1b5d1-firebase-adminsdk-fbsvc-6a8ce536de.json');
  const storage = new Storage({ keyFilename: keyPath });
  const bucket  = storage.bucket('constitutionvault-1b5d1.firebasestorage.app');

  console.log(`Applying CORS to ${bucket.name}…`);
  await bucket.setMetadata({ cors: corsConfig });

  const [meta] = await bucket.getMetadata();
  console.log('Current CORS:', JSON.stringify(meta.cors,null,2));
}

main().catch(console.error);
