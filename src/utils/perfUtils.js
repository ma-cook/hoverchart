// Simple memoization utility for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();

  return (arg) => {
    // Ensure arg is valid and has required properties
    if (!arg || !arg.type || !arg.face) {
      console.warn('Invalid argument passed to memoized function:', arg);
      return [0, 0, 0]; // Return safe default
    }

    const key = JSON.stringify({
      type: arg.type,
      face: arg.face,
      objectId: arg?.cube?.id || arg?.plane?.id,
      position: arg?.cube?.position || arg?.plane?.position || arg.position,
    });

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(arg);
    cache.set(key, result);
    return result;
  };
};

// Debounce to limit calculation frequency
export const debounce = (fn, delay = 100) => {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
};
