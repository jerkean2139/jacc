import { google } from 'googleapis';
import { Express } from 'express';

// Temporary helper to generate OAuth refresh token
export function setupOAuthHelper(app: Express) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = 'https://02aa0592-869c-416a-869f-4cb3baafbabd-00-17ngv8bepjtga.picard.replit.dev/auth/callback';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log('OAuth helper not available - missing CLIENT_ID or CLIENT_SECRET');
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Step 1: Get authorization URL
  app.get('/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
      prompt: 'consent'
    });
    
    res.redirect(authUrl);
  });

  // Step 2: Handle callback and get refresh token
  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      
      res.send(`
        <h2>OAuth Setup Complete!</h2>
        <p>Copy these credentials to your .env file:</p>
        <pre>
GOOGLE_CLIENT_ID=${CLIENT_ID}
GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
        </pre>
        <p>Access Token: ${tokens.access_token}</p>
        <p><strong>Save the refresh token - you'll need it for the .env file!</strong></p>
      `);
    } catch (error) {
      res.send(`Error: ${error}`);
    }
  });

  console.log('OAuth helper routes available at /auth/google');
}