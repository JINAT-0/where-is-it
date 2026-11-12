const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');

async function initDatabase() {
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    console.log('[DB Setup] Applying database/schema.sql...');
    await connection.query(schemaSql);
    console.log('[DB Setup] Applying database/seed.sql...');
    await connection.query(seedSql);
    console.log('[DB Setup] Database where_is_it_db initialized and seeded successfully.');
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[DB Setup Failed]', err.message);
      process.exit(1);
    });
}

module.exports = { initDatabase };

