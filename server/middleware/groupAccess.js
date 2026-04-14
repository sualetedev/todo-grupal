const db = require('../config/db');

function groupAccess(requiredRole) {
  return async (req, res, next) => {
    const groupId = req.params.groupId || req.body.group_id;
    if (!groupId) {
      return res.status(400).json({ error: 'group_id requerido' });
    }

    const [rows] = await db.query(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'No eres miembro de este grupo' });
    }

    req.memberRole = rows[0].role;

    if (requiredRole === 'admin' && rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Necesitas ser admin del grupo' });
    }

    next();
  };
}

module.exports = groupAccess;
