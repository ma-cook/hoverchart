// Debug script to check connection storage in cells
console.log('🔧 Debug: Checking connection storage in cells...');

// Function to manually check a specific cell for connections
window.debugCheckCell = async (cellId) => {
  try {
    const { db } = await import('./src/firebase.js');
    const { doc, getDoc } = await import('firebase/firestore');

    const userId = window._currentUserId || 'VsKDyU5XjiNYHzKVuwVanCPd90A2';
    const spaceId = window._currentSpaceId || '4K1JXdF6TRWZ2sC5ExLD';

    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );
    const cellDoc = await getDoc(cellRef);

    console.log(`🔍 Cell ${cellId} check:`, {
      exists: cellDoc.exists(),
      data: cellDoc.exists() ? cellDoc.data() : null,
    });

    if (cellDoc.exists()) {
      const cellData = cellDoc.data();
      if (cellData.connections) {
        console.log(`📁 Connections in cell ${cellId}:`, cellData.connections);
        Object.entries(cellData.connections).forEach(([connId, conn]) => {
          console.log(`🔗 Connection ${connId}:`, {
            startObjectId: conn.start?.objectId,
            endObjectId: conn.end?.objectId,
            startPosition: conn.start?.position,
            endPosition: conn.end?.position,
          });
        });
      } else {
        console.log(`📭 No connections found in cell ${cellId}`);
      }
    }
  } catch (error) {
    console.error('Error checking cell:', error);
  }
};

// Function to check all cells that might contain connections
window.debugCheckAllCells = async () => {
  // Check common cells around origin
  const cellsToCheck = [
    '0,0,0',
    '0,0,-1',
    '0,0,-2',
    '0,0,1',
    '-1,0,0',
    '-1,0,-1',
    '-1,0,-2',
    '-1,0,1',
    '1,0,0',
    '1,0,-1',
    '1,0,-2',
    '1,0,1',
  ];

  for (const cellId of cellsToCheck) {
    await window.debugCheckCell(cellId);
  }
};

console.log('🔧 Debug functions loaded:');
console.log('- debugCheckCell(cellId): Check a specific cell for connections');
console.log('- debugCheckAllCells(): Check common cells around origin');
console.log('Example: debugCheckCell("-1,0,-1")');
