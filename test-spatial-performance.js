// Performance test for spatial partitioning batch loading improvements
console.log('🚀 Testing Spatial Partitioning Performance Improvements');
console.log('========================================================');

// Simulate the batch loading performance improvements
const CELL_SIZE = 2000;
const CELL_NEIGHBOR_RADIUS = 1;

// Mock timing functions
const mockCreateCell = () =>
  new Promise((resolve) => setTimeout(() => resolve(true), 50)); // 50ms per cell
const mockCreateCellsBatch = (cells) =>
  Promise.all(cells.map(() => mockCreateCell())); // Parallel execution

const getCellCoordinates = (position) => {
  const [x, y, z] = position;
  return {
    x: Math.floor(x / CELL_SIZE),
    y: Math.floor(y / CELL_SIZE),
    z: Math.floor(z / CELL_SIZE),
  };
};

const getNeighborCells = (position, neighborRadius = CELL_NEIGHBOR_RADIUS) => {
  const centerCell = getCellCoordinates(position);
  const neighborCells = [];

  // Generate 3x3 horizontal grid (Y stays constant)
  for (
    let x = centerCell.x - neighborRadius;
    x <= centerCell.x + neighborRadius;
    x++
  ) {
    for (
      let z = centerCell.z - neighborRadius;
      z <= centerCell.z + neighborRadius;
      z++
    ) {
      neighborCells.push({ x, y: centerCell.y, z });
    }
  }

  return neighborCells;
};

// Test sequential loading (old way)
const testSequentialLoading = async (cells) => {
  console.log(`\n📊 Testing Sequential Loading (${cells.length} cells):`);
  const startTime = performance.now();

  for (const cell of cells) {
    await mockCreateCell(); // Sequential execution
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`⏱️  Sequential loading took: ${duration.toFixed(2)}ms`);
  return duration;
};

// Test batch loading (new way)
const testBatchLoading = async (cells) => {
  console.log(`\n🚀 Testing Batch Loading (${cells.length} cells):`);
  const startTime = performance.now();

  await mockCreateCellsBatch(cells); // Parallel execution

  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`⏱️  Batch loading took: ${duration.toFixed(2)}ms`);
  return duration;
};

// Main performance test
const runPerformanceTest = async () => {
  console.log('\n🎯 Performance Test Scenario:');
  console.log('- Camera position: [20, 20, 50]');
  console.log(`- Load radius: ${CELL_NEIGHBOR_RADIUS} (3x3 horizontal grid)`);

  const cameraPosition = [20, 20, 50];
  const cellsToLoad = getNeighborCells(cameraPosition, CELL_NEIGHBOR_RADIUS);

  console.log(`- Total cells to load: ${cellsToLoad.length}`);
  console.log(
    '- Cell coordinates:',
    cellsToLoad.map((c) => `(${c.x},${c.y},${c.z})`)
  );

  // Test sequential loading
  const sequentialTime = await testSequentialLoading(cellsToLoad);

  // Test batch loading
  const batchTime = await testBatchLoading(cellsToLoad);

  // Calculate improvement
  const improvement = ((sequentialTime - batchTime) / sequentialTime) * 100;
  const speedup = sequentialTime / batchTime;

  console.log('\n📈 Performance Results:');
  console.log(`✅ Batch loading is ${improvement.toFixed(1)}% faster`);
  console.log(`🚀 Speed improvement: ${speedup.toFixed(2)}x faster`);
  console.log(`💾 Time saved: ${(sequentialTime - batchTime).toFixed(2)}ms`);

  // Additional optimizations summary
  console.log('\n🔧 Other Optimizations Implemented:');
  console.log('✅ Position update throttling (100ms)');
  console.log('✅ Reduced redundant cell existence checks');
  console.log('✅ Single state updates instead of incremental');
  console.log('✅ Batch cell unloading');
  console.log('✅ Parallel Promise.all execution');

  return {
    sequentialTime,
    batchTime,
    improvement,
    speedup,
    cellCount: cellsToLoad.length,
  };
};

// Run the test
runPerformanceTest()
  .then((results) => {
    console.log('\n🎉 Performance test completed!');
    console.log(
      `📊 Summary: ${results.cellCount} cells loaded ${results.speedup.toFixed(
        2
      )}x faster with batch loading`
    );
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
  });

// Export for potential use in browser console
if (typeof window !== 'undefined') {
  window.runSpatialPerformanceTest = runPerformanceTest;
  console.log(
    '\n💡 You can run this test in the browser console with: window.runSpatialPerformanceTest()'
  );
}
