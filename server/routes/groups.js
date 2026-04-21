const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const groupAccess = require('../middleware/groupAccess');

const router = express.Router();

const GROUP_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4'];

router.get('/', auth, async (req, res) => {
  try {
    const [groups] = await db.query(
      `SELECT g.*, gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count,
        (SELECT COUNT(*) FROM tasks WHERE group_id = g.id AND status != 'done') AS pending_tasks
       FROM groups_ g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ?
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
    }

    const color = GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];

    const [result] = await db.query(
      'INSERT INTO groups_ (name, description, color, owner_id) VALUES (?, ?, ?, ?)',
      [name, description || null, color, req.user.id]
    );

    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'admin']
    );

    const [group] = await db.query('SELECT * FROM groups_ WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...group[0], role: 'admin', member_count: 1, pending_tasks: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

router.get('/:groupId', auth, groupAccess(), async (req, res) => {
  try {
    const [group] = await db.query('SELECT * FROM groups_ WHERE id = ?', [req.params.groupId]);
    if (group.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const [members] = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar_color, gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.role DESC, gm.joined_at ASC`,
      [req.params.groupId]
    );

    res.json({ ...group[0], members, currentUserRole: req.memberRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
});

router.put('/:groupId', auth, groupAccess('admin'), async (req, res) => {
  try {
    const { name, description, color } = req.body;
    await db.query(
      'UPDATE groups_ SET name = COALESCE(?, name), description = COALESCE(?, description), color = COALESCE(?, color) WHERE id = ?',
      [name, description, color, req.params.groupId]
    );
    const [group] = await db.query('SELECT * FROM groups_ WHERE id = ?', [req.params.groupId]);
    res.json(group[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar grupo' });
  }
});

router.delete('/:groupId', auth, groupAccess('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM groups_ WHERE id = ?', [req.params.groupId]);
    res.json({ message: 'Grupo eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar grupo' });
  }
});

router.post('/:groupId/members', auth, groupAccess('admin'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Correo electrónico del miembro obligatorio' });
    }

    const [users] = await db.query('SELECT id, name, email, avatar_color FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'No se encontró un usuario con ese correo electrónico' });
    }

    const userId = users[0].id;

    const [existing] = await db.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.groupId, userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este usuario ya es miembro del grupo' });
    }

    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.groupId, userId, 'member']
    );

    res.status(201).json({ ...users[0], role: 'member' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al añadir miembro' });
  }
});

router.delete('/:groupId/members/:userId', auth, groupAccess('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo del grupo' });
    }
    await db.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [req.params.groupId, userId]
    );
    res.json({ message: 'Miembro eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar miembro' });
  }
});

module.exports = router;
