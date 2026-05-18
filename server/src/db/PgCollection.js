/**
 * PgCollection.js — collection backed by PostgreSQL JSONB.
 * Used in production (NODE_ENV === 'production').
 *
 * Schema (one table per collection):
 *   CREATE TABLE {name} (
 *     id TEXT PRIMARY KEY,
 *     data JSONB NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *
 * All documents are stored as JSONB in the `data` column.
 * Filtering is done in JS after fetching (fine for MVP; add SQL WHERE clauses later).
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

let _pool = null;

function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false'
        ? false
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
    _pool.on('error', (err) => console.error('[PG] Idle client error:', err.message));
  }
  return _pool;
}

export class PgCollection {
  constructor(name) {
    this._name = name;
    this._pool = getPool();
    // Ensure table exists on startup (non-blocking)
    this._init().catch(e => console.error(`[PG] Init error for ${name}:`, e.message));
  }

  async _init() {
    await this._pool.query(`
      CREATE TABLE IF NOT EXISTS "${this._name}" (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Add common JSONB indexes if not present
    await this._pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_${this._name}_owner"
        ON "${this._name}" ((data->>'ownerId'))
        WHERE data->>'ownerId' IS NOT NULL
    `).catch(() => {}); // ignore if column not applicable
    console.log(`[PG] Collection "${this._name}" ready`);
  }

  async _rows() {
    const { rows } = await this._pool.query(`SELECT data FROM "${this._name}"`);
    return rows.map(r => r.data);
  }

  async all() {
    return this._rows();
  }

  async filter(fn) {
    const all = await this._rows();
    return all.filter(fn);
  }

  async findOne(fn) {
    const all = await this._rows();
    return all.find(fn) ?? null;
  }

  async findById(id) {
    const { rows } = await this._pool.query(
      `SELECT data FROM "${this._name}" WHERE id = $1`,
      [id]
    );
    return rows[0]?.data ?? null;
  }

  async insert(doc) {
    const record = { ...doc, id: doc.id ?? Date.now().toString() };
    await this._pool.query(
      `INSERT INTO "${this._name}" (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [record.id, JSON.stringify(record)]
    );
    return record;
  }

  async update(id, patch) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = typeof patch === 'function'
      ? patch(existing)
      : { ...existing, ...patch, updatedAt: new Date() };
    await this._pool.query(
      `UPDATE "${this._name}" SET data = $1 WHERE id = $2`,
      [JSON.stringify(updated), id]
    );
    return updated;
  }

  async updateWhere(fn, patch) {
    const all = await this._rows();
    const targets = all.filter(fn);
    for (const doc of targets) {
      const updated = typeof patch === 'function'
        ? patch(doc)
        : { ...doc, ...patch, updatedAt: new Date() };
      await this._pool.query(
        `UPDATE "${this._name}" SET data = $1 WHERE id = $2`,
        [JSON.stringify(updated), doc.id]
      );
    }
    return targets.length;
  }

  async remove(id) {
    const { rowCount } = await this._pool.query(
      `DELETE FROM "${this._name}" WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  async removeWhere(fn) {
    const targets = await this.filter(fn);
    for (const doc of targets) {
      await this._pool.query(`DELETE FROM "${this._name}" WHERE id = $1`, [doc.id]);
    }
    return targets.length;
  }

  async count(fn = null) {
    if (fn) {
      const all = await this._rows();
      return all.filter(fn).length;
    }
    const { rows } = await this._pool.query(`SELECT COUNT(*) FROM "${this._name}"`);
    return parseInt(rows[0].count, 10);
  }
}
