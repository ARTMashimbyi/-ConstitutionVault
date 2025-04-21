const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post('/api/signup', async (req, res) => {
  const { id_token } = req.body; // Make sure this matches the frontend key

  if (!id_token) {
    return res.status(400).send({ message: 'Missing ID token' });
  }

  try {
    const existingSnapshot = await db.collection('user_signup')
      .where('id_token', '==', id_token)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(200).send({ message: 'User already signed up' });
    }

    await db.collection('user_signup').add({ id_token });

    res.status(200).send({ message: 'Signup successful' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
