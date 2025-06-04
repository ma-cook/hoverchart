// Test script to verify connection loading after page refresh
console.log('🧪 Testing connection loading after refresh...');

// Wait for the app to initialize
setTimeout(() => {
  console.log('🔍 Checking for connection data in components...');

  // Check for debug logs from useConnections
  console.log('📋 Looking for useConnections debug logs...');

  // Check for debug logs from ConnectionsRenderer
  console.log('🎨 Looking for ConnectionsRenderer debug logs...');

  // Check for any error messages
  const errors = [];
  const logs = [];

  // Capture console to check for our debug messages
  const originalLog = console.log;
  const originalError = console.error;

  console.log = function (...args) {
    logs.push(args.join(' '));
    originalLog.apply(console, args);
  };

  console.error = function (...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };

  // Check for React components in the DOM
  setTimeout(() => {
    console.log('🔍 Final results:');
    console.log('- Errors found:', errors.length);
    console.log('- Debug logs found:', logs.length);

    // Look for specific patterns
    const connectionLogs = logs.filter(
      (log) =>
        log.includes('Connection') ||
        log.includes('useConnections') ||
        log.includes('getConnectionsFromCells')
    );

    console.log('- Connection-related logs:', connectionLogs.length);
    connectionLogs.forEach((log) => console.log('  📝', log));

    // Check for errors
    const connectionErrors = errors.filter(
      (error) =>
        error.includes('Connection') ||
        error.includes('cellCoords') ||
        error.includes('filter')
    );

    console.log('- Connection-related errors:', connectionErrors.length);
    connectionErrors.forEach((error) => console.log('  ❌', error));
  }, 2000);
}, 1000);
