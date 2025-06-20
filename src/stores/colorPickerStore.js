import { create } from 'zustand';

const useColorPickerStore = create((set, get) => ({
  // State for color pickers across different UI contexts
  colorPickers: {}, // { pickerId: { isOpen: boolean, currentColor: string, context: string } }

  // Global color picker settings
  defaultColor: '#ffffff',
  recentColors: [], // Array of recently used colors
  maxRecentColors: 10,

  // Actions for managing color picker instances
  openColorPicker: (pickerId, context = 'default', initialColor = null) => {
    const state = get();
    const color = initialColor || state.defaultColor;

    set((current) => ({
      colorPickers: {
        ...current.colorPickers,
        [pickerId]: {
          isOpen: true,
          currentColor: color,
          context,
          initialColor: color,
        },
      },
    }));
  },

  closeColorPicker: (pickerId) => {
    set((current) => ({
      colorPickers: {
        ...current.colorPickers,
        [pickerId]: {
          ...current.colorPickers[pickerId],
          isOpen: false,
        },
      },
    }));
  },

  setCurrentColor: (pickerId, color) => {
    set((current) => ({
      colorPickers: {
        ...current.colorPickers,
        [pickerId]: {
          ...current.colorPickers[pickerId],
          currentColor: color,
        },
      },
    }));
  },

  applyColor: (pickerId, onColorApply) => {
    const state = get();
    const picker = state.colorPickers[pickerId];

    if (picker && picker.currentColor) {
      // Add to recent colors
      get().addRecentColor(picker.currentColor);

      // Call the callback with the selected color
      if (onColorApply) {
        onColorApply(picker.currentColor);
      }

      // Close the picker
      get().closeColorPicker(pickerId);

      return picker.currentColor;
    }

    return null;
  },

  cancelColorPicker: (pickerId) => {
    const state = get();
    const picker = state.colorPickers[pickerId];

    if (picker && picker.initialColor) {
      // Reset to initial color
      set((current) => ({
        colorPickers: {
          ...current.colorPickers,
          [pickerId]: {
            ...current.colorPickers[pickerId],
            currentColor: picker.initialColor,
          },
        },
      }));
    }

    // Close the picker
    get().closeColorPicker(pickerId);
  },

  removeColorPicker: (pickerId) => {
    set((current) => {
      const newPickers = { ...current.colorPickers };
      delete newPickers[pickerId];
      return { colorPickers: newPickers };
    });
  },

  // Recent colors management
  addRecentColor: (color) => {
    set((current) => {
      const newRecentColors = [
        color,
        ...current.recentColors.filter((c) => c !== color),
      ];
      return {
        recentColors: newRecentColors.slice(0, current.maxRecentColors),
      };
    });
  },

  clearRecentColors: () => {
    set({ recentColors: [] });
  },

  // Global settings
  setDefaultColor: (color) => {
    set({ defaultColor: color });
  },

  setMaxRecentColors: (max) => {
    set((current) => ({
      maxRecentColors: max,
      recentColors: current.recentColors.slice(0, max),
    }));
  },

  // Getters
  getColorPicker: (pickerId) => {
    const state = get();
    return (
      state.colorPickers[pickerId] || {
        isOpen: false,
        currentColor: state.defaultColor,
        context: 'default',
        initialColor: state.defaultColor,
      }
    );
  },

  isColorPickerOpen: (pickerId) => {
    const state = get();
    return state.colorPickers[pickerId]?.isOpen || false;
  },

  getCurrentColor: (pickerId) => {
    const state = get();
    return state.colorPickers[pickerId]?.currentColor || state.defaultColor;
  },

  // Utility functions
  closeAllColorPickers: () => {
    set((current) => {
      const newPickers = {};
      Object.keys(current.colorPickers).forEach((id) => {
        newPickers[id] = {
          ...current.colorPickers[id],
          isOpen: false,
        };
      });
      return { colorPickers: newPickers };
    });
  },

  getOpenColorPickers: () => {
    const state = get();
    return Object.keys(state.colorPickers).filter(
      (id) => state.colorPickers[id].isOpen
    );
  },

  // Predefined color palettes
  colorPalettes: {
    basic: [
      '#000000',
      '#ffffff',
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
      '#ff00ff',
      '#00ffff',
    ],
    material: [
      '#f44336',
      '#e91e63',
      '#9c27b0',
      '#673ab7',
      '#3f51b5',
      '#2196f3',
      '#03a9f4',
      '#00bcd4',
    ],
    pastel: [
      '#ffcdd2',
      '#f8bbd9',
      '#e1bee7',
      '#d1c4e9',
      '#c5cae9',
      '#bbdefb',
      '#b3e5fc',
      '#b2ebf2',
    ],
  },

  getPalette: (paletteName) => {
    const state = get();
    return state.colorPalettes[paletteName] || state.colorPalettes.basic;
  },
}));

export default useColorPickerStore;
