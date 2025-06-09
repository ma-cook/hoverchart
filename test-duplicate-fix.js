// Test script to verify the duplicate object fix
console.log('🧪 Testing Duplicate Object Fix...\n');

// Mock Firebase functions for testing
const mockFirestore = {
  docs: new Map(),

  async getDoc(ref) {
    const key = `${ref.path}`;
    const data = this.docs.get(key);
    return {
      exists: () => !!data,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : null),
    };
  },

  async setDoc(ref, data, options = {}) {
    const key = `${ref.path}`;
    if (options.merge && this.docs.has(key)) {
      const existing = this.docs.get(key);
      this.docs.set(key, { ...existing, ...data });
    } else {
      this.docs.set(key, data);
    }
    return true;
  },

  // Helper to check cell contents
  getCellContents(userId, spaceId, cellId) {
    const key = `users/${userId}/spaces/${spaceId}/cells/${cellId}`;
    const data = this.docs.get(key);
    return data?.objects || {};
  },

  // Helper to find object across all cells
  findObject(userId, spaceId, objectId) {
    const results = [];
    for (const [path, data] of this.docs.entries()) {
      if (
        path.includes(`users/${userId}/spaces/${spaceId}/cells/`) &&
        data.objects
      ) {
        if (data.objects[objectId]) {
          const cellId = path.split('/').pop();
          results.push({ cellId, data: data.objects[objectId] });
        }
      }
    }
    return results;
  },
};

// Mock spatial partitioning functions
const CELL_SIZE = 10000;

const getCellCoordinates = (position) => {
  const [x, y, z] = position;
  return {
    x: Math.floor(x / CELL_SIZE),
    y: Math.floor(y / CELL_SIZE),
    z: Math.floor(z / CELL_SIZE),
  };
};

const getCellId = (x, y, z) => `${x},${y},${z}`;

const getCellBounds = (x, y, z) => ({
  minX: x * CELL_SIZE,
  maxX: (x + 1) * CELL_SIZE,
  minY: y * CELL_SIZE,
  maxY: (y + 1) * CELL_SIZE,
  minZ: z * CELL_SIZE,
  maxZ: (z + 1) * CELL_SIZE,
});

// Mock doc function
const doc = (db, ...pathSegments) => ({
  path: pathSegments.join('/'),
});

// Mock database reference
const db = mockFirestore;

// Implementation of fixed functions
const createCell = async (userId, spaceId, cellX, cellY, cellZ) => {
  const cellId = getCellId(cellX, cellY, cellZ);
  const cellRef = doc(db, 'users', userId, 'spaces', spaceId, 'cells', cellId);

  const cellDoc = await mockFirestore.getDoc(cellRef);
  if (cellDoc.exists()) {
    return true;
  }

  const cellData = {
    id: cellId,
    x: cellX,
    y: cellY,
    z: cellZ,
    bounds: getCellBounds(cellX, cellY, cellZ),
    createdAt: new Date(),
    objects: {},
    connections: {},
  };

  await mockFirestore.setDoc(cellRef, cellData);
  return true;
};

