/**
 * Database Configuration
 * PostgreSQL Connection Pool
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mokineveto',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Query helper with error handling
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] Query executed in ${duration}ms`, {
      text: text.substring(0, 50),
      rows: result.rows.length,
    });
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
};

/**
 * Connection check
 */
const connect = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✓ PostgreSQL Connected:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('✗ PostgreSQL Connection Failed:', error.message);
    return false;
  }
};

module.exports = {
  query,
  pool,
  connect,
};
