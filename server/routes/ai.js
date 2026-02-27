import { Router } from 'express';
import ShopifyService from '../services/shopify.js';
import OpenRouterService from '../services/openrouter.js';
import { validateActions } from '../services/validator.js';
import actionHistory from '../models/actionHistory.js';

const router = Router();
const aiService = new OpenRouterService();

/**
 * Middleware: require Shopify connection
 */
function requireShopify(req, res, next) {
  if (!req.session.shopifyAccessToken || !req.session.shopifyDomain) {
    return res.status(401).json({ error: 'Shopify store not connected. Please connect first.' });
  }
  req.shopify = new ShopifyService(req.session.shopifyDomain, req.session.shopifyAccessToken);
  next();
}

/**
 * POST /api/execute
 * Takes a prompt, fetches store context, sends to AI, validates, returns preview.
 * Does NOT execute actions — just returns them for user confirmation.
 */
router.post('/execute', requireShopify, async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 1. Fetch current store data for context
    const [products, pages, collections] = await Promise.all([
      req.shopify.getProducts().catch(() => []),
      req.shopify.getPages().catch(() => []),
      req.shopify.getCollections().catch(() => []),
    ]);

    const storeData = { products, pages, collections };

    // 2. Send to AI
    const aiResponse = await aiService.generateActions(prompt.trim(), storeData);

    // 3. Validate actions
    const validation = validateActions(aiResponse.actions);

    res.json({
      preview: true,
      prompt: prompt.trim(),
      actions: validation.actions,
      valid: validation.valid,
      validationErrors: validation.errors,
      summary: aiResponse.summary,
      model: aiResponse.model,
      usage: aiResponse.usage,
      storeContext: {
        productCount: products.length,
        pageCount: pages.length,
        collectionCount: collections.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/execute/confirm
 * Actually executes the validated actions on Shopify.
 * Saves before/after snapshots for undo.
 */
router.post('/execute/confirm', requireShopify, async (req, res, next) => {
  try {
    const { prompt, actions } = req.body;

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: 'No actions to execute' });
    }

    // Re-validate (in case of tampering)
    const validation = validateActions(actions);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    // 1. Snapshot "before" state
    const [productsBefore, pagesBefore] = await Promise.all([
      req.shopify.getProducts().catch(() => []),
      req.shopify.getPages().catch(() => []),
    ]);
    const beforeSnapshot = { products: productsBefore, pages: pagesBefore };

    // 2. Execute each action
    const results = [];
    for (const action of validation.actions) {
      try {
        const result = await executeAction(req.shopify, action);
        results.push({ action, success: true, result });
      } catch (error) {
        results.push({ action, success: false, error: error.message });
      }
    }

    // 3. Snapshot "after" state
    const [productsAfter, pagesAfter] = await Promise.all([
      req.shopify.getProducts().catch(() => []),
      req.shopify.getPages().catch(() => []),
    ]);
    const afterSnapshot = { products: productsAfter, pages: pagesAfter };

    // 4. Save to history
    const historyEntry = actionHistory.push({
      prompt: prompt || 'Manual execution',
      actions: validation.actions,
      beforeSnapshot,
      afterSnapshot,
      summary: `Executed ${results.filter(r => r.success).length}/${results.length} actions`,
      storeDomain: req.session.shopifyDomain,
    });

    res.json({
      executed: true,
      historyId: historyEntry.id,
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Execute a single validated action on Shopify
 */
async function executeAction(shopify, action) {
  switch (action.type) {
    case 'create_product':
      return shopify.createProduct(action);

    case 'update_product':
      return shopify.updateProduct(action.product_id, action);

    case 'create_page':
      return shopify.createPage(action);

    case 'update_page':
      return shopify.updatePage(action.page_id, action);

    case 'create_collection':
      return shopify.createCollection(action);

    case 'adjust_price':
      return shopify.updateProduct(action.product_id, { price: action.new_price });

    case 'generate_seo':
      return shopify.updateProductSEO(action.product_id, action);

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

export default router;
