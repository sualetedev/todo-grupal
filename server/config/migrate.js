require('dotenv').config();
const mysql = require('mysql2/promise');

function cleanUrl(url) {
  return url.replace(/[?&]ssl-mode=[^&]*/gi, '');
}

async function migrate() {
  let connection;

  if (process.env.DATABASE_URL) {
    const url = cleanUrl(String(process.env.DATABASE_URL).trim());
    connection = await mysql.createConnection({
      uri: url,
      ssl: { rejectUnauthorized: false },
      multipleStatements: true,
    });
  } else {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
      multipleStatements: true,
    });

    const dbName = process.env.DB_NAME || 'todo_grupal';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
  }

  console.log('Conectado a MySQL');

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      avatar_color VARCHAR(7) DEFAULT '#6366f1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS groups_ (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      color VARCHAR(7) DEFAULT '#6366f1',
      owner_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS group_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      user_id INT NOT NULL,
      role ENUM('admin', 'member') DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups_(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_membership (group_id, user_id)
    )`,

    `CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('pending', 'in_progress', 'done') DEFAULT 'pending',
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      group_id INT NOT NULL,
      created_by INT NOT NULL,
      assigned_to INT,
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups_(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    )`,
  ];

  for (const sql of tables) {
    await connection.query(sql);
  }

  console.log('Tablas creadas correctamente');
  await connection.end();
  console.log('Migracion completada');
}

migrate().catch((err) => {
  console.error('Error en la migracion:', err);
  process.exit(1);
});
