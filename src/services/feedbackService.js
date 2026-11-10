import { api } from '../api-client';

// Client for the feedback / issue ticket API (backend/src/api/feedback.js).
//
// Two callers share these endpoints:
//   - The public landing overlay: list (open + in-progress only, enforced
//     server-side), create, detail, and comment.
//   - The admin dashboard Feedback section: lists every status and may change a
//     ticket's status via updateTicketStatus (application admins only).
//
// The server is the authority on what each caller may see or do; nothing here
// re-implements that decision.

export const FEEDBACK_TYPES = ['feedback', 'issue'];
export const FEEDBACK_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
// Statuses shown to ordinary users.
export const PUBLIC_FEEDBACK_STATUSES = ['open', 'in_progress'];

export const FEEDBACK_PAGE_SIZE = 50;

export const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const TYPE_LABELS = {
  feedback: 'Feedback',
  issue: 'Issue',
};

// Compact relative timestamp used by both feedback surfaces.
export function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const parsePage = (data, fallbackPage, fallbackLimit) => ({
  tickets: data?.tickets || [],
  total: typeof data?.total === 'number' ? data.total : 0,
  page: data?.page ?? fallbackPage,
  limit: data?.limit ?? fallbackLimit,
});

// List tickets. `status` accepts one value, a comma list, or 'all' (admin only).
// Omit it to let the server pick the default for the caller's role.
export const fetchTickets = async ({
  status,
  page = 1,
  limit = FEEDBACK_PAGE_SIZE,
} = {}) => {
  const params = { page, limit };
  if (status) params.status = status;
  const data = await api.get('/api/feedback/tickets', { params });
  return parsePage(data, page, limit);
};

export const fetchTicket = async (ticketId) => {
  const data = await api.get(`/api/feedback/tickets/${encodeURIComponent(ticketId)}`);
  return data;
};

export const createTicket = async ({ type = 'feedback', title, body }) => {
  const data = await api.post('/api/feedback/tickets', { type, title, body });
  return data;
};

export const addComment = async (ticketId, body) => {
  const data = await api.post(
    `/api/feedback/tickets/${encodeURIComponent(ticketId)}/comments`,
    { body }
  );
  return data;
};

// Application admins only; the server rejects everyone else with 403.
export const updateTicketStatus = async (ticketId, status) => {
  const data = await api.patch(
    `/api/feedback/tickets/${encodeURIComponent(ticketId)}`,
    { status }
  );
  return data;
};
