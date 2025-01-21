const ColorPicker = ({ onColorSelect, onClose }) => {
  const colors = [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#ffffff',
    '#808080',
    '#000000',
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '8px',
        background: 'white',
        padding: '8px',
        borderRadius: '4px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        zIndex: 1000,
      }}
    >
      {colors.map((color) => (
        <div
          key={color}
          onClick={() => {
            onColorSelect(color);
            onClose();
          }}
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: color,
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
};

export default ColorPicker;
