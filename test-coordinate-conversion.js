// Test script to verify coordinate conversion logic
console.log('Testing coordinate conversion...');

// Simulate the conversion logic from useConnections.js
const loadedCells = ['0,0,0', '1,0,0', '0,1,0', '1,1,0'];

const cellCoords = Array.isArray(loadedCells)
  ? loadedCells
      .map((cellId) => {
        if (typeof cellId === 'string') {
          const [x, y, z] = cellId.split(',').map(Number);
          return { x, y, z: z || 0 }; // Default z to 0 for backward compatibility
        }
        return cellId; // Already an object
      })
      .filter(
        (coords) =>
          coords &&
          typeof coords.x === 'number' &&
          typeof coords.y === 'number' &&
          typeof coords.z === 'number'
      )
  : [];

console.log('Input loadedCells:', loadedCells);
console.log('Converted cellCoords:', cellCoords);

// Test edge cases
const edgeCases = ['0,0', '1,1,', 'invalid', '', '2,3,4'];
console.log('\nTesting edge cases:', edgeCases);

const edgeConversion = edgeCases
  .map((cellId) => {
    if (typeof cellId === 'string') {
      const [x, y, z] = cellId.split(',').map(Number);
      return { x, y, z: z || 0 };
    }
    return cellId;
  })
  .filter(
    (coords) =>
      coords &&
      typeof coords.x === 'number' &&
      typeof coords.y === 'number' &&
      typeof coords.z === 'number'
  );

console.log('Edge case results:', edgeConversion);
console.log('Conversion test complete!');
