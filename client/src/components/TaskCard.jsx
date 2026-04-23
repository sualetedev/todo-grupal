import { Calendar, GripVertical } from 'lucide-react';

const PRIORITY_LABELS = { high: 'Alta', medium: 'Media', low: 'Baja' };
const STATUS_LABELS = { pending: 'Pendiente', in_progress: 'En progreso', done: 'Hecho' };

export default function TaskCard({ task, onClick, onStatusChange, onDragStart, onDragEnd }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  const handleStatusClick = (e) => {
    e.stopPropagation();
    const statuses = ['pending', 'in_progress', 'done'];
    const idx = statuses.indexOf(task.status);
    const next = statuses[(idx + 1) % statuses.length];
    onStatusChange(task.id, next);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', String(task.id));
    onDragStart && onDragStart(task);
  };

  const handleDragEnd = () => {
    onDragEnd && onDragEnd();
  };

  return (
    <div
      className="task-card"
      onClick={() => onClick(task)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <div
          className="drag-handle"
          title="Arrastra para cambiar prioridad"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="task-card-title">{task.title}</div>
          {task.description && <div className="task-card-desc">{task.description}</div>}
          <div className="task-card-footer">
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`priority-badge priority-${task.priority}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              <button
                className={`status-select status-${task.status}`}
                onClick={handleStatusClick}
                title="Cambiar estado"
              >
                {STATUS_LABELS[task.status]}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {task.due_date && (
                <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                  <Calendar size={12} />
                  {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              )}
              {task.assignee_name && (
                <span className="task-assignee">
                  <div className="avatar avatar-sm" style={{ background: task.assignee_color || '#6366f1' }}>
                    {task.assignee_name[0].toUpperCase()}
                  </div>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
