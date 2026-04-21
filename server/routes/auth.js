const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

function jwtSecret() {
  const s = (process.env.JWT_SECRET || '').trim();
  return s || null;
}

router.post('/register', async (req, res) => {
  try {
    const secret = jwtSecret();
    if (!secret) {
      return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este correo electrónico' });
    }

    const hash = await bcrypt.hash(password, 10);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, avatar_color) VALUES (?, ?, ?, ?)',
      [name, email, hash, color]
    );

    const newUserId = Number(result.insertId);
    const token = jwt.sign({ id: newUserId, email }, secret, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: newUserId, name, email, avatar_color: color },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const secret = jwtSecret();
    if (!secret) {
      return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo electrónico y contraseña son obligatorios' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const userId = Number(user.id);
    const token = jwt.sign({ id: userId, email: user.email }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: userId, name: user.name, email: user.email, avatar_color: user.avatar_color },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, avatar_color, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const u = rows[0];
    res.json({ ...u, id: Number(u.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

module.exports = router;
