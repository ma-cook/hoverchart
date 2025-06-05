/**
 * Test Script: Object Unloading Fix Verification
 * 
 * This script verifies that the fix for object unloading after page refresh works correctly.
 * 
 * The Issue:
 * - Objects added before page refresh weren't being tracked properly
 * - When cells were unloaded, these untracked objects remained in the UI
 * 
 * The Fix:
 * 1. Removed the `isSpatialInitialized` requirement from object tracking in subscribeToSpatialObjects callback
 * 2. Added retroactive tracking when spatial manager becomes initialized
 * 3. Fixed cellCoords to include proper z coordinate
 * 
 * Run this in browser console after adding some objects and refreshing the page
 */

console.log('🧪 Testing Object Unloading Fix...');

// Test Configuration
const TEST_CONFIG = {
  MOVE_DISTANCE: 250, // Distance to trigger cell unloading
  CHECK_INTERVAL: 1000, // Check every second
  TEST_DURATION: 15000, // 15 seconds total
};

// Test state
window.testUnloadingFix = {
  startTime: Date.now(),
  initialObjectCount: 0,
  objectsBeforeMove: 0,
  objectsAfterMove: 0,
  cellsLoadedInitially: [],
  cellsLoadedAfterMove: [],
  trackingDataBefore: {},
  trackingDataAfter: {},
  success: false,
  logs: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📝';
  const logMessage = `${emoji} [${timestamp}] ${message}`;
  console.log(logMessage);
  window.testUnloadingFix.logs.push(logMessage);
}

function getObjectCount() {
  if (!window.objects || !Array.isArray(window.objects)) {
    // Try alternative ways to get object count
    const objectTypes = ['cubes', 'dodecahedrons', 'planes', 'textObjects'];
    let totalCount = 0;
    
    objectTypes.forEach(type => {
      if (window[type] && typeof window[type] === 'object') {
        totalCount += Object.keys(window[type]).length;
      }
    });
    
    return totalCount;
  }
  return window.objects.length;
}

function getSpatialManagerState() {
  if (window._spatialManagerDebug) {
    return {
      loadedCells: Array.from(window._spatialManagerDebug.loadedCells || []),
      isInitialized: window._spatialManagerDebug.isInitialized,
      objectCount: window._spatialManagerDebug.objects
    };
  }
  return {
    loadedCells: [],
    isInitialized: false,
    objectCount: 0
  };
}

function getObjectTrackingData() {
  // Try to access the objectsByCellRef through debug context
  if (window._spatialManagerDebug && window._spatialManagerDebug.trackObjectInCell) {
    // The tracking data is internal to the spatial manager
    // We'll track what we can observe
    return {
      available: true,
      timestamp: Date.now()
    };
  }
  return {
    available: false,
    timestamp: Date.now()
  };
}

async function moveCamera(x, y, z) {
  const camera = window.camera || window.cameraRef?.current?.camera;
  if (!camera) {
    log('Camera not available for movement', 'error');
    return false;
  }
  
  log(`Moving camera to position [${x}, ${y}, ${z}]`);
  camera.position.set(x, y, z);
  
  // Trigger position update if available
  if (window.updateCameraPosition) {
    window.updateCameraPosition([x, y, z]);
  }
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  return true;
}

