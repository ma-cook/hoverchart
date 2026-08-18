import { useState, useEffect, useCallback } from 'react';
import useWorkflowStore from '../stores/workflowStore';
import useSpaceManagerStore from '../stores/spaceManagerStore';
import { getTickets, subscribeToTickets } from '../services/workflowService';
import WorkflowTicketRow from './WorkflowTicketRow';
import './WorkflowModal.css';

const TABS = [
  { key: null, label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'to_review', label: 'To Review' },
  { key: 'committed', label: 'Committed' },
];

export default function WorkflowModal() {
  const isOpen = useWorkflowStore((s) => s.isModalOpen);
  const setModalOpen = useWorkflowStore((s) => s.setModalOpen);
  const tickets = useWorkflowStore((s) => s.tickets);
  const setTickets = useWorkflowStore((s) => s.setTickets);
  const addTicket = useWorkflowStore((s) => s.addTicket);
  const updateTicket = useWorkflowStore((s) => s.updateTicket);
  const isLoading = useWorkflowStore((s) => s.isLoading);
  const setIsLoading = useWorkflowStore((s) => s.setIsLoading);
  const spaceId = useSpaceManagerStore((s) => s.currentSpaceId);

  const [activeTab, setActiveTab] = useState(null);

  // Fetch tickets when modal opens or space changes
  useEffect(() => {
    if (!isOpen || !spaceId) return;
    let cancelled = false;
    setIsLoading(true);
    getTickets(spaceId)
      .then((fetched) => {
        if (!cancelled) setTickets(fetched);
      })
      .catch((err) => {
        console.warn('[WorkflowModal] Failed to fetch tickets:', err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, spaceId, setTickets, setIsLoading]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!spaceId) return;
    const unsub = subscribeToTickets(spaceId, {
      onCreated: addTicket,
      onUpdated: updateTicket,
      onAccepted: (data) => updateTicket(data.ticket),
      onRejected: (data) => updateTicket(data.ticket),
    });
    return unsub;
  }, [spaceId, addTicket, updateTicket]);

  const handleClose = useCallback(() => setModalOpen(false), [setModalOpen]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleClose();
  }, [handleClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const filtered = activeTab ? tickets.filter((t) => t.status === activeTab) : tickets;

  return (
    <div className="workflow-modal-backdrop" onClick={handleBackdropClick}>
      <div className="workflow-modal">
        <div className="workflow-modal-header">
          <h2 className="workflow-modal-title">Workflow</h2>
          <span className="workflow-modal-count">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
          <button className="workflow-modal-close" onClick={handleClose} title="Close">
            {'\u2715'}
          </button>
        </div>

        <div className="workflow-modal-tabs">
          {TABS.map((tab) => {
            const count = tab.key ? tickets.filter((t) => t.status === tab.key).length : tickets.length;
            return (
              <button
                key={tab.key || 'all'}
                className={`workflow-modal-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="workflow-modal-tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="workflow-modal-body">
          {isLoading && tickets.length === 0 && (
            <div className="workflow-modal-empty">Loading tickets...</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="workflow-modal-empty">
              {activeTab ? `No ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} tickets.` : 'No workflow tickets yet.'}
            </div>
          )}
          {filtered.map((ticket) => (
            <WorkflowTicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </div>
    </div>
  );
}