const addObjectToCell = async (userId, spaceId, objectData) => {
  if (
    !userId ||
    !spaceId ||
    !objectData ||
    !objectData.id ||
    !objectData.position
  ) {
    console.warn('addObjectToCell: Missing required parameters');
    return false;
  }

  try {
    const cellCoords = getCellCoordinates(objectData.position);
    const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    const cellDoc = await mockFirestore.getDoc(cellRef);
    let cellData;

    if (cellDoc.exists()) {
      cellData = cellDoc.data();
    } else {
      console.log(`📦 Creating new cell ${cellId} for object ${objectData.id}`);
      await createCell(
        userId,
        spaceId,
        cellCoords.x,
        cellCoords.y,
        cellCoords.z
      );
      cellData = {
        id: cellId,
        x: cellCoords.x,
        y: cellCoords.y,
        z: cellCoords.z,
        bounds: getCellBounds(cellCoords.x, cellCoords.y, cellCoords.z),
        createdAt: new Date(),
        objects: {},
        connections: {},
      };
    }

    if (Array.isArray(cellData.objects)) {
      cellData.objects = {};
    }

    const objectExists = cellData.objects[objectData.id];
    if (objectExists) {
      console.log(
        `🔄 Updating existing object ${objectData.id} in cell ${cellId}`
      );
    } else {
      console.log(`➕ Adding new object ${objectData.id} to cell ${cellId}`);
    }

    cellData.objects[objectData.id] = {
      ...objectData,
      lastUpdated: new Date(),
      cellId: cellId,
    };

    await mockFirestore.setDoc(cellRef, cellData, { merge: true });
    console.log(
      `✅ Successfully saved object ${objectData.id} to cell ${cellId}`
    );

    return true;
  } catch (error) {
    console.error(`❌ Error adding object ${objectData.id} to cell:`, error);
    return false;
  }
};

const removeObjectFromCell = async (userId, spaceId, objectId, position) => {
  if (!userId || !spaceId || !objectId || !position) {
    console.warn('removeObjectFromCell: Missing required parameters');
    return false;
  }

  try {
    const cellCoords = getCellCoordinates(position);
    const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);
    const cellRef = doc(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'cells',
      cellId
    );

    const cellDoc = await mockFirestore.getDoc(cellRef);
    if (!cellDoc.exists()) {
      console.log(
        `📍 Cell ${cellId} doesn't exist, object ${objectId} already removed`
      );
      return true;
    }

    const cellData = cellDoc.data();
    let objectRemoved = false;

    if (Array.isArray(cellData.objects)) {
      const objectIndex = cellData.objects.indexOf(objectId);
      if (objectIndex > -1) {
        cellData.objects.splice(objectIndex, 1);
        objectRemoved = true;
      }
    } else if (cellData.objects && typeof cellData.objects === 'object') {
      if (cellData.objects[objectId]) {
        delete cellData.objects[objectId];
        objectRemoved = true;
      }
    }

    if (objectRemoved) {
      await mockFirestore.setDoc(cellRef, cellData, { merge: true });
      console.log(`🗑️ Removed object ${objectId} from cell ${cellId}`);
    } else {
      console.log(`ℹ️ Object ${objectId} was not found in cell ${cellId}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error removing object ${objectId} from cell:`, error);
    return false;
  }
};

