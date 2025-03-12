import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import express from 'express';
import cors from 'cors';

// Try to load environment variables with fallback mechanism

// Initialize Firebase Admin with service account
initializeApp({
  credential: cert({
    projectId: 'hoverchart',
    clientEmail: 'firebase-adminsdk-wka1s@hoverchart.iam.gserviceaccount.com',
    privateKey:
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMot/sJZk60o9U\ntsipkOuKH09A9LJvUlaeY0tsJqxjpe29oq0g7rm5o4uasHk+lIXgIH2xIOrAyIsR\n981zlGJBk/M5JHMoEJhFcZjpXLDBZ+Ig032wtkYROdt0Iyn17rXpYkK9PSyk7erG\nkwzjDMYbQOjceQtJMtKRCLO3BP8gDD6ghSop1vvosYcSMwoZMTuAYegBaL7WTv6M\nvCOOzI7ADiO8DO5KPdqsdvHTi8D9ZRkYBjot0LdhpKFb2wlMqPOqSaayTlDJY7/C\n7T/6YyHstsAVe8u4kwfG8P2wfs2XzJ36L8mcn6E7gDcSOncK2FTrVmAkmWi1mu3v\n3zUMirjZAgMBAAECggEAEOqKerIvEzc+jFcMHfFTk6Keeta0G9XQm26gJNsmAzpz\nNUs6/eoZJu44HZw6iT9+Nu5RkBvAgP3eVIP1D4D6rJ6qM+Zhf6E3X6sBVJiUnj7r\noT0vMjFKjkniTr7oDi/va6opEvAnzZLcmZQYibsAnUiaeeKJa/2T/GQKkeok8eq5\ne3dE1NwbRLsFPMYX1JxAST3WYFxKEP6uFc4H+X6zg64Fix/YyqVegrVofTqxuBqa\nYw3f3JpBHxc6LKb/otUUaeAG13MbQa48pRNTD0BnTLqDRZQyJXoVXCwXlgPfutRX\n4mTo3nhPxGHuJ42eBEP4yXfPwnvvZWVzP4JDuzyPzQKBgQC/1x1LUqw+rJmFilRu\nQRXyHgOrR8jF58Kn6pnVEnWlrAvPbzkOgLD5YETh7MCUTcDHcmViFcVQiWLuC3em\ni30CoFKJI7OQZiuyyvk8fzdD7CXGF5KLCiF1zyr6hww4lO+blEid9NfLIAknCJt/\nIAlpz4h2Adm1efnXIMgTH6wAQwKBgQC7q8vy10QyBRqz0ysRUNA1O9lMFE5ItqrD\nzGFQrUouEzZYzzOtkKYj91dWQQkbH6uDLrJRgJPe1Bapm6CG1vi4eBLTZroZcNen\nigbHnHFxbyZL27Moh9seeokQkhEiDzvgwzXQ+ReN/Yhzp68XCDLPQ2eDgVu2sm13\nKddYC3OuswKBgB7SD5nHWXbkQfHrbG8eM8lnOw2shbwN5P8XOMm7on0QbAFSjCch\nU81swwRNBg+NglhIr7MXblDnEabO3tU5+caPPVNdEf8z+vdJlss6YQWfjd4KcXe3\nE/Maanw/cB4zB1/Gbfg6muS+a9oCjwDYg8qlFfZni7OVOidu09YGs5qDAoGBAILc\n+ds9FlWWz5bjQh3R702fjReK9Ueo8IyVwKokHBzi0ru8yDlYKzHbMHB56yKZw9w2\nvKsucG4qEB924MoFruva9q2o7U3+LLKsAaxBP62sptSwv04c5cNsCJWgdQf9/W/u\nT2GHwFAHoZWcMPBrjBqQ0uaVVmGgK8qzR3EikykXAoGAL5Un7EuwTh0c++qX8h6q\nponYoQ9pt0LWPpZHZUofc9GUxUWDS6aspJCh9CP4RW7AjHrBBHAInwfyTk9+tcZ0\nHhDsMad4bFijOBhzerJ2N0VoCh6/m7UGG0Z4QJhWRw2gaoCj4Uscig7GI02vvYnT\nWKEIVKdcMM37dz9EcEHv5pQ=\n-----END PRIVATE KEY-----\n',
  }),
});

const app = express();

// Set up CORS with configuration
const corsOptions = {
  origin: [
    'https://hoverchart.web.app',
    'https://hoverchart.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:5000',
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Export the Cloud Function with the correct path
export const verifyAuthToken = onRequest(
  {
    memory: '256MiB',
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
  },
  app.use('/verify-token', async (req, res) => {
    const idToken = req.body.token;

    if (!idToken) {
      console.error('No token provided');
      return res.status(400).json({ error: 'No token provided' });
    }

    try {
      console.log('Verifying token...');
      // First verify the token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);

      // Create a custom token
      const customToken = await getAuth().createCustomToken(decodedToken.uid);
      console.log('Custom token created successfully');

      res.json({
        customToken,
        uid: decodedToken.uid,
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(400).json({
        error: 'Invalid token',
        details: error.message,
      });
    }
  })
);
