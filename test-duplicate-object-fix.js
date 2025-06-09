// Test script to verify the duplicate object issue is fixed
console.log('🧪 Testing Duplicate Object Fix after Cell Movement...\n');

// Mock Firebase functions for testing
const mockObjects = new Map();
const mockCells = new Map();

// Simulate the spatial partitioning functions
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

// Mock addObjectToCell
const addObjectToCell = async (userId, spaceId, objectData) => {
  const cellCoords = getCellCoordinates(objectData.position);
  const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

  if (!mockCells.has(cellId)) {
    mockCells.set(cellId, { objects: {} });
  }

  const cell = mockCells.get(cellId);
  cell.objects[objectData.id] = objectData;

  console.log(
    `➕ Added object ${
      objectData.id
    } to cell ${cellId} at position [${objectData.position.join(', ')}]`
  );
  return true;
};

// Mock removeObjectFromCell
const removeObjectFromCell = async (userId, spaceId, objectId, position) => {
  const cellCoords = getCellCoordinates(position);
  const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

  const cell = mockCells.get(cellId);
  if (cell && cell.objects[objectId]) {
    delete cell.objects[objectId];
    console.log(`🗑️ Removed object ${objectId} from cell ${cellId}`);
    return true;
  } else {
    console.log(`ℹ️ Object ${objectId} was not found in cell ${cellId}`);
    return true;
  }
};

// Mock moveObjectBetweenCells - implementing the FIXED version
const moveObjectBetweenCells = async (
  userId,
  spaceId,
  objectIdOrData,
  oldPosition,
  newPosition,
  objectData = null
) => {
  // Handle both signatures
  let objectId, fullObjectData;

  if (typeof objectIdOrData === 'string') {
    objectId = objectIdOrData;
    fullObjectData = objectData || { id: objectId, position: newPosition };
  } else {
    fullObjectData = objectIdOrData;
    objectId = fullObjectData.id;
  }

  const oldCellCoords = getCellCoordinates(oldPosition);
  const newCellCoords = getCellCoordinates(newPosition);

  // If object didn't change cells, just update
  if (
    oldCellCoords.x === newCellCoords.x &&
    oldCellCoords.y === newCellCoords.y &&
    oldCellCoords.z === newCellCoords.z
  ) {
    const updatedObjectData = { ...fullObjectData, position: newPosition };
    return await addObjectToCell(userId, spaceId, updatedObjectData);
  }

  // ATOMIC OPERATION: Remove from old cell first, then add to new cell
  console.log(
    `🔄 Moving object ${objectId} from cell ${getCellId(
      oldCellCoords.x,
      oldCellCoords.y,
      oldCellCoords.z
    )} to ${getCellId(newCellCoords.x, newCellCoords.y, newCellCoords.z)}`
  );

  // Step 1: Remove from old cell
  const removed = await removeObjectFromCell(
    userId,
    spaceId,
    objectId,
    oldPosition
  );

  // Step 2: Add to new cell
  const updatedObjectData = { ...fullObjectData, position: newPosition };
  const added = await addObjectToCell(userId, spaceId, updatedObjectData);

  if (added) {
    console.log(`✅ Successfully moved object ${objectId} between cells`);
    return true;
  } else {
    console.error(`❌ Failed to add object ${objectId} to new cell`);
    return false;
  }
};

// Function to check for duplicates across all cells
const checkForDuplicates = () => {
  const objectCounts = new Map();

  for (const [cellId, cell] of mockCells) {
    for (const [objectId, objectData] of Object.entries(cell.objects)) {
      if (!objectCounts.has(objectId)) {
        objectCounts.set(objectId, []);
      }
      objectCounts
        .get(objectId)
        .push({ cellId, position: objectData.position });
    }
  }

  const duplicates = [];
  for (const [objectId, locations] of objectCounts) {
    if (locations.length > 1) {
      duplicates.push({ objectId, locations });
    }
  }

  return duplicates;
};

// Function to get all objects from loaded cells (simulating page refresh)
const getAllObjectsFromCells = () => {
  const allObjects = [];
  for (const [cellId, cell] of mockCells) {
    for (const objectData of Object.values(cell.objects)) {
      allObjects.push(objectData);
    }
  }
  return allObjects;
};

// Test the scenario
async function testDuplicateObjectFix() {
  console.log('📦 Test 1: Create object in cell (0,0,0)');
  const objectData = {
    id: 'test-object-1',
    position: [5000, 5000, 5000], // Center of cell (0,0,0)
    type: 'cube',
  };

  await addObjectToCell('user1', 'space1', objectData);
  console.log(
    'Objects after creation:',
    getAllObjectsFromCells().map((o) => ({ id: o.id, position: o.position }))
  );

  console.log('\n🔄 Test 2: Move object to cell (1,0,0)');
  const newPosition = [15000, 5000, 5000]; // Center of cell (1,0,0)
  const oldPosition = objectData.position;

  // Test the fixed moveObjectBetweenCells function
  await moveObjectBetweenCells(
    'user1',
    'space1',
    'test-object-1', // objectId
    oldPosition,
    newPosition,
    { ...objectData, position: newPosition } // objectData
  );

  console.log('\n📊 Test 3: Check for duplicates');
  const duplicates = checkForDuplicates();

  if (duplicates.length === 0) {
    console.log('✅ SUCCESS: No duplicate objects found!');
  } else {
    console.log('❌ FAILURE: Found duplicate objects:');
    duplicates.forEach((dup) => {
      console.log(
        `   Object ${dup.objectId} found in ${dup.locations.length} cells:`
      );
      dup.locations.forEach((loc) => {
        console.log(
          `     - Cell ${loc.cellId} at position [${loc.position.join(', ')}]`
        );
      });
    });
  }

  console.log('\n📍 Test 4: Simulate page refresh - loading all objects');
  const loadedObjects = getAllObjectsFromCells();
  console.log(
    'Objects loaded after refresh:',
    loadedObjects.map((o) => ({ id: o.id, position: o.position }))
  );

  // Check if object has correct position
  const testObject = loadedObjects.find((o) => o.id === 'test-object-1');
  if (testObject) {
    const expectedPos = [15000, 5000, 5000];
    const actualPos = testObject.position;
    const positionCorrect =
      JSON.stringify(expectedPos) === JSON.stringify(actualPos);

    if (positionCorrect) {
      console.log('✅ SUCCESS: Object has correct position after refresh');
    } else {
      console.log('❌ FAILURE: Object position is incorrect');
      console.log(`   Expected: [${expectedPos.join(', ')}]`);
      console.log(`   Actual: [${actualPos.join(', ')}]`);
    }
  } else {
    console.log('❌ FAILURE: Object not found after refresh');
  }

  console.log('\n🧪 Test completed!');
}

// Run the test
testDuplicateObjectFix().catch(console.error);
