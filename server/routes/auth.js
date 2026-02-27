import { Router } from 'express';
import crypto from 'crypto';
import config from '../config.js';

const router = Router();

/**
 * GET /auth/shopify
 * Initiates Shopify OAuth flow — redirects user to Shopify consent screen
 */
router.get('/shopify', (req, res) => {
  const { storeDomain } = req.query;

  if (!storeDomain) {
    return res.status(400).json({ error: 'storeDomain query parameter is required' });
  }

  // Clean the domain
  const shop = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Generate a nonce for CSRF protection
  const nonce = crypto.randomBytes(16).toString('hex');
  req.session.shopifyNonce = nonce;
  req.session.shopifyDomain = shop;

  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${config.shopify.clientId}` +
    `&scope=${config.shopify.scopes}` +
    `&redirect_uri=${encodeURIComponent(config.shopify.redirectUri)}` +
    `&state=${nonce}`;

  res.json({ authUrl });
});

/**
 * GET /auth/shopify/callback
 * Handles OAuth callback — exchanges code for access token
 */
router.get('/shopify/callback', async (req, res) => {
  const { code, state, shop } = req.query;

  // Verify CSRF nonce
  if (state !== req.session.shopifyNonce) {
    return res.status(403).send('Invalid state parameter. Possible CSRF attack.');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.shopify.clientId,
        client_secret: config.shopify.clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokenData = await tokenResponse.json();

    // Store in session
    req.session.shopifyAccessToken = tokenData.access_token;
    req.session.shopifyDomain = shop;
    req.session.shopifyScope = tokenData.scope;

    // Redirect to frontend dashboard
    const clientUrl = config.nodeEnv === 'production' ? '/' : 'http://localhost:5173';
    res.redirect(`${clientUrl}?connected=true`);
  } catch (error) {
    console.error('Shopify OAuth error:', error);
    res.status(500).send(`OAuth error: ${error.message}`);
  }
});

/**
 * GET /auth/status
 * Returns current connection status
 */
router.get('/status', (req, res) => {
  const connected = !!req.session.shopifyAccessToken;
  res.json({
    connected,
    storeDomain: connected ? req.session.shopifyDomain : null,
    scope: connected ? req.session.shopifyScope : null,
  });
});

/**
 * POST /auth/disconnect
 * Clears Shopify session data
 */
router.post('/disconnect', (req, res) => {
  delete req.session.shopifyAccessToken;
  delete req.session.shopifyDomain;
  delete req.session.shopifyScope;
  delete req.session.shopifyNonce;
  res.json({ disconnected: true });
});

export default router;
