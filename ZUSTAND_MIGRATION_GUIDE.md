# Zustand Store Migration Guide

This guide explains how to migrate the Cube, Dodecahedron, Plane, Face, and Connection components from local React state to Zustand stores.

## Overview

The migration involves:

1. ✅ **Created Zustand stores** for all component types
2. ✅ **Created store utilities** for easier access
3. 🔄 **Component migration** (in progress)
4. 🔄 **Helper function migration** (pending)

## Store Structure

### Available Stores

- `useFaceIndicatorStore` - Manages face indicator state
- `useCubeStore` - Manages cube state
- `useDodecahedronStore` - Manages dodecahedron state
- `usePlaneStore` - Manages plane state
- `useFaceStore` - Manages face-specific state
- `useConnectionStore` - Manages connection/line state

### Store Utilities

- `useCubeSelectors(id)` - Get all cube state for an ID
- `useCubeActions(id)` - Get all cube actions for an ID
- `usePlaneSelectors(id)` - Get all plane state for an ID
- `usePlaneActions(id)` - Get all plane actions for an ID
- `useGlobalStoreUtils()` - Global utilities for clearing/resetting

## Migration Pattern

### Before (Local State)

```jsx
const Cube = ({ id, position, color, ... }) => {
  const [selectedFace, setSelectedFace] = useState(null);
  const [showTransform, setShowTransform] = useState(false);
  const [localColor, setLocalColor] = useState(color);

  // Use local state
  const handleFaceClick = (face) => {
    setSelectedFace(face);
  };
};
```

### After (Store State)

```jsx
import { useCubeSelectors, useCubeActions } from '../stores';

const Cube = ({ id, position, color, ... }) => {
  const { cube, selectedFace, showTransform } = useCubeSelectors(id);
  const { createCube, updateCube, setCubeSelectedFace, setCubeShowTransform } = useCubeActions(id);

  // Initialize cube in store
  useEffect(() => {
    if (!cube) {
      createCube(id, { position, color, ... });
    }
  }, [id, cube, createCube]);

  // Use store state
  const handleFaceClick = (face) => {
    setCubeSelectedFace(id, face);
  };
};
```

## Specific Migration Steps

### 1. FaceIndicator Component ✅ (COMPLETED)

The FaceIndicator component has been successfully migrated to use the `useFaceIndicatorStore`.

### 2. Cube Component 🔄 (IN PROGRESS)

**Current Status**: Store setup completed, component partially migrated

**Remaining Steps**:

1. Replace all `useState` calls with store selectors
2. Replace all state setters with store actions
3. Update all references to local state variables

**Example of remaining changes needed**:

```jsx
// Replace this:
const [selectedFace, setSelectedFace] = useState(null);
const [showTransform, setShowTransform] = useState(false);

// With this:
const { selectedFace, showTransform } = useCubeSelectors(id);
const { setCubeSelectedFace, setCubeShowTransform } = useCubeActions(id);

// Replace this:
setSelectedFace(face);
setShowTransform(true);

// With this:
setCubeSelectedFace(id, face);
setCubeShowTransform(id, true);
```

### 3. Dodecahedron Component (PENDING)

**Store**: Created ✅
**Component Migration**: Needed

**Key changes needed**:

- Replace all local state with `useDodecahedronStore`
- Update face management to use store
- Update connection tracking to use store

### 4. Plane Component (PENDING)

**Store**: Created ✅
**Component Migration**: Needed

**Key changes needed**:

- Replace media state (webcam, screen share) with store
- Update UI state management
- Update image/texture handling

### 5. Connection Components (PENDING)

**Store**: Created ✅
**Component Migration**: Needed

**Components to migrate**:

- `ConnectionsRenderer.jsx`
- `ConnectionUpdater.jsx`
- Related connection helpers

### 6. Helper Files Migration (PENDING)

**Files needing migration**:

- `facePositionUtils.js` - Update to use store for face state
- `faceIndicatorUtils.js` - Update to use store for indicator state
- `connectionUtils.js` - Update to use store for connection state
- `cubeHelpers.js` - Update to use store for cube state

## Migration Best Practices

### 1. Initialize Objects in Store

```jsx
useEffect(() => {
  if (!cube) {
    createCube(id, {
      position,
      scale,
      color,
      faceColors,
      faceTexts,
      headerText,
      textStyle,
      // ... other initial props
    });
  }
}, [id, cube, createCube /* other deps */]);
```

### 2. Sync Props to Store

```jsx
useEffect(() => {
  if (cube) {
    updateCube(id, {
      position,
      scale,
      color,
      // ... other props that can change
    });
  }
}, [id, cube, updateCube, position, scale, color]);
```

### 3. Handle Selection State

```jsx
useEffect(() => {
  if (selected && !isCubeSelected) {
    selectCube(id);
  } else if (!selected && isCubeSelected) {
    deselectCube(id);
  }
}, [selected, isCubeSelected, selectCube, deselectCube, id]);
```

### 4. Clean Up Store State

```jsx
useEffect(() => {
  return () => {
    deleteCube(id);
  };
}, [id, deleteCube]);
```

## Helper Function Migration

### facePositionUtils.js

- Replace direct state access with store selectors
- Use store state for face position calculations

### faceIndicatorUtils.js

- Update indicator click handlers to use store actions
- Replace state setters with store actions

### connectionUtils.js

- Update connection creation to use store
- Replace connection state management with store actions

## Testing Migration

### 1. Component Level

- Verify all local state is replaced with store state
- Ensure prop changes still sync to store
- Test all user interactions work correctly

### 2. Integration Level

- Test cross-component state sharing
- Verify connections update when objects move
- Test cleanup when components unmount

### 3. Performance

- Monitor for unnecessary re-renders
- Optimize store selectors if needed
- Test with large numbers of objects

## Next Steps

1. **Complete Cube Component Migration**

   - Replace remaining local state references
   - Update all event handlers
   - Test thoroughly

2. **Migrate Dodecahedron Component**

   - Follow same pattern as Cube
   - Pay special attention to face management

3. **Migrate Plane Component**

   - Handle media state carefully
   - Ensure UI state persistence

4. **Migrate Connection Components**

   - Update real-time connection updates
   - Ensure proper cleanup

5. **Update Helper Functions**

   - Replace direct state access
   - Use store selectors throughout

6. **Integration Testing**
   - Test full application flow
   - Verify performance improvements
   - Test edge cases

## Troubleshooting

### Common Issues

1. **Stale closures**: Use store selectors instead of destructuring
2. **Re-render loops**: Check useEffect dependencies
3. **Missing initialization**: Ensure objects are created in store
4. **Memory leaks**: Clean up store state on unmount

### Performance Tips

1. Use specific selectors to avoid unnecessary re-renders
2. Memoize complex calculations
3. Clean up unused store state
4. Monitor store size in large applications
