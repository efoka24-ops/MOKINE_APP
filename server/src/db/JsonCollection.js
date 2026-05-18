/**
 * JsonCollection.js — collection backed by a JSON file.
 * Used in development / test (NODE_ENV !== 'production').
 *
 * The file is loaded once at startup and cached in memory.
 * Every mutation flushes the cache back to disk synchronously.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export class JsonCollection {
  constructor(name, seed = []) {
    this._name = name;
    this._file = path.join(DATA_DIR, `${name}.json`);
    if (fs.existsSync(this._file)) {
      try {
        this._data = JSON.parse(fs.readFileSync(this._file, 'utf8'));
      } catch {
        console.warn(`[DB] Corrupt ${name}.json — using seed`);
        this._data = seed;
        this._flush();
      }
    } else {
      this._data = seed;
      this._flush();
    }
    console.log(`[DB] JsonCollection "${name}" loaded (${this._data.length} docs)`);
  }

  _flush() {
    fs.writeFileSync(this._file, JSON.stringify(this._data, null, 2), 'utf8');
  }

  /** Return all documents */
  async all() {
    return [...this._data];
  }

  /** Filter by predicate function */
  async filter(fn) {
    return this._data.filter(fn);
  }

  /** Find first matching document */
  async findOne(fn) {
    return this._data.find(fn) ?? null;
  }

  /** Find by id field */
  async findById(id) {
    return this._data.find(d => d.id === id) ?? null;
  }

  /** Insert a document. Must have an `id` field or one will be generated. */
  async insert(doc) {
    const record = { ...doc, id: doc.id ?? Date.now().toString() };
    this._data.push(record);
    this._flush();
    return record;
  }

  /**
   * Update document by id.
   * patch can be an object (merged) or a function (doc => newDoc).
   */
  async update(id, patch) {
    const idx = this._data.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this._data[idx] = typeof patch === 'function'
      ? patch(this._data[idx])
      : { ...this._data[idx], ...patch, updatedAt: new Date() };
    this._flush();
    return this._data[idx];
  }

  /**
   * Update all documents matching predicate.
   * Returns number of updated documents.
   */
  async updateWhere(fn, patch) {
    let count = 0;
    this._data = this._data.map(d => {
      if (!fn(d)) return d;
      count++;
      return typeof patch === 'function'
        ? patch(d)
        : { ...d, ...patch, updatedAt: new Date() };
    });
    if (count) this._flush();
    return count;
  }

  /** Remove document by id. Returns true if found and removed. */
  async remove(id) {
    const idx = this._data.findIndex(d => d.id === id);
    if (idx === -1) return false;
    this._data.splice(idx, 1);
    this._flush();
    return true;
  }

  /** Remove all documents matching predicate. Returns count removed. */
  async removeWhere(fn) {
    const before = this._data.length;
    this._data = this._data.filter(d => !fn(d));
    const removed = before - this._data.length;
    if (removed) this._flush();
    return removed;
  }

  /** Count all or matching documents */
  async count(fn = null) {
    return fn ? this._data.filter(fn).length : this._data.length;
  }
}
