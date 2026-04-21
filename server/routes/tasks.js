const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const groupAccess = require('../middleware/groupAccess');

const router = express.Router();

router.get('/group/:groupId', auth, groupAccess(), async (req, res) => {
  try {
    const { status, assigned_to, priority } = req.query;
    let query = `
      SELECT t.*,
        creator.name AS creator_name, creator.avatar_color AS creator_color,
        assignee.name AS assignee_name, assignee.avatar_color AS assignee_color
      FROM tasks t
      JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.group_id = ?
    `;
    const params = [req.params.groupId];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    query += " ORDER BY FIELD(t.priority, 'high', 'medium', 'low'), t.created_at DESC";

    const [tasks] = await db.query(query, params);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, group_id, assigned_to, due_date } = req.body;
    if (!title || !group_id) {
      return res.status(400).json({ error: 'Título y grupo son obligatorios' });
    }

    const [membership] = await db.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [group_id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ error: 'No eres miembro de este grupo' });
    }

    const [result] = await db.query(
      'INSERT INTO tasks (title, description, priority, group_id, created_by, assigned_to, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, priority || 'medium', group_id, req.user.id, assigned_to || null, due_date || null]
    );

    const [task] = await db.query(
      `SELECT t.*,
        creator.name AS creator_name, creator.avatar_color AS creator_color,
        assignee.name AS assignee_name, assignee.avatar_color AS assignee_color
       FROM tasks t
       JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json(task[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const task = existing[0];
    const [membership] = await db.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [task.group_id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ error: 'No eres miembro de este grupo' });
    }

    const { title, description, status, priority, assigned_to, due_date } = req.body;

    await db.query(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = ?,
        due_date = ?
       WHERE id = ?`,
      [title, description, status, priority, assigned_to !== undefined ? assigned_to : task.assigned_to, due_date !== undefined ? due_date : task.due_date, req.params.id]
    );

    const [updated] = await db.query(
      `SELECT t.*,
        creator.name AS creator_name, creator.avatar_color AS creator_color,
        assignee.name AS assignee_name, assignee.avatar_color AS assignee_color
       FROM tasks t
       JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const task = existing[0];
    const [membership] = await db.query(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [task.group_id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ error: 'No eres miembro de este grupo' });
    }

    if (task.created_by !== req.user.id && membership[0].role !== 'admin') {
      return res.status(403).json({ error: 'Solo el creador o el administrador del grupo pueden eliminar esta tarea' });
    }

    await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Tarea eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

module.exports = router;
