import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, Trash2, UserPlus, ArrowLeft } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import toast from 'react-hot-toast';

export default function GroupDetail({ onGroupsChanged }) {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
  const [memberEmail, setMemberEmail] = useState('');

  const fetchGroup = useCallback(async () => {
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data);
    } catch {
      toast.error('Error al cargar grupo');
      navigate('/');
    }
  }, [groupId, navigate]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get(`/tasks/group/${groupId}`);
      setTasks(data);
    } catch {
      toast.error('Error al cargar tareas');
    }
  }, [groupId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchGroup(), fetchTasks()]).finally(() => setLoading(false));
  }, [fetchGroup, fetchTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        group_id: parseInt(groupId),
        assigned_to: taskForm.assigned_to ? parseInt(taskForm.assigned_to) : null,
        due_date: taskForm.due_date || null,
      };
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
        toast.success('Tarea actualizada');
      } else {
        await api.post('/tasks', payload);
        toast.success('Tarea creada');
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
      fetchTasks();
      onGroupsChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
      onGroupsChanged();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Tarea eliminada');
      fetchTasks();
      onGroupsChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    });
    setShowTaskModal(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${groupId}/members`, { email: memberEmail });
      toast.success('Miembro añadido');
      setMemberEmail('');
      fetchGroup();
      onGroupsChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al añadir miembro');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('¿Eliminar este miembro del grupo?')) return;
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
      toast.success('Miembro eliminado');
      fetchGroup();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('¿Eliminar este grupo y todas sus tareas? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/groups/${groupId}`);
      toast.success('Grupo eliminado');
      onGroupsChanged();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!group) return null;

  const isAdmin = group.currentUserRole === 'admin';
  const pending = tasks.filter((t) => t.status === 'pending');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: group.color, display: 'inline-block' }} />
              <h2>{group.name}</h2>
            </div>
            <p className="page-header-sub">{group.description || `${group.members?.length} miembros`}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
            <Users size={16} /> Miembros ({group.members?.length})
          </button>
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSettingsModal(true)}>
              <Settings size={16} />
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' }); setShowTaskModal(true); }}>
            <Plus size={16} /> Nueva tarea
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <h3>Sin tareas todavía</h3>
          <p>Crea la primera tarea para este grupo</p>
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            <Plus size={18} /> Crear tarea
          </button>
        </div>
      ) : (
        <div className="task-columns">
          <div className="task-column">
            <div className="task-column-header pending">
              Pendiente <span className="count">{pending.length}</span>
            </div>
            {pending.map((t) => (
              <TaskCard key={t.id} task={t} onClick={openEditTask} onStatusChange={handleStatusChange} />
            ))}
          </div>
          <div className="task-column">
            <div className="task-column-header in-progress">
              En progreso <span className="count">{inProgress.length}</span>
            </div>
            {inProgress.map((t) => (
              <TaskCard key={t.id} task={t} onClick={openEditTask} onStatusChange={handleStatusChange} />
            ))}
          </div>
          <div className="task-column">
            <div className="task-column-header done">
              Hecho <span className="count">{done.length}</span>
            </div>
            {done.map((t) => (
              <TaskCard key={t.id} task={t} onClick={openEditTask} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {showTaskModal && (
        <Modal onClose={() => { setShowTaskModal(false); setEditingTask(null); }}>
          <h3>{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h3>
          <form onSubmit={handleCreateTask}>
            <div className="input-group">
              <label>Título</label>
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="¿Qué hay que hacer?"
                required
              />
            </div>
            <div className="input-group">
              <label>Descripción</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Detalles adicionales..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label>Prioridad</label>
                <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="input-group">
                <label>Asignar a</label>
                <select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                  <option value="">Sin asignar</option>
                  {group.members?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="input-group">
              <label>Fecha límite</label>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              {editingTask && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { setShowTaskModal(false); handleDeleteTask(editingTask.id); }}>
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editingTask ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showMemberModal && (
        <Modal onClose={() => setShowMemberModal(false)}>
          <h3>Miembros del grupo</h3>
          {isAdmin && (
            <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <input
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="Email del nuevo miembro"
                  type="email"
                  required
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '14px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                <UserPlus size={16} /> Añadir
              </button>
            </form>
          )}
          <div className="members-list">
            {group.members?.map((m) => (
              <div key={m.id} className="member-item">
                <div className="avatar avatar-sm" style={{ background: m.avatar_color || '#6366f1' }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="name">{m.name}</div>
                  <div className="email">{m.email}</div>
                </div>
                <span className="role-badge">{m.role}</span>
                {isAdmin && m.id !== user?.id && (
                  <button className="btn btn-ghost" onClick={() => handleRemoveMember(m.id)} title="Eliminar miembro">
                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cerrar</button>
          </div>
        </Modal>
      )}

      {showSettingsModal && (
        <Modal onClose={() => setShowSettingsModal(false)}>
          <h3>Configuración del grupo</h3>
          <div className="input-group">
            <label>Nombre del grupo</label>
            <input defaultValue={group.name} id="group-name-input" />
          </div>
          <div className="input-group">
            <label>Descripción</label>
            <textarea defaultValue={group.description || ''} id="group-desc-input" />
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger btn-sm" onClick={handleDeleteGroup}>
              <Trash2 size={14} /> Eliminar grupo
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={async () => {
              const name = document.getElementById('group-name-input').value;
              const description = document.getElementById('group-desc-input').value;
              try {
                await api.put(`/groups/${groupId}`, { name, description });
                toast.success('Grupo actualizado');
                fetchGroup();
                onGroupsChanged();
                setShowSettingsModal(false);
              } catch (err) {
                toast.error(err.response?.data?.error || 'Error');
              }
            }}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
