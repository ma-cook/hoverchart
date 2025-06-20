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
export const handleFaceIndicatorClick = async ({
  indicator,
  objects,
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
    selectedIndicatorsRef.current = [indicator];
    setSelectedIndicators([indicator]);

    return {
      success: true,
      complete: false,
      message: 'First indicator selected',
    };
  } else {
    // Extract necessary data from indicators with error checking
    const startIndicator = selectedIndicatorsRef.current[0];

    // More robust ID extraction with fallbacks
    const getIdFromIndicator = (ind) => {
      if (!ind) return null;
      return String(
        ind.cube?.id ||
          ind.id ||
          ind.objectId ||
          ind.cube?.userData?.id ||
          (ind.plane && ind.plane.userData?.id)
      );
    };

    const startIdStr = getIdFromIndicator(startIndicator);
    const endIdStr = getIdFromIndicator(indicator);

    if (!startIdStr || !endIdStr) {
      console.error('Invalid indicator data:', { startIndicator, indicator });
      // Reset selection state but stay in connect mode
      selectedIndicatorsRef.current = [];
      setSelectedIndicators([]);
      return {
        success: false,
        complete: true,
        message: 'Invalid indicator data',
      };
    }

    console.log('Attempting connection from', startIdStr, 'to', endIdStr);

    // Find objects using normalized string comparison
    const startObj = objects.find((obj) => String(obj.id) === startIdStr);
    const endObj = objects.find((obj) => String(obj.id) === endIdStr);

    console.log('Found objects:', { startObj, endObj });

    // Better error handling
    if (!startObj || !endObj) {
      console.error('Failed to find objects for connection', {
        startIdStr,
        endIdStr,
        objects,
      });
      // Reset selection state
      selectedIndicatorsRef.current = [];
      setSelectedIndicators([]);
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

        // Add face position calculation for the end object's indicator
        const endPosition = calculateFacePosition(indicator);

        // Enhance the end object with the calculated face position
        const enhancedEndObj = {
          ...endObj,
          position: endPosition, // Use the face position instead of object center
          worldPosition: endPosition,
          face: indicator.face,
          faceCenter: indicator.faceCenter || endPosition,
          facePosition: endPosition,
        };
        console.log('Creating text connection with text as start:', {
          textIndicator,
          endObj: enhancedEndObj,
        });

        // Create text connection directly using the new store system
        const connectionId = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const textPosition = textIndicator.worldPosition ||
          textIndicator.position || [0, 0, 0];
        const endFacePosition = calculateFacePosition(indicator);

        const newConnection = {
          id: connectionId,
          start: {
            type: 'text',
            face: 'top', // Default face for text objects
            objectId: textIndicator.id || textIndicator.objectId,
            position: textPosition,
            faceCenter: textPosition,
          },
          end: {
            type: enhancedEndObj.type || 'cube',
            face: indicator.face,
            objectId: enhancedEndObj.id,
            position: endFacePosition,
            faceCenter: indicator.faceCenter || endFacePosition,
          },
          lineStyle: 'straight',
          color: 'black',
          text: '',
          textStyle: { fontSize: 1, color: 'black' },
        };

        result = { success: true, connection: newConnection };
      } else {
        // Text object is the end - similar approach with current indicator
        // Calculate face position for the start object
        const startPosition = calculateFacePosition(startIndicator);

        // Enhance the start object with the calculated face position
        const enhancedStartObj = {
          ...startObj,
          position: startPosition, // Use the face position instead of object center
          worldPosition: startPosition,
          face: startIndicator.face,
          faceCenter: startIndicator.faceCenter || startPosition,
          facePosition: startPosition,
        };
        console.log('Creating text connection with text as end:', {
          startObj: enhancedStartObj,
          indicator,
        });

        // Create text connection directly using the new store system
        const connectionId = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const textPosition = indicator.worldPosition ||
          indicator.position || [0, 0, 0];

        const newConnection = {
          id: connectionId,
          start: {
            type: enhancedStartObj.type || 'cube',
            face: startIndicator.face,
            objectId: enhancedStartObj.id,
            position: startPosition,
            faceCenter: startIndicator.faceCenter || startPosition,
          },
          end: {
            type: 'text',
            face: 'top', // Default face for text objects
            objectId: indicator.id || indicator.objectId,
            position: textPosition,
            faceCenter: textPosition,
          },
          lineStyle: 'straight',
          color: 'black',
          text: '',
          textStyle: { fontSize: 1, color: 'black' },
        };

        result = { success: true, connection: newConnection };
      }

      if (result.success && result.connection) {
        console.log('Text connection created:', result.connection);
        // Add to local state for immediate visualization
        setConnections((prev) => [...prev, result.connection]);
      } else {
        console.error('Failed to create text connection:', result);
      }

      // Reset selection state regardless of outcome

      setSelectedIndicators([]);
      selectedIndicatorsRef.current = [];
      setIsConnectMode(false);
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

    console.log('Creating standard connection between indicators');

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
      console.error('Invalid object IDs:', { startObjectId, endObjectId });
      return {
        success: false,
        complete: true,
        message: 'Invalid object IDs',
      };
    }

    console.log('Creating connection with:', {
      startObjectId,
      startPos,
      endObjectId,
      endPos,
    });

    // Include objectId in the connection data
    const newConnection = {
      id: connectionId,
      start: {
        type: startIndicator.type || 'cube',
        face: startIndicator.face,
        position: startPos, // Use calculated position
        faceCenter: startIndicator.faceCenter || [0, 0, 0],
        objectId: startObjectId,
        cube: enhancedStartIndicator.cube,
        plane: enhancedStartIndicator.plane,
      },
      end: {
        type: indicator.type || 'cube',
        face: indicator.face,
        position: endPos, // Use calculated position
        faceCenter: indicator.faceCenter || [0, 0, 0],
        objectId: endObjectId,
        cube: enhancedEndIndicator.cube,
        plane: enhancedEndIndicator.plane,
      },
      lineStyle: 'straight',
      color: 'black',
      text: '',
      textStyle: { fontSize: 1, color: 'black' },
    };
    console.log('Connection created:', newConnection);

    // Update local state immediately for clickability
    setConnections((prev) => [...prev, newConnection]);

    // Save to database; if error, rollback state
    if (user) {
      try {
        const spaceOwnerId = window.currentSpaceOwner || user.uid;
        console.log('🔄 Saving connection to database...', {
          connectionId,
          spaceOwnerId,
          currentSpaceId,
        });

        await saveConnection(spaceOwnerId, currentSpaceId, newConnection);
        console.log('✅ Connection saved successfully to database');
      } catch (err) {
        console.error('❌ Failed to save connection to database:', err);
        // Rollback local state on save failure
        setConnections((prev) =>
          prev.filter((conn) => conn.id !== connectionId)
        );
        return {
          success: false,
          complete: true,
          message: 'Failed to save connection to database',
        };
      }
    } else {
      console.warn('⚠️ No user available, connection not saved to database');
    }

    // Reset indicator selection states
    setSelectedIndicators([]);
    selectedIndicatorsRef.current = [];
    setIsConnectMode(false);
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

export const processConnectionCreation = (
  selectedIndicators,
  selectedIndicatorsRef,
  user,
  currentSpaceId,
  setConnections,
  objects,
  indicator
) => {
  // Sanity check the selected indicators
  if (
    !selectedIndicatorsRef.current ||
    selectedIndicatorsRef.current.length === 0
  ) {
    console.warn('No indicators selected for connection');
    return { success: false, message: 'No indicators selected' };
  }

  try {
    const startIndicator = selectedIndicatorsRef.current[0];

    // Validate both indicators have valid data
    if (
      !startIndicator ||
      !indicator ||
      !startIndicator.cube ||
      !indicator.cube
    ) {
      console.error('Invalid indicator data for connection creation', {
        startIndicator,
        endIndicator: indicator,
      });
      selectedIndicatorsRef.current = [];
      return {
        success: false,
        complete: true,
        message: 'Invalid indicator data',
      };
    }

    const startObjectId = startIndicator.cube.id.toString();
    const endObjectId = indicator.cube.id.toString();

    // Don't connect an object to itself
    if (startObjectId === endObjectId) {
      console.warn('Cannot connect an object to itself');
      selectedIndicatorsRef.current = [];
      return {
        success: false,
        complete: true,
        message: 'Cannot connect an object to itself',
      };
    }

    // Get objects from the IDs with proper error checking
    const startObj = objects.find(
      (obj) => obj?.id?.toString() === startObjectId
    );
    const endObj = objects.find((obj) => obj?.id?.toString() === endObjectId);

    if (!startObj || !endObj) {
      console.error('Could not find objects for connection:', {
        startId: startObjectId,
        endId: endObjectId,
        objectsFound: objects.length,
      });
      selectedIndicatorsRef.current = [];
      return {
        success: false,
        complete: true,
        message: 'Objects not found',
      };
    }

    // ...rest of your existing code...
  } catch (error) {
    console.error('Error creating connection:', error);
    // Reset selection state
    selectedIndicatorsRef.current = [];
    return {
      success: false,
      complete: true,
      message: 'Connection creation error',
    };
  }
};
