import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ groups, onCreateGroup }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#6366f1" />
          <path d="M8 14.5L12 18.5L20 10.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1>TodoGrupal</h1>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <div className="sidebar-section-title">Mis Grupos</div>

        {groups.map((g) => (
          <NavLink
            key={g.id}
            to={`/groups/${g.id}`}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-group-dot" style={{ background: g.color }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
            {g.pending_tasks > 0 && <span className="sidebar-badge">{g.pending_tasks}</span>}
          </NavLink>
        ))}

        <button className="sidebar-link" onClick={onCreateGroup} style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>
          <Plus size={18} />
          Nuevo grupo
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Cerrar sesión">
          <div className="avatar" style={{ background: user?.avatar_color || '#6366f1' }}>
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
          <LogOut size={16} style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>
    </aside>
  );
}
