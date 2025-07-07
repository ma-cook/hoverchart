import { Html } from '@react-three/drei';
import { TextStyleUIContent } from './TextStyleUI';

const TextStyleUIContainer = ({ position, onStyleChange, onClose }) => {
  return (
    <Html
      transform
      position={position}
      center
      style={{ pointerEvents: 'auto' }}
    >
      <TextStyleUIContent onStyleChange={onStyleChange} />
      <button onClick={onClose} style={{ cursor: 'pointer' }}>
        Close
      </button>
    </Html>
  );
};

export default TextStyleUIContainer;
