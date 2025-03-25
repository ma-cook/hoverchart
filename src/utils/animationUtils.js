/**
 * Animation utilities to improve performance for dashed/dotted lines
 */

// Store material references for direct update
const animatedMaterials = new Map();

// Track animation parameters
let isAnimating = false;
let lastTimestamp = 0;
let animationSpeed = 40; // Default speed for animations

/**
 * Register a material for direct animation updates
 * @param {string} id - Unique identifier for the material
 * @param {Object} material - Three.js material to animate
 * @param {Object} options - Animation options (direction, type)
 */
export const registerMaterial = (id, material, options = {}) => {
  if (!material) return;

  animatedMaterials.set(id, {
    material,
    direction: options.direction || 'right',
    type: options.type || 'dashed',
    offset: options.offset || 0,
    speed: options.speed || 1.0,
  });

  // Start animation loop if not already running
  if (!isAnimating) {
    startAnimationLoop();
  }
};

/**
 * Unregister a material from animation
 * @param {string} id - Material identifier
 */
export const unregisterMaterial = (id) => {
  animatedMaterials.delete(id);

  // Stop animation loop if no materials left
  if (animatedMaterials.size === 0) {
    stopAnimationLoop();
  }
};

/**
 * Update animation speed
 * @param {number} speed - New animation speed
 */
export const setAnimationSpeed = (speed) => {
  animationSpeed = Math.max(1, Math.min(100, speed));
};

// Animation frame request reference
let animationFrame = null;

/**
 * Start the animation loop for all registered materials
 */
const startAnimationLoop = () => {
  if (isAnimating) return;

  isAnimating = true;
  lastTimestamp = performance.now();

  const animate = (timestamp) => {
    // Calculate delta time in seconds with maximum cap
    const deltaTime = Math.min(0.1, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    // Update each registered material
    animatedMaterials.forEach((data, id) => {
      try {
        const { material, direction, speed } = data;

        // Calculate animation step
        const step = deltaTime * animationSpeed * speed;

        // Update offset based on direction
        if (direction === 'left') {
          data.offset = (data.offset - step) % 100;
          if (data.offset < 0) data.offset += 100;
        } else if (direction === 'right') {
          data.offset = (data.offset + step) % 100;
        }

        // Apply to material
        if (material.uniforms && material.uniforms.dashOffset) {
          material.uniforms.dashOffset.value = data.offset;
          material.uniformsNeedUpdate = true;
        } else if (material.dashOffset !== undefined) {
          material.dashOffset = data.offset;
          material.needsUpdate = true;
        }
      } catch (err) {
        console.warn(`Animation error for ${id}:`, err);
      }
    });

    // Continue animation loop
    animationFrame = requestAnimationFrame(animate);
  };

  // Start the animation loop
  animationFrame = requestAnimationFrame(animate);
};

/**
 * Stop the animation loop
 */
const stopAnimationLoop = () => {
  if (!isAnimating) return;

  isAnimating = false;
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
};

/**
 * Initialize animation system
 */
export const initAnimationSystem = () => {
  // Create a global reference for components to use
  window._animationSystem = {
    registerMaterial,
    unregisterMaterial,
    setAnimationSpeed,
  };

  return {
    registerMaterial,
    unregisterMaterial,
    setAnimationSpeed,
  };
};

export default {
  registerMaterial,
  unregisterMaterial,
  setAnimationSpeed,
  initAnimationSystem,
};
