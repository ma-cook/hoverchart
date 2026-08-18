import { api, onSocket, emitSocket } from '../api-client';

/**
 * Workflow service — CRUD for workflow tickets + socket.io real-time sync.
 *
 * Backend contract (SQL):
 *   POST   /api/workflow/tickets           — create ticket
 *   PATCH  /api/workflow/tickets/:id       — update ticket (status, diffs, files)
 *   GET    /api/workflow/tickets?spaceId=X — list tickets for a space
 *   POST   /api/workflow/tickets/:id/accept — accept diffs, status → committed
 *   POST   /api/workflow/tickets/:id/reject — reject diffs, status → rejected
 *
 * Socket events (server → client):
 *   workflow:ticket:created   — new ticket in space
 *   workflow:ticket:updated   — ticket status/diffs changed
 *   workflow:ticket:accepted  — ticket accepted by a user
 *   workflow:ticket:rejected  — ticket rejected by a user
 *
 * The backend broadcasts these to all clients in the same space room.
 * Clients filter by spaceId on the client side for safety.
 */

// ── API calls ────────────────────────────────────────────────────────

export async function createTicket({ spaceId, userId, userName, userPicture, promptPreview, promptFull }) {
  const ticket = await api.post('/api/workflow/tickets', {
    spaceId,
    userId,
    userName,
    userPicture: userPicture || null,
    promptPreview: (promptPreview || '').slice(0, 120),
    promptFull,
    status: 'in_progress',
    filesTouched: [],
    diffs: [],
  });
  return ticket;
}

export async function updateTicket(ticketId, fields) {
  const ticket = await api.patch(`/api/workflow/tickets/${ticketId}`, fields);
  return ticket;
}

export async function getTickets(spaceId) {
  const tickets = await api.get('/api/workflow/tickets', { params: { spaceId } });
  return tickets || [];
}

export async function acceptTicket(ticketId) {
  const ticket = await api.post(`/api/workflow/tickets/${ticketId}/accept`);
  return ticket;
}

export async function rejectTicket(ticketId) {
  const ticket = await api.post(`/api/workflow/tickets/${ticketId}/reject`);
  return ticket;
}

// ── Socket subscription ───────────────────────────────────────────────

/**
 * Subscribe to real-time ticket events for a space.
 * Returns an unsubscribe function.
 *
 * @param {string} spaceId - The space to watch
 * @param {object} callbacks - { onCreated, onUpdated, onAccepted, onRejected }
 * @returns {function} unsubscribe
 */
export function subscribeToTickets(spaceId, callbacks) {
  const { onCreated, onUpdated, onAccepted, onRejected } = callbacks;

  const unsubs = [
    onSocket('workflow:ticket:created', (data) => {
      if (data?.ticket?.spaceId === spaceId) onCreated?.(data.ticket);
    }),
    onSocket('workflow:ticket:updated', (data) => {
      if (data?.ticket?.spaceId === spaceId) onUpdated?.(data.ticket);
    }),
    onSocket('workflow:ticket:accepted', (data) => {
      if (data?.ticket?.spaceId === spaceId) onAccepted?.(data);
    }),
    onSocket('workflow:ticket:rejected', (data) => {
      if (data?.ticket?.spaceId === spaceId) onRejected?.(data);
    }),
  ];

  return () => unsubs.forEach((fn) => fn?.());
}

// ── Emit helpers (client → server) ────────────────────────────────────

export function emitTicketCreated(ticket) {
  emitSocket('workflow:ticket:created', { ticket });
}

export function emitTicketUpdated(ticket) {
  emitSocket('workflow:ticket:updated', { ticket });
}

export function emitTicketAccepted(ticketId, userId) {
  emitSocket('workflow:ticket:accepted', { ticketId, userId });
}

export function emitTicketRejected(ticketId, userId) {
  emitSocket('workflow:ticket:rejected', { ticketId, userId });
}
