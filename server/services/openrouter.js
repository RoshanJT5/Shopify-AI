import config from '../config.js';
import { getActionSchemaPrompt } from '../utils/actionSchema.js';

/**
 * OpenRouter AI Service
 * Sends structured prompts and expects JSON action arrays back.
 */
class OpenRouterService {
  constructor() {
    this.apiKey = config.openrouter.apiKey;
    this.model = config.openrouter.model;
    this.baseUrl = config.openrouter.baseUrl;
  }

  /**
   * Build the system prompt for the AI
   */
  _buildSystemPrompt() {
    return `You are a Shopify store AI assistant. You help store owners manage their store by generating structured actions.

CRITICAL RULES:
1. You MUST respond with ONLY valid JSON — no markdown, no explanations, no commentary.
2. Your response MUST be a JSON object with an "actions" array.
3. Each action MUST have a "type" field and the required fields for that type.
4. If you need to reference existing products/pages, use the IDs provided in the store context.
5. Be creative and helpful, but NEVER destructive.

IMAGE RULES (VERY IMPORTANT):
- When creating products, ALWAYS include the "images" field with real, working image URLs.
- Use picsum.photos for product images. Format: "https://picsum.photos/seed/{unique-keyword}/800/800"
  - Replace {unique-keyword} with a relevant word (e.g., "blue-tshirt", "leather-bag", "sneakers-white").
  - Each product MUST have a DIFFERENT seed keyword so they get unique images.
  - Example: "images": ["https://picsum.photos/seed/classic-tshirt/800/800", "https://picsum.photos/seed/classic-tshirt-side/800/800"]
- NEVER use made-up URLs, fake Unsplash links, or placeholder domains. Only use picsum.photos.
- Include 1-3 images per product.

${getActionSchemaPrompt()}

RESPONSE FORMAT (strictly follow this):
{
  "actions": [
    {
      "type": "action_type",
      "field1": "value1",
      "field2": "value2"
    }
  ],
  "summary": "Brief human-readable summary of what these actions will do"
}

If you cannot fulfill the request with the allowed actions, return:
{
  "actions": [],
  "summary": "Explanation of why you cannot do this"
}`;
  }

  /**
   * Build context about the current store state
   */
  _buildStoreContext(storeData) {
    let context = '=== CURRENT STORE DATA ===\n\n';

    if (storeData.products && storeData.products.length > 0) {
      context += 'PRODUCTS:\n';
      storeData.products.forEach(p => {
        const price = p.variants?.[0]?.price || 'N/A';
        context += `- ID: ${p.id} | Title: "${p.title}" | Price: $${price} | Status: ${p.status}\n`;
        if (p.body_html) {
          // Strip HTML for context, keep it short
          const text = p.body_html.replace(/<[^>]*>/g, '').substring(0, 200);
          context += `  Description: ${text}\n`;
        }
      });
      context += '\n';
    } else {
      context += 'PRODUCTS: No products in store yet.\n\n';
    }

    if (storeData.pages && storeData.pages.length > 0) {
      context += 'PAGES:\n';
      storeData.pages.forEach(p => {
        context += `- ID: ${p.id} | Title: "${p.title}"\n`;
      });
      context += '\n';
    }

    if (storeData.collections && storeData.collections.length > 0) {
      context += 'COLLECTIONS:\n';
      storeData.collections.forEach(c => {
        context += `- ID: ${c.id} | Title: "${c.title}"\n`;
      });
      context += '\n';
    }

    return context;
  }

  /**
   * Send a prompt to OpenRouter and get back structured actions
   */
  async generateActions(userPrompt, storeData = {}) {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const storeContext = this._buildStoreContext(storeData);

    const messages = [
      { role: 'system', content: this._buildSystemPrompt() },
      {
        role: 'user',
        content: `${storeContext}\n=== USER REQUEST ===\n${userPrompt}`,
      },
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Shopify AI Agent',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('AI returned an empty response');
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error(`AI did not return valid JSON: ${content.substring(0, 500)}`);
    }

    return {
      actions: parsed.actions || [],
      summary: parsed.summary || 'No summary provided',
      model: data.model || this.model,
      usage: data.usage || {},
    };
  }
}

export default OpenRouterService;
