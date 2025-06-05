/**
 * Test Script: Spatial Object Unloading Integration
 *
 * This script tests the critical issue where objects (cubes, dodecahedrons, planes, connectors)
 * were not being unloaded from the UI when their containing cells were unloaded.
 *
 * Expected Behavior After Fix:
 * 1. Objects should be tracked when loaded and associated with their cells
 * 2. When cells are unloaded due to distance, objects in those cells should be removed from UI
 * 3. Cell loading should not block cell unloading operations
 *
 * Run this in browser console after the app loads
 */

// Test Configuration
const TEST_CONFIG = {
  // Move camera far enough to trigger cell unloading (CELL_UNLOAD_DISTANCE = 2)
  UNLOAD_DISTANCE: 250, // Should be > 2 * CELL_SIZE (assuming CELL_SIZE = 100)
  LOAD_DISTANCE: 150, // Close enough to load cells
  TEST_DURATION: 10000, // 10 seconds
  POSITION_CHECK_INTERVAL: 500, // Check every 500ms
};

// Global test state
window.testState = {
  startTime: Date.now(),
  initialObjectCount: 0,
  currentObjectCount: 0,
  cellsLoaded: new Set(),
  cellsUnloaded: new Set(),
  objectsTracked: new Map(), // objectId -> cellId
  objectsRemoved: new Set(),
  logs: [],
};

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  window.testState.logs.push(logMessage);
}

function getCurrentObjectCount() {
  // Count visible objects in the scene
  const objectTypes = ['cubes', 'dodecahedrons', 'planes', 'textObjects'];
  let totalCount = 0;

  objectTypes.forEach((type) => {
    if (window[type] && typeof window[type] === 'object') {
      totalCount += Object.keys(window[type]).length;
    }
  });

  return totalCount;
}

function getSpatialManagerState() {
  // Access the spatial manager state through React DevTools or global exposure
  if (window.spatialManagerState) {
    return window.spatialManagerState;
  }

  // Alternative: check loaded cells from DOM or other indicators
  return {
    loadedCells: [],
    isInitialized: false,
    currentCellCoords: { x: 0, y: 0, z: 0 },
  };
}

