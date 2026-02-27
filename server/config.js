import 'dotenv/config';

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

// Validate critical config in production
if (config.nodeEnv === 'production') {
  const required = ['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'OPENROUTER_API_KEY', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export default config;
