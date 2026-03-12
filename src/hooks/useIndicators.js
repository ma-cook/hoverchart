import { shallow } from 'zustand/shallow';
import { useIndicatorsStore } from '../stores';

/**
 * Custom hook to manage indicators state and behavior
 * Migrated to use Zustand store for state management
 */
export function useIndicators() {
  // PERFORMANCE: Select only reactive state with shallow equality —
  // avoids re-renders when unrelated indicator fields change.
  const state = useIndicatorsStore(
    (s) => ({
      showAllCubesIndicators: s.showAllCubesIndicators,
      activeIndicator: s.activeIndicator,
      indicatorMode: s.indicatorMode,
      selectedIndicators: s.selectedIndicators,
      isConnectMode: s.isConnectMode,
      globalIndicatorSelected: s.globalIndicatorSelected,
      selectedIndicatorsRef: s.selectedIndicatorsRef,
    }),
    shallow
  );

  // Actions are stable references — read once, no subscription needed.
  const {
    setShowAllCubesIndicators,
    setActiveIndicator,
    setIndicatorMode,
    setSelectedIndicators,
    setIsConnectMode,
    setGlobalIndicatorSelected,
    handleToggleIndicators,
    handleIndicatorSelected,
    handleIndicatorDeselected,
  } = useIndicatorsStore.getState();

  // Return the same API as before for backward compatibility
  return {
    ...state,
    setShowAllCubesIndicators,
    setActiveIndicator,
    setIndicatorMode,
    setSelectedIndicators,
    setIsConnectMode,
    setGlobalIndicatorSelected,
    handleToggleIndicators,
    handleIndicatorSelected,
    handleIndicatorDeselected,
  };
}
