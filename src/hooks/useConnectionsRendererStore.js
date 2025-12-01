import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import useConnectionStore from '../stores/connectionStore';

/**
 * Batched store subscription hook for ConnectionsRenderer
 * Replaces 7+ individual useConnectionStore calls with a single subscription
 * This significantly reduces React overhead for 1000+ connections
 */
export const useConnectionsRendererStore = () => {
  return useConnectionStore(
    (state) => ({
      // Connection data
      connections: state.connections,
      selectedConnection: state.selectedConnection,
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
      setLineText: state.setLineText,
      updateConnection: state.updateConnection,
    }),
    shallow
  );
};

/**
 * Lightweight hook for individual Connection components
 * Only subscribes to the minimal state needed for a single connection
 */
export const useConnectionState = (connectionId) => {
  return useConnectionStore(
    (state) => ({
      isSelected: state.selectedConnection === connectionId,
      isDeleting: state.deletingConnections.has(connectionId),
      lineText: state.lineTexts?.[connectionId] || '',
      showTextInput: state.showLineTextInput === connectionId,
      showStyleUI: state.showLineTextStyleUI === connectionId,
    }),
    shallow
  );
};

/**
 * Hook for connection actions - stable references, no re-renders
 */
export const useConnectionActions = () => {
  return useConnectionStore(
    (state) => ({
      setShowLineTextStyleUI: state.setShowLineTextStyleUI,
      setShowLineTextInput: state.setShowLineTextInput,
      selectConnection: state.selectConnection,
      setLineText: state.setLineText,
      updateConnection: state.updateConnection,
    }),
    shallow
  );
};

export default useConnectionsRendererStore;
