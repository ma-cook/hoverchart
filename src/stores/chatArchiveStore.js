import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

/**
 * Tracks chat windows that have been "used" so that, when one is closed, it can
 * be archived and surfaced again as a numbered icon below the top bar (see
 * UIOverlay). A window counts as significant when an LLM provider was
 * configured for it or the user sent a message through it.
 *
 * The archived list is persisted per space in localStorage keyed by the same
 * windowId SpaceChat uses for its persisted messages/LLM state, so reopening an
 * archived window after a reload restores its conversation and config.
 */

const archiveKey = (spaceId) => `chat:archived:${spaceId}`;

function loadArchived(spaceId) {
  if (!spaceId) return [];
  try {
    const raw = localStorage.getItem(archiveKey(spaceId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => Number.isInteger(id) && id > 0) : [];
  } catch {
    return [];
  }
}

function saveArchived(spaceId, list) {
  if (!spaceId) return;
  try {
    localStorage.setItem(archiveKey(spaceId), JSON.stringify(list));
  } catch { /* ignore */ }
}

const useChatArchiveStore = createWithEqualityFn((set, get) => ({
  // spaceId -> [windowId, ...] of closed-but-significant chat windows.
  archivedBySpace: {},
  // spaceId -> { [windowId]: true } of windows used during this session.
  significantBySpace: {},

  // Load a space's archived list from localStorage if it isn't cached yet.
  archivedIds: (spaceId) => {
    if (!spaceId) return [];
    const cached = get().archivedBySpace[spaceId];
    if (cached !== undefined) return cached;
    const loaded = loadArchived(spaceId);
    set((s) => ({
      archivedBySpace: { ...s.archivedBySpace, [spaceId]: loaded },
    }));
    return loaded;
  },

  refresh: (spaceId) => {
    if (!spaceId) return;
    const loaded = loadArchived(spaceId);
    set((s) => ({
      archivedBySpace: { ...s.archivedBySpace, [spaceId]: loaded },
    }));
  },

  markSignificant: (spaceId, windowId) => {
    if (!spaceId || !windowId || windowId <= 0) return;
    set((s) => {
      if (s.significantBySpace[spaceId]?.[windowId]) return s;
      return {
        significantBySpace: {
          ...s.significantBySpace,
          [spaceId]: { ...(s.significantBySpace[spaceId] || {}), [windowId]: true },
        },
      };
    });
  },

  isSignificant: (spaceId, windowId) => {
    if (!spaceId || !windowId) return false;
    return !!(get().significantBySpace[spaceId]?.[windowId]);
  },

  archiveWindow: (spaceId, windowId) => {
    if (!spaceId || !windowId || windowId <= 0) return;
    set((s) => {
      const current = s.archivedBySpace[spaceId] !== undefined ? s.archivedBySpace[spaceId] : loadArchived(spaceId);
      if (current.includes(windowId)) return s;
      const next = [...current, windowId];
      saveArchived(spaceId, next);
      return { archivedBySpace: { ...s.archivedBySpace, [spaceId]: next } };
    });
  },

  unarchiveWindow: (spaceId, windowId) => {
    if (!spaceId || !windowId) return;
    set((s) => {
      const current = s.archivedBySpace[spaceId] !== undefined ? s.archivedBySpace[spaceId] : loadArchived(spaceId);
      const next = current.filter((id) => id !== windowId);
      saveArchived(spaceId, next);
      return { archivedBySpace: { ...s.archivedBySpace, [spaceId]: next } };
    });
  },

  clearSpace: (spaceId) => {
    if (!spaceId) return;
    try {
      localStorage.removeItem(archiveKey(spaceId));
    } catch { /* ignore */ }
    set((s) => {
      const archivedBySpace = { ...s.archivedBySpace };
      delete archivedBySpace[spaceId];
      const significantBySpace = { ...s.significantBySpace };
      delete significantBySpace[spaceId];
      return { archivedBySpace, significantBySpace };
    });
  },
}), shallow);

export default useChatArchiveStore;