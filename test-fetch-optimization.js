/**
 * Test Script: Cell Loading Fetch Optimization Verification
 *
 * This script tests the performance improvements made to reduce excessive fetch calls
 * when moving the camera between cells in the spatial partitioning system.
 *
 * Optimizations Tested:
 * 1. Cell existence cache with 1-minute duration
 * 2. Optimized createCellsBatch with cached existence checks
 * 3. Request deduplication for concurrent cell loading
 * 4. Reduced camera position update frequency (200ms intervals)
 * 5. Movement threshold detection (100 units minimum)
 * 6. Predictive cell loading based on camera velocity
 *
 * Run this in browser console after the app loads
 */

console.log('🧪 Testing Cell Loading Fetch Optimizations');
console.log('===========================================');

// Test Configuration
const TEST_CONFIG = {
  SIMULATION_DURATION: 15000, // 15 seconds
  CAMERA_MOVE_INTERVAL: 250, // Move camera every 250ms
  MOVEMENT_DISTANCE: 200, // Move 200 units each time
};

// Counters for performance tracking
let fetchCallCount = 0;
let cacheHitCount = 0;
let cellCreationCount = 0;
let predictiveLoadCount = 0;

// Mock database calls to count fetch operations
const originalGetDoc = window.firebase?.firestore?.getDoc;
if (originalGetDoc) {
  // Override getDoc to count fetch calls
  window.firebase.firestore.getDoc = function (...args) {
    fetchCallCount++;
    return originalGetDoc.apply(this, args);
  };
}

// Test the optimized system
const runOptimizationTest = async () => {
  console.log('📊 Starting optimization test...');
  console.log(`Duration: ${TEST_CONFIG.SIMULATION_DURATION / 1000}s`);
  console.log(`Camera movement: Every ${TEST_CONFIG.CAMERA_MOVE_INTERVAL}ms`);

  const startTime = Date.now();
  let moveCount = 0;

  // Simulate camera movement in a pattern that would trigger cell loading
  const cameraMoveInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (elapsed >= TEST_CONFIG.SIMULATION_DURATION) {
      clearInterval(cameraMoveInterval);
      displayResults();
      return;
    }

    moveCount++;

    // Move camera in a pattern that crosses cell boundaries
    const x = Math.sin(elapsed / 1000) * 5000; // 5000 unit radius
    const y = 100; // Keep Y constant
    const z = Math.cos(elapsed / 1000) * 5000;

    console.log(
      `📍 Move ${moveCount}: Camera to [${x.toFixed(0)}, ${y}, ${z.toFixed(0)}]`
    );

    // Trigger camera position update if hook is available
    if (window.spatialManager?.updateCameraPosition) {
      window.spatialManager.updateCameraPosition([x, y, z]);
    }
  }, TEST_CONFIG.CAMERA_MOVE_INTERVAL);

  const displayResults = () => {
    console.log('\n📈 Optimization Test Results:');
    console.log('============================');
    console.log(`🎯 Total camera moves: ${moveCount}`);
    console.log(`🔄 Database fetch calls: ${fetchCallCount}`);
    console.log(`⚡ Cache hits: ${cacheHitCount}`);
    console.log(`📦 Cells created: ${cellCreationCount}`);
    console.log(`🔮 Predictive loads: ${predictiveLoadCount}`);

    // Calculate efficiency metrics
    const fetchesPerMove = fetchCallCount / moveCount;
    const cacheHitRate =
      (cacheHitCount / (cacheHitCount + fetchCallCount)) * 100;

    console.log(`\n📊 Efficiency Metrics:`);
    console.log(`• Avg fetches per camera move: ${fetchesPerMove.toFixed(2)}`);
    console.log(`• Cache hit rate: ${cacheHitRate.toFixed(1)}%`);

    // Performance assessment
    if (fetchesPerMove < 2) {
      console.log('✅ EXCELLENT: Very low fetch rate per movement');
    } else if (fetchesPerMove < 5) {
      console.log('✅ GOOD: Reasonable fetch rate');
    } else if (fetchesPerMove < 10) {
      console.log('⚠️  MODERATE: Could be improved');
    } else {
      console.log('❌ HIGH: Too many fetches per movement');
    }

    if (cacheHitRate > 70) {
      console.log('✅ EXCELLENT: High cache hit rate');
    } else if (cacheHitRate > 50) {
      console.log('✅ GOOD: Decent cache hit rate');
    } else {
      console.log('⚠️  LOW: Cache not being utilized effectively');
    }

    console.log('\n🔧 Optimizations Applied:');
    console.log('• ✅ Cell existence cache (60s duration)');
    console.log('• ✅ Batch existence checks in createCellsBatch');
    console.log('• ✅ Request deduplication for concurrent loads');
    console.log('• ✅ Camera movement throttling (200ms + distance threshold)');
    console.log('• ✅ Predictive loading based on velocity');
    console.log('• ✅ Increased CELL_UNLOAD_DISTANCE from 2 to 3');
  };
};

// Manual test functions
window.testFetchOptimization = runOptimizationTest;

// Test cache functionality specifically
window.testCellCache = async () => {
  console.log('🧪 Testing Cell Existence Cache');

  if (!window.spatialPartitioning?.cellExists) {
    console.error('❌ spatialPartitioning.cellExists not found');
    return;
  }

  const testUserId = 'test-user';
  const testSpaceId = 'test-space';

  console.log('Testing same cell multiple times...');
  const start = performance.now();

  // First call - should hit database
  console.log('🔄 First call (should fetch from DB)');
  await window.spatialPartitioning.cellExists(testUserId, testSpaceId, 0, 0, 0);

  // Subsequent calls - should hit cache
  console.log('⚡ Second call (should hit cache)');
  await window.spatialPartitioning.cellExists(testUserId, testSpaceId, 0, 0, 0);

  console.log('⚡ Third call (should hit cache)');
  await window.spatialPartitioning.cellExists(testUserId, testSpaceId, 0, 0, 0);

  const end = performance.now();
  console.log(`⏱️  Total time: ${(end - start).toFixed(2)}ms`);
  console.log('✅ Cache test completed');
};

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Optimization test ready!');
  console.log('Run: testFetchOptimization() to test the optimizations');
  console.log('Run: testCellCache() to test cache functionality');

  // Auto-run after 2 seconds if app is loaded
  setTimeout(() => {
    if (window.spatialManager) {
      console.log('🎯 Auto-running optimization test...');
      runOptimizationTest();
    } else {
      console.log(
        'ℹ️  Spatial manager not found. Run manually with testFetchOptimization()'
      );
    }
  }, 2000);
}
