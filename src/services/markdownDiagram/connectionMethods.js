import useConnectionStore from '../../stores/connectionStore';
import { useObjectsStore } from '../../stores';
import {
  pauseConnectionListeners,
  resumeConnectionListeners,
} from '../connectionsService';
import {
  bulkSaveConnectionsToCell,
  getCellCoordinates,
  getCellId,
} from '../spatialPartitioning';
import { auth } from '../../firebase';

export const connectionMethods = {
  /**
   * Parse flowpath directives and #tag annotations from Merfolk code blocks.
   * Returns a Map of "sourceNodeId|targetNodeId" -> Set<flowpathName>
   */
  parseFlowPaths(content) {
    const connectionTags = new Map();

    const blockRegex = /```merfolk\n([\s\S]*?)```/g;
    const merfolkChunks = [];
    let blockMatch;
    while ((blockMatch = blockRegex.exec(content)) !== null) {
      merfolkChunks.push(blockMatch[1]);
    }
    if (merfolkChunks.length === 0) return connectionTags;
    const merfolkContent = merfolkChunks.join('\n');

    const addTag = (src, tgt, name) => {
      const key = `${src}|${tgt}`;
      if (!connectionTags.has(key)) connectionTags.set(key, new Set());
      connectionTags.get(key).add(name);
    };

    // 1. Parse flowpath directives
    const flowpathRegex =
      /^[ \t]*flowpath\s+"([^"]+)"\s*(?:\([^)]*\))?\s*:\s*(.+?)(?:\s*:\s*"[^"]*")?\s*$/gm;
    let match;
    while ((match = flowpathRegex.exec(merfolkContent)) !== null) {
      const name = match[1];
      const sequenceStr = match[2];
      const nodes = sequenceStr
        .split(/\s*(?:-->|-.->|-\.->|===+>|--[^>]*>)\s*/)
        .map(n => n.trim())
        .filter(Boolean);
      for (let i = 0; i < nodes.length - 1; i++) {
        addTag(nodes[i], nodes[i + 1], name);
      }
    }

    // 2. Parse #tag annotations on individual connection lines
    const taggedConnRegex =
      /^[ \t]*(\w[\w-]*)[ \t]*(?:-->|-.->|-\.->|===+>|--[^>]*>)[ \t]*(\w[\w-]*)[ \t]*(?::\s*"[^"]*")?[ \t]*((?:#\w+[ \t]*)+)/gm;
    while ((match = taggedConnRegex.exec(merfolkContent)) !== null) {
      const srcId = match[1];
      const tgtId = match[2];
      const tags = (match[3].match(/#(\w+)/g) || []).map(t => t.slice(1));
      tags.forEach(tag => addTag(srcId, tgtId, tag));
    }

    return connectionTags;
  },

  /**
   * Remove flowpath directives from raw markdown content before passing to MarkdownProcessor
   */
  stripFlowPathSyntax(content) {
    return content.replace(/^[ \t]*flowpath\b[^\n]*/gm, '');
  },

  /**
   * Create connections between objects
   */
  createConnectionsFromDiagram(
    diagram,
    nodeToObjectIdMap,
    allConnectionsToSave,
    connectionTags = new Map()
  ) {
    const graph = diagram.graph;
    if (!graph || !graph.connections) {
      return;
    }

    const existingConnections = useConnectionStore.getState().connections;
    const existingConnectionPairs = new Set(
      existingConnections
        .filter((conn) => conn.start?.objectId && conn.end?.objectId)
        .map((conn) => `${conn.start.objectId}|${conn.end.objectId}`)
    );

    Array.from(graph.connections.values()).forEach((connection) => {
      const sourceNodeId = connection.source?.nodeId || connection.source;
      const targetNodeId = connection.target?.nodeId || connection.target;

      const sourceObjectId = nodeToObjectIdMap.get(sourceNodeId);
      const targetObjectId = nodeToObjectIdMap.get(targetNodeId);

      if (
        sourceObjectId &&
        targetObjectId &&
        sourceObjectId !== targetObjectId
      ) {
        if (existingConnectionPairs.has(`${sourceObjectId}|${targetObjectId}`)) {
          return;
        }

        let connectionText = '';
        if (connection.visual?.label?.text) {
          connectionText = connection.visual.label.text;
        } else if (connection.label) {
          connectionText = connection.label;
        } else if (connection.text) {
          connectionText = connection.text;
        }

        const connectionId = `merfolk-conn-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const objectsStore = useObjectsStore.getState();
        const sourceObject = objectsStore.objects.find(
          (obj) => obj.id === sourceObjectId
        );
        const targetObject = objectsStore.objects.find(
          (obj) => obj.id === targetObjectId
        );

        if (!sourceObject || !targetObject) {
          console.warn(
            `Cannot create connection: missing object data for ${sourceObjectId} or ${targetObjectId}`
          );
          return;
        }

        const CUBE_FACES = ['front', 'back', 'left', 'right', 'top', 'bottom'];
        const TETRAHEDRON_FACES = ['front', 'left', 'right', 'bottom'];

        const getFaceForObject = (objectId, objectType, isSource) => {
          const key = `${objectId}_${isSource ? 'source' : 'target'}`;

          if (!window._faceDistributionCounters) {
            window._faceDistributionCounters = new Map();
          }

          const currentCount = window._faceDistributionCounters.get(key) || 0;
          window._faceDistributionCounters.set(key, currentCount + 1);

          if (objectType === 'dodecahedron') {
            return currentCount % 12;
          } else if (objectType === 'tetrahedron') {
            return TETRAHEDRON_FACES[currentCount % TETRAHEDRON_FACES.length];
          } else {
            return CUBE_FACES[currentCount % CUBE_FACES.length];
          }
        };

        const computeFaceWorldPosition = (objectPosition, objectScale, faceName, objectType) => {
          const pos = [...objectPosition];
          const s = objectScale || [1, 1, 1];
          const cubeSize = 5;

          if (objectType === 'tetrahedron') {
            const TETRA_SIZE = 5;
            const v = [
              [0, TETRA_SIZE, 0],
              [-TETRA_SIZE, -TETRA_SIZE, TETRA_SIZE],
              [TETRA_SIZE, -TETRA_SIZE, TETRA_SIZE],
              [0, -TETRA_SIZE, -TETRA_SIZE * 1.5],
            ];
            let fc;
            switch (faceName) {
              case 'bottom': fc = [(v[1][0]+v[2][0]+v[3][0])/3, (v[1][1]+v[2][1]+v[3][1])/3, (v[1][2]+v[2][2]+v[3][2])/3]; break;
              case 'front':  fc = [(v[0][0]+v[2][0]+v[1][0])/3, (v[0][1]+v[2][1]+v[1][1])/3, (v[0][2]+v[2][2]+v[1][2])/3]; break;
              case 'left':   fc = [(v[0][0]+v[1][0]+v[3][0])/3, (v[0][1]+v[1][1]+v[3][1])/3, (v[0][2]+v[1][2]+v[3][2])/3]; break;
              case 'right':  fc = [(v[0][0]+v[3][0]+v[2][0])/3, (v[0][1]+v[3][1]+v[2][1])/3, (v[0][2]+v[3][2]+v[2][2])/3]; break;
              default:       fc = [0, 0, 0];
            }
            return [pos[0] + fc[0] * s[0], pos[1] + fc[1] * s[1], pos[2] + fc[2] * s[2]];
          }

          switch (faceName) {
            case 'front':  return [pos[0], pos[1], pos[2] + cubeSize * s[2]];
            case 'back':   return [pos[0], pos[1], pos[2] - cubeSize * s[2]];
            case 'left':   return [pos[0] - cubeSize * s[0], pos[1], pos[2]];
            case 'right':  return [pos[0] + cubeSize * s[0], pos[1], pos[2]];
            case 'top':    return [pos[0], pos[1] + cubeSize * s[1], pos[2]];
            case 'bottom': return [pos[0], pos[1] - cubeSize * s[1], pos[2]];
            default:       return pos;
          }
        };

        let sourceFaceIndex, targetFaceIndex;
        let sourceWorldPosition, targetWorldPosition;

        sourceFaceIndex = getFaceForObject(sourceObjectId, sourceObject.type, true);
        targetFaceIndex = getFaceForObject(targetObjectId, targetObject.type, false);

        if (sourceObject.type === 'dodecahedron') {
          sourceWorldPosition = [...sourceObject.position];
        } else {
          sourceWorldPosition = computeFaceWorldPosition(
            sourceObject.position, sourceObject.scale, sourceFaceIndex, sourceObject.type
          );
        }

        if (targetObject.type === 'dodecahedron') {
          targetWorldPosition = [...targetObject.position];
        } else {
          targetWorldPosition = computeFaceWorldPosition(
            targetObject.position, targetObject.scale, targetFaceIndex, targetObject.type
          );
        }

        const calculateDodecahedronFaceCenter = (faceIndex) => {
          const phi = (1 + Math.sqrt(5)) / 2;
          const scale = 5;

          const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
            [0, -phi, -1 / phi], [0, phi, -1 / phi], [0, phi, 1 / phi], [0, -phi, 1 / phi],
            [-1 / phi, 0, -phi], [1 / phi, 0, -phi], [1 / phi, 0, phi], [-1 / phi, 0, phi],
            [-phi, -1 / phi, 0], [-phi, 1 / phi, 0], [phi, 1 / phi, 0], [phi, -1 / phi, 0],
          ];

          const faces = [
            [0, 12, 13, 1, 8], [0, 16, 17, 3, 12], [0, 8, 11, 4, 16], [1, 19, 5, 11, 8],
            [1, 13, 2, 18, 19], [2, 13, 12, 3, 9], [2, 9, 10, 6, 18], [3, 17, 7, 10, 9],
            [4, 11, 5, 14, 15], [4, 15, 7, 17, 16], [5, 19, 18, 6, 14], [6, 10, 7, 15, 14],
          ];

          if (faceIndex < 0 || faceIndex >= faces.length) {
            return [0, 0, 0];
          }

          const faceVertices = faces[faceIndex];
          const positions = [];

          for (const vertexIndex of faceVertices) {
            const vertex = vertices[vertexIndex];
            positions.push(vertex[0] * scale, vertex[1] * scale, vertex[2] * scale);
          }

          let centerX = 0, centerY = 0, centerZ = 0;
          for (let i = 0; i < positions.length; i += 3) {
            centerX += positions[i];
            centerY += positions[i + 1];
            centerZ += positions[i + 2];
          }
          const vertexCount = positions.length / 3;

          return [centerX / vertexCount, centerY / vertexCount, centerZ / vertexCount];
        };

        if (sourceObject.type === 'dodecahedron') {
          const fc = calculateDodecahedronFaceCenter(sourceFaceIndex);
          const s = sourceObject.scale || [1, 1, 1];
          sourceWorldPosition = [
            sourceObject.position[0] + fc[0] * s[0],
            sourceObject.position[1] + fc[1] * s[1],
            sourceObject.position[2] + fc[2] * s[2],
          ];
        }
        if (targetObject.type === 'dodecahedron') {
          const fc = calculateDodecahedronFaceCenter(targetFaceIndex);
          const s = targetObject.scale || [1, 1, 1];
          targetWorldPosition = [
            targetObject.position[0] + fc[0] * s[0],
            targetObject.position[1] + fc[1] * s[1],
            targetObject.position[2] + fc[2] * s[2],
          ];
        }

        const connectionData = {
          id: connectionId,
          start: {
            objectId: sourceObjectId,
            type: sourceObject.type === 'dodecahedron' ? 'dodecahedron' : sourceObject.type || 'cube',
            face: sourceFaceIndex,
            position: sourceWorldPosition,
            ...(sourceObject.type === 'dodecahedron' && {
              faceCenter: calculateDodecahedronFaceCenter(sourceFaceIndex),
            }),
            cube: {
              id: sourceObjectId,
              position: [...sourceObject.position],
              scale: sourceObject.scale || [1, 1, 1],
              userData: { objectId: sourceObjectId },
            },
            id: sourceObjectId,
          },
          end: {
            objectId: targetObjectId,
            type: targetObject.type === 'dodecahedron' ? 'dodecahedron' : targetObject.type || 'cube',
            face: targetFaceIndex,
            position: targetWorldPosition,
            ...(targetObject.type === 'dodecahedron' && {
              faceCenter: calculateDodecahedronFaceCenter(targetFaceIndex),
            }),
            cube: {
              id: targetObjectId,
              position: [...targetObject.position],
              scale: targetObject.scale || [1, 1, 1],
              userData: { objectId: targetObjectId },
            },
            id: targetObjectId,
          },
          text: connectionText,
          color: connection.visual?.color || '#888888',
          thickness: connection.visual?.thickness || 2,
          textStyle: { fontSize: 4, color: 'black' },
          cellId: (() => {
            const coords = getCellCoordinates(sourceWorldPosition);
            return getCellId(coords.x, coords.y, coords.z);
          })(),
          merfolkData: {
            sourceNode: sourceNodeId,
            targetNode: targetNodeId,
            connectionType: connection.type,
            flowPaths: Array.from(
              connectionTags.get(`${sourceNodeId}|${targetNodeId}`) || []
            ),
          },
        };

        allConnectionsToSave.push(connectionData);
      }
    });
  },

  /**
   * Save all connections using Cloud Function for bulk import
   */
  async saveConnections(
    allConnectionsToSave,
    currentSpaceId,
    user,
    allObjectsToSave = []
  ) {
    if (allConnectionsToSave.length === 0 && allObjectsToSave.length === 0)
      return Promise.resolve();

    const connectionStore = useConnectionStore.getState();

    try {
      connectionStore.bulkAddConnections(allConnectionsToSave);
    } catch (error) {
      console.error('Failed to bulk add connections to store:', error);
    }

    if (!user || !currentSpaceId) {
      return Promise.resolve();
    }

    return this._cloudFunctionBulkImport(
      allConnectionsToSave,
      currentSpaceId,
      user,
      allObjectsToSave
    );
  },

  /**
   * Call Cloud Function to perform bulk import server-side
   * @private
   */
  async _cloudFunctionBulkImport(
    allConnectionsToSave,
    currentSpaceId,
    user,
    allObjectsToSave = []
  ) {
    const startTime = performance.now();

    try {
      const idToken = await auth.currentUser.getIdToken();

      const connections = allConnectionsToSave.map((conn) => ({
        id: conn.id,
        start: conn.start || {
          objectId: conn.from?.objectId || conn.from?.id,
          type: conn.from?.type,
          face: conn.from?.face,
          position: conn.from?.position,
        },
        end: conn.end || {
          objectId: conn.to?.objectId || conn.to?.id,
          type: conn.to?.type,
          face: conn.to?.face,
          position: conn.to?.position,
        },
        type: conn.type || 'line',
        color: conn.color || '#000000',
        createdAt: conn.createdAt || Date.now(),
        cellId: conn.cellId,
        ...(conn.text && { text: conn.text }),
        ...(conn.thickness && { thickness: conn.thickness }),
        ...(conn.textStyle && { textStyle: conn.textStyle }),
        ...(conn.curvedPath && {
          curvedPath: conn.curvedPath.map((p) =>
            Array.isArray(p) ? [...p] : p
          ),
        }),
        ...(conn.merfolkData && { merfolkData: conn.merfolkData }),
      }));

      const objects = allObjectsToSave.map((obj) => ({
        id: obj.id,
        position: obj.position,
        type: obj.type,
        color: obj.color,
        content: obj.content || '',
        createdAt: obj.createdAt || Date.now(),
        cellId: obj.cellId,
        ...(obj.size && { size: obj.size }),
        ...(obj.scale && { scale: obj.scale }),
        ...(obj.rotation && { rotation: obj.rotation }),
        ...(obj.textStyle && { textStyle: obj.textStyle }),
        ...(obj.headerText !== undefined && { headerText: obj.headerText }),
        ...(obj.headerStyle && { headerStyle: obj.headerStyle }),
        ...(obj.faceColors && { faceColors: obj.faceColors }),
        ...(obj.faceTexts && { faceTexts: obj.faceTexts }),
        ...(obj.faceTextStyles && { faceTextStyles: obj.faceTextStyles }),
        ...(obj.lineColor && { lineColor: obj.lineColor }),
        ...(obj.borderStyle && { borderStyle: obj.borderStyle }),
        ...(obj.borderColor && { borderColor: obj.borderColor }),
        ...(obj.lineThickness && { lineThickness: obj.lineThickness }),
        ...(obj.merfolkData && { merfolkData: obj.merfolkData }),
      }));

      const functionUrl = 'https://bulkimport-qtk2xsi74a-uc.a.run.app';

      const payload = {
        idToken,
        userId: user.uid,
        spaceId: currentSpaceId,
        objects,
        connections,
      };

      const payloadSize = JSON.stringify(payload).length;

      if (payloadSize > 9 * 1024 * 1024) {
        console.warn(
          '⚠️ [CloudFunction] Payload too large, falling back to client-side save'
        );
        return this._backgroundSaveConnections(
          allConnectionsToSave,
          currentSpaceId,
          user
        );
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
          console.error('❌ [CloudFunction] Error response:', errorData);
        } catch {
          try {
            const errorText = await response.text();
            console.error('❌ [CloudFunction] Error text:', errorText);
            errorMessage = errorText || errorMessage;
          } catch {
            console.error('❌ [CloudFunction] Could not read error response');
          }
        }
        throw new Error(`Cloud Function error: ${errorMessage}`);
      }

      const result = await response.json();
      const duration = ((performance.now() - startTime) / 1000).toFixed(2); // eslint-disable-line no-unused-vars

      return result;
    } catch (error) {
      console.error('❌ [CloudFunction] Bulk import failed:', error);

      return this._backgroundSaveConnections(
        allConnectionsToSave,
        currentSpaceId,
        user
      );
    }
  },

  /**
   * Background process for saving connections to Firebase (FALLBACK ONLY)
   * @private
   */
  async _backgroundSaveConnections(allConnectionsToSave, currentSpaceId, user) {
    const BATCH_SIZE = 20;
    const startTime = performance.now();

    try {
      await pauseConnectionListeners();
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const MAX_CONCURRENT_BATCHES = 1;
      const totalBatches = Math.ceil(allConnectionsToSave.length / BATCH_SIZE);
      let savedCount = 0;

      for (
        let batchGroup = 0;
        batchGroup < totalBatches;
        batchGroup += MAX_CONCURRENT_BATCHES
      ) {
        const groupPromises = [];

        if (batchGroup > 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        for (
          let batchOffset = 0;
          batchOffset < MAX_CONCURRENT_BATCHES;
          batchOffset++
        ) {
          const batchIndex = batchGroup + batchOffset;
          if (batchIndex >= totalBatches) break;

          const i = batchIndex * BATCH_SIZE;
          const batch = allConnectionsToSave.slice(
            i,
            Math.min(i + BATCH_SIZE, allConnectionsToSave.length)
          );
          const currentBatchNumber = batchIndex + 1;

          const batchPromise = (async () => {
            const batchStart = performance.now();

            try {
              const connectionsByCell = new Map();

              for (const connectionData of batch) {
                const startPosition = connectionData.start?.position;
                const endPosition = connectionData.end?.position;

                if (!startPosition || !endPosition) {
                  continue;
                }

                const startCellCoords = getCellCoordinates(startPosition);
                const startCellId = getCellId(
                  startCellCoords.x,
                  startCellCoords.y,
                  startCellCoords.z
                );

                if (!connectionsByCell.has(startCellId)) {
                  connectionsByCell.set(startCellId, []);
                }
                connectionsByCell.get(startCellId).push(connectionData);
              }

              let batchSavedCount = 0;
              const cellEntries = Array.from(connectionsByCell.entries());

              for (let cellIdx = 0; cellIdx < cellEntries.length; cellIdx++) {
                const [cellId, connections] = cellEntries[cellIdx];
                try {
                  const success = await bulkSaveConnectionsToCell(
                    user.uid,
                    currentSpaceId,
                    cellId,
                    connections,
                    false
                  );
                  if (success) {
                    batchSavedCount += connections.length;
                  }
                } catch (error) {
                  console.error(
                    `✗ Cell ${cellId} in batch ${currentBatchNumber} failed:`,
                    error
                  );
                }
              }

              const batchDuration = // eslint-disable-line no-unused-vars
                ((performance.now() - batchStart) / 1000).toFixed(2);

              return batchSavedCount;
            } catch (error) {
              console.error(`❌ Batch ${currentBatchNumber} failed:`, error);
              return 0;
            }
          })();

          groupPromises.push(batchPromise);
        }

        const groupResults = await Promise.all(groupPromises);
        const groupSaved = groupResults.reduce((sum, count) => sum + count, 0);
        savedCount += groupSaved; // eslint-disable-line no-unused-vars
      }

      const duration = ((performance.now() - startTime) / 1000).toFixed(2); // eslint-disable-line no-unused-vars

      await resumeConnectionListeners();
    } catch (error) {
      console.error('❌ Background save process failed:', error);

      try {
        await resumeConnectionListeners();
      } catch (resumeError) {
        console.error('❌ Failed to resume listeners:', resumeError);
      }
    }
  },
};
