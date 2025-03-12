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
    console.log('Verifying token...');
    const decodedToken = await getAuth().verifyIdToken(idToken, true); // Force token refresh
    console.log('Token verified for user:', decodedToken.uid);

    // Create a fresh custom token
    const customToken = await getAuth().createCustomToken(decodedToken.uid);
    console.log('Created custom token for:', decodedToken.uid);

    // Return both tokens
    res.json({
      customToken,
      uid: decodedToken.uid,
      decoded: decodedToken,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({
      error: 'Invalid token',
      message: error.message,
      code: error.code,
    });
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
