import React from 'react';
import { useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useTextInputStore } from '../stores';

const HeaderInput = React.memo(
  ({
    position,
    onTextSubmit,
    inputId = 'default-header',
    initialText = '',
  }) => {
    const groupRef = useRef();
    const inputRef = useRef(null);
    const setText = useTextInputStore((state) => state.setText);
    const submitText = useTextInputStore((state) => state.submitText);

    // Get text directly from store to avoid calling getTextInput on every render
    const headerText = useTextInputStore((state) => {
      const textInput = state.textInputs[inputId];
      return textInput ? textInput.text : initialText;
    });

    // Initialize text in store if it doesn't exist and we have initial text
    useEffect(() => {
      if (initialText && !useTextInputStore.getState().textInputs[inputId]) {
        setText(inputId, initialText, 'header');
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

    useFrame(({ camera }) => {
      if (groupRef.current) {
        // Only handle rotation, maintain original position
        groupRef.current.quaternion.copy(camera.quaternion);
      }
    });

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
      setText(inputId, e.target.value, 'header');
    };
    const handleFocus = (e) => {
      e.stopPropagation();
    };

    const handleBlur = (e) => {
      e.stopPropagation();
    };

    return (
      <group ref={groupRef} position={position}>
        <Html
          center
          style={{
            background: 'white',
            padding: '4px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            pointerEvents: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={headerText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Enter header text..."
            className="header-input"
            style={{
              pointerEvents: 'auto',
              zIndex: 1000,
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </Html>{' '}
      </group>
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

HeaderInput.displayName = 'HeaderInput';

export default HeaderInput;
