import { ALLOWED_ACTIONS, BLOCKED_ACTIONS, MAX_ACTIONS_PER_REQUEST } from '../utils/actionSchema.js';

/**
 * Validates an array of AI-generated actions before they touch Shopify.
 * Returns { valid, actions, errors }
 */
export function validateActions(actions) {
  const errors = [];

  // Must be an array
  if (!Array.isArray(actions)) {
    return { valid: false, actions: [], errors: ['AI response is not an array of actions'] };
  }

  // Reject bulk operations
  if (actions.length > MAX_ACTIONS_PER_REQUEST) {
    return {
      valid: false,
      actions: [],
      errors: [`Too many actions (${actions.length}). Maximum is ${MAX_ACTIONS_PER_REQUEST}.`],
    };
  }

  if (actions.length === 0) {
    return { valid: false, actions: [], errors: ['No actions provided'] };
  }

  const validatedActions = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const prefix = `Action #${i + 1}`;

    // Check type exists
    if (!action.type) {
      errors.push(`${prefix}: Missing "type" field`);
      continue;
    }

    // Check for blocked actions
    if (BLOCKED_ACTIONS.includes(action.type)) {
      errors.push(`${prefix}: Action "${action.type}" is BLOCKED and not allowed`);
      continue;
    }

    // Check action is in whitelist
    const schema = ALLOWED_ACTIONS[action.type];
    if (!schema) {
      errors.push(`${prefix}: Unknown action type "${action.type}"`);
      continue;
    }

    // Check required fields
    const missingFields = schema.required.filter(field => !(field in action));
    if (missingFields.length > 0) {
      errors.push(`${prefix} (${action.type}): Missing required fields: ${missingFields.join(', ')}`);
      continue;
    }

    // Type-check fields
    let fieldError = false;
    const allFields = [...schema.required, ...schema.optional];
    for (const field of allFields) {
      if (field in action && schema.fieldTypes[field]) {
        const expectedType = schema.fieldTypes[field];
        const actualValue = action[field];

        if (expectedType === 'number') {
          const num = Number(actualValue);
          if (isNaN(num)) {
            errors.push(`${prefix} (${action.type}): Field "${field}" must be a number, got "${actualValue}"`);
            fieldError = true;
          } else {
            action[field] = num; // coerce string→number
          }
        } else if (expectedType === 'string') {
          if (typeof actualValue !== 'string') {
            errors.push(`${prefix} (${action.type}): Field "${field}" must be a string`);
            fieldError = true;
          } else if (field === 'title' && actualValue.length > 255) {
            errors.push(`${prefix} (${action.type}): Title is too long (max 255 characters)`);
            fieldError = true;
          }
        } else if (expectedType === 'array') {
          if (!Array.isArray(actualValue)) {
            errors.push(`${prefix} (${action.type}): Field "${field}" must be an array`);
            fieldError = true;
          }
        }
      }
    }

    // Strip unknown fields (only allow defined fields + type)
    if (!fieldError) {
      const cleanAction = { type: action.type };
      for (const field of allFields) {
        if (field in action) {
          cleanAction[field] = action[field];
        }
      }
      validatedActions.push(cleanAction);
    }
  }

  return {
    valid: errors.length === 0,
    actions: validatedActions,
    errors,
  };
}
