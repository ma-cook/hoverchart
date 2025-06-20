import { create } from 'zustand';

const useAnimatedConnectionLineStore = create((set, get) => ({
  // Animation state for each connection line
  animationStates: {}, // { connectionId: { offset: number, isAnimating: boolean, direction: string } }

  // Global animation settings
  globalAnimationSpeed: 2.0,
  globalAnimationEnabled: true,

  // Actions for managing individual connection animations
  setAnimationState: (connectionId, state) => {
    set((current) => ({
      animationStates: {
        ...current.animationStates,
        [connectionId]: {
          ...current.animationStates[connectionId],
          ...state,
        },
      },
    }));
  },
  updateAnimationOffset: (connectionId, delta, direction = 'right') => {
    const state = get();
    const currentState = state.animationStates[connectionId] || {};
    const currentOffset = currentState.offset || 0;
    const speed = state.globalAnimationSpeed;
    const directionMultiplier = direction === 'right' ? 1 : -1;

    // Calculate new offset
    let newOffset = currentOffset + delta * speed * directionMultiplier;

    // Wrap the offset to prevent infinite growth and create seamless loop
    // For dashed lines, we want to wrap at a value that creates smooth animation
    const wrapValue = 20; // Wrap every 20 units for smooth dash animation
    if (newOffset > wrapValue) {
      newOffset = newOffset % wrapValue;
    } else if (newOffset < 0) {
      newOffset = wrapValue + (newOffset % wrapValue);
    }

    set((current) => ({
      animationStates: {
        ...current.animationStates,
        [connectionId]: {
          ...current.animationStates[connectionId],
          offset: newOffset,
        },
      },
    }));

    return newOffset;
  },

  startAnimation: (connectionId, direction = 'right') => {
    set((current) => ({
      animationStates: {
        ...current.animationStates,
        [connectionId]: {
          ...current.animationStates[connectionId],
          isAnimating: true,
          direction,
          offset: current.animationStates[connectionId]?.offset || 0,
        },
      },
    }));
  },

  stopAnimation: (connectionId) => {
    set((current) => ({
      animationStates: {
        ...current.animationStates,
        [connectionId]: {
          ...current.animationStates[connectionId],
          isAnimating: false,
        },
      },
    }));
  },

  resetAnimation: (connectionId) => {
    set((current) => ({
      animationStates: {
        ...current.animationStates,
        [connectionId]: {
          ...current.animationStates[connectionId],
          offset: 0,
        },
      },
    }));
  },

  removeAnimation: (connectionId) => {
    set((current) => {
      const newStates = { ...current.animationStates };
      delete newStates[connectionId];
      return { animationStates: newStates };
    });
  },

  // Global animation controls
  setGlobalAnimationSpeed: (speed) => {
    set({ globalAnimationSpeed: speed });
  },

  setGlobalAnimationEnabled: (enabled) => {
    set({ globalAnimationEnabled: enabled });
  },

  toggleGlobalAnimation: () => {
    set((current) => ({
      globalAnimationEnabled: !current.globalAnimationEnabled,
    }));
  },

  // Getters
  getAnimationState: (connectionId) => {
    const state = get();
    return (
      state.animationStates[connectionId] || {
        offset: 0,
        isAnimating: false,
        direction: 'right',
      }
    );
  },

  isAnimating: (connectionId) => {
    const state = get();
    const animationState = state.animationStates[connectionId];
    return (
      state.globalAnimationEnabled && (animationState?.isAnimating || false)
    );
  },

  // Batch operations
  stopAllAnimations: () => {
    set((current) => {
      const newStates = {};
      Object.keys(current.animationStates).forEach((id) => {
        newStates[id] = {
          ...current.animationStates[id],
          isAnimating: false,
        };
      });
      return { animationStates: newStates };
    });
  },

  resetAllAnimations: () => {
    set((current) => {
      const newStates = {};
      Object.keys(current.animationStates).forEach((id) => {
        newStates[id] = {
          ...current.animationStates[id],
          offset: 0,
        };
      });
      return { animationStates: newStates };
    });
  },

  clearAllAnimations: () => {
    set({ animationStates: {} });
  },
}));

export default useAnimatedConnectionLineStore;
