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
    console.error('No token provided');
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    console.log(
      `Verifying token starting with: ${idToken.substring(0, 10)}...`
    );

    // Verify the ID token comes from our Firebase project
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    console.log(`Successfully verified token for user: ${uid}`);

    // Create a custom token for the user
    const customToken = await getAuth().createCustomToken(uid);

    console.log(`Successfully created custom token for user: ${uid}`);

    // Return the custom token
    res.json({ customToken, uid });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(400).json({ error: 'Invalid ID token', message: error.message });
  }
});

// Update the export to be more specific
export const verifyAuthToken = onRequest(
  {
    memory: '256MiB',
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
  },
  app
);
