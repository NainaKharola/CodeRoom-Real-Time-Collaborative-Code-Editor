const { Pool } = require('pg');
require('dotenv').config();

// Create pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Event listener for idle clients errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
