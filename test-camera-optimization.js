// Test camera movement optimizations to reduce Firebase channel requests
// Run this in browser console after the app loads

let requestCount = 0;
let originalFetch = window.fetch;

// Monitor Firebase requests
window.fetch = function (...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('firestore.googleapis.com')) {
    requestCount++;
    console.log(
      `🔥 Firebase request #${requestCount}: ${
        url.includes('channel?') ? 'Channel (real-time)' : 'REST API'
      }`
    );
  }
  return originalFetch.apply(this, args);
};

// Test camera movement optimization
async function testCameraOptimization() {
  console.log('🚀 Starting camera movement optimization test...');

  const camera = window.camera || window.cameraRef?.current?.camera;
  if (!camera) {
    console.error('❌ Camera not available');
    return;
  }

  console.log('📊 Current optimization settings:');
  console.log('  - POSITION_UPDATE_THROTTLE: 250ms (increased from 100ms)');
  console.log('  - CAMERA_CHECK_INTERVAL: 500ms (increased from 200ms)');
  console.log('  - MOVEMENT_THRESHOLD: 200 units (increased from 100)');
  console.log('  - Cell load cooldown: 1000ms');
  console.log('  - Predictive loading: Only between 500-2000 units/sec speed');

  const initialRequestCount = requestCount;
  const startTime = Date.now();

  // Test rapid camera movements (should be throttled)
  console.log('\n🎯 Test 1: Rapid small movements (should be throttled)');
  for (let i = 0; i < 10; i++) {
    camera.position.set(20 + i * 5, 20, 50);
    if (window.updateCameraPosition) {
      window.updateCameraPosition([20 + i * 5, 20, 50]);
    }
    await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms intervals
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const afterTest1 = requestCount;
  console.log(
    `📈 Firebase requests after Test 1: ${afterTest1 - initialRequestCount}`
  );

  // Test large movements (should trigger cell loading)
  console.log('\n🎯 Test 2: Large movements across cell boundaries');
  const positions = [
    [20, 20, 50], // Starting position
    [5000, 20, 50], // Move to different cell
    [15000, 20, 50], // Move to another cell
    [25000, 20, 50], // Move to another cell
  ];

  for (const pos of positions) {
    console.log(`📍 Moving camera to [${pos.join(', ')}]`);
    camera.position.set(...pos);
    if (window.updateCameraPosition) {
      window.updateCameraPosition(pos);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait for cell loading
  }

  const afterTest2 = requestCount;
  console.log(`📈 Firebase requests after Test 2: ${afterTest2 - afterTest1}`);

  // Test extremely rapid movements (should be heavily throttled)
  console.log(
    '\n🎯 Test 3: Extremely rapid movements (should be heavily throttled)'
  );
  for (let i = 0; i < 20; i++) {
    camera.position.set(25000 + i * 10, 20, 50);
    if (window.updateCameraPosition) {
      window.updateCameraPosition([25000 + i * 10, 20, 50]);
    }
    await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms intervals (very rapid)
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const afterTest3 = requestCount;
  console.log(`📈 Firebase requests after Test 3: ${afterTest3 - afterTest2}`);

  const totalTime = Date.now() - startTime;
  const totalRequests = requestCount - initialRequestCount;

  console.log('\n📊 Camera Optimization Test Results:');
  console.log(`⏱️ Total test time: ${totalTime}ms`);
  console.log(`🔥 Total Firebase requests: ${totalRequests}`);
  console.log(
    `📊 Request rate: ${(totalRequests / (totalTime / 1000)).toFixed(
      2
    )} requests/sec`
  );

  if (totalRequests < 20) {
    console.log('✅ EXCELLENT: Camera optimizations are working well!');
  } else if (totalRequests < 50) {
    console.log('⚠️ MODERATE: Some optimization working, but could be better');
  } else {
    console.log(
      '❌ POOR: Too many Firebase requests, optimizations may not be working'
    );
  }

  return {
    totalRequests,
    totalTime,
    requestRate: totalRequests / (totalTime / 1000),
  };
}

// Test spatial subscription deduplication
async function testSubscriptionDeduplication() {
  console.log('\n🔄 Testing spatial subscription deduplication...');

  const initialCount = window.activeSubscriptions?.size || 0;
  console.log(`📊 Initial active subscriptions: ${initialCount}`);

  // Simulate multiple components trying to subscribe to same cells
  if (window.subscribeToSpatialObjects) {
    const unsubscribes = [];

    // Multiple subscriptions to the same cells
    for (let i = 0; i < 5; i++) {
      const unsubscribe = window.subscribeToSpatialObjects(
        window.currentUser?.uid,
        window.currentSpaceId,
        ['0,0,0', '1,0,0', '0,1,0'], // Same cells
        (change) => {
          console.log(`Subscriber ${i} received change:`, change.type);
        }
      );
      unsubscribes.push(unsubscribe);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const afterCount = window.activeSubscriptions?.size || 0;
    console.log(`📊 Active subscriptions after 5 attempts: ${afterCount}`);

    if (afterCount <= initialCount + 3) {
      console.log('✅ GOOD: Subscription deduplication is working');
    } else {
      console.log(
        '❌ POOR: Too many subscriptions, deduplication may not be working'
      );
    }

    // Cleanup
    unsubscribes.forEach((unsub) => unsub());
  }
}

// Run the complete optimization test
async function runOptimizationTest() {
  console.log('🎯 Firebase Firestore Channel Request Optimization Test');
  console.log('='.repeat(60));

  await testCameraOptimization();
  await testSubscriptionDeduplication();

  console.log('\n🏁 Test completed!');
  console.log('💡 Tips to further reduce Firebase requests:');
  console.log('  1. Move camera slowly and deliberately');
  console.log('  2. Avoid rapid back-and-forth movements');
  console.log(
    '  3. Use the browser Network tab to monitor "channel?" requests'
  );
  console.log('  4. Check console for subscription reuse messages');
}

// Export test functions
window.testCameraOptimization = testCameraOptimization;
window.testSubscriptionDeduplication = testSubscriptionDeduplication;
window.runOptimizationTest = runOptimizationTest;

console.log('🔧 Camera optimization test loaded!');
console.log('💻 Run: window.runOptimizationTest()');
