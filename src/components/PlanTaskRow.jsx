import { useCallback } from 'react';
import usePlanStore from '../stores/planStore';

export default function PlanTaskRow({ task }) {
  const completeTask = usePlanStore((s) => s.completeTask);
  const uncompleteTask = usePlanStore((s) => s.uncompleteTask);
  const removeTask = usePlanStore((s) => s.removeTask);

  const handleToggle = useCallback(() => {
    if (task.status === 'todo') {
      completeTask(task.id);
    } else {
      uncompleteTask(task.id);
    }
  }, [task.id, task.status, completeTask, uncompleteTask]);

  const handleRemove = useCallback(() => {
    removeTask(task.id);
  }, [task.id, removeTask]);

  const isCompleted = task.status === 'completed';
  const initials = (task.userName || 'A').charAt(0).toUpperCase();

  return (
    <div className="plan-task-row">
      <button
        className={`plan-task-checkbox ${isCompleted ? 'checked' : ''}`}
        onClick={handleToggle}
        title={isCompleted ? 'Mark as todo' : 'Mark completed'}
      >
        {isCompleted ? '\u2713' : ''}
      </button>
      <div className="plan-task-content">
        <span className={`plan-task-text ${isCompleted ? 'completed' : ''}`}>
          {task.text}
        </span>
        <div className="plan-task-attribution">
          {task.userPicture ? (
            <img src={task.userPicture} alt="" className="plan-task-avatar-img" />
          ) : (
            <span className="plan-task-avatar-fallback">{initials}</span>
          )}
          <span className="plan-task-user">{task.userName || 'Anonymous'}</span>
        </div>
      </div>
      <button
        className="plan-task-delete"
        onClick={handleRemove}
        title="Remove task"
      >
        {'\u2715'}
      </button>
    </div>
  );
}
