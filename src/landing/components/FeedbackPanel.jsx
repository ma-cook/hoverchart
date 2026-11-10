import React, { useCallback, useEffect, useState } from 'react';
import {
  FEEDBACK_TYPES,
  PUBLIC_FEEDBACK_STATUSES,
  STATUS_LABELS,
  TYPE_LABELS,
  addComment,
  createTicket,
  fetchTicket,
  fetchTickets,
  formatRelativeTime,
  updateTicketStatus,
} from '../../services/feedbackService';
import { FeedbackAvatar } from './FeedbackBits';
import './FeedbackPanel.css';

const PublicStatusBadge = ({ status }) => (
  <span className={`feedback-badge feedback-badge--status feedback-badge--${status}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

const TypeBadge = ({ type }) => (
  <span className={`feedback-badge feedback-badge--type feedback-badge--${type}`}>
    {TYPE_LABELS[type] || type}
  </span>
);

const EMPTY_FORM = { type: 'issue', title: '', body: '' };

/**
 * Public feedback overlay.
 *
 * Opened from the landing page footer. Any signed-in (non-guest) account can
 * open a ticket and comment. The list is limited server-side to open and
 * in-progress tickets — resolved/closed history is only visible to admins in
 * the admin dashboard.
 */
export const FeedbackPanel = React.memo(({ show, onClose, currentUser, isAdmin }) => {
  const [view, setView] = useState('list');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commenting, setCommenting] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTickets();
      setTickets(data.tickets);
    } catch (err) {
      setError(err?.message || 'Failed to load feedback.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to a clean list every time the panel opens.
  useEffect(() => {
    if (!show) return;
    setView('list');
    setForm(EMPTY_FORM);
    setFormError('');
    setSelected(null);
    setCommentBody('');
    loadTickets();
  }, [show, loadTickets]);

  useEffect(() => {
    if (!show) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (view !== 'list') {
        setView('list');
        setSelected(null);
      } else {
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [show, view, onClose]);

  const openTicket = useCallback(async (ticketId) => {
    setView('detail');
    setDetailLoading(true);
    setError('');
    try {
      const data = await fetchTicket(ticketId);
      setSelected(data);
    } catch (err) {
      setError(err?.message || 'Failed to load ticket.');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('A title is required.');
      return;
    }
    if (!form.body.trim()) {
      setFormError('A description is required.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createTicket({
        type: form.type,
        title: form.title.trim(),
        body: form.body.trim(),
      });
      setForm(EMPTY_FORM);
      setView('list');
      await loadTickets();
      if (created?.id) openTicket(created.id);
    } catch (err) {
      setFormError(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selected || !commentBody.trim() || commenting) return;
    setCommenting(true);
    setError('');
    try {
      const created = await addComment(selected.id, commentBody.trim());
      setSelected((prev) =>
        prev ? { ...prev, comments: [...(prev.comments || []), created] } : prev
      );
      setCommentBody('');
    } catch (err) {
      setError(err?.message || 'Failed to add comment.');
    } finally {
      setCommenting(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selected) return;
    const previous = selected.status;
    if (status === previous) return;
    setSelected((prev) => (prev ? { ...prev, status } : prev));
    try {
      await updateTicketStatus(selected.id, status);
      loadTickets();
    } catch (err) {
      setSelected((prev) => (prev ? { ...prev, status: previous } : prev));
      setError(err?.message || 'Failed to update status.');
    }
  };

  if (!show) return null;

  const displayName =
    currentUser?.displayName || currentUser?.name || currentUser?.email || 'You';

  return (
    <div className="feedback-overlay" onClick={onClose} role="presentation">
      <div
        className="feedback-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Feedback"
      >
        <div className="feedback-header">
          <div>
            <h3 className="feedback-title">Feedback &amp; Issues</h3>
            <p className="feedback-subtitle">Report a problem or share an idea</p>
          </div>
          <button
            className="feedback-close"
            onClick={onClose}
            aria-label="Close feedback"
            title="Close"
          >
            ✕
          </button>
        </div>

        {error && <div className="feedback-error">{error}</div>}

        {view === 'list' && (
          <div className="feedback-body">
            <div className="feedback-toolbar">
              <div className="feedback-tabs">
                {PUBLIC_FEEDBACK_STATUSES.map((status) => (
                  <span
                    key={status}
                    className={`feedback-badge feedback-badge--status feedback-badge--${status}`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                ))}
              </div>
              <button
                className="feedback-btn feedback-btn--primary"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setFormError('');
                  setView('new');
                }}
              >
                New ticket
              </button>
            </div>

            {loading ? (
              <div className="feedback-muted feedback-center">Loading…</div>
            ) : tickets.length === 0 ? (
              <div className="feedback-muted feedback-center">
                No open feedback yet. Be the first to post.
              </div>
            ) : (
              <ul className="feedback-list">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <button
                      className="feedback-ticket"
                      onClick={() => openTicket(ticket.id)}
                    >
                      <div className="feedback-ticket-top">
                        <TypeBadge type={ticket.type} />
                        <span className="feedback-ticket-title">{ticket.title}</span>
                        <PublicStatusBadge status={ticket.status} />
                      </div>
                      <div className="feedback-ticket-meta">
                        <FeedbackAvatar
                          name={ticket.author_name || 'Unknown'}
                          url={ticket.author_photo_url}
                          size={18}
                        />
                        <span>{ticket.author_name || 'Unknown'}</span>
                        <span className="feedback-dot">·</span>
                        <span>{formatRelativeTime(ticket.created_at)}</span>
                        <span className="feedback-dot">·</span>
                        <span>
                          {ticket.comment_count}{' '}
                          {ticket.comment_count === 1 ? 'comment' : 'comments'}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {view === 'new' && (
          <form className="feedback-body" onSubmit={handleSubmitTicket}>
            <div className="feedback-field">
              <label className="feedback-label">Type</label>
              <div className="feedback-toggle">
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`feedback-toggle-btn ${
                      form.type === type ? 'feedback-toggle-btn--active' : ''
                    }`}
                    onClick={() => setForm((prev) => ({ ...prev, type }))}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="feedback-field">
              <label className="feedback-label" htmlFor="feedback-title">
                Title
              </label>
              <input
                id="feedback-title"
                className="feedback-input"
                value={form.title}
                maxLength={200}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Short summary"
              />
            </div>

            <div className="feedback-field">
              <label className="feedback-label" htmlFor="feedback-body">
                Description
              </label>
              <textarea
                id="feedback-body"
                className="feedback-textarea"
                value={form.body}
                rows={6}
                maxLength={5000}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="What happened, what you expected, and any steps to reproduce…"
              />
            </div>

            {formError && <div className="feedback-error">{formError}</div>}

            <div className="feedback-actions">
              <button
                type="button"
                className="feedback-btn feedback-btn--secondary"
                onClick={() => setView('list')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="feedback-btn feedback-btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        {view === 'detail' && (
          <div className="feedback-body">
            <button className="feedback-back" onClick={() => setView('list')}>
              ‹ Back to list
            </button>

            {detailLoading || !selected ? (
              <div className="feedback-muted feedback-center">
                {detailLoading ? 'Loading…' : 'Ticket unavailable.'}
              </div>
            ) : (
              <>
                <div className="feedback-detail-head">
                  <TypeBadge type={selected.type} />
                  <h4 className="feedback-detail-title">{selected.title}</h4>
                </div>
                <div className="feedback-ticket-meta">
                  <FeedbackAvatar
                    name={selected.author_name || 'Unknown'}
                    url={selected.author_photo_url}
                    size={18}
                  />
                  <span>{selected.author_name || 'Unknown'}</span>
                  <span className="feedback-dot">·</span>
                  <span>{formatRelativeTime(selected.created_at)}</span>
                </div>

                {isAdmin ? (
                  <div className="feedback-field feedback-status-control">
                    <label className="feedback-label" htmlFor="feedback-status">
                      Status
                    </label>
                    <select
                      id="feedback-status"
                      className="feedback-select"
                      value={selected.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="feedback-status-control">
                    <PublicStatusBadge status={selected.status} />
                  </div>
                )}

                <p className="feedback-detail-body">{selected.body}</p>

                <div className="feedback-comments-head">
                  Comments ({(selected.comments || []).length})
                </div>
                <ul className="feedback-comments">
                  {(selected.comments || []).length === 0 && (
                    <li className="feedback-muted feedback-center feedback-center--sm">
                      No comments yet.
                    </li>
                  )}
                  {(selected.comments || []).map((comment) => (
                    <li key={comment.id} className="feedback-comment">
                      <FeedbackAvatar
                        name={comment.author_name || 'Unknown'}
                        url={comment.author_photo_url}
                        size={24}
                      />
                      <div className="feedback-comment-main">
                        <div className="feedback-comment-meta">
                          <span className="feedback-comment-author">
                            {comment.author_name || 'Unknown'}
                          </span>
                          <span>{formatRelativeTime(comment.created_at)}</span>
                        </div>
                        <p className="feedback-comment-body">{comment.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <form className="feedback-composer" onSubmit={handleAddComment}>
                  <textarea
                    className="feedback-textarea"
                    value={commentBody}
                    rows={3}
                    maxLength={5000}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder={`Comment as ${displayName}…`}
                  />
                  <div className="feedback-actions">
                    <button
                      type="submit"
                      className="feedback-btn feedback-btn--primary"
                      disabled={commenting || !commentBody.trim()}
                    >
                      {commenting ? 'Posting…' : 'Post comment'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
