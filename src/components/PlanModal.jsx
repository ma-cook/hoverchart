import { useCallback, useEffect } from 'react';
import usePlanStore from '../stores/planStore';
import PlanTaskRow from './PlanTaskRow';
import './PlanModal.css';

export default function PlanModal() {
  const isOpen = usePlanStore((s) => s.isPanelOpen);
  const setPanelOpen = usePlanStore((s) => s.setPanelOpen);
  const plan = usePlanStore((s) => s.plan);
  const tasks = usePlanStore((s) => s.tasks);
  const currentView = usePlanStore((s) => s.currentView);
  const setCurrentView = usePlanStore((s) => s.setCurrentView);
  const isLoading = usePlanStore((s) => s.isLoading);

  const handleClose = useCallback(() => setPanelOpen(false), [setPanelOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  const filteredTasks = tasks.filter((t) => t.status === currentView);
  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  if (!isOpen) return null;

  return (
    <div className="plan-panel">
      <div className="plan-panel-header">
        <h2 className="plan-panel-title">Plan</h2>
        <span className="plan-panel-count">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
        <button className="plan-panel-close" onClick={handleClose} title="Close">
          {'\u2715'}
        </button>
      </div>

      {plan && (
        <div className="plan-panel-plan-title">{plan.title}</div>
      )}

      <div className="plan-panel-tabs">
        <button
          className={`plan-panel-tab ${currentView === 'todo' ? 'active' : ''}`}
          onClick={() => setCurrentView('todo')}
        >
          To Do
          <span className="plan-panel-tab-count">{todoCount}</span>
        </button>
        <button
          className={`plan-panel-tab ${currentView === 'completed' ? 'active' : ''}`}
          onClick={() => setCurrentView('completed')}
        >
          Completed
          <span className="plan-panel-tab-count">{completedCount}</span>
        </button>
      </div>

      <div className="plan-panel-body">
        {isLoading && (
          <div className="plan-panel-empty">Loading plan...</div>
        )}
        {!isLoading && !plan && (
          <div className="plan-panel-empty">
            No active plan. The LLM will create one when you send a multi-step request.
          </div>
        )}
        {!isLoading && plan && filteredTasks.length === 0 && (
          <div className="plan-panel-empty">
            {currentView === 'todo'
              ? 'All tasks completed!'
              : 'No completed tasks yet.'}
          </div>
        )}
        {filteredTasks.map((task) => (
          <PlanTaskRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
