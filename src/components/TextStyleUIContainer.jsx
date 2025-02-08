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
      <div
        style={{
          background: 'black',
          padding: '8px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <TextStyleUIContent onStyleChange={onStyleChange} />
        <button onClick={onClose} style={{ cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </Html>
  );
};

export default TextStyleUIContainer;
