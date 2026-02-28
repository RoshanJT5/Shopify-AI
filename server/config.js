import dotenv from 'dotenv';
dotenv.config(); // no-op on Vercel (no .env file), works locally

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Shopify OAuth
  shopify: {
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
    scopes: process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_content,write_content',
    redirectUri: process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3000/auth/shopify/callback',
  },

  // OpenRouter AI
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    baseUrl: 'https://openrouter.ai/api/v1',
  },

  // Session
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
};

// Validate critical config — warn but don't crash (for serverless compatibility)
const _required = ['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'OPENROUTER_API_KEY', 'SESSION_SECRET'];
const _missing = _required.filter(key => !process.env[key]);
if (_missing.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${_missing.join(', ')}. Some features will not work.`);
}

export default config;
