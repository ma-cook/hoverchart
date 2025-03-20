import {
  objectsAreConnected,
  registerObjectConnection,
  registerConnectedPair,
  handleTextObjectConnection,
} from '../services/connectionManager';
import { saveConnection } from '../services/connectionsService';
import { calculateFacePosition } from './facePositionUtils';

/**
 * Handle face indicator click events with connection creation
 *
 * @param {Object} params Configuration parameters
 * @param {Object} params.indicator The indicator that was clicked
 * @param {Array} params.objects Array of all objects in the scene
 * @param {Array} params.connections Array of all connections in the scene
 * @param {Object} params.selectedIndicatorsRef Reference to track selected indicators
 * @param {Function} params.setSelectedIndicators Function to update selected indicators state
 * @param {Function} params.setConnections Function to update connections state
 * @param {Function} params.setIsConnectMode Function to update connect mode state
 * @param {Function} params.setIndicatorMode Function to update indicator mode state
 * @param {Function} params.setShowAllCubesIndicators Function to update indicator visibility
 * @param {Function} params.setGlobalIndicatorSelected Function to update global indicator selected state
 * @param {Object} params.user Current user object
 * @param {String} params.currentSpaceId Current space ID
 * @param {Boolean} params.isConnectMode Current connect mode state
 * @returns {Object} Result object with success status and message
 */
