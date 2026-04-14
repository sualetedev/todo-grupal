import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './api';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function AppLayout() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch {
      console.error('Error fetching groups');
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/groups', { name: newGroupName, description: newGroupDesc });
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateGroup(false);
      fetchGroups();
    } catch {
      // handled by toast
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar groups={groups} onCreateGroup={() => setShowCreateGroup(true)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard groups={groups} onCreateGroup={() => setShowCreateGroup(true)} />} />
          <Route path="/groups/:groupId" element={<GroupDetail onGroupsChanged={fetchGroups} />} />
        </Routes>
      </main>

      {showCreateGroup && (
        <Modal onClose={() => setShowCreateGroup(false)}>
          <h3>Crear nuevo grupo</h3>
          <form onSubmit={handleCreateGroup}>
            <div className="input-group">
              <label>Nombre del grupo</label>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ej: Equipo de desarrollo, Amigos..."
                required
                autoFocus
              />
            </div>
            <div className="input-group">
              <label>Descripción (opcional)</label>
              <textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="¿De qué se trata este grupo?"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateGroup(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creando...' : 'Crear grupo'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1d27',
              color: '#e4e5ea',
              border: '1px solid #2e3140',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
