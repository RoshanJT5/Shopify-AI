import { Router } from 'express';
import ShopifyService from '../services/shopify.js';

const router = Router();

/**
 * Middleware: require Shopify connection
 */
function requireShopify(req, res, next) {
  if (!req.session.shopifyAccessToken || !req.session.shopifyDomain) {
    return res.status(401).json({ error: 'Shopify store not connected' });
  }
  req.shopify = new ShopifyService(req.session.shopifyDomain, req.session.shopifyAccessToken);
  next();
}

/**
 * GET /api/shopify/products
 */
router.get('/products', requireShopify, async (req, res, next) => {
  try {
    const products = await req.shopify.getProducts();
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shopify/pages
 */
router.get('/pages', requireShopify, async (req, res, next) => {
  try {
    const pages = await req.shopify.getPages();
    res.json({ pages });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shopify/collections
 */
router.get('/collections', requireShopify, async (req, res, next) => {
  try {
    const collections = await req.shopify.getCollections();
    res.json({ collections });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shopify/store
 */
router.get('/store', requireShopify, async (req, res, next) => {
  try {
    const shop = await req.shopify.getShopInfo();
    res.json({ shop });
  } catch (error) {
    next(error);
  }
});

export default router;
