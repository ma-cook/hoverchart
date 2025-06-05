# Object Unloading Fix After Page Refresh

## Problem Description

Objects were not being unloaded from the UI when their containing cells were unloaded, especially for objects that were added before refreshing the page. This caused memory leaks and incorrect object persistence in the 3D scene.

## Root Cause Analysis

The issue had several contributing factors:

### 1. **Timing Issue with Spatial Manager Initialization**

- The `subscribeToSpatialObjects` callback required `isSpatialInitialized` to be true before tracking objects
- Objects loaded from Firebase before spatial manager initialization weren't being tracked
- When cells were later unloaded, these untracked objects remained in the UI

### 2. **Missing Retroactive Tracking**

- Objects that existed in Firebase cells before page refresh weren't being tracked in `objectsByCellRef`
- The spatial manager's object tracking system only captured newly loaded objects
- No mechanism existed to track objects that were already in the UI when the spatial manager initialized

### 3. **Incorrect Cell Coordinate Handling**

- The z-coordinate in cellCoords was hardcoded to 0 in callbacks
- This could cause tracking issues for objects in cells with non-zero z coordinates

## Solution Implementation

### 1. **Removed Spatial Manager Dependency from Object Tracking**

**File:** `src/App.jsx`

```javascript
// BEFORE: Required spatial manager to be initialized
if (change.cellCoords && trackObjectInCell && isSpatialInitialized) {

// AFTER: Track immediately when trackObjectInCell is available
if (change.cellCoords && trackObjectInCell) {
```

### 2. **Added Retroactive Object Tracking**

**File:** `src/App.jsx`

```javascript
// Retroactively track existing objects when spatial manager becomes initialized
const hasRetroTrackedRef = useRef(false);
useEffect(() => {
  if (
    isSpatialInitialized &&
    trackObjectInCell &&
    objects.length > 0 &&
    !hasRetroTrackedRef.current
  ) {
    console.log(
      `🔄 Spatial manager initialized - retroactively tracking ${objects.length} existing objects`
    );

    objects.forEach((obj) => {
      if (
        obj.position &&
        Array.isArray(obj.position) &&
        obj.position.length >= 3
      ) {
        // Calculate which cell this object belongs to
        const cellCoords = {
          x: Math.floor(obj.position[0] / CELL_SIZE),
          y: Math.floor(obj.position[1] / CELL_SIZE),
          z: Math.floor((obj.position[2] || 0) / CELL_SIZE),
        };

        const cellId = `${cellCoords.x},${cellCoords.y},${cellCoords.z}`;
        trackObjectInCell(obj.id.toString(), cellId);
      }
    });

    hasRetroTrackedRef.current = true; // Prevent re-tracking on subsequent renders
  }
}, [isSpatialInitialized, trackObjectInCell, objects]);
```

### 3. **Fixed Cell Coordinate Handling**

**File:** `src/services/spatialObjectsService.js`

```javascript
// BEFORE: Hardcoded z coordinate
const [x, y] = cellKey.split(',').map(Number);
cellCoords: { x, y, z: 0 }

// AFTER: Parse all three coordinates
const [x, y, z] = cellKey.split(',').map(Number);
cellCoords: { x, y, z: z || 0 }
```

## Data Flow After Fix

### Initial Page Load

1. **Objects Load from Firebase** → Firebase objects are loaded via `subscribeToSpatialObjects`
2. **Objects Added to UI** → Objects appear in the 3D scene
3. **Objects Tracked Immediately** → `trackObjectInCell` is called for each object (no longer waits for spatial manager)
4. **Spatial Manager Initializes** → Spatial partitioning system becomes ready
5. **Retroactive Tracking** → Any objects that weren't tracked are now tracked based on their positions

### Cell Unloading

1. **Camera Moves** → User moves camera far from loaded cells
2. **Cells Marked for Unloading** → `getCellsToUnload` identifies distant cells
3. **Object Lookup** → `objectsByCellRef` contains proper mapping of objects to cells
4. **Objects Removed** → `onObjectsChange` callback removes objects from UI
5. **Cell State Updated** → `loadedCells` Set is updated

## Testing

Use the test script `test-object-unloading-fix.js` to verify the fix:

```javascript
// In browser console after adding objects and refreshing page
// The test will automatically run or you can trigger it manually
window.testUnloadingFix.runTest();
```

### Expected Test Results

- ✅ Objects added before refresh are properly tracked
- ✅ Objects are removed from UI when containing cells are unloaded
- ✅ No memory leaks or orphaned objects in the scene
- ✅ Cell loading/unloading works correctly in both directions

## Files Modified

1. **`src/App.jsx`**

   - Removed `isSpatialInitialized` requirement from object tracking
   - Added retroactive object tracking effect
   - Added CELL_SIZE import and usage

2. **`src/services/spatialObjectsService.js`**
   - Fixed cell coordinate parsing to include z-coordinate
   - Updated callback to pass proper cellCoords

## Impact

- **Memory Usage:** Reduced memory leaks from untracked objects
- **Performance:** Improved spatial culling effectiveness
- **User Experience:** Objects now properly disappear when moving away
- **Reliability:** Consistent behavior before and after page refreshes

## Backwards Compatibility

This fix is fully backwards compatible:

- Existing objects continue to work normally
- No changes to Firebase schema or data structures
- No breaking changes to component APIs
- Graceful handling of objects with missing position data
