# Connection Reload Fix - Root Cause Found and Fixed

## Root Cause Identified:

The issue was in the `removeConnectionsFromCells` method in `connectionStore.js`. When connections were removed due to cells being unloaded, they were being added to the `deletingConnections` Set. However, when the cells were loaded again later, these connections were permanently blocked from being re-added because they were still marked as "being deleted".

## The Problem:

1. Camera moves away from area → cells unload → `removeConnectionsFromCells` is called
2. Connections are removed from `connections` array AND added to `deletingConnections` Set
3. Camera moves back to area → cells reload → connection subscriptions fire
4. Connection service tries to add connections back via `addConnection`
5. `addConnection` checks `deletingConnections` Set and blocks the re-addition
6. Result: Objects reload but connections don't

## The Fix:

Modified `removeConnectionsFromCells` to NOT add connections to the `deletingConnections` Set when removing them due to spatial partitioning. The `deletingConnections` Set should only be used for permanent deletions, not temporary spatial removals.

### Before (broken):

```javascript
// Create new deleting set with removed connections
const newDeletingSet = new Set(state.deletingConnections);
connectionsToRemove.forEach((id) => newDeletingSet.add(id));
```

### After (fixed):

```javascript
// For cell-based removal, don't add to deletingConnections since these are temporary
// spatial partitioning removals, not permanent deletions
```

## Expected Result:

Now when cells are unloaded and reloaded:

1. Connections are removed from the store (visual cleanup)
2. But NOT added to the deletion blacklist
3. When cells reload, connections can be re-added successfully
4. Both objects AND connections should reload properly

## Testing Steps:

1. Place some objects and create connections between them
2. Move camera away until the area unloads
3. Return to the original area
4. Verify both objects and connections reappear
