const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'dashboard',
        user: process.env.DB_USER || 'dashboard',
        password: process.env.DB_PASSWORD || 'dashboard',
      }
);

module.exports = pool;