function simulateMovement(distance, label) {
  return new Promise((resolve) => {
    log(`📍 Simulating ${label} movement to distance ${distance}`);

    // Get camera reference (assuming it's available globally or through React refs)
    const camera = window.cameraRef?.current?.camera;
    if (!camera) {
      log('❌ Camera not available for movement simulation');
      resolve();
      return;
    }

    // Move camera to specific position
    const targetPosition = [distance, 20, 50];
    camera.position.set(...targetPosition);

    // Trigger position update manually if needed
    if (window.updateCameraPosition) {
      window.updateCameraPosition(targetPosition);
    }

    log(`✅ Camera moved to position: [${targetPosition.join(', ')}]`);

    // Wait for spatial system to process the movement
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

async function runSpatialObjectUnloadingTest() {
  log('🚀 Starting Spatial Object Unloading Integration Test');
  log('='.repeat(60));

  // Initialize test state
  window.testState.startTime = Date.now();
  window.testState.initialObjectCount = getCurrentObjectCount();

  log(`📊 Initial object count: ${window.testState.initialObjectCount}`);

  // Phase 1: Load objects by moving to LOAD_DISTANCE
  log('\n📦 Phase 1: Loading objects near camera');
  await simulateMovement(TEST_CONFIG.LOAD_DISTANCE, 'LOAD');

  // Wait and check object count
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const loadedObjectCount = getCurrentObjectCount();
  window.testState.currentObjectCount = loadedObjectCount;

  log(`📊 Objects after loading phase: ${loadedObjectCount}`);
  log(
    `📈 Objects added: ${
      loadedObjectCount - window.testState.initialObjectCount
    }`
  );

  // Phase 2: Move far away to trigger unloading
  log('\n🗑️ Phase 2: Moving away to trigger cell/object unloading');
  await simulateMovement(TEST_CONFIG.UNLOAD_DISTANCE, 'UNLOAD');

  // Wait for unloading to complete
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const finalObjectCount = getCurrentObjectCount();

  log(`📊 Objects after unloading phase: ${finalObjectCount}`);
  log(`📉 Objects removed: ${loadedObjectCount - finalObjectCount}`);

  // Phase 3: Analyze results
  log('\n📋 Phase 3: Test Results Analysis');
  log('='.repeat(40));

  const expectedBehavior = {
    objectsRemoved: loadedObjectCount > finalObjectCount,
    significantReduction: loadedObjectCount - finalObjectCount > 0,
  };

  // Check if objects were properly unloaded
  if (expectedBehavior.objectsRemoved) {
    log('✅ SUCCESS: Objects were removed when cells were unloaded');
    log(
      `✅ Object count reduced from ${loadedObjectCount} to ${finalObjectCount}`
    );
  } else {
    log('❌ FAILURE: Objects were NOT removed when cells were unloaded');
    log('❌ This indicates the integration issue is still present');
  }

  // Check spatial manager state
  const spatialState = getSpatialManagerState();
  log(`📍 Spatial manager initialized: ${spatialState.isInitialized}`);
  log(
    `📍 Current cell coords: ${JSON.stringify(spatialState.currentCellCoords)}`
  );
  log(`📍 Loaded cells count: ${spatialState.loadedCells.length}`);

  // Phase 4: Return to origin to test reloading
  log('\n🔄 Phase 4: Returning to origin to test reloading');
  await simulateMovement(20, 'RETURN');

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const reloadedObjectCount = getCurrentObjectCount();

  log(`📊 Objects after return to origin: ${reloadedObjectCount}`);

  if (reloadedObjectCount > finalObjectCount) {
    log('✅ SUCCESS: Objects reloaded when returning to populated area');
  } else {
    log('⚠️ NOTICE: No objects reloaded (may be expected if area was empty)');
  }

  // Final summary
  log('\n📈 Test Summary');
  log('='.repeat(30));
  log(`Initial objects: ${window.testState.initialObjectCount}`);
  log(`After loading: ${loadedObjectCount}`);
  log(`After unloading: ${finalObjectCount}`);
  log(`After return: ${reloadedObjectCount}`);
  log(`Test duration: ${Date.now() - window.testState.startTime}ms`);

  // Save results to window for manual inspection
  window.testResults = {
    success: expectedBehavior.objectsRemoved,
    objectCounts: {
      initial: window.testState.initialObjectCount,
      afterLoading: loadedObjectCount,
      afterUnloading: finalObjectCount,
      afterReturn: reloadedObjectCount,
    },
    spatialState: spatialState,
    logs: window.testState.logs,
  };

  log('💾 Test results saved to window.testResults');
  return window.testResults;
}

// Enhanced monitoring function
function startContinuousMonitoring() {
  log('👀 Starting continuous object monitoring...');

  const monitor = setInterval(() => {
    const currentCount = getCurrentObjectCount();
    const spatialState = getSpatialManagerState();

    if (currentCount !== window.testState.currentObjectCount) {
      log(
        `📊 Object count changed: ${window.testState.currentObjectCount} → ${currentCount}`
      );
      window.testState.currentObjectCount = currentCount;
    }
  }, TEST_CONFIG.POSITION_CHECK_INTERVAL);

  // Auto-stop monitoring after test duration
  setTimeout(() => {
    clearInterval(monitor);
    log('⏹️ Continuous monitoring stopped');
  }, TEST_CONFIG.TEST_DURATION);

  return monitor;
}

// Expose functions globally for manual testing
window.runSpatialObjectUnloadingTest = runSpatialObjectUnloadingTest;
window.startContinuousMonitoring = startContinuousMonitoring;
window.simulateMovement = simulateMovement;

log('🔧 Spatial object unloading test script loaded');
log('📝 Run: runSpatialObjectUnloadingTest() to start the test');
log('📝 Run: startContinuousMonitoring() for continuous object monitoring');
