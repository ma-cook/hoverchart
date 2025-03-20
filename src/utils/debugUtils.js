/**
 * Utility functions for debugging
 */

// Enable/disable animation debugging
export const ANIMATION_DEBUG = false;

// Log animation status with sampling to reduce console noise
export const logAnimation = (id, message, data, sampleRate = 0.01) => {
  if (!ANIMATION_DEBUG) return;

  // Only log occasionally to avoid flooding console
  if (Math.random() > sampleRate) return;

  console.log(`[Animation] ${id}: ${message}`, data);
};

// Force animation on specific connections for testing
export const forceAnimateConnection = (connectionId, direction = 'right') => {
  return {
    id: connectionId,
    lineStyle: 'dashed',
    dashDirection: direction,
    dashOffset: 0,
  };
};

// Check if animation should be applied to a connection
export const shouldAnimateConnection = (conn) => {
  if (!conn) return false;

  // Connection must have a lineStyle that supports animation
  const hasAnimatableStyle =
    conn.lineStyle === 'dashed' || conn.lineStyle === 'dotted';

  // Connection must have a direction specified
  const hasDirection =
    conn.dashDirection === 'left' || conn.dashDirection === 'right';

  return hasAnimatableStyle && hasDirection;
};

// Performance monitoring
const perfMetrics = {
  frameTime: [],
  stateUpdates: 0,
  lastStateUpdate: 0,
  blockedUpdates: 0,
};

export const recordFrameTime = (time) => {
  if (perfMetrics.frameTime.length > 100) {
    perfMetrics.frameTime.shift();
  }
  perfMetrics.frameTime.push(time);
};

export const recordStateUpdate = () => {
  const now = Date.now();
  perfMetrics.stateUpdates++;

  // Track if updates are being blocked (happening too close together)
  if (now - perfMetrics.lastStateUpdate < 16) {
    perfMetrics.blockedUpdates++;
  }

  perfMetrics.lastStateUpdate = now;
};

export const getPerfStats = () => {
  const avg =
    perfMetrics.frameTime.reduce((a, b) => a + b, 0) /
    (perfMetrics.frameTime.length || 1);

  return {
    averageFrameTime: avg.toFixed(2),
    stateUpdates: perfMetrics.stateUpdates,
    blockedUpdates: perfMetrics.blockedUpdates,
    frameTimeHistory: [...perfMetrics.frameTime],
  };
};

export const resetPerfStats = () => {
  perfMetrics.frameTime = [];
  perfMetrics.stateUpdates = 0;
  perfMetrics.blockedUpdates = 0;
};
