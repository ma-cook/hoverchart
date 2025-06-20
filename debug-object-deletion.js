// Debug script to test object deletion persistence
console.log('🔍 === OBJECT DELETION DEBUG ===');

// Helper function to check what's actually in Firebase for these specific objects
const checkObjectsInFirebase = async () => {
  if (!window.currentSpaceOwner || !window.currentSpaceId) {
    console.log('❌ No space owner or space ID available');
    return;
  }

  const objectIds = [
    '1750095844596-0qlhv5ha',
    '1750095849076-71ahpqr9',
    '1750095846276-ishjg9mm',
    '1750095847692-gwk05pxj',
  ];

  console.log('🔍 Checking Firebase for these object IDs:', objectIds);

  try {
    // Import Firebase functions
    const { db } = await import('./src/firebase.js');
    const { getDocs, collection } = await import('firebase/firestore');

    const spaceOwner = window.currentSpaceOwner;
    const spaceId = window.currentSpaceId;

    // Get all cells in the space
    const cellsRef = collection(
      db,
      'users',
      spaceOwner,
      'spaces',
      spaceId,
      'cells'
    );
    const snapshot = await getDocs(cellsRef);

    console.log(`📊 Found ${snapshot.size} cells in Firebase`);

    const foundObjects = {};
    snapshot.forEach((cellDoc) => {
      const cellData = cellDoc.data();
      const cellId = cellDoc.id;

      if (cellData.objects && typeof cellData.objects === 'object') {
        objectIds.forEach((objId) => {
          if (cellData.objects[objId]) {
            foundObjects[objId] = {
              cellId,
              data: cellData.objects[objId],
            };
          }
        });
      }
    });

    console.log('🔍 Objects found in Firebase:', foundObjects);

    if (Object.keys(foundObjects).length === 0) {
      console.log(
        '✅ No objects found in Firebase - deletion appears successful'
      );
    } else {
      console.log('❌ Objects still exist in Firebase:');
      Object.entries(foundObjects).forEach(([objId, info]) => {
        console.log(`  - Object ${objId} in cell ${info.cellId}`);
        console.log(`    Created: ${info.data.createdAt}`);
        console.log(`    Updated: ${info.data.lastUpdated}`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking Firebase:', error);
  }
};

// Helper function to check what's in the local cache/store
const checkLocalState = () => {
  console.log('🔍 Checking local state...');

  // Check Zustand store
  if (window._zustandStores && window._zustandStores.objectsStore) {
    const objects = window._zustandStores.objectsStore.getState().objects;
    const targetObjects = objects.filter((obj) =>
      [
        '1750095844596-0qlhv5ha',
        '1750095849076-71ahpqr9',
        '1750095846276-ishjg9mm',
        '1750095847692-gwk05pxj',
      ].includes(obj.id.toString())
    );

    console.log(
      `📊 Found ${targetObjects.length} target objects in local store`
    );
    targetObjects.forEach((obj) => {
      console.log(`  - ${obj.id} at position [${obj.position.join(', ')}]`);
    });

    // Check recently deleted objects
    const recentlyDeleted =
      window._zustandStores.objectsStore.getState().recentlyDeletedObjects;
    console.log(
      '🗑️ Recently deleted objects:',
      Array.from(recentlyDeleted.entries())
    );
  } else {
    console.log('❌ No Zustand store access available');
  }
};

// Run the debug checks
console.log('1. Checking local state...');
checkLocalState();

console.log('2. Checking Firebase state...');
checkObjectsInFirebase();

// Make functions available globally for manual testing
window.debugObjectDeletion = {
  checkFirebase: checkObjectsInFirebase,
  checkLocal: checkLocalState,
  runAll: () => {
    checkLocalState();
    checkObjectsInFirebase();
  },
};

console.log('💡 Use window.debugObjectDeletion.runAll() to run all checks');
console.log(
  '💡 Use window.debugObjectDeletion.checkFirebase() to check Firebase only'
);
console.log(
  '💡 Use window.debugObjectDeletion.checkLocal() to check local state only'
);
