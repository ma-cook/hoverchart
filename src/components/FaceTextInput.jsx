import React from 'react';
import { Html } from '@react-three/drei';
import { useTextInputStore } from '../stores';
import { useEffect, useRef } from 'react';

const FaceTextInput = React.memo(
  ({ position, onTextSubmit, inputId = 'default-face', initialText = '' }) => {
    const inputRef = useRef(null);
    const setText = useTextInputStore((state) => state.setText);
    const submitText = useTextInputStore((state) => state.submitText);

    // Get text directly from store to avoid calling getTextInput on every render
    const text = useTextInputStore((state) => {
      const textInput = state.textInputs[inputId];
      return textInput ? textInput.text : initialText;
    });
    // Initialize text in store if it doesn't exist and we have initial text
    useEffect(() => {
      if (initialText && !useTextInputStore.getState().textInputs[inputId]) {
        setText(inputId, initialText, 'face');
      }
    }, [inputId, initialText, setText]);

    // Force focus when component mounts
    useEffect(() => {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // Select all text for easier editing
        }
      }, 100); // Small delay to ensure HTML is rendered

      return () => clearTimeout(timer);
    }, []);

    const handleKeyDown = (e) => {
      // Prevent the 3D canvas from capturing these events
      e.stopPropagation();

      if (e.key === 'Enter') {
        submitText(inputId, onTextSubmit);
      } else if (e.key === 'Escape') {
        // Allow escaping without submitting
        onTextSubmit?.(''); // Submit empty text to close
      }
    };

    const handleChange = (e) => {
      e.stopPropagation(); // Prevent event bubbling
      setText(inputId, e.target.value, 'face');
    };
    const handleFocus = (e) => {
      e.stopPropagation();
    };

    const handleBlur = (e) => {
      e.stopPropagation();
    };

    return (
      <Html position={position} center>
        <div style={{ pointerEvents: 'auto' }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Enter face text..."
            className="header-input"
            style={{
              pointerEvents: 'auto',
              zIndex: 1000,
              position: 'relative',
            }}
            autoFocus
          />
        </div>{' '}
      </Html>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.position === nextProps.position &&
      prevProps.inputId === nextProps.inputId &&
      prevProps.initialText === nextProps.initialText
    );
  }
);

FaceTextInput.displayName = 'FaceTextInput';

export default FaceTextInput;
