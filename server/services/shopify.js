import config from '../config.js';

const SHOPIFY_API_VERSION = '2024-10';

/**
 * Shopify Admin REST API client.
 * Uses the access token from the user's session.
 */
class ShopifyService {
  constructor(storeDomain, accessToken) {
    this.storeDomain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.accessToken = accessToken;
    this.baseUrl = `https://${this.storeDomain}/admin/api/${SHOPIFY_API_VERSION}`;
  }

  async _request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
    };

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseFloat(response.headers.get('Retry-After') || '2');
      console.warn(`Shopify rate limited. Retrying after ${retryAfter}s...`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this._request(endpoint, method, body);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shopify API error ${response.status}: ${errorBody}`);
    }

    // Some DELETE requests return 200 with no body
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  // ─── Products ──────────────────────────────────────────

  async getProducts(limit = 50) {
    const data = await this._request(`/products.json?limit=${limit}`);
    return data.products || [];
  }

  async getProduct(id) {
    const data = await this._request(`/products/${id}.json`);
    return data.product;
  }

  async createProduct({ title, description, price, vendor, product_type, tags, images }) {
    const product = { title };
    if (description) product.body_html = description;
    if (vendor) product.vendor = vendor;
    if (product_type) product.product_type = product_type;
    if (tags) product.tags = tags;
    if (price !== undefined) {
      product.variants = [{ price: String(price), inventory_management: 'shopify' }];
    } else {
      product.variants = [{ inventory_management: 'shopify' }];
    }
    if (images && images.length > 0) {
      // Support both URL-based ({src}) and base64 ({attachment}) images
      product.images = images.map(img => {
        if (typeof img === 'string') return { src: img };       // Plain URL string
        if (img.attachment) return { attachment: img.attachment }; // Base64 from HF
        if (img.src) return { src: img.src };                    // URL object
        return null;
      }).filter(Boolean);
    }

    console.log(`[Shopify] Creating product "${title}" with ${product.images?.length || 0} image(s)`);
    if (product.images) {
      product.images.forEach((img, i) => {
        if (img.attachment) console.log(`  Image ${i + 1}: base64 (${img.attachment.length} chars)`);
        if (img.src) console.log(`  Image ${i + 1}: URL ${img.src}`);
      });
    }

    const data = await this._request('/products.json', 'POST', { product });
    return data.product;
  }

  async updateProduct(id, updates) {
    const product = { id };
    if (updates.title) product.title = updates.title;
    if (updates.description) product.body_html = updates.description;
    if (updates.vendor) product.vendor = updates.vendor;
    if (updates.product_type) product.product_type = updates.product_type;
    if (updates.tags) product.tags = updates.tags;

    const data = await this._request(`/products/${id}.json`, 'PUT', { product });

    // Handle price update separately via variant
    if (updates.price !== undefined && data.product?.variants?.[0]) {
      const variantId = data.product.variants[0].id;
      await this._request(`/variants/${variantId}.json`, 'PUT', {
        variant: { id: variantId, price: String(updates.price) },
      });
    }

    return data.product;
  }

  // ─── Pages ─────────────────────────────────────────────

  async getPages(limit = 50) {
    const data = await this._request(`/pages.json?limit=${limit}`);
    return data.pages || [];
  }

  async getPage(id) {
    const data = await this._request(`/pages/${id}.json`);
    return data.page;
  }

  async createPage({ title, content }) {
    const data = await this._request('/pages.json', 'POST', {
      page: { title, body_html: content },
    });
    return data.page;
  }

  async updatePage(id, updates) {
    const page = { id };
    if (updates.title) page.title = updates.title;
    if (updates.content) page.body_html = updates.content;

    const data = await this._request(`/pages/${id}.json`, 'PUT', { page });
    return data.page;
  }

  // ─── Collections ───────────────────────────────────────

  async getCollections(limit = 50) {
    const data = await this._request(`/custom_collections.json?limit=${limit}`);
    return data.custom_collections || [];
  }

  async createCollection({ title, description, sort_order }) {
    const collection = { title };
    if (description) collection.body_html = description;
    if (sort_order) collection.sort_order = sort_order;

    const data = await this._request('/custom_collections.json', 'POST', { custom_collection: collection });
    return data.custom_collection;
  }

  // ─── SEO (Metafields) ─────────────────────────────────

  async updateProductSEO(productId, { meta_title, meta_description }) {
    const product = {
      id: productId,
      metafields_global_title_tag: meta_title,
      metafields_global_description_tag: meta_description,
    };

    const data = await this._request(`/products/${productId}.json`, 'PUT', { product });
    return data.product;
  }

  // ─── Themes ─────────────────────────────────────────────

  async getThemes() {
    const data = await this._request('/themes.json');
    return data.themes || [];
  }

  async setActiveTheme(themeId) {
    const data = await this._request(`/themes/${themeId}.json`, 'PUT', {
      theme: { id: themeId, role: 'main' },
    });
    return data.theme;
  }

  // ─── Store Info ────────────────────────────────────────

  async getShopInfo() {
    const data = await this._request('/shop.json');
    return data.shop;
  }
}

export default ShopifyService;
