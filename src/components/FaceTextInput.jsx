import { Html } from '@react-three/drei';
import { useState } from 'react';

const FaceTextInput = ({ position, onTextSubmit }) => {
  const [text, setText] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onTextSubmit(text);
      setText('');
    }
  };

  return (
    <Html position={position} center>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter face text..."
        className="header-input"
        autoFocus
      />
    </Html>
  );
};

export default FaceTextInput;
