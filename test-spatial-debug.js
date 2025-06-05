// Test script to run in browser console to debug spatial object tracking

// Test 1: Check if spatial manager is initialized
console.log('🔍 Test 1: Spatial Manager State');
console.log('Debug object:', window._spatialManagerDebug);

// Test 2: Check camera position
console.log('🔍 Test 2: Camera Position');
if (window.camera) {
  console.log('Camera position:', window.camera.position);
} else {
  console.log('❌ Camera not available');
}

// Test 3: Check loaded cells
console.log('🔍 Test 3: Loaded Cells');
if (window._spatialManagerDebug && window._spatialManagerDebug.loadedCells) {
  console.log('Loaded cells:', window._spatialManagerDebug.loadedCells);
} else {
  console.log('❌ No loaded cells data');
}

// Test 4: Manual object tracking test
window.testObjectTracking = () => {
  console.log('🧪 Testing object tracking manually...');

  const debug = window._spatialManagerDebug;
  if (debug && debug.trackObjectInCell) {
    console.log('✅ trackObjectInCell function available');

    // Test tracking an object
    debug.trackObjectInCell('test-123', '0,0,0');
    console.log('✅ Tracked test object');

    // Test untracking
    debug.untrackObjectInCell('test-123', '0,0,0');
    console.log('✅ Untracked test object');
  } else {
    console.log('❌ Object tracking functions not available');
  }
};

console.log(
  '🛠️ Run window.testObjectTracking() to test object tracking functions'
);

// Test 5: Check if objects exist
setTimeout(() => {
  console.log('🔍 Test 5: Objects in Scene (after 2 seconds)');
  if (window._spatialManagerDebug) {
    console.log('Object count:', window._spatialManagerDebug.objects);
  }
}, 2000);
