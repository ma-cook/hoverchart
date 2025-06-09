// Test Global Subscription Manager for Firebase Channel Request Reduction
// Run this in browser console after the app loads

console.log('🎯 Global Subscription Manager Test');
console.log('='.repeat(60));

// Monitor Firebase requests with more detailed tracking
let firebaseRequestCount = 0;
let channelRequestCount = 0;
let originalFetch = window.fetch;

window.fetch = function (...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('firestore.googleapis.com')) {
    firebaseRequestCount++;
    if (url.includes('channel?')) {
      channelRequestCount++;
      console.log(
        `📡 Firebase Channel Request #${channelRequestCount}: ${url.slice(
          0,
          100
        )}...`
      );
    }
  }
  return originalFetch.apply(this, args);
};

// Test subscription deduplication
async function testGlobalSubscriptionManager() {
  console.log('\n🔄 Testing Global Subscription Manager...');

  // Check if global subscription manager is loaded
  if (!window.getSubscriptionMetrics) {
    console.log('❌ Global subscription manager not available');
    return;
  }

  const initialMetrics = window.getSubscriptionMetrics();
  console.log('📊 Initial metrics:', initialMetrics);

  // Test multiple spatial object subscriptions
  console.log('\n📦 Testing spatial object subscriptions...');
  const unsubscribes = [];

  for (let i = 0; i < 5; i++) {
    if (window.subscribeToSpatialObjects) {
      const unsubscribe = window.subscribeToSpatialObjects(
        window.currentUser?.uid,
        window.currentSpaceId,
        ['0,0,0', '1,0,0', '0,1,0'], // Same cells
        (change) => {
          console.log(`Subscriber ${i} received:`, change.type);
        }
      );
      unsubscribes.push(unsubscribe);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const afterSubscriptionMetrics = window.getSubscriptionMetrics();
  console.log('📊 After subscriptions:', afterSubscriptionMetrics);

  // Test WebRTC signaling subscriptions
  console.log('\n📡 Testing WebRTC signaling subscriptions...');
  const webrtcUnsubscribes = [];

  for (let i = 0; i < 3; i++) {
    if (window.subscribeToUsersInSpace) {
      const unsubscribe = window.subscribeToUsersInSpace(
        window.currentSpaceId,
        (users) => {
          console.log(`WebRTC subscriber ${i} found ${users.length} users`);
        }
      );
      webrtcUnsubscribes.push(unsubscribe);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const afterWebRTCMetrics = window.getSubscriptionMetrics();
  console.log('📊 After WebRTC subscriptions:', afterWebRTCMetrics);

  // Cleanup and measure final metrics
  console.log('\n🧹 Cleaning up subscriptions...');
  unsubscribes.forEach((unsub) => unsub());
  webrtcUnsubscribes.forEach((unsub) => unsub());

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const finalMetrics = window.getSubscriptionMetrics();
  console.log('📊 Final metrics:', finalMetrics);

  // Results analysis
  console.log('\n📈 Test Results:');
  console.log(`🔥 Firebase requests: ${firebaseRequestCount}`);
  console.log(`📡 Channel requests: ${channelRequestCount}`);
  console.log(`♻️ Subscriptions reused: ${finalMetrics.reused}`);
  console.log(`🆕 Subscriptions created: ${finalMetrics.created}`);
  console.log(`🧹 Subscriptions cleaned: ${finalMetrics.cleaned}`);
  console.log(`📊 Active subscriptions: ${finalMetrics.active}`);

  if (finalMetrics.reused > finalMetrics.created) {
    console.log('✅ EXCELLENT: Subscription deduplication is working well!');
  } else if (finalMetrics.reused > 0) {
    console.log('⚠️ MODERATE: Some deduplication working');
  } else {
    console.log('❌ POOR: No deduplication detected');
  }

  return {
    firebaseRequests: firebaseRequestCount,
    channelRequests: channelRequestCount,
    metrics: finalMetrics,
  };
}

// Test camera movement with reduced requests
async function testCameraMovementOptimization() {
  console.log('\n🎥 Testing Camera Movement Optimization...');

  const initialChannelCount = channelRequestCount;
  const camera = window.cameraRef?.current?.camera;

  if (!camera) {
    console.log('❌ Camera not available');
    return;
  }

  console.log('📍 Moving camera through multiple positions...');

  // Rapid camera movements
  for (let i = 0; i < 10; i++) {
    camera.position.set(25000 + i * 500, 20, 50);
    if (window.updateCameraPosition) {
      window.updateCameraPosition([25000 + i * 500, 20, 50]);
    }
    await new Promise((resolve) => setTimeout(resolve, 50)); // Very rapid
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const channelRequestsAfterMovement =
    channelRequestCount - initialChannelCount;
  console.log(
    `📡 Channel requests during camera movement: ${channelRequestsAfterMovement}`
  );

  if (channelRequestsAfterMovement < 5) {
    console.log('✅ EXCELLENT: Camera movement optimization working!');
  } else if (channelRequestsAfterMovement < 20) {
    console.log('⚠️ MODERATE: Some optimization active');
  } else {
    console.log('❌ POOR: Too many requests during movement');
  }

  return channelRequestsAfterMovement;
}

// Run comprehensive test
async function runComprehensiveOptimizationTest() {
  console.log('🚀 Running Comprehensive Optimization Test...');

  const subscriptionResults = await testGlobalSubscriptionManager();
  const cameraResults = await testCameraMovementOptimization();

  console.log('\n🏆 FINAL RESULTS:');
  console.log('='.repeat(60));
  console.log(`📊 Total Firebase Requests: ${firebaseRequestCount}`);
  console.log(`📡 Total Channel Requests: ${channelRequestCount}`);
  console.log(
    `♻️ Subscription Reuse Ratio: ${(
      (subscriptionResults?.metrics?.reused /
        Math.max(subscriptionResults?.metrics?.created, 1)) *
      100
    ).toFixed(1)}%`
  );
  console.log(`🎥 Camera Movement Requests: ${cameraResults}`);

  const overallScore =
    (subscriptionResults?.metrics?.reused || 0) * 2 +
    Math.max(0, 50 - channelRequestCount) +
    Math.max(0, 20 - cameraResults);

  if (overallScore > 80) {
    console.log('🏆 OUTSTANDING: All optimizations working excellently!');
  } else if (overallScore > 50) {
    console.log('🎯 GOOD: Most optimizations are effective');
  } else if (overallScore > 20) {
    console.log('⚠️ FAIR: Some optimizations working');
  } else {
    console.log('❌ POOR: Optimizations need more work');
  }

  console.log(
    '\n💡 Monitor Network tab for "channel?" requests to verify reduction'
  );

  return {
    totalFirebaseRequests: firebaseRequestCount,
    totalChannelRequests: channelRequestCount,
    subscriptionMetrics: subscriptionResults?.metrics,
    cameraMovementRequests: cameraResults,
    overallScore,
  };
}

// Export test functions
window.testGlobalSubscriptionManager = testGlobalSubscriptionManager;
window.testCameraMovementOptimization = testCameraMovementOptimization;
window.runComprehensiveOptimizationTest = runComprehensiveOptimizationTest;

console.log('\n🎮 Available Test Functions:');
console.log('• window.testGlobalSubscriptionManager()');
console.log('• window.testCameraMovementOptimization()');
console.log('• window.runComprehensiveOptimizationTest()');
console.log('\n▶️ Run: window.runComprehensiveOptimizationTest()');