const moveObjectBetweenCells = async (
  userId,
  spaceId,
  objectIdOrData,
  oldPosition,
  newPosition,
  objectData = null
) => {
  if (!userId || !spaceId || !objectIdOrData || !oldPosition || !newPosition)
    return false;

  let objectId, fullObjectData;

  if (typeof objectIdOrData === 'string') {
    objectId = objectIdOrData;
    fullObjectData = objectData || { id: objectId, position: newPosition };
  } else {
    fullObjectData = objectIdOrData;
    objectId = fullObjectData.id;
  }

  if (!objectId) {
    console.error('moveObjectBetweenCells: No object ID provided');
    return false;
  }

  const oldCellCoords = getCellCoordinates(oldPosition);
  const newCellCoords = getCellCoordinates(newPosition);

  if (
    oldCellCoords.x === newCellCoords.x &&
    oldCellCoords.y === newCellCoords.y &&
    oldCellCoords.z === newCellCoords.z
  ) {
    const updatedObjectData = { ...fullObjectData, position: newPosition };
    return await addObjectToCell(userId, spaceId, updatedObjectData);
  }

  try {
    console.log(
      `🔄 Moving object ${objectId} from cell ${getCellId(
        oldCellCoords.x,
        oldCellCoords.y,
        oldCellCoords.z
      )} to ${getCellId(newCellCoords.x, newCellCoords.y, newCellCoords.z)}`
    );

    const removed = await removeObjectFromCell(
      userId,
      spaceId,
      objectId,
      oldPosition
    );
    if (!removed) {
      console.warn(`⚠️ Failed to remove object ${objectId} from old cell`);
    }

    const updatedObjectData = { ...fullObjectData, position: newPosition };
    const added = await addObjectToCell(userId, spaceId, updatedObjectData);

    if (added) {
      console.log(`✅ Successfully moved object ${objectId} between cells`);
      return true;
    } else {
      console.error(`❌ Failed to add object ${objectId} to new cell`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error moving object ${objectId} between cells:`, error);
    return false;
  }
};

// Test scenarios
async function runTests() {
  const userId = 'test-user';
  const spaceId = 'test-space';

  console.log('='.repeat(60));
  console.log('TEST 1: Object Movement Between Cells (Legacy Signature)');
  console.log('='.repeat(60));

  // Create test object in first cell
  const testObject1 = {
    id: 'obj1',
    type: 'cube',
    position: [5000, 5000, 5000], // Cell (0,0,0)
    scale: [1, 1, 1],
    color: 'red',
  };

  // Add object to first cell
  await addObjectToCell(userId, spaceId, testObject1);

  // Check object is in first cell
  let objectLocations = mockFirestore.findObject(userId, spaceId, 'obj1');
  console.log(`\n📍 Object locations before move: ${objectLocations.length}`);
  objectLocations.forEach((loc) =>
    console.log(
      `   Cell ${loc.cellId}: position ${JSON.stringify(loc.data.position)}`
    )
  );

  if (objectLocations.length !== 1) {
    console.log('❌ FAIL: Object should be in exactly one cell before move');
    return false;
  }

  // Move object to different cell using legacy signature
  const newPosition = [15000, 15000, 15000]; // Cell (1,1,1)
  const success = await moveObjectBetweenCells(
    userId,
    spaceId,
    { ...testObject1, position: newPosition }, // objectData
    testObject1.position, // oldPosition
    newPosition // newPosition
  );

  if (!success) {
    console.log('❌ FAIL: moveObjectBetweenCells returned false');
    return false;
  }

  // Check object is only in new cell
  objectLocations = mockFirestore.findObject(userId, spaceId, 'obj1');
  console.log(`\n📍 Object locations after move: ${objectLocations.length}`);
  objectLocations.forEach((loc) =>
    console.log(
      `   Cell ${loc.cellId}: position ${JSON.stringify(loc.data.position)}`
    )
  );

  if (objectLocations.length !== 1) {
    console.log('❌ FAIL: Object should be in exactly one cell after move');
    return false;
  }

  const expectedCellId = getCellId(1, 1, 1);
  if (objectLocations[0].cellId !== expectedCellId) {
    console.log(
      `❌ FAIL: Object should be in cell ${expectedCellId}, but found in ${objectLocations[0].cellId}`
    );
    return false;
  }

  console.log('✅ PASS: Legacy signature move test passed\n');

  console.log('='.repeat(60));
  console.log('TEST 2: Object Movement Between Cells (New Signature)');
  console.log('='.repeat(60));

  // Test the new signature that spatialObjectsService.js uses
  const testObject2 = {
    id: 'obj2',
    type: 'cube',
    position: [25000, 25000, 25000], // Cell (2,2,2)
    scale: [1, 1, 1],
    color: 'blue',
  };

  // Add object to first cell
  await addObjectToCell(userId, spaceId, testObject2);

  // Move using new signature (objectId, oldPos, newPos, objectData)
  const newPosition2 = [35000, 35000, 35000]; // Cell (3,3,3)
  const success2 = await moveObjectBetweenCells(
    userId,
    spaceId,
    'obj2', // objectId
    testObject2.position, // oldPosition
    newPosition2, // newPosition
    { ...testObject2, position: newPosition2 } // objectData
  );

  if (!success2) {
    console.log(
      '❌ FAIL: moveObjectBetweenCells (new signature) returned false'
    );
    return false;
  }

  // Check object is only in new cell
  const objectLocations2 = mockFirestore.findObject(userId, spaceId, 'obj2');
  console.log(`\n📍 Object locations after move: ${objectLocations2.length}`);
  objectLocations2.forEach((loc) =>
    console.log(
      `   Cell ${loc.cellId}: position ${JSON.stringify(loc.data.position)}`
    )
  );

  if (objectLocations2.length !== 1) {
    console.log('❌ FAIL: Object should be in exactly one cell after move');
    return false;
  }

  const expectedCellId2 = getCellId(3, 3, 3);
  if (objectLocations2[0].cellId !== expectedCellId2) {
    console.log(
      `❌ FAIL: Object should be in cell ${expectedCellId2}, but found in ${objectLocations2[0].cellId}`
    );
    return false;
  }

  console.log('✅ PASS: New signature move test passed\n');

  console.log('='.repeat(60));
  console.log('TEST 3: Multiple Rapid Moves (Stress Test)');
  console.log('='.repeat(60));

  const testObject3 = {
    id: 'obj3',
    type: 'cube',
    position: [1000, 1000, 1000], // Cell (0,0,0)
    scale: [1, 1, 1],
    color: 'green',
  };

  await addObjectToCell(userId, spaceId, testObject3);

  // Perform multiple rapid moves
  const positions = [
    [11000, 11000, 11000], // Cell (1,1,1)
    [21000, 21000, 21000], // Cell (2,2,2)
    [31000, 31000, 31000], // Cell (3,3,3)
    [41000, 41000, 41000], // Cell (4,4,4)
  ];

  let currentPos = testObject3.position;

  for (let i = 0; i < positions.length; i++) {
    const newPos = positions[i];
    console.log(
      `\n🔄 Move ${i + 1}: ${JSON.stringify(currentPos)} → ${JSON.stringify(
        newPos
      )}`
    );

    const moveSuccess = await moveObjectBetweenCells(
      userId,
      spaceId,
      'obj3',
      currentPos,
      newPos,
      { ...testObject3, position: newPos }
    );

    if (!moveSuccess) {
      console.log(`❌ FAIL: Move ${i + 1} failed`);
      return false;
    }

    // Check object count
    const locations = mockFirestore.findObject(userId, spaceId, 'obj3');
    if (locations.length !== 1) {
      console.log(
        `❌ FAIL: After move ${i + 1}, object found in ${
          locations.length
        } cells`
      );
      locations.forEach((loc) => console.log(`   Cell ${loc.cellId}`));
      return false;
    }

    currentPos = newPos;
  }

  console.log('✅ PASS: Rapid moves stress test passed\n');

  console.log('='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));

  // Check final state - should have 3 objects, each in exactly one cell
  const allObjects = ['obj1', 'obj2', 'obj3'];
  let totalDuplicates = 0;

  for (const objId of allObjects) {
    const locations = mockFirestore.findObject(userId, spaceId, objId);
    console.log(`Object ${objId}: Found in ${locations.length} cell(s)`);
    if (locations.length > 1) {
      totalDuplicates += locations.length - 1;
      locations.forEach((loc) => console.log(`   ⚠️ Cell ${loc.cellId}`));
    } else if (locations.length === 1) {
      console.log(`   ✅ Cell ${locations[0].cellId}`);
    } else {
      console.log(`   ❌ Not found anywhere!`);
    }
  }

  if (totalDuplicates === 0) {
    console.log(`\n🎉 SUCCESS: No duplicate objects found!`);
    console.log(
      `✅ All tests passed - the duplicate object fix is working correctly.`
    );
    return true;
  } else {
    console.log(`\n❌ FAILURE: Found ${totalDuplicates} duplicate object(s)`);
    return false;
  }
}

// Run the tests
runTests()
  .then((success) => {
    if (success) {
      console.log('\n🏆 All tests completed successfully!');
    } else {
      console.log('\n💥 Some tests failed!');
    }
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
  });
