import { useState, useCallback, useMemo } from 'react';
import useWorkflowStore from '../stores/workflowStore';
import useAuthStore from '../stores/authStore';
import { acceptTicket, rejectTicket, emitTicketAccepted, emitTicketRejected } from '../services/workflowService';
import WorkflowTicketDiff from './WorkflowTicketDiff';

const STATUS_STYLES = {
  in_progress: { color: '#f3a85c', bg: 'rgba(243,168,92,0.12)', border: 'rgba(243,168,92,0.4)', label: 'In Progress' },
  to_review: { color: '#6ab9f5', bg: 'rgba(106,185,245,0.12)', border: 'rgba(106,185,245,0.4)', label: 'To Review' },
  committed: { color: '#7adc7e', bg: 'rgba(122,220,126,0.12)', border: 'rgba(122,220,126,0.4)', label: 'Committed' },
  rejected: { color: '#f47864', bg: 'rgba(244,120,100,0.12)', border: 'rgba(244,120,100,0.4)', label: 'Rejected' },
};

function formatAge(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WorkflowTicketRow({ ticket }) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const updateTicket = useWorkflowStore((s) => s.updateTicket);
  const currentUserId = useAuthStore((s) => s.user?.uid || s.user?.sub);

  const status = STATUS_STYLES[ticket.status] || STATUS_STYLES.in_progress;
  const isOwn = ticket.userId === currentUserId;
  const canAccept = ticket.status === 'to_review' && !isOwn;
  const canReject = ticket.status === 'to_review' && !isOwn;
  const files = useMemo(() => ticket.filesTouched || [], [ticket.filesTouched]);
  const diffs = useMemo(() => ticket.diffs || [], [ticket.diffs]);

  const handleAccept = useCallback(async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const updated = await acceptTicket(ticket.id);
      updateTicket(updated);
      emitTicketAccepted(ticket.id, currentUserId);

      // Apply ticket diffs to the workspace's pending changes
      if (diffs.length > 0) {
        const { default: useCodeStore } = await import('../stores/codeStore');
        const csState = useCodeStore.getState();
        const pendingChanges = diffs.map((d) => ({
          filePath: d.filePath,
          original: d.original,
          proposed: d.proposed,
          fullContent: true,
          isWholeFileProposal: false,
          action: d.action || 'modify',
          request: `Accepted from workflow ticket by ${ticket.userName}`,
        }));
        csState.addPendingChanges(pendingChanges);
      }
    } catch (err) {
      console.warn('[WorkflowTicket] Accept failed:', err.message);
    } finally {
      setActionLoading(false);
    }
  }, [ticket, diffs, currentUserId, updateTicket]);

  const handleReject = useCallback(async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const updated = await rejectTicket(ticket.id);
      updateTicket(updated);
      emitTicketRejected(ticket.id, currentUserId);
    } catch (err) {
      console.warn('[WorkflowTicket] Reject failed:', err.message);
    } finally {
      setActionLoading(false);
    }
  }, [ticket, currentUserId, updateTicket]);

  return (
    <div className="workflow-ticket-row">
      {/* Collapsed row */}
      <div className="workflow-ticket-header" onClick={() => setExpanded(!expanded)}>
        <div className="workflow-ticket-avatar">
          {ticket.userPicture ? (
            <img src={ticket.userPicture} alt="" className="workflow-ticket-avatar-img" />
          ) : (
            <div className="workflow-ticket-avatar-fallback">
              {(ticket.userName || '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="workflow-ticket-info">
          <div className="workflow-ticket-topline">
            <span className="workflow-ticket-user">{ticket.userName || 'Unknown'}</span>
            <span className="workflow-ticket-time">{formatAge(ticket.createdAt)}</span>
          </div>
          <div className="workflow-ticket-preview">{ticket.promptPreview || '(no prompt)'}</div>
          {files.length > 0 && (
            <div className="workflow-ticket-files">
              {files.slice(0, 4).map((f) => (
                <span key={f} className="workflow-ticket-file-tag">{f.split('/').pop()}</span>
              ))}
              {files.length > 4 && <span className="workflow-ticket-file-more">+{files.length - 4}</span>}
            </div>
          )}
        </div>

        <span
          className="workflow-ticket-status"
          style={{ color: status.color, background: status.bg, borderColor: status.border }}
        >
          {status.label}
        </span>

        <div className="workflow-ticket-actions">
          {canAccept && (
            <button
              className="workflow-ticket-btn workflow-ticket-btn-accept"
              onClick={handleAccept}
              disabled={actionLoading}
              title="Accept changes"
            >
              {actionLoading ? '...' : 'Accept'}
            </button>
          )}
          {canReject && (
            <button
              className="workflow-ticket-btn workflow-ticket-btn-reject"
              onClick={handleReject}
              disabled={actionLoading}
              title="Reject changes"
            >
              {actionLoading ? '...' : 'Reject'}
            </button>
          )}
          <span className="workflow-ticket-chevron">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="workflow-ticket-expanded">
          <div className="workflow-ticket-prompt-full">
            <div className="workflow-ticket-section-label">Full Prompt</div>
            <div className="workflow-ticket-prompt-text">{ticket.promptFull || ticket.promptPreview}</div>
          </div>

          {diffs.length > 0 && (
            <div className="workflow-ticket-diffs">
              <div className="workflow-ticket-section-label">Changes ({diffs.length} file{diffs.length !== 1 ? 's' : ''})</div>
              {diffs.map((d) => (
                <div key={d.filePath} className="workflow-ticket-diff-file">
                  <div className="workflow-ticket-diff-path">{d.filePath}</div>
                  <WorkflowTicketDiff original={d.original} proposed={d.proposed} />
                </div>
              ))}
            </div>
          )}

          {diffs.length === 0 && ticket.status === 'in_progress' && (
            <div className="workflow-ticket-no-diffs">No changes yet — task is still in progress.</div>
          )}
        </div>
      )}
    </div>
  );
}
