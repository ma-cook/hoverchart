import React, { useCallback, useEffect, useState } from 'react';
import {
  FEEDBACK_PAGE_SIZE,
  FEEDBACK_STATUSES,
  STATUS_LABELS,
  TYPE_LABELS,
  addComment,
  fetchTicket,
  fetchTickets,
  formatRelativeTime,
  updateTicketStatus,
} from '../../services/feedbackService';
import { FeedbackAvatar } from './FeedbackBits';
import './FeedbackPanel.css';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

// Admin tabs: the four statuses plus an "all" escape hatches. Default is 'open'
// because the admin's job here is triaging what has not been dealt with yet.
const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
];

const toolbarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
  flexWrap: 'wrap',
};

const tabBase = {
  padding: '5px 12px',
  borderRadius: '999px',
  border: '1px solid #3a3a40',
  background: '#18181c',
  color: '#c8c8c8',
  fontSize: '12px',
  fontWeight: '600',
  fontFamily: FONT_FAMILY,
  cursor: 'pointer',
};

const tabActive = {
  ...tabBase,
  background: 'rgba(204, 133, 0, 0.14)',
  borderColor: '#cc8500',
  color: '#ffb733',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '12px',
};

const thStyle = {
  textAlign: 'left',
  padding: '7px 8px',
  borderBottom: '1px solid #3a3a40',
  color: '#999999',
  fontWeight: '600',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '7px 8px',
  borderBottom: '1px solid #2a2a30',
  verticalAlign: 'middle',
  color: '#e6e6e6',
};

const selectStyle = {
  padding: '5px 6px',
  border: '1px solid #3a3a40',
  borderRadius: '4px',
  fontSize: '12px',
  fontFamily: FONT_FAMILY,
  background: '#141417',
  color: '#e6e6e6',
  cursor: 'pointer',
};

const smallBtnStyle = {
  padding: '4px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  fontFamily: FONT_FAMILY,
  border: '1px solid #3a3a40',
  background: '#2a2a30',
  color: '#e6e6e6',
};

const emptyStyle = {
  textAlign: 'center',
  color: '#888888',
  padding: '28px 0',
  fontSize: '13px',
};

const bannerBase = {
  padding: '7px 10px',
  borderRadius: '4px',
  fontSize: '12px',
  marginBottom: '10px',
};

