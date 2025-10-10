/**
 * Global frame counter to avoid calling Date.now() thousands of times per frame
 * This is a singleton that updates once per frame and all components can reference
 */

class FrameCounter {
  constructor() {
    this.frameNumber = 0;
    this.lastTime = Date.now();
    this.deltaTime = 0;
  }

  tick() {
    const now = Date.now();
    this.deltaTime = now - this.lastTime;
    this.lastTime = now;
    this.frameNumber++;
  }

  getTime() {
    return this.lastTime;
  }

  getFrameNumber() {
    return this.frameNumber;
  }

  getDeltaTime() {
    return this.deltaTime;
  }

  // Helper to check if enough time has passed since last update
  // Returns true if `interval` milliseconds have passed since `lastUpdateTime`
  shouldUpdate(lastUpdateTime, interval) {
    return !lastUpdateTime || this.lastTime - lastUpdateTime >= interval;
  }
}

// Export singleton instance
export const frameCounter = new FrameCounter();
