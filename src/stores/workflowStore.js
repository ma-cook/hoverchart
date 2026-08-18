import { create } from 'zustand';

/**
 * Workflow store — tracks LLM task tickets for the current space.
 * Tickets are synced across users via socket.io events emitted by
 * workflowService.js. The store is the source of truth for the UI;
 * the SQL backend is the durable source of truth for persistence.
 *
 * Ticket shape:
 * {
 *   id: string,
 *   spaceId: string,
 *   userId: string,
 *   userName: string,
 *   userPicture: string | null,
 *   promptPreview: string,
 *   promptFull: string,
 *   status: 'in_progress' | 'to_review' | 'committed' | 'rejected',
 *   filesTouched: string[],
 *   diffs: Array<{ filePath: string, original: string | null, proposed: string, action: string }>,
 *   createdAt: string,
 *   updatedAt: string,
 *   committedAt: string | null,
 * }
 */

const useWorkflowStore = create((set, get) => ({
  tickets: [],
  selectedTicketId: null,
  isLoading: false,
  isModalOpen: false,

  setTickets: (tickets) => set({ tickets }),

  addTicket: (ticket) =>
    set((state) => {
      const exists = state.tickets.some((t) => t.id === ticket.id);
      if (exists) return state;
      return { tickets: [ticket, ...state.tickets] };
    }),

  updateTicket: (ticket) =>
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticket.id ? { ...t, ...ticket } : t)),
    })),

  removeTicket: (ticketId) =>
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== ticketId),
      selectedTicketId: state.selectedTicketId === ticketId ? null : state.selectedTicketId,
    })),

  setSelectedTicketId: (id) => set({ selectedTicketId: id }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setModalOpen: (open) => set({ isModalOpen: open }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),

  getTicketsByStatus: (status) => {
    const { tickets } = get();
    if (!status) return tickets;
    return tickets.filter((t) => t.status === status);
  },

  getActiveTickets: (excludeUserId) => {
    const { tickets } = get();
    return tickets.filter(
      (t) => t.status === 'in_progress' && t.userId !== excludeUserId
    );
  },

  getTicketById: (id) => {
    const { tickets } = get();
    return tickets.find((t) => t.id === id) || null;
  },
}));

export default useWorkflowStore;
