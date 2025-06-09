// Test cell coordinate calculations
import {
  getCellCoordinates,
  getCellId,
  CELL_SIZE,
} from './src/services/spatialPartitioning.js';

console.log('=== CELL COORDINATE DEBUG ===');
console.log('CELL_SIZE:', CELL_SIZE);

// Test the actual positions from your database
const oldPosition = [146.32857370126123, 146.32857370126138, 16.86660504111785];
const newPosition = [146.32857370126123, 146.32857370126138, -803.319076642224];

const oldCellCoords = getCellCoordinates(oldPosition);
const newCellCoords = getCellCoordinates(newPosition);

const oldCellId = getCellId(oldCellCoords.x, oldCellCoords.y, oldCellCoords.z);
const newCellId = getCellId(newCellCoords.x, newCellCoords.y, newCellCoords.z);

console.log('Old position:', oldPosition);
console.log('Old cell coords:', oldCellCoords);
console.log('Old cell ID:', oldCellId);

console.log('New position:', newPosition);
console.log('New cell coords:', newCellCoords);
console.log('New cell ID:', newCellId);

// Also test the bounds for each cell
console.log('\n=== CELL BOUNDS ===');
console.log('Cell 0,0,0 Z bounds: 0 to', CELL_SIZE);
console.log('Cell 0,0,-1 Z bounds:', -CELL_SIZE, 'to 0');

console.log(
  '\nOld position Z:',
  oldPosition[2],
  'should be in cell Z:',
  Math.floor(oldPosition[2] / CELL_SIZE)
);
console.log(
  'New position Z:',
  newPosition[2],
  'should be in cell Z:',
  Math.floor(newPosition[2] / CELL_SIZE)
);
