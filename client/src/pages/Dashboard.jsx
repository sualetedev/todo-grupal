import { useNavigate } from 'react-router-dom';
import { Users, CheckSquare, Plus } from 'lucide-react';

export default function Dashboard({ groups, onCreateGroup }) {
  const navigate = useNavigate();

  const totalPending = groups.reduce((sum, g) => sum + (g.pending_tasks || 0), 0);
  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-header-sub">Resumen de tus grupos y tareas</p>
        </div>
        <button className="btn btn-primary" onClick={onCreateGroup}>
          <Plus size={18} /> Nuevo grupo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)' }}>{groups.length}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Grupos</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)' }}>{totalPending}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Tareas pendientes</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)' }}>{totalMembers}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Miembros totales</div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <h3>Sin grupos todavía</h3>
          <p>Crea tu primer grupo para empezar a organizar tareas con tu equipo</p>
          <button className="btn btn-primary" onClick={onCreateGroup}>
            <Plus size={18} /> Crear mi primer grupo
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group-card"
              style={{ '--card-color': group.color }}
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: group.color }} />
              <div className="group-card-title">{group.name}</div>
              <div className="group-card-desc">{group.description || 'Sin descripción'}</div>
              <div className="group-card-meta">
                <span><Users size={14} /> {group.member_count} miembros</span>
                <span><CheckSquare size={14} /> {group.pending_tasks} pendientes</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
