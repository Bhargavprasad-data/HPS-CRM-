const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const initDb = async () => {
  try {
    console.log('🔄 Reading schema.sql...');
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Initializing database schema and seeding tables...');
    await pool.query(sql);
    console.log('✅ Database schema and seed data initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
};

initDb();
