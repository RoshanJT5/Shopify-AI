import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory action history for serverless environments.
 * For production persistence, swap this with a database (e.g. Supabase, PlanetScale).
 * 
 * Note: In serverless (Vercel), this resets between cold starts.
 * For local dev, it persists during the server session.
 */
class ActionHistory {
  constructor() {
    this.entries = [];
  }

  /**
   * Save a new action entry with before/after snapshots
   */
  push({ prompt, actions, beforeSnapshot, afterSnapshot, summary, storeDomain }) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const entry = {
      id,
      timestamp,
      prompt,
      actions,
      before_snapshot: beforeSnapshot,
      after_snapshot: afterSnapshot,
      summary: summary || '',
      status: 'executed',
      store_domain: storeDomain || '',
    };

    this.entries.unshift(entry); // newest first

    // Keep max 200 entries in memory
    if (this.entries.length > 200) {
      this.entries = this.entries.slice(0, 200);
    }

    return { id, timestamp };
  }

  /**
   * Get all entries, most recent first
   */
  getAll(limit = 50, offset = 0) {
    return this.entries.slice(offset, offset + limit);
  }

  /**
   * Get a single entry by ID
   */
  getById(id) {
    return this.entries.find(e => e.id === id) || null;
  }

  /**
   * Update the status of an entry (e.g. 'undone', 'redone')
   */
  updateStatus(id, status) {
    const entry = this.entries.find(e => e.id === id);
    if (entry) entry.status = status;
  }

  /**
   * Get total count
   */
  getCount() {
    return this.entries.length;
  }
}

export default new ActionHistory();
