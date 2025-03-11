import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import express from 'express';
import cors from 'cors';

initializeApp();

const app = express();

// Set up CORS with configuration
const corsOptions = {
  origin: [
    'https://hoverchart.web.app',
    'https://hoverchart.firebaseapp.com',
    // Include your development URLs as needed
    'http://localhost:5173',
    'http://localhost:5000',
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Token verification endpoint
app.post('/verify-token', async (req, res) => {
  const idToken = req.body.token;

  if (!idToken) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    // Verify the ID token comes from our Firebase project
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Create a custom token for the user
    const customToken = await getAuth().createCustomToken(uid);

    // Return the custom token
    res.json({ customToken });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(400).json({ error: 'Invalid ID token' });
  }
});

// Update the export to be more specific
export const verifyAuthToken = onRequest(
  {
    memory: '256MiB',
    region: 'us-central1',
    cors: [
      'https://hoverchart.web.app',
      'https://hoverchart.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:5000',
    ],
    maxInstances: 10,
  },
  app
);
