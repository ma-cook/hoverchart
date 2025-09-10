# Root Cause Analysis: Connection Lines Not Reloading

## The Problem

Connection lines were not reloading when cells came back into range after being unloaded. Additionally, attempts to fix this were breaking the initial cell loading functionality.

## Root Cause Identified

### Issue 1: Duplicate useEffect Hooks

The `useConnections.js` file had **TWO separate useEffect hooks** with identical dependency arrays:

```javascript
// First useEffect
}, [user?.uid, currentSpaceId, stableLoadedCells, enhancedConnectionCallback]);

// Second useEffect (duplicate!)
}, [user?.uid, currentSpaceId, stableLoadedCells, enhancedConnectionCallback]);
```

This caused:

1. **Race conditions** - Both effects would fire on the same changes
2. **Subscription conflicts** - First effect creates subscription, second immediately destroys it
3. **Initial loading interference** - During initial loading when cells are being added incrementally, both effects would fire repeatedly
4. **Connection subscription instability** - Subscriptions were being created and destroyed unpredictably

### Issue 2: deletingConnections Set Misuse

In the connection store, connections removed due to cell unloading were being added to the `deletingConnections` Set, which prevented them from being re-added when cells were reloaded.

## The Fix

### 1. Consolidated useEffect Logic

- Removed the duplicate second useEffect
- Consolidated all subscription management logic into a single, coherent effect
- Added proper checks for initial loading vs. post-loading updates
- Maintained the same dependency array but with unified logic

### 2. Fixed deletingConnections Usage

- Modified `removeConnectionsFromCells` to NOT add connections to the `deletingConnections` Set
- This Set is now only used for permanent deletions, not temporary spatial partitioning removals

## Why This Should Work

### During Initial Loading:

1. When `getIsInitialLoading()` is true, the effect only creates a subscription if none exists
2. No subscription restarts during initial loading, preventing interference with cell loading
3. Spatial partitioning can load cells incrementally without connection subscription conflicts

### After Initial Loading:

1. When cells change (load/unload), the single effect detects the change
2. Cleanly restarts the subscription with the new cell list
3. Connections in newly loaded cells can be properly subscribed to
4. Connections removed due to cell unloading can be re-added when cells reload

### Connection Reloading:

1. When a cell is unloaded, connections are removed from the store (visual cleanup)
2. But they are NOT added to the deletion blacklist
3. When the cell is loaded again, the subscription restarts with the new cells
4. Firebase subscription fires for the reloaded cell
5. Connections are successfully re-added to the store (no longer blocked)

## Expected Behavior

✅ Initial cells load properly  
✅ Additional cells load when camera moves  
✅ Distant cells unload properly  
✅ Objects are removed when cells unload  
✅ **Connections are removed when cells unload**  
✅ **Objects reload when cells come back into range**  
✅ **Connections reload when cells come back into range** (THIS WAS THE MISSING PIECE)
