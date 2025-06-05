// Test script to check cell bounds and detect overlaps
console.log('🧪 Testing cell bounds and overlaps...');

// Simulate the current setup
const CELL_SIZE = 2000;
const CELL_NEIGHBOR_RADIUS = 1; // Updated value

const getCellCoordinates = (position) => {
  const [x, y, z] = position;
  return {
    x: Math.floor(x / CELL_SIZE),
    y: Math.floor(y / CELL_SIZE),
    z: Math.floor(z / CELL_SIZE),
  };
};

const getCellBounds = (cellX, cellY, cellZ) => {
  return {
    minX: cellX * CELL_SIZE,
    maxX: (cellX + 1) * CELL_SIZE,
    minY: cellY * CELL_SIZE,
    maxY: (cellY + 1) * CELL_SIZE,
    minZ: cellZ * CELL_SIZE,
    maxZ: (cellZ + 1) * CELL_SIZE,
  };
};

const getNeighborCells = (position, neighborRadius = CELL_NEIGHBOR_RADIUS) => {
  const centerCell = getCellCoordinates(position);
  const neighborCells = [];

  for (
    let x = centerCell.x - neighborRadius;
    x <= centerCell.x + neighborRadius;
    x++
  ) {
    for (
      let y = centerCell.y - neighborRadius;
      y <= centerCell.y + neighborRadius;
      y++
    ) {
      for (
        let z = centerCell.z - neighborRadius;
        z <= centerCell.z + neighborRadius;
        z++
      ) {
        neighborCells.push({ x, y, z });
      }
    }
  }

  return neighborCells;
};

// Test with camera position [20, 20, 50]
const cameraPosition = [20, 20, 50];
console.log('📍 Camera position:', cameraPosition);

const cameraCell = getCellCoordinates(cameraPosition);
console.log('📍 Camera cell:', cameraCell);

const neighborCells = getNeighborCells(cameraPosition);
console.log('📦 Neighbor cells count:', neighborCells.length);
console.log('📦 Expected count for radius 1: 3x3x3 =', 3 * 3 * 3);

// Test for overlaps
console.log('\n🔍 Testing for overlaps...');
const cellBounds = neighborCells.map((cell) => ({
  cellId: `${cell.x},${cell.y},${cell.z}`,
  cell: cell,
  bounds: getCellBounds(cell.x, cell.y, cell.z),
}));

let overlapsFound = 0;
for (let i = 0; i < cellBounds.length; i++) {
  for (let j = i + 1; j < cellBounds.length; j++) {
    const bounds1 = cellBounds[i].bounds;
    const bounds2 = cellBounds[j].bounds;

    // Check if bounds overlap (they should NOT overlap for adjacent cells)
    const overlaps = !(
      bounds1.maxX <= bounds2.minX ||
      bounds2.maxX <= bounds1.minX ||
      bounds1.maxY <= bounds2.minY ||
      bounds2.maxY <= bounds1.minY ||
      bounds1.maxZ <= bounds2.minZ ||
      bounds2.maxZ <= bounds1.minZ
    );

    if (overlaps) {
      overlapsFound++;
      console.warn('🚨 OVERLAP DETECTED!', {
        cell1: cellBounds[i].cellId,
        cell2: cellBounds[j].cellId,
        bounds1: bounds1,
        bounds2: bounds2,
      });
    }
  }
}

if (overlapsFound === 0) {
  console.log('✅ No overlaps found - cell bounds are correct!');
} else {
  console.log(`❌ Found ${overlapsFound} overlapping cell bounds!`);
}

// Show sample bounds for neighboring cells
console.log('\n📊 Sample cell bounds:');
cellBounds.slice(0, 5).forEach((item) => {
  console.log(`Cell ${item.cellId}:`, item.bounds);
});
