import { Html } from '@react-three/drei';
import { useState, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

const PlaneMeshText = ({
  scale,
  width,
  height,
  onTextChange,
  initialText = '',
}) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef();
  const { camera } = useThree();

  // Calculate text area size based on plane dimensions
  const getTextAreaStyle = () => {
    const planeWidth = width * scale[0];
    const planeHeight = height * scale[1];

    return {
      width: `${planeWidth * 10}px`,
      height: `${planeHeight * 10}px`,
      background: 'transparent',
      color: 'white',
      border: 'none',
      padding: '8px',
      resize: 'none',
      fontSize: '16px',
      fontFamily: 'Arial',
      overflow: 'hidden',
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
    };
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    onTextChange?.(e.target.value);
  };

  // Auto-resize text to fit plane
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <Html center transform>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        style={getTextAreaStyle()}
        placeholder="Type here..."
        autoFocus
      />
    </Html>
  );
};

export default PlaneMeshText;
