import { createWithEqualityFn } from 'zustand/traditional';

const useTextInputStore = createWithEqualityFn((set, get) => ({
  // State for all text inputs across the app
  textInputs: {}, // { inputId: { text: string, type: 'face' | 'header' } }
  // Get text input state by ID, with optional initial text
  getTextInput: (inputId, initialText = '') => {
    const state = get();
    const existing = state.textInputs[inputId];

    // If no existing state and we have initial text, create it
    if (!existing && initialText) {
      set((currentState) => ({
        textInputs: {
          ...currentState.textInputs,
          [inputId]: {
            text: initialText,
            type: 'face',
          },
        },
      }));
      return { text: initialText, type: 'face' };
    }

    return existing || { text: initialText, type: 'face' };
  },

  // Set text for a specific input
  setText: (inputId, text, type = 'face') => {
    set((state) => ({
      textInputs: {
        ...state.textInputs,
        [inputId]: {
          text,
          type,
        },
      },
    }));
  },

  // Clear text for a specific input
  clearText: (inputId) => {
    set((state) => ({
      textInputs: {
        ...state.textInputs,
        [inputId]: {
          ...state.textInputs[inputId],
          text: '',
        },
      },
    }));
  }, // Submit text and clear it
  submitText: (inputId, onSubmit) => {
    const state = get();
    const textInput = state.textInputs[inputId];
    if (textInput) {
      // Always call onSubmit to close the input, even with empty text
      onSubmit(textInput.text || '');
      // Delay clearing the text to ensure submission completes
      setTimeout(() => {
        get().clearText(inputId);
      }, 100); // Small delay to ensure submission completes
    } else {
      // If no textInput exists, still call onSubmit with empty text to close the input
      onSubmit('');
    }
  },

  // Remove a text input entirely
  removeTextInput: (inputId) => {
    set((state) => {
      const newTextInputs = { ...state.textInputs };
      delete newTextInputs[inputId];
      return { textInputs: newTextInputs };
    });
  },

  // Clear all text inputs
  clearAllTextInputs: () => {
    set({ textInputs: {} });
  },
  // Get all text inputs of a specific type
  getTextInputsByType: (type) => {
    const state = get();
    return Object.entries(state.textInputs)
      .filter(([, input]) => input.type === type)
      .reduce((acc, [id, input]) => {
        acc[id] = input;
        return acc;
      }, {});
  },
}));

export default useTextInputStore;
