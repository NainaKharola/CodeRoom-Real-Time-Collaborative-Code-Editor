const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  console.log('Initializing PostgreSQL database schema (safe mode)...');
  
  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Run the schema setup
    await pool.query(sql);
    
    console.log('Database tables, relationships, and indexes created or verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database schema:', error.stack || error.message);
    process.exit(1);
  }
}

initializeDatabase();
