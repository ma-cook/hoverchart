// Debug script to test connection loading after page refresh
console.log('🔧 Debug: Starting connection loading test...');

// Wait for the page to load completely
setTimeout(() => {
  console.log('🔧 Debug: Page loaded, checking connection state...');

  // Check if we have connections in the React state
  const connectionElements = document.querySelectorAll('[data-connection-id]');
  console.log(
    '🔧 Debug: Found connection elements:',
    connectionElements.length
  );

  // Check loaded cells
  console.log('🔧 Debug: Window properties:');
  console.log('- currentSpaceOwner:', window.currentSpaceOwner);
  console.log('- publicAccessSpace:', window.publicAccessSpace);

  // Try to access React dev tools info if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔧 Debug: React dev tools available');
  }

  // Look for any error messages in the console
  console.log('🔧 Debug: Check console above for connection loading logs...');
}, 2000);