export const handleFaceIndicatorClick = ({
  indicator,
  objects,
  connections,
  selectedIndicatorsRef,
  setSelectedIndicators,
  setConnections,
  setIsConnectMode,
  setIndicatorMode,
  setShowAllCubesIndicators,
  setGlobalIndicatorSelected,
  user,
  currentSpaceId,
  isConnectMode,
}) => {
  // If not in connect mode, enter connect mode first
  if (!isConnectMode) {
    setIsConnectMode(true);
    setIndicatorMode('indicators');
    setShowAllCubesIndicators(true);
    setGlobalIndicatorSelected(true);
    // Store the first indicator
    selectedIndicatorsRef.current = [indicator];
    setSelectedIndicators([indicator]);
    return {
      success: true,
      complete: false,
      message: 'Entered connect mode, select second indicator',
    };
  }

  if (selectedIndicatorsRef.current.length === 0) {
    // First indicator selection - store it in both state and ref
    selectedIndicatorsRef.current.push(indicator);
    setSelectedIndicators([indicator]);
    return {
      success: true,
      complete: false,
      message: 'First indicator selected',
    };
  } else {
    // We have the first indicator, now create a connection with the second
    const startIndicator = selectedIndicatorsRef.current[0];

    // More robust ID extraction for text object indicators
    const startIdStr = String(
      startIndicator.cube?.id ||
        startIndicator.id ||
        startIndicator.objectId ||
        startIndicator.cube?.userData?.objectId ||
        (startIndicator.plane && startIndicator.plane.userData?.id)
    );

    const endIdStr = String(
      indicator.cube?.id ||
        indicator.id ||
        indicator.objectId ||
        indicator.cube?.userData?.objectId ||
        (indicator.plane && indicator.plane.userData?.id)
    );

    // Check if connection already exists
    try {
      const connectionAlreadyExists = objectsAreConnected(startIdStr, endIdStr);

      if (connectionAlreadyExists) {
        // Reset selection state but stay in connect mode
        selectedIndicatorsRef.current = [];
        setSelectedIndicators([]);
        return {
          success: false,
          complete: true,
          message: 'Connection already exists',
        };
      }
    } catch (error) {
      console.error('Error checking connection:', error);

      // Fallback - check manually in connections array
      const manualConnectionCheck = connections.some(
        (conn) =>
          (conn.start?.objectId === startIdStr &&
            conn.end?.objectId === endIdStr) ||
          (conn.start?.objectId === endIdStr &&
            conn.end?.objectId === startIdStr)
      );

      if (manualConnectionCheck) {
        selectedIndicatorsRef.current = [];
        setSelectedIndicators([]);
        return {
          success: false,
          complete: true,
          message: 'Connection already exists (manual check)',
        };
      }
    }

    // Find objects using normalized string comparison
    const startObj = objects.find((obj) => String(obj.id) === startIdStr);
    const endObj = objects.find((obj) => String(obj.id) === endIdStr);

    // Better error handling
    if (!startObj || !endObj) {
      return {
        success: false,
        complete: true,
        message: 'Failed to find objects',
      };
    }

    // Special handling for text object connections
    if (startObj.type === 'text' || endObj.type === 'text') {
      let result;

      if (startObj.type === 'text') {
        // For text objects, use the INDICATOR object (not the startObj) to preserve indicator position
        const textIndicator = selectedIndicatorsRef.current[0];

        // Make sure indicator has worldPosition from original click
        if (!textIndicator.worldPosition && textIndicator.position) {
          textIndicator.worldPosition = textIndicator.position;
        }

        // Pass the indicator object that has position data
        result = handleTextObjectConnection(
          textIndicator, // Pass the indicator instead of just the object
          endObj,
          indicator.face,
          user?.uid,
          currentSpaceId
        );
      } else {
        // Text object is the end - similar approach with current indicator
        result = handleTextObjectConnection(
          indicator, // Pass the current indicator with position data
          startObj,
          startIndicator.face,
          user?.uid,
          currentSpaceId
        );
      }

      if (result.success && result.connection) {
        // Add to local state for immediate visualization
        setConnections((prev) => [...prev, result.connection]);
      }

      // Reset selection state regardless of outcome
      selectedIndicatorsRef.current = [];
      setSelectedIndicators([]);
      setShowAllCubesIndicators(false);
      setGlobalIndicatorSelected(false);
      setIndicatorMode('none');

      return {
        success: result.success,
        complete: true,
        message: result.message || 'Text object connection created',
        connection: result.connection,
      };
    }

    // Create enhanced indicators with full object data
    const enhancedStartIndicator = {
      ...startIndicator,
      cube: {
        ...startIndicator.cube,
        position: startObj.position,
        scale: startObj.scale,
      },
    };

    const enhancedEndIndicator = {
      ...indicator,
      cube: {
        ...indicator.cube,
        position: endObj.position,
        scale: endObj.scale,
      },
    };

    // Calculate positions using enhanced indicators
    const startPos = calculateFacePosition(enhancedStartIndicator);
    const endPos = calculateFacePosition(enhancedEndIndicator);

    const connectionId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Ensure we're using proper ID formats
    const startObjectId = startIdStr;
    const endObjectId = endIdStr;

    // Validate we have both object IDs
    if (!startObjectId || !endObjectId) {
      return {
        success: false,
        complete: true,
        message: 'Invalid object IDs',
      };
    }

    // Include objectId in the connection data
    const newConnection = {
      id: connectionId,
      start: {
        type: startIndicator.type,
        face: startIndicator.face,
        position: startPos, // Use calculated position
        faceCenter: startIndicator.faceCenter || [0, 0, 0],
        objectId: startObjectId,
        cube: startIndicator.cube,
        plane: startIndicator.plane,
      },
      end: {
        type: indicator.type,
        face: indicator.face,
        position: endPos, // Use calculated position
        faceCenter: indicator.faceCenter || [0, 0, 0],
        objectId: endObjectId,
        cube: indicator.cube,
        plane: indicator.plane,
      },
      lineStyle: 'straight',
      color: 'white',
      text: '',
      textStyle: { fontSize: 1, color: 'white' },
    };

    // For plane type indicators, preserve all position data that was originally calculated
    if (startIndicator.type === 'plane') {
      newConnection.start.worldPosition = startPos;
      newConnection.start.planeData = {
        position: startObj.position,
        scale: startObj.scale || [1, 1, 1],
        // Store worldMatrixArray if available
        worldMatrixArray: startIndicator.planeData?.worldMatrixArray || null,
      };
    }

    if (indicator.type === 'plane') {
      newConnection.end.worldPosition = endPos;
      newConnection.end.planeData = {
        position: endObj.position,
        scale: endObj.scale || [1, 1, 1],
        // Store worldMatrixArray if available
        worldMatrixArray: indicator.planeData?.worldMatrixArray || null,
      };
    }

    // Register this connection in the connection manager
    registerObjectConnection(startObjectId, connectionId);
    registerObjectConnection(endObjectId, connectionId);
    registerConnectedPair(startObjectId, endObjectId, connectionId);

    // Update local state immediately for clickability
    setConnections((prev) => [...prev, newConnection]);

    // Save to database; if error, rollback state
    if (user) {
      try {
        saveConnection(user.uid, currentSpaceId, newConnection).catch(() => {
          setConnections((prev) =>
            prev.filter((conn) => conn.id !== connectionId)
          );
        });
      } catch {
        setConnections((prev) =>
          prev.filter((conn) => conn.id !== connectionId)
        );
      }
    }

    // Reset indicator selection states
    selectedIndicatorsRef.current = [];
    setSelectedIndicators([]);
    setShowAllCubesIndicators(false);
    setGlobalIndicatorSelected(false);
    setIndicatorMode('none');

    return {
      success: true,
      complete: true,
      message: 'Connection created successfully',
      connection: newConnection,
    };
  }
};
