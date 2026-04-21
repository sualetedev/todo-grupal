require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tasks', taskRoutes);

// En Vercel la petición interna a veces llega sin el prefijo /api
if (process.env.VERCEL === '1') {
  app.use('/auth', authRoutes);
  app.use('/groups', groupRoutes);
  app.use('/tasks', taskRoutes);
}

function healthHandler(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

async function healthDbHandler(req, res) {
  try {
    await db.query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'conectada' });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: 'error', database: 'no disponible' });
  }
}

// Rutas con prefijo /api (local y muchos despliegues)
app.get('/api/health', healthHandler);
app.get('/api/health/db', healthDbHandler);
// Vercel a veces entrega la URL sin el prefijo /api dentro de la función
app.get('/health', healthHandler);
app.get('/health/db', healthDbHandler);
// Alias corto por si el rewrite acorta el path
app.get('/api/db-health', healthDbHandler);
app.get('/db-health', healthDbHandler);

app.use((err, req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Petición no válida (JSON incorrecto)' });
  }
  console.error(err.stack || err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
