import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'action_history.db');

/**
 * SQLite-backed action history for undo/redo support.
 * Stores before/after snapshots of every executed action batch.
 */
class ActionHistory {
  constructor() {
    this.db = new Database(DB_PATH);
    this._init();
  }

  _init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS action_history (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        prompt TEXT NOT NULL,
        actions TEXT NOT NULL,
        before_snapshot TEXT,
        after_snapshot TEXT,
        summary TEXT,
        status TEXT DEFAULT 'executed',
        store_domain TEXT
      )
    `);
  }

  /**
   * Save a new action entry with before/after snapshots
   */
  push({ prompt, actions, beforeSnapshot, afterSnapshot, summary, storeDomain }) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO action_history (id, timestamp, prompt, actions, before_snapshot, after_snapshot, summary, status, store_domain)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'executed', ?)
    `).run(
      id,
      timestamp,
      prompt,
      JSON.stringify(actions),
      JSON.stringify(beforeSnapshot),
      JSON.stringify(afterSnapshot),
      summary || '',
      storeDomain || ''
    );

    return { id, timestamp };
  }

  /**
   * Get all entries, most recent first
   */
  getAll(limit = 50, offset = 0) {
    const rows = this.db.prepare(
      'SELECT * FROM action_history ORDER BY timestamp DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);

    return rows.map(this._parseRow);
  }

  /**
   * Get a single entry by ID
   */
  getById(id) {
    const row = this.db.prepare('SELECT * FROM action_history WHERE id = ?').get(id);
    return row ? this._parseRow(row) : null;
  }

  /**
   * Update the status of an entry (e.g. 'undone', 'redone')
   */
  updateStatus(id, status) {
    this.db.prepare('UPDATE action_history SET status = ? WHERE id = ?').run(status, id);
  }

  /**
   * Get total count
   */
  getCount() {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM action_history').get();
    return row.count;
  }

  _parseRow(row) {
    return {
      ...row,
      actions: JSON.parse(row.actions),
      before_snapshot: row.before_snapshot ? JSON.parse(row.before_snapshot) : null,
      after_snapshot: row.after_snapshot ? JSON.parse(row.after_snapshot) : null,
    };
  }
}

export default new ActionHistory();
