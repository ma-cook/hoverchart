import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to manage indicators state and behavior
 */
export function useIndicators() {
  // Indicator state
  const [showAllCubesIndicators, setShowAllCubesIndicators] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState(null);
  const [indicatorMode, setIndicatorMode] = useState('none');
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [globalIndicatorSelected, setGlobalIndicatorSelected] = useState(false);

  // Reference to track selected indicators across renders
  const selectedIndicatorsRef = useRef([]);

  // Handler for indicator selection
  const handleIndicatorSelected = useCallback(() => {
    setShowAllCubesIndicators(true);
    setGlobalIndicatorSelected(true);
    setIndicatorMode('indicators');
  }, []);

  // Handler for indicator deselection
  const handleIndicatorDeselected = useCallback(() => {
    setShowAllCubesIndicators(false);
    setGlobalIndicatorSelected(false);
    setIndicatorMode('none');
    setSelectedIndicators([]);
  }, []);

  // Toggle indicators visibility and mode
  const handleToggleIndicators = useCallback((mode = 'all') => {
    if (mode === 'connection') {
      setIsConnectMode((prev) => {
        const newConnectMode = !prev;
        if (newConnectMode) {
          selectedIndicatorsRef.current = [];
          setSelectedIndicators([]);
          setIndicatorMode('indicators');
          setShowAllCubesIndicators(true);
          setGlobalIndicatorSelected(true);
        } else {
          selectedIndicatorsRef.current = [];
          setSelectedIndicators([]);
          setShowAllCubesIndicators(false);
          setGlobalIndicatorSelected(false);
          setIndicatorMode('none');
        }
        return newConnectMode;
      });
    } else {
      setShowAllCubesIndicators((prev) => {
        const newValue = !prev;
        setGlobalIndicatorSelected(newValue);
        return newValue;
      });
      setIndicatorMode((prev) => (prev === 'all' ? 'none' : 'all'));
    }
  }, []);

  return {
    showAllCubesIndicators,
    setShowAllCubesIndicators,
    activeIndicator,
    setActiveIndicator,
    indicatorMode,
    setIndicatorMode,
    selectedIndicators,
    setSelectedIndicators,
    isConnectMode,
    setIsConnectMode,
    globalIndicatorSelected,
    setGlobalIndicatorSelected,
    selectedIndicatorsRef,
    handleToggleIndicators,
    handleIndicatorSelected,
    handleIndicatorDeselected,
  };
}
