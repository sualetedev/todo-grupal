const mysql = require('mysql2/promise');

function cleanUrl(url) {
  return url.replace(/[?&]ssl-mode=[^&]*/gi, '');
}

function getConnectionConfig() {
  if (process.env.DATABASE_URL) {
    const url = cleanUrl(process.env.DATABASE_URL);
    return {
      uri: url,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todo_grupal',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const pool = mysql.createPool(getConnectionConfig());

module.exports = pool;
