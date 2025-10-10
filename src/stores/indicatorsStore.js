import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useIndicatorsStore = createWithEqualityFn((set, get) => ({
  // Indicator state
  showAllCubesIndicators: false,
  activeIndicator: null,
  indicatorMode: 'none',
  selectedIndicators: [],
  isConnectMode: false,
  globalIndicatorSelected: false,
  selectedIndicatorsRef: { current: [] },
  hoveredObjectId: null, // Track which object is being hovered for selective indicator display

  // Actions
  setShowAllCubesIndicators: (show) => {
    set({ showAllCubesIndicators: show });
  },

  setHoveredObjectId: (objectId) => {
    set({ hoveredObjectId: objectId });
  },

  setActiveIndicator: (indicator) => {
    set({ activeIndicator: indicator });
  },

  setIndicatorMode: (mode) => {
    set({ indicatorMode: mode });
  },

  setSelectedIndicators: (indicators) => {
    set({ selectedIndicators: indicators });
    // Also update the ref
    const state = get();
    state.selectedIndicatorsRef.current = indicators;
  },

  setIsConnectMode: (isConnect) => {
    set({ isConnectMode: isConnect });
  },

  setGlobalIndicatorSelected: (selected) => {
    set({ globalIndicatorSelected: selected });
  },

  // Combined actions that mirror the original hook handlers
  handleIndicatorSelected: () => {
    set({
      showAllCubesIndicators: true,
      globalIndicatorSelected: true,
      indicatorMode: 'indicators',
    });
  },

  handleIndicatorDeselected: () => {
    set({
      showAllCubesIndicators: false,
      globalIndicatorSelected: false,
      indicatorMode: 'none',
      selectedIndicators: [],
    });
    // Also update the ref
    const state = get();
    state.selectedIndicatorsRef.current = [];
  },

  handleToggleIndicators: (mode = 'all') => {
    const state = get();

    if (mode === 'connection') {
      const newConnectMode = !state.isConnectMode;

      if (newConnectMode) {
        set({
          isConnectMode: true,
          selectedIndicators: [],
          indicatorMode: 'indicators',
          showAllCubesIndicators: true,
          globalIndicatorSelected: true,
        });
        state.selectedIndicatorsRef.current = [];
      } else {
        set({
          isConnectMode: false,
          selectedIndicators: [],
          showAllCubesIndicators: false,
          globalIndicatorSelected: false,
          indicatorMode: 'none',
        });
        state.selectedIndicatorsRef.current = [];
      }
    } else {
      const newShowAllCubes = !state.showAllCubesIndicators;
      set({
        showAllCubesIndicators: newShowAllCubes,
        globalIndicatorSelected: newShowAllCubes,
        indicatorMode: newShowAllCubes ? 'all' : 'none',
      });
    }
  },

  // Reset all indicators
  resetIndicators: () => {
    set({
      showAllCubesIndicators: false,
      activeIndicator: null,
      indicatorMode: 'none',
      selectedIndicators: [],
      isConnectMode: false,
      globalIndicatorSelected: false,
      hoveredObjectId: null,
    });
    const state = get();
    state.selectedIndicatorsRef.current = [];
  },
}));

export default useIndicatorsStore;
