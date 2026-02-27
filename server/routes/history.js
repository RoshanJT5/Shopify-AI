import { Router } from 'express';
import ShopifyService from '../services/shopify.js';
import actionHistory from '../models/actionHistory.js';

const router = Router();

/**
 * GET /api/history
 * Returns paginated action history
 */
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  const entries = actionHistory.getAll(limit, offset);
  const total = actionHistory.getCount();

  res.json({ entries, total, limit, offset });
});

/**
 * GET /api/history/:id
 * Returns a single history entry with full snapshots
 */
router.get('/:id', (req, res) => {
  const entry = actionHistory.getById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'History entry not found' });
  }
  res.json(entry);
});

/**
 * POST /api/history/:id/undo
 * Reverts the store to the "before" snapshot
 */
router.post('/:id/undo', async (req, res, next) => {
  try {
    if (!req.session.shopifyAccessToken || !req.session.shopifyDomain) {
      return res.status(401).json({ error: 'Shopify store not connected' });
    }

    const entry = actionHistory.getById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    if (entry.status === 'undone') {
      return res.status(400).json({ error: 'This action has already been undone' });
    }

    if (!entry.before_snapshot) {
      return res.status(400).json({ error: 'No snapshot available for undo' });
    }

    const shopify = new ShopifyService(req.session.shopifyDomain, req.session.shopifyAccessToken);

    // Restore products to their "before" state
    const results = [];
    if (entry.before_snapshot.products) {
      for (const action of entry.actions) {
        try {
          if (action.type === 'update_product' || action.type === 'adjust_price' || action.type === 'generate_seo') {
            // Find the original product in the before snapshot
            const original = entry.before_snapshot.products.find(p => p.id === action.product_id);
            if (original) {
              await shopify.updateProduct(original.id, {
                title: original.title,
                description: original.body_html,
                price: original.variants?.[0]?.price,
              });
              results.push({ action: action.type, product_id: action.product_id, undone: true });
            }
          }
          // For create actions, we can't easily undo (would need delete permission)
          // Log it as a limitation
          if (action.type === 'create_product') {
            results.push({ action: action.type, undone: false, reason: 'Cannot auto-delete created products (safety)' });
          }
        } catch (error) {
          results.push({ action: action.type, undone: false, error: error.message });
        }
      }
    }

    // Mark as undone
    actionHistory.updateStatus(req.params.id, 'undone');

    res.json({ undone: true, results });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/history/:id/redo
 * Re-applies the "after" snapshot
 */
router.post('/:id/redo', async (req, res, next) => {
  try {
    if (!req.session.shopifyAccessToken || !req.session.shopifyDomain) {
      return res.status(401).json({ error: 'Shopify store not connected' });
    }

    const entry = actionHistory.getById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    if (entry.status !== 'undone') {
      return res.status(400).json({ error: 'This action has not been undone' });
    }

    if (!entry.after_snapshot) {
      return res.status(400).json({ error: 'No snapshot available for redo' });
    }

    const shopify = new ShopifyService(req.session.shopifyDomain, req.session.shopifyAccessToken);

    // Re-apply actions
    const results = [];
    for (const action of entry.actions) {
      try {
        if (action.type === 'update_product' || action.type === 'adjust_price') {
          const updated = entry.after_snapshot.products?.find(p => p.id === action.product_id);
          if (updated) {
            await shopify.updateProduct(updated.id, {
              title: updated.title,
              description: updated.body_html,
              price: updated.variants?.[0]?.price,
            });
            results.push({ action: action.type, product_id: action.product_id, redone: true });
          }
        }
      } catch (error) {
        results.push({ action: action.type, redone: false, error: error.message });
      }
    }

    actionHistory.updateStatus(req.params.id, 'executed');

    res.json({ redone: true, results });
  } catch (error) {
    next(error);
  }
});

export default router;
