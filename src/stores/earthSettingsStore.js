import { create } from 'zustand';

const useEarthSettingsStore = create((set) => ({
  // Globe geometry
  radius: 80,
  exaggeration: 8,

  // Display settings
  colorScheme: 'terrain', // 'terrain' | 'monochrome' | 'ocean' | 'elevation'
  showOceanFloor: true,
  lineWidth: 1,

  // Navigation
  targetLatitude: 0,
  targetLongitude: 0,

  // Actions
  setRadius: (radius) => set({ radius }),
  setExaggeration: (exaggeration) => set({ exaggeration }),
  setColorScheme: (colorScheme) => set({ colorScheme }),
  setShowOceanFloor: (showOceanFloor) => set({ showOceanFloor }),
  setLineWidth: (lineWidth) => set({ lineWidth }),
  setTargetLatitude: (targetLatitude) => set({ targetLatitude }),
  setTargetLongitude: (targetLongitude) => set({ targetLongitude }),
}));

export default useEarthSettingsStore;