export const AdminFeedbackTable = React.memo(() => {
  const [tab, setTab] = useState('open');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commenting, setCommenting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTickets({
        status: tab === 'all' ? 'all' : tab,
        limit: FEEDBACK_PAGE_SIZE,
      });
      setTickets(data.tickets);
    } catch (err) {
      setError(err?.message || 'Failed to load feedback.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setSelected(null);
    setCommentBody('');
    load();
  }, [load]);

  const openTicket = useCallback(async (ticketId) => {
    setDetailLoading(true);
    setError('');
    setSelected({ id: ticketId });
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

  const handleStatusChange = async (ticket, status) => {
    const previous = ticket.status;
    if (status === previous) return;
    setBusyId(ticket.id);
    setError('');
    setTickets((prev) =>
      prev.map((row) => (row.id === ticket.id ? { ...row, status } : row))
    );
    try {
      await updateTicketStatus(ticket.id, status);
      // A ticket that no longer matches the active tab is dropped from the list.
      if (tab !== 'all' && status !== tab) {
        setTickets((prev) => prev.filter((row) => row.id !== ticket.id));
      }
      if (selected?.id === ticket.id) {
        setSelected((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (err) {
      setTickets((prev) =>
        prev.map((row) => (row.id === ticket.id ? { ...row, status: previous } : row))
      );
      setError(err?.message || 'Failed to update status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selected?.id || !commentBody.trim() || commenting) return;
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

  if (selected) {
    return (
      <div>
        <button className="feedback-back" onClick={() => setSelected(null)}>
          ‹ Back to list
        </button>

        {error && (
          <div
            style={{
              ...bannerBase,
              background: 'rgba(204, 133, 0, 0.1)',
              border: '1px solid #e0a33a',
              borderLeft: '3px solid #cc8500',
              color: '#ffb733',
            }}
          >
            {error}
          </div>
        )}

        {detailLoading ? (
          <div style={emptyStyle}>Loading…</div>
        ) : (
          <>
            <div className="feedback-detail-head">
              <span
                className={`feedback-badge feedback-badge--type feedback-badge--${selected.type}`}
              >
                {TYPE_LABELS[selected.type] || selected.type}
              </span>
              <h4 className="feedback-detail-title">{selected.title}</h4>
            </div>
            <div className="feedback-ticket-meta">
              <FeedbackAvatar
                name={selected.author_name || 'Unknown'}
                url={selected.author_photo_url}
                size={18}
              />
              <span>{selected.author_name || 'Unknown'}</span>
              {selected.author_email && (
                <>
                  <span className="feedback-dot">·</span>
                  <span>{selected.author_email}</span>
                </>
              )}
              <span className="feedback-dot">·</span>
              <span>{formatRelativeTime(selected.created_at)}</span>
            </div>

            <div className="feedback-status-control" style={toolbarStyle}>
              <label className="feedback-label" htmlFor="admin-feedback-status">
                Status
              </label>
              <select
                id="admin-feedback-status"
                style={selectStyle}
                value={selected.status}
                disabled={busyId === selected.id}
                onChange={(e) => handleStatusChange(selected, e.target.value)}
              >
                {FEEDBACK_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <p className="feedback-detail-body">{selected.body}</p>

            <div className="feedback-comments-head">
              Comments &amp; notes ({(selected.comments || []).length})
            </div>
            <ul className="feedback-comments">
              {(selected.comments || []).length === 0 && (
                <li className="feedback-muted feedback-center feedback-center--sm">
                  No notes yet.
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
                placeholder="Add an internal note or reply…"
              />
              <div className="feedback-actions">
                <button
                  type="submit"
                  className="feedback-btn feedback-btn--primary"
                  disabled={commenting || !commentBody.trim()}
                >
                  {commenting ? 'Posting…' : 'Add note'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={toolbarStyle}>
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={item.id === tab ? tabActive : tabBase}
          >
            {item.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#888888' }}>
            {loading ? 'Loading…' : `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`}
          </span>
          <button style={smallBtnStyle} onClick={load} disabled={loading}>
            Refresh
          </button>
        </span>
      </div>

      {error && (
        <div
          style={{
            ...bannerBase,
            background: 'rgba(204, 133, 0, 0.1)',
            border: '1px solid #e0a33a',
            borderLeft: '3px solid #cc8500',
            color: '#ffb733',
          }}
        >
          {error}
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Author</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Comments</th>
            <th style={thStyle}>Created</th>
            <th style={thStyle} />
          </tr>
        </thead>
        <tbody>
          {!loading && tickets.length === 0 && (
            <tr>
              <td colSpan={7} style={emptyStyle}>
                No {tab === 'all' ? '' : `${STATUS_LABELS[tab]?.toLowerCase() || ''} `}tickets.
              </td>
            </tr>
          )}

          {tickets.map((ticket) => {
            const busy = busyId === ticket.id;
            return (
              <tr key={ticket.id} style={{ opacity: busy ? 0.6 : 1 }}>
                <td style={tdStyle}>
                  <span
                    className={`feedback-badge feedback-badge--type feedback-badge--${ticket.type}`}
                  >
                    {TYPE_LABELS[ticket.type] || ticket.type}
                  </span>
                </td>
                <td
                  style={{
                    ...tdStyle,
                    maxWidth: '280px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: '500',
                  }}
                  title={ticket.title}
                >
                  {ticket.title}
                </td>
                <td style={tdStyle}>{ticket.author_name || 'Unknown'}</td>
                <td style={tdStyle}>
                  <select
                    value={ticket.status}
                    disabled={busy}
                    onChange={(e) => handleStatusChange(ticket, e.target.value)}
                    aria-label={`Status for ${ticket.title}`}
                    style={selectStyle}
                  >
                    {FEEDBACK_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>{ticket.comment_count ?? 0}</td>
                <td style={tdStyle}>{formatRelativeTime(ticket.created_at)}</td>
                <td style={tdStyle}>
                  <button style={smallBtnStyle} onClick={() => openTicket(ticket.id)}>
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
