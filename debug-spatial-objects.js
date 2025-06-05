// Debug script to check spatial partitioning object tracking
console.log('🔍 === SPATIAL PARTITIONING DEBUG ===');

if (window._spatialManagerDebug) {
  console.log('📊 Spatial Manager State:');
  console.log('  - Loaded cells:', window._spatialManagerDebug.loadedCells);
  console.log(
    '  - Current cell:',
    window._spatialManagerDebug.currentCellCoords
  );
  console.log('  - Initialized:', window._spatialManagerDebug.isInitialized);
  console.log('  - Objects count:', window._spatialManagerDebug.objects);
} else {
  console.log('❌ No spatial manager debug data available');
}

if (window.camera) {
  console.log('📷 Camera position:', window.camera.position);
} else {
  console.log('❌ No camera available');
}

// Function to manually check object tracking
window.debugSpatialObjects = () => {
  console.log('🔍 === MANUAL SPATIAL DEBUG ===');

  if (
    window._spatialManagerDebug &&
    window._spatialManagerDebug.trackObjectInCell
  ) {
    console.log('✅ Object tracking functions available');
  } else {
    console.log('❌ Object tracking functions not available');
  }

  // Check if objects exist in the scene
  const objects = document.querySelectorAll('[data-object-id]');
  console.log(`🎯 Found ${objects.length} objects in DOM`);

  objects.forEach((obj, index) => {
    const objectId = obj.getAttribute('data-object-id');
    console.log(`  ${index + 1}. Object ID: ${objectId}`);
  });
};

console.log('🛠️ Run window.debugSpatialObjects() to check object tracking');
