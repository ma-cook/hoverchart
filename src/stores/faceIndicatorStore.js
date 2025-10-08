import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useFaceIndicatorStore = createWithEqualityFn((set, get) => ({
  // State for all face indicators
  indicators: new Map(), // Map of indicatorId -> indicator state
  hoveredIndicators: new Set(), // Set of currently hovered indicator IDs
  activeIndicators: new Set(), // Set of currently active indicator IDs
  connectedIndicators: new Set(), // Set of connected indicator IDs

  // Actions
  createIndicator: (indicatorId, initialState = {}) => {
    set((state) => {
      const newIndicators = new Map(state.indicators);
      newIndicators.set(indicatorId, {
        id: indicatorId,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isActive: false,
        isConnected: false,
        isHovered: false,
        ...initialState,
      });
      return { indicators: newIndicators };
    });
  },

  updateIndicator: (indicatorId, updates) => {
    set((state) => {
      const newIndicators = new Map(state.indicators);
      const existing = newIndicators.get(indicatorId);
      if (existing) {
        newIndicators.set(indicatorId, { ...existing, ...updates });
      }
      return { indicators: newIndicators };
    });
  },

  deleteIndicator: (indicatorId) => {
    set((state) => {
      const newIndicators = new Map(state.indicators);
      newIndicators.delete(indicatorId);

      const newHovered = new Set(state.hoveredIndicators);
      newHovered.delete(indicatorId);

      const newActive = new Set(state.activeIndicators);
      newActive.delete(indicatorId);

      const newConnected = new Set(state.connectedIndicators);
      newConnected.delete(indicatorId);

      return {
        indicators: newIndicators,
        hoveredIndicators: newHovered,
        activeIndicators: newActive,
        connectedIndicators: newConnected,
      };
    });
  },

  setIndicatorHovered: (indicatorId, isHovered) => {
    set((state) => {
      const newHovered = new Set(state.hoveredIndicators);
      if (isHovered) {
        newHovered.add(indicatorId);
      } else {
        newHovered.delete(indicatorId);
      }
      return { hoveredIndicators: newHovered };
    });
  },

  setIndicatorActive: (indicatorId, isActive) => {
    set((state) => {
      const newActive = new Set(state.activeIndicators);
      if (isActive) {
        newActive.add(indicatorId);
      } else {
        newActive.delete(indicatorId);
      }
      return { activeIndicators: newActive };
    });
  },

  setIndicatorConnected: (indicatorId, isConnected) => {
    set((state) => {
      const newConnected = new Set(state.connectedIndicators);
      if (isConnected) {
        newConnected.add(indicatorId);
      } else {
        newConnected.delete(indicatorId);
      }
      return { connectedIndicators: newConnected };
    });
  },

  clearAllIndicators: () => {
    set({
      indicators: new Map(),
      hoveredIndicators: new Set(),
      activeIndicators: new Set(),
      connectedIndicators: new Set(),
    });
  },

  // Selectors
  getIndicator: (indicatorId) => {
    return get().indicators.get(indicatorId);
  },

  isIndicatorHovered: (indicatorId) => {
    return get().hoveredIndicators.has(indicatorId);
  },

  isIndicatorActive: (indicatorId) => {
    return get().activeIndicators.has(indicatorId);
  },

  isIndicatorConnected: (indicatorId) => {
    return get().connectedIndicators.has(indicatorId);
  },

  getAllIndicators: () => {
    return Array.from(get().indicators.values());
  },
}));

export default useFaceIndicatorStore;
