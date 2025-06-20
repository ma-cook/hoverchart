import { create } from 'zustand';

const useTextObjectStore = create((set, get) => ({
  // Text objects state - keyed by object ID
  textObjects: {}, // { objectId: { text, isEditing, isActivelyEditing, textStyle, scale, etc. } }

  // Text sprites state - keyed by sprite ID
  textSprites: {}, // { spriteId: { isDragging } }

  // Get text object state by ID
  getTextObject: (objectId) => {
    const state = get();
    return (
      state.textObjects[objectId] || {
        text: '',
        isEditing: false,
        isActivelyEditing: false,
        textStyle: { fontSize: 32, color: 'black' },
        scale: [15, 10, 1],
        indicatorSelected: false,
        contentHeight: 'auto',
        isMoving: false,
        showTransform: false,
        showResizeArrow: false,
        showResizeControls: false,
        bulletPointMode: false,
      }
    );
  },

  // Set text object state
  setTextObject: (objectId, updates) => {
    set((state) => ({
      textObjects: {
        ...state.textObjects,
        [objectId]: {
          ...state.textObjects[objectId],
          ...updates,
        },
      },
    }));
  },

  // Update specific property of a text object
  updateTextObjectProperty: (objectId, property, value) => {
    set((state) => ({
      textObjects: {
        ...state.textObjects,
        [objectId]: {
          ...state.textObjects[objectId],
          [property]: value,
        },
      },
    }));
  },

  // Text property setters
  setText: (objectId, text) => {
    get().updateTextObjectProperty(objectId, 'text', text);
  },

  setIsEditing: (objectId, isEditing) => {
    get().updateTextObjectProperty(objectId, 'isEditing', isEditing);
  },

  setIsActivelyEditing: (objectId, isActivelyEditing) => {
    get().updateTextObjectProperty(
      objectId,
      'isActivelyEditing',
      isActivelyEditing
    );
  },

  setTextStyle: (objectId, textStyle) => {
    get().updateTextObjectProperty(objectId, 'textStyle', textStyle);
  },

  setScale: (objectId, scale) => {
    get().updateTextObjectProperty(objectId, 'scale', scale);
  },

  setIndicatorSelected: (objectId, indicatorSelected) => {
    get().updateTextObjectProperty(
      objectId,
      'indicatorSelected',
      indicatorSelected
    );
  },

  setContentHeight: (objectId, contentHeight) => {
    get().updateTextObjectProperty(objectId, 'contentHeight', contentHeight);
  },

  setIsMoving: (objectId, isMoving) => {
    get().updateTextObjectProperty(objectId, 'isMoving', isMoving);
  },

  setShowTransform: (objectId, showTransform) => {
    get().updateTextObjectProperty(objectId, 'showTransform', showTransform);
  },

  setShowResizeArrow: (objectId, showResizeArrow) => {
    get().updateTextObjectProperty(
      objectId,
      'showResizeArrow',
      showResizeArrow
    );
  },

  setShowResizeControls: (objectId, showResizeControls) => {
    get().updateTextObjectProperty(
      objectId,
      'showResizeControls',
      showResizeControls
    );
  },

  setBulletPointMode: (objectId, bulletPointMode) => {
    get().updateTextObjectProperty(
      objectId,
      'bulletPointMode',
      bulletPointMode
    );
  },

  // Initialize text object with initial values
  initializeTextObject: (objectId, initialData = {}) => {
    const defaultData = {
      text: initialData.text || '',
      isEditing: false,
      isActivelyEditing: false,
      textStyle: initialData.textStyle || { fontSize: 32, color: 'black' },
      scale: initialData.scale || [15, 10, 1],
      indicatorSelected: false,
      contentHeight: 'auto',
      isMoving: false,
      showTransform: false,
      showResizeArrow: false,
      showResizeControls: false,
      bulletPointMode: false,
    };

    set((state) => ({
      textObjects: {
        ...state.textObjects,
        [objectId]: {
          ...defaultData,
          ...initialData,
        },
      },
    }));
  },

  // Clear text object state
  clearTextObject: (objectId) => {
    set((state) => {
      const newTextObjects = { ...state.textObjects };
      delete newTextObjects[objectId];
      return { textObjects: newTextObjects };
    });
  },

  // Text Sprite Actions
  getTextSprite: (spriteId) => {
    const state = get();
    return (
      state.textSprites[spriteId] || {
        isDragging: false,
      }
    );
  },

  setTextSpriteDragging: (spriteId, isDragging) => {
    set((state) => ({
      textSprites: {
        ...state.textSprites,
        [spriteId]: {
          ...state.textSprites[spriteId],
          isDragging,
        },
      },
    }));
  },

  clearTextSprite: (spriteId) => {
    set((state) => {
      const newTextSprites = { ...state.textSprites };
      delete newTextSprites[spriteId];
      return { textSprites: newTextSprites };
    });
  },

  // Utility actions
  clearAllTextObjects: () => {
    set({ textObjects: {} });
  },

  clearAllTextSprites: () => {
    set({ textSprites: {} });
  },

  clearAll: () => {
    set({ textObjects: {}, textSprites: {} });
  },
}));

export default useTextObjectStore;
