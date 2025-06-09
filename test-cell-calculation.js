// Simple test to verify cell coordinate calculations
const CELL_SIZE = 10000;

const getCellCoordinates = (position) => {
  if (!Array.isArray(position) || position.length < 3) {
    return { x: 0, y: 0, z: 0 };
  }

  const [x, y, z] = position;

  return {
    x: Math.floor(x / CELL_SIZE),
    y: Math.floor(y / CELL_SIZE),
    z: Math.floor(z / CELL_SIZE),
  };
};

const getCellId = (x, y, z) => {
  return `${x},${y},${z}`;
};

// Test with your actual data
console.log('=== CELL COORDINATE CALCULATION TEST ===');

// Old position from your data (the position that was updated in cell 0,0,0)
const oldPosition = [146.32857370126123, 146.32857370126138, 16.86660504111785];
console.log('Old position:', oldPosition);

const oldCellCoords = getCellCoordinates(oldPosition);
const oldCellId = getCellId(oldCellCoords.x, oldCellCoords.y, oldCellCoords.z);
console.log('Old cell coordinates:', oldCellCoords);
console.log('Old cell ID:', oldCellId);

// New position from your data (in cell 0,0,-1)
const newPosition = [146.32857370126123, 146.32857370126138, -803.319076642224];
console.log('\nNew position:', newPosition);

const newCellCoords = getCellCoordinates(newPosition);
const newCellId = getCellId(newCellCoords.x, newCellCoords.y, newCellCoords.z);
console.log('New cell coordinates:', newCellCoords);
console.log('New cell ID:', newCellId);

// Test boundary cases
console.log('\n=== BOUNDARY TESTS ===');
console.log('Position [0, 0, 0] -> Cell:', getCellCoordinates([0, 0, 0]));
console.log('Position [9999, 0, 0] -> Cell:', getCellCoordinates([9999, 0, 0]));
console.log(
  'Position [10000, 0, 0] -> Cell:',
  getCellCoordinates([10000, 0, 0])
);
console.log('Position [0, 0, -1] -> Cell:', getCellCoordinates([0, 0, -1]));
console.log(
  'Position [0, 0, -10000] -> Cell:',
  getCellCoordinates([0, 0, -10000])
);

// Test the specific Z values
console.log('\n=== Z-COORDINATE TESTS ===');
console.log('Z = 16.866 -> Cell Z:', Math.floor(16.866 / CELL_SIZE));
console.log('Z = -803.319 -> Cell Z:', Math.floor(-803.319 / CELL_SIZE));
console.log('Z = 365.821 -> Cell Z:', Math.floor(365.821 / CELL_SIZE));
