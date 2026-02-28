/**
 * Action Schema — defines what the AI is allowed to do.
 * Each action type has required and optional fields.
 * Any action not in this list will be rejected by the validator.
 */

export const ALLOWED_ACTIONS = {
  create_product: {
    description: 'Create a new product in the store',
    required: ['title'],
    optional: ['description', 'price', 'vendor', 'product_type', 'tags', 'images', 'image_prompts'],
    fieldTypes: {
      title: 'string',
      description: 'string',
      price: 'number',
      vendor: 'string',
      product_type: 'string',
      tags: 'string',
      images: 'array',
      image_prompts: 'array',
    },
  },

  update_product: {
    description: 'Update an existing product',
    required: ['product_id'],
    optional: ['title', 'description', 'price', 'vendor', 'product_type', 'tags'],
    fieldTypes: {
      product_id: 'number',
      title: 'string',
      description: 'string',
      price: 'number',
      vendor: 'string',
      product_type: 'string',
      tags: 'string',
    },
  },

  create_page: {
    description: 'Create a new page (About Us, Contact, etc.)',
    required: ['title', 'content'],
    optional: [],
    fieldTypes: {
      title: 'string',
      content: 'string',
    },
  },

  update_page: {
    description: 'Update an existing page',
    required: ['page_id'],
    optional: ['title', 'content'],
    fieldTypes: {
      page_id: 'number',
      title: 'string',
      content: 'string',
    },
  },

  create_collection: {
    description: 'Create a new product collection',
    required: ['title'],
    optional: ['description', 'sort_order'],
    fieldTypes: {
      title: 'string',
      description: 'string',
      sort_order: 'string',
    },
  },

  adjust_price: {
    description: 'Change the price of a product',
    required: ['product_id', 'new_price'],
    optional: [],
    fieldTypes: {
      product_id: 'number',
      new_price: 'number',
    },
  },

  generate_seo: {
    description: 'Generate SEO metadata for a product',
    required: ['product_id', 'meta_title', 'meta_description'],
    optional: [],
    fieldTypes: {
      product_id: 'number',
      meta_title: 'string',
      meta_description: 'string',
    },
  },

  set_active_theme: {
    description: 'Set the active/published theme for the store (switch theme)',
    required: ['theme_id'],
    optional: [],
    fieldTypes: {
      theme_id: 'number',
    },
  },
};

// Actions that are NEVER allowed — the AI is explicitly told not to use these
export const BLOCKED_ACTIONS = [
  'delete_product',
  'delete_all_products',
  'delete_page',
  'delete_all_pages',
  'delete_collection',
  'delete_store',
  'modify_admin_settings',
  'delete_customer',
  'modify_checkout',
];

// Maximum actions the AI can produce in a single response
export const MAX_ACTIONS_PER_REQUEST = 50;

/**
 * Build the action schema description for the AI system prompt
 */
export function getActionSchemaPrompt() {
  let prompt = 'You may ONLY return actions from this list:\n\n';

  for (const [type, schema] of Object.entries(ALLOWED_ACTIONS)) {
    prompt += `- **${type}**: ${schema.description}\n`;
    prompt += `  Required fields: ${schema.required.join(', ')}\n`;
    if (schema.optional.length > 0) {
      prompt += `  Optional fields: ${schema.optional.join(', ')}\n`;
    }
    prompt += '\n';
  }

  prompt += '\nYou are NEVER allowed to:\n';
  BLOCKED_ACTIONS.forEach(action => {
    prompt += `- ${action}\n`;
  });

  return prompt;
}
