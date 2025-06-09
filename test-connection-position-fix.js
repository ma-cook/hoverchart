#!/usr/bin/env node

/**
 * Test script to verify that connection position updates are properly saved to database
 * when objects are moved.
 */

console.log('🧪 Testing Connection Position Persistence Fix...\n');

// Mock the required dependencies for testing
const mockSaveConnection = jest.fn();
const mockGetConnectionById = jest.fn();

// Mock the connection manager dependencies
jest.mock('./src/services/connectionsService', () => ({
  saveConnection: mockSaveConnection,
}));

// Import the function under test
const { updateObjectConnections } = require('./src/services/connectionManager');

describe('Connection Position Persistence Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the connection mappings
    const { objectConnectionMap } = require('./src/services/connectionManager');
    objectConnectionMap.clear();
    objectConnectionMap.set(
      'test-object-1',
      new Set(['connection-1', 'connection-2'])
    );
  });

  test('updateObjectConnections should call saveConnection with correct parameters', async () => {
    // Mock a connection that will be returned by getConnectionById
    const mockConnection = {
      id: 'connection-1',
      start: {
        objectId: 'test-object-1',
        position: [0, 0, 0],
      },
      end: {
        objectId: 'test-object-2',
        position: [5, 5, 5],
      },
    };

    mockGetConnectionById.mockResolvedValue(mockConnection);
    mockSaveConnection.mockResolvedValue(true);

    // Test parameters
    const userId = 'user123';
    const spaceId = 'space456';
    const objectId = 'test-object-1';
    const newPosition = [10, 10, 10];

    // Call the function
    await updateObjectConnections(userId, spaceId, objectId, newPosition);

    // Verify saveConnection was called with all 3 required parameters
    expect(mockSaveConnection).toHaveBeenCalledWith(
      userId, // First parameter
      spaceId, // Second parameter (THIS WAS MISSING BEFORE THE FIX)
      expect.objectContaining({
        id: 'connection-1',
        start: expect.objectContaining({
          objectId: 'test-object-1',
          position: newPosition, // Position should be updated
        }),
      })
    );

    console.log('✅ saveConnection called with correct parameters');
    console.log(`   - userId: ${userId}`);
    console.log(`   - spaceId: ${spaceId}`);
    console.log(
      `   - connection with updated position: [${newPosition.join(', ')}]`
    );
  });

  test('function signature should accept spaceId parameter', () => {
    // Test that the function signature includes spaceId
    const functionString = updateObjectConnections.toString();

    // Check that the function accepts 4 parameters (userId, spaceId, objectId, newPosition)
    const paramMatch = functionString.match(/async\s*\(\s*([^)]+)\s*\)/);
    expect(paramMatch).toBeTruthy();

    const params = paramMatch[1].split(',').map((p) => p.trim());
    expect(params).toHaveLength(4);
    expect(params[0]).toBe('userId');
    expect(params[1]).toBe('spaceId');
    expect(params[2]).toBe('objectId');
    expect(params[3]).toBe('newPosition');

    console.log('✅ Function signature correctly includes spaceId parameter');
  });
});

console.log('\n🎯 Fix Summary:');
console.log('Before: updateObjectConnections(userId, objectId, newPosition)');
console.log(
  'After:  updateObjectConnections(userId, spaceId, objectId, newPosition)'
);
console.log('');
console.log(
  'Before: saveConnection(userId, connection)  // ❌ Missing spaceId'
);
console.log(
  'After:  saveConnection(userId, spaceId, connection)  // ✅ Correct'
);
console.log('');
console.log(
  '🔧 This fix ensures that when objects are moved, their connection'
);
console.log('   line positions are properly saved to the database instead of');
console.log('   only updating locally.');
