import { create } from 'zustand';

let nextId = 1;

const useDialogStore = create((set, get) => ({
  confirmState: null,
  toasts: [],

  requestConfirm: (options = {}) =>
    new Promise((resolve) => {
      const current = get().confirmState;
      if (current) {
        current.resolve(false);
      }
      set({
        confirmState: {
          id: nextId++,
          title: options.title || 'Are you sure?',
          message: options.message || '',
          confirmLabel: options.confirmLabel || 'Delete',
          cancelLabel: options.cancelLabel || 'Cancel',
          tone: options.tone || 'danger',
          resolve,
        },
      });
    }),

  resolveConfirm: (value) => {
    const state = get().confirmState;
    if (!state) return;
    state.resolve(Boolean(value));
    set({ confirmState: null });
  },

  pushToast: (toast) => {
    const id = nextId++;
    set((state) => ({
      toasts: [...state.toasts, { id, type: 'info', duration: 4000, ...toast }],
    }));
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export const confirmDialog = (options) => useDialogStore.getState().requestConfirm(options);

export const notify = (message, options = {}) => {
  const duration = options.duration ?? 4000;
  const id = useDialogStore.getState().pushToast({
    message,
    type: options.type || 'success',
    title: options.title,
    duration,
  });
  if (duration > 0) {
    setTimeout(() => useDialogStore.getState().dismissToast(id), duration);
  }
  return id;
};

export const dismissToast = (id) => useDialogStore.getState().dismissToast(id);

export default useDialogStore;
