import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import useConnectionStore from '../stores/connectionStore';

// =============================================================================
// PERFORMANCE OPTIMIZATION: Cached selector factories
// Avoids recreating selector functions on every render
// =============================================================================
const connectionStateSelectors = new Map();

const getConnectionStateSelector = (connectionId) => {
  if (!connectionStateSelectors.has(connectionId)) {
    connectionStateSelectors.set(connectionId, (state) => ({
      isSelected: state.selectedConnection === connectionId,
      isFlowPathHighlighted:
        !!(state.highlightedFlowPathIds?.size > 0 &&
          state.highlightedFlowPathIds.has(connectionId)),
      isDeleting: state.deletingConnections.has(connectionId),
      lineText: state.lineTexts?.[connectionId] || '',
      showTextInput: state.showLineTextInput === connectionId,
      showStyleUI: state.showLineTextStyleUI === connectionId,
    }));
  }
  return connectionStateSelectors.get(connectionId);
};

// Cleanup old selectors periodically to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

// Cleanup selectors for connections that no longer exist to prevent the map
// from growing without bound. Accepts a getter so the (potentially large)
// active-id list is only materialised once the interval has elapsed.
const cleanupStaleSelectors = (getActiveIds) => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const activeSet = new Set(
    typeof getActiveIds === 'function' ? getActiveIds() : getActiveIds
  );
  for (const id of connectionStateSelectors.keys()) {
    if (!activeSet.has(id)) {
      connectionStateSelectors.delete(id);
    }
  }
};

// Stable actions selector - created once, never changes
const actionsSelector = (state) => ({
  setShowLineTextStyleUI: state.setShowLineTextStyleUI,
  setShowLineTextInput: state.setShowLineTextInput,
  selectConnection: state.selectConnection,
  selectConnectionWithFlowPath: state.selectConnectionWithFlowPath,
  clearFlowPathHighlight: state.clearFlowPathHighlight,
  setLineText: state.setLineText,
  updateConnection: state.updateConnection,
});

/**
 * Batched store subscription hook for ConnectionsRenderer
 * Replaces 7+ individual useConnectionStore calls with a single subscription
 * This significantly reduces React overhead for 1000+ connections
 */
export const useConnectionsRendererStore = () => {
  const store = useConnectionStore(
    (state) => ({
      // Connection data
      connections: state.connections,
      selectedConnection: state.selectedConnection,
      highlightedFlowPathIds: state.highlightedFlowPathIds,
      deletingConnections: state.deletingConnections,
      connectionsVisible: state.connectionsVisible,
      focusedObjectId: state.focusedObjectId,
      
      // UI state
      lineTexts: state.lineTexts,
      showLineTextInput: state.showLineTextInput,
      showLineTextStyleUI: state.showLineTextStyleUI,
      
      // Actions
      setShowLineTextStyleUI: state.setShowLineTextStyleUI,
      setShowLineTextInput: state.setShowLineTextInput,
      selectConnection: state.selectConnection,
      selectConnectionWithFlowPath: state.selectConnectionWithFlowPath,
      clearFlowPathHighlight: state.clearFlowPathHighlight,
      setLineText: state.setLineText,
      updateConnection: state.updateConnection,
    }),
    shallow
  );

  // Periodically drop selectors for connection IDs that no longer exist.
  cleanupStaleSelectors(() => store.connections.map((c) => c.id));

  return store;
};

/**
 * Lightweight hook for individual Connection components
 * PERFORMANCE OPTIMIZED: Uses cached selector to avoid recreating on every render
 */
export const useConnectionState = (connectionId) => {
  // Get cached selector for this connection ID
  const selector = useMemo(
    () => getConnectionStateSelector(connectionId),
    [connectionId]
  );
  
  return useConnectionStore(selector, shallow);
};

/**
 * Hook for connection actions - stable references, no re-renders
 * PERFORMANCE OPTIMIZED: Uses module-level cached selector
 */
export const useConnectionActions = () => {
  return useConnectionStore(actionsSelector, shallow);
};

// Export cleanup function for use by ConnectionsRenderer
export { cleanupStaleSelectors };

export default useConnectionsRendererStore;