async function runUnloadingTest() {
  log('Starting Object Unloading Fix Test', 'info');
  
  // Step 1: Record initial state
  const initialState = getSpatialManagerState();
  const initialObjectCount = getObjectCount();
  const initialTracking = getObjectTrackingData();
  
  window.testUnloadingFix.initialObjectCount = initialObjectCount;
  window.testUnloadingFix.objectsBeforeMove = initialObjectCount;
  window.testUnloadingFix.cellsLoadedInitially = initialState.loadedCells;
  window.testUnloadingFix.trackingDataBefore = initialTracking;
  
  log(`Initial state: ${initialObjectCount} objects, ${initialState.loadedCells.length} cells loaded`);
  log(`Spatial manager initialized: ${initialState.isInitialized}`);
  log(`Object tracking available: ${initialTracking.available}`);
  
  if (initialObjectCount === 0) {
    log('No objects found! Please add some objects first and refresh the page.', 'warning');
    return;
  }
  
  if (!initialState.isInitialized) {
    log('Spatial manager not initialized! Waiting...', 'warning');
    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 3000));
    const retryState = getSpatialManagerState();
    if (!retryState.isInitialized) {
      log('Spatial manager still not initialized after waiting', 'error');
      return;
    }
  }
  
  // Step 2: Move camera far away to trigger cell unloading
  log('Moving camera far away to trigger cell unloading...');
  const moveSuccess = await moveCamera(TEST_CONFIG.MOVE_DISTANCE, 20, 50);
  
  if (!moveSuccess) {
    log('Failed to move camera', 'error');
    return;
  }
  
  // Step 3: Wait and check results
  log('Waiting for spatial system to process movement...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const finalState = getSpatialManagerState();
  const finalObjectCount = getObjectCount();
  const finalTracking = getObjectTrackingData();
  
  window.testUnloadingFix.objectsAfterMove = finalObjectCount;
  window.testUnloadingFix.cellsLoadedAfterMove = finalState.loadedCells;
  window.testUnloadingFix.trackingDataAfter = finalTracking;
  
  log(`Final state: ${finalObjectCount} objects, ${finalState.loadedCells.length} cells loaded`);
  
  // Step 4: Analyze results
  const objectsRemoved = initialObjectCount - finalObjectCount;
  const cellsChanged = initialState.loadedCells.length !== finalState.loadedCells.length;
  
  log(`Objects removed: ${objectsRemoved} (${initialObjectCount} → ${finalObjectCount})`);
  log(`Cells changed: ${cellsChanged} (${initialState.loadedCells.length} → ${finalState.loadedCells.length})`);
  
  // Determine success
  if (objectsRemoved > 0 && cellsChanged) {
    window.testUnloadingFix.success = true;
    log('🎉 SUCCESS: Objects were properly unloaded when cells changed!', 'success');
    log('The fix is working correctly - objects added before page refresh are being tracked and unloaded properly.', 'success');
  } else if (objectsRemoved === 0 && !cellsChanged) {
    log('ℹ️ No cells were unloaded, so no objects should be removed. This is expected behavior.', 'info');
    log('Try moving the camera even further away or adding objects in more distant cells.', 'info');
  } else if (objectsRemoved === 0 && cellsChanged) {
    log('❌ ISSUE: Cells changed but no objects were removed. The issue may still exist.', 'error');
    log('Objects that were added before page refresh may not be properly tracked for unloading.', 'error');
  } else {
    log('🤔 Unexpected result. Manual investigation needed.', 'warning');
  }
  
  // Step 5: Move back to original position
  log('Moving camera back to original position...');
  await moveCamera(20, 20, 50);
  
  log('Test completed. Check window.testUnloadingFix for detailed results.');
}

// Auto-run the test if objects are available
if (getObjectCount() > 0) {
  setTimeout(() => {
    runUnloadingTest().catch(error => {
      log(`Test failed with error: ${error.message}`, 'error');
    });
  }, 2000); // Wait 2 seconds for the app to fully load
} else {
  log('No objects detected. Please add some objects and run the test manually:', 'info');
  log('window.testUnloadingFix.runTest = runUnloadingTest; window.testUnloadingFix.runTest();', 'info');
  window.testUnloadingFix.runTest = runUnloadingTest;
}

// Expose test functions globally
window.testUnloadingFix.runTest = runUnloadingFix;
window.testUnloadingFix.getObjectCount = getObjectCount;
window.testUnloadingFix.getSpatialState = getSpatialManagerState;
window.testUnloadingFix.moveCamera = moveCamera;

log('Test script loaded. Functions available in window.testUnloadingFix');
