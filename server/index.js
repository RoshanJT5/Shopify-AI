import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import shopifyRoutes from './routes/shopify.js';
import historyRoutes from './routes/history.js';
import errorHandler from './middleware/errorHandler.js';
import { aiLimiter, generalLimiter } from './middleware/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ─── Middleware ───────────────────────────────────────────

// CORS — allow frontend dev server
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? false // Same origin in production
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Sessions (for Shopify OAuth tokens)
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

// General rate limiter
app.use(generalLimiter);

// ─── Routes ──────────────────────────────────────────────

// Auth routes (no /api prefix — OAuth callback needs clean URL)
app.use('/auth', authRoutes);

// API routes
app.use('/api/execute', aiLimiter, aiRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    shopifyConnected: !!req.session.shopifyAccessToken,
  });
});

// ─── Serve Frontend (Production) ─────────────────────────

if (config.nodeEnv === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Error Handler ───────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║         Shopify AI Agent Backend              ║
║───────────────────────────────────────────────║
║  Server:  http://localhost:${config.port}             ║
║  Mode:    ${config.nodeEnv.padEnd(36)}║
║  AI:      ${(config.openrouter.model || 'not configured').padEnd(36)}║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;
