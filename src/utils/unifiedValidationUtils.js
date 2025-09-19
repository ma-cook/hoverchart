/**
 * Unified Validation Utilities
 * Consolidates all validation, sanitization, and verification functions
 * from connectionUtils.js, connectionsService.js, and other validation utilities
 */

// ================== OBJECT VALIDATION ==================

/**
 * Clean object by removing undefined values recursively
 * @param {Object} obj - Object to clean
 * @returns {Object|null} - Cleaned object or null if empty
 */
export const cleanObject = (obj) => {
  if (!obj) return null;

  const cleaned = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        // Recursively clean nested objects
        const cleanedNested = cleanObject(obj[key]);
        if (cleanedNested && Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = obj[key];
      }
    }
  });

  return Object.keys(cleaned).length > 0 ? cleaned : null;
};

/**
 * Validate that an object has required properties
 * @param {Object} obj - Object to validate
 * @param {Array} requiredProps - Array of required property names
 * @returns {Object} - Validation result {valid: boolean, missing: Array}
 */
export const validateRequiredProperties = (obj, requiredProps) => {
  if (!obj || typeof obj !== 'object') {
    return {
      valid: false,
      missing: requiredProps,
      message: 'Object is null or not an object',
    };
  }

  const missing = requiredProps.filter(
    (prop) => obj[prop] === undefined || obj[prop] === null
  );

  return {
    valid: missing.length === 0,
    missing,
    message:
      missing.length > 0
        ? `Missing required properties: ${missing.join(', ')}`
        : 'Valid',
  };
};

/**
 * Validate object structure against a schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Schema definition
 * @returns {Object} - Validation result
 */
export const validateObjectSchema = (obj, schema) => {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return {
      valid: false,
      errors: ['Object is null or not an object'],
      message: 'Invalid object',
    };
  }

  // Check each schema property
  Object.keys(schema).forEach((key) => {
    const schemaRule = schema[key];
    const value = obj[key];

    // Check if required
    if (schemaRule.required && (value === undefined || value === null)) {
      errors.push(`Required property '${key}' is missing`);
      return;
    }

    // Skip type checking if value is undefined and not required
    if (value === undefined || value === null) return;

    // Check type
    if (schemaRule.type) {
      const expectedType = schemaRule.type;
      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (actualType !== expectedType) {
        errors.push(
          `Property '${key}' should be ${expectedType}, got ${actualType}`
        );
      }
    }

    // Check array validation
    if (schemaRule.type === 'array' && Array.isArray(value)) {
      if (schemaRule.minLength && value.length < schemaRule.minLength) {
        errors.push(
          `Array '${key}' should have at least ${schemaRule.minLength} items`
        );
      }
      if (schemaRule.maxLength && value.length > schemaRule.maxLength) {
        errors.push(
          `Array '${key}' should have at most ${schemaRule.maxLength} items`
        );
      }
    }

    // Check string validation
    if (schemaRule.type === 'string' && typeof value === 'string') {
      if (schemaRule.minLength && value.length < schemaRule.minLength) {
        errors.push(
          `String '${key}' should be at least ${schemaRule.minLength} characters`
        );
      }
      if (schemaRule.maxLength && value.length > schemaRule.maxLength) {
        errors.push(
          `String '${key}' should be at most ${schemaRule.maxLength} characters`
        );
      }
      if (schemaRule.pattern && !schemaRule.pattern.test(value)) {
        errors.push(`String '${key}' does not match required pattern`);
      }
    }

    // Check number validation
    if (schemaRule.type === 'number' && typeof value === 'number') {
      if (schemaRule.min !== undefined && value < schemaRule.min) {
        errors.push(`Number '${key}' should be at least ${schemaRule.min}`);
      }
      if (schemaRule.max !== undefined && value > schemaRule.max) {
        errors.push(`Number '${key}' should be at most ${schemaRule.max}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors.join('; ') : 'Valid',
  };
};

// ================== POSITION VALIDATION ==================

/**
 * Check if a position is valid (no NaN or infinite values)
 * @param {Array|Object} position - Position to validate
 * @returns {boolean} - True if position is valid
 */
export const isValidPosition = (position) => {
  if (!position) return false;

  // Handle array format [x, y, z]
  if (Array.isArray(position)) {
    return (
      position.length >= 3 &&
      position.slice(0, 3).every((v) => Number.isFinite(v))
    );
  }

  // Handle object format {x, y, z}
  if (typeof position === 'object') {
    return (
      Number.isFinite(position.x) &&
      Number.isFinite(position.y) &&
      Number.isFinite(position.z)
    );
  }

  return false;
};

/**
 * Validate position data and normalize it
 * @param {Array|Object} position - Position to validate
 * @returns {Object} - Validation result with normalized position
 */
export const validatePosition = (position) => {
  if (!position) {
    return {
      valid: false,
      normalized: null,
      message: 'Position is null or undefined',
    };
  }

  let normalized = null;
  let valid = false;

  // Handle array format [x, y, z]
  if (Array.isArray(position)) {
    if (position.length >= 3) {
      const [x, y, z] = position;
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        normalized = { x, y, z };
        valid = true;
      }
    }
  }
  // Handle object format {x, y, z}
  else if (typeof position === 'object') {
    const { x, y, z } = position;
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      normalized = { x, y, z };
      valid = true;
    }
  }

  return {
    valid,
    normalized,
    message: valid
      ? 'Valid position'
      : 'Invalid position: contains NaN or infinite values',
  };
};

/**
 * Validate that a position is within bounds
 * @param {Array|Object} position - Position to validate
 * @param {Object} bounds - Bounds {min: {x, y, z}, max: {x, y, z}}
 * @returns {Object} - Validation result
 */
export const validatePositionBounds = (position, bounds) => {
  const posValidation = validatePosition(position);
  if (!posValidation.valid) {
    return posValidation;
  }

  const pos = posValidation.normalized;
  const { min, max } = bounds;

  const withinBounds =
    pos.x >= min.x &&
    pos.x <= max.x &&
    pos.y >= min.y &&
    pos.y <= max.y &&
    pos.z >= min.z &&
    pos.z <= max.z;

  return {
    valid: withinBounds,
    normalized: pos,
    message: withinBounds
      ? 'Position within bounds'
      : 'Position outside bounds',
  };
};

// ================== CONNECTION VALIDATION ==================

/**
 * Checks if a connection can be created between two face indicators
 * @param {Object} startIndicator - The first indicator to connect
 * @param {Object} endIndicator - The second indicator to connect
 * @param {Array} existingConnections - Array of existing connections (optional)
 * @returns {Object} - Validation result {valid: boolean, message: string}
 */
export const validateConnection = (
  startIndicator,
  endIndicator,
  existingConnections = []
) => {
  if (!startIndicator || !endIndicator) {
    return {
      valid: false,
      message: 'Missing start or end indicator',
    };
  }

  // Extract object IDs and face information
  const startObjectId = String(
    startIndicator.cube?.id || startIndicator.id || startIndicator.objectId
  );
  const endObjectId = String(
    endIndicator.cube?.id || endIndicator.id || endIndicator.objectId
  );
  const startFace = startIndicator.face;
  const endFace = endIndicator.face;

  // Validate object IDs exist
  if (!startObjectId || !endObjectId) {
    return {
      valid: false,
      message: 'Could not extract valid object IDs from indicators',
    };
  }

  // Allow connections between different faces of the same object, but prevent face-to-itself connections
  if (startObjectId === endObjectId && startFace === endFace) {
    return {
      valid: false,
      message: 'Cannot connect a face to itself',
    };
  }

  // Check for existing connection between the exact same face pairs
  const existingConnection = existingConnections.find(
    (conn) =>
      // Exact same face-to-face connection already exists
      (conn.start?.objectId === startObjectId &&
        conn.start?.face === startFace &&
        conn.end?.objectId === endObjectId &&
        conn.end?.face === endFace) ||
      // Or reverse direction
      (conn.start?.objectId === endObjectId &&
        conn.start?.face === endFace &&
        conn.end?.objectId === startObjectId &&
        conn.end?.face === startFace)
  );

  if (existingConnection) {
    return {
      valid: false,
      message: 'These specific face indicators are already connected',
    };
  }

  return { valid: true, message: 'Connection is valid' };
};

/**
 * Validate connection data structure
 * @param {Object} connection - Connection object to validate
 * @returns {Object} - Validation result
 */
export const validateConnectionData = (connection) => {
  const schema = {
    id: { type: 'string', required: true },
    start: { type: 'object', required: true },
    end: { type: 'object', required: true },
    lineStyle: { type: 'string', required: false },
    color: { type: 'string', required: false },
    text: { type: 'string', required: false },
  };

  const result = validateObjectSchema(connection, schema);

  if (!result.valid) {
    return result;
  }

  // Additional validation for start and end objects
  const startValidation = validateRequiredProperties(connection.start, [
    'objectId',
  ]);
  if (!startValidation.valid) {
    return {
      valid: false,
      errors: [`Start indicator: ${startValidation.message}`],
      message: 'Invalid start indicator',
    };
  }

  const endValidation = validateRequiredProperties(connection.end, [
    'objectId',
  ]);
  if (!endValidation.valid) {
    return {
      valid: false,
      errors: [`End indicator: ${endValidation.message}`],
      message: 'Invalid end indicator',
    };
  }

  return {
    valid: true,
    message: 'Connection data is valid',
  };
};

// ================== INDICATOR VALIDATION ==================

/**
 * Extracts a consistent ID from an indicator object
 * @param {Object} indicator - The indicator object
 * @returns {string|null} - The extracted ID as a string or null
 */
export const getIndicatorId = (indicator) => {
  if (!indicator) return null;

  // Extract ID based on available properties
  const id = String(
    indicator.cube?.id ||
      indicator.id ||
      indicator.objectId ||
      indicator.cube?.userData?.objectId ||
      (indicator.plane && indicator.plane.userData?.id)
  );

  return id || null;
};

/**
 * Validate indicator object structure
 * @param {Object} indicator - Indicator to validate
 * @returns {Object} - Validation result
 */
export const validateIndicator = (indicator) => {
  if (!indicator) {
    return {
      valid: false,
      message: 'Indicator is null or undefined',
    };
  }

  const id = getIndicatorId(indicator);
  if (!id) {
    return {
      valid: false,
      message: 'Could not extract valid ID from indicator',
    };
  }

  // Check if indicator has position information
  const hasPosition =
    indicator.position ||
    (indicator.cube && indicator.cube.position) ||
    (indicator.plane && indicator.plane.position);

  if (!hasPosition) {
    return {
      valid: false,
      message: 'Indicator missing position information',
    };
  }

  return {
    valid: true,
    id,
    message: 'Indicator is valid',
  };
};

// ================== FILE VALIDATION ==================

/**
 * Validate file type and size
 * @param {File} file - File object to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes = [],
    maxSize = 10 * 1024 * 1024, // 10MB default
    minSize = 0,
  } = options;

  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      message: 'Invalid file object',
    };
  }

  // Check file type
  if (allowedTypes.length > 0) {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    const isAllowed = allowedTypes.some((type) => {
      if (type.startsWith('.')) {
        // File extension check
        return fileName.endsWith(type);
      } else {
        // MIME type check
        return fileType === type || fileType.startsWith(type + '/');
      }
    });

    if (!isAllowed) {
      return {
        valid: false,
        message: `File type not allowed. Allowed types: ${allowedTypes.join(
          ', '
        )}`,
      };
    }
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File too large. Maximum size: ${Math.round(
        maxSize / 1024 / 1024
      )}MB`,
    };
  }

  if (file.size < minSize) {
    return {
      valid: false,
      message: `File too small. Minimum size: ${minSize} bytes`,
    };
  }

  return {
    valid: true,
    message: 'File is valid',
  };
};

// ================== ID VALIDATION ==================

/**
 * Validate object ID format
 * @param {string} id - ID to validate
 * @returns {Object} - Validation result
 */
export const validateObjectId = (id) => {
  if (!id) {
    return {
      valid: false,
      message: 'ID is null or undefined',
    };
  }

  const idString = String(id).trim();

  if (idString.length === 0) {
    return {
      valid: false,
      message: 'ID is empty',
    };
  }

  // Check for invalid characters (basic validation)
  if (/[<>:"/\\|?*]/.test(idString)) {
    return {
      valid: false,
      message: 'ID contains invalid characters',
    };
  }

  return {
    valid: true,
    normalizedId: idString,
    message: 'ID is valid',
  };
};

/**
 * Validate space ID format
 * @param {string} spaceId - Space ID to validate
 * @returns {Object} - Validation result
 */
export const validateSpaceId = (spaceId) => {
  const idValidation = validateObjectId(spaceId);

  if (!idValidation.valid) {
    return {
      ...idValidation,
      message: `Space ${idValidation.message}`,
    };
  }

  // Additional space-specific validation
  const id = idValidation.normalizedId;

  if (id.length < 3) {
    return {
      valid: false,
      message: 'Space ID too short (minimum 3 characters)',
    };
  }

  if (id.length > 50) {
    return {
      valid: false,
      message: 'Space ID too long (maximum 50 characters)',
    };
  }

  return {
    valid: true,
    normalizedId: id,
    message: 'Space ID is valid',
  };
};

/**
 * Validate user ID format
 * @param {string} userId - User ID to validate
 * @returns {Object} - Validation result
 */
export const validateUserId = (userId) => {
  const idValidation = validateObjectId(userId);

  if (!idValidation.valid) {
    return {
      ...idValidation,
      message: `User ${idValidation.message}`,
    };
  }

  return {
    valid: true,
    normalizedId: idValidation.normalizedId,
    message: 'User ID is valid',
  };
};

// ================== URL VALIDATION ==================

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} - Validation result
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      message: 'URL is null, undefined, or not a string',
    };
  }

  try {
    const urlObj = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        message: 'URL must use HTTP or HTTPS protocol',
      };
    }

    return {
      valid: true,
      normalizedUrl: urlObj.href,
      message: 'URL is valid',
    };
  } catch {
    return {
      valid: false,
      message: 'Invalid URL format',
    };
  }
};

// ================== EMAIL VALIDATION ==================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} - Validation result
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      message: 'Email is null, undefined, or not a string',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email.trim());

  return {
    valid: isValid,
    normalizedEmail: isValid ? email.trim().toLowerCase() : null,
    message: isValid ? 'Email is valid' : 'Invalid email format',
  };
};

// ================== ARRAY VALIDATION ==================

/**
 * Validate array structure
 * @param {Array} arr - Array to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateArray = (arr, options = {}) => {
  const {
    minLength = 0,
    maxLength = Infinity,
    itemValidator = null,
    allowEmpty = true,
  } = options;

  if (!Array.isArray(arr)) {
    return {
      valid: false,
      message: 'Value is not an array',
    };
  }

  if (!allowEmpty && arr.length === 0) {
    return {
      valid: false,
      message: 'Array cannot be empty',
    };
  }

  if (arr.length < minLength) {
    return {
      valid: false,
      message: `Array too short (minimum ${minLength} items)`,
    };
  }

  if (arr.length > maxLength) {
    return {
      valid: false,
      message: `Array too long (maximum ${maxLength} items)`,
    };
  }

  // Validate individual items if validator provided
  if (itemValidator && typeof itemValidator === 'function') {
    for (let i = 0; i < arr.length; i++) {
      const itemResult = itemValidator(arr[i], i);
      if (!itemResult.valid) {
        return {
          valid: false,
          message: `Item at index ${i}: ${itemResult.message}`,
        };
      }
    }
  }

  return {
    valid: true,
    message: 'Array is valid',
  };
};

// ================== COMBINED VALIDATION UTILITIES ==================

/**
 * Validate multiple values with different validators
 * @param {Object} validators - Object mapping field names to validation functions
 * @param {Object} data - Data to validate
 * @returns {Object} - Combined validation result
 */
export const validateMultiple = (validators, data) => {
  const errors = {};
  let hasErrors = false;

  Object.keys(validators).forEach((field) => {
    const validator = validators[field];
    const value = data[field];

    if (typeof validator === 'function') {
      const result = validator(value);
      if (!result.valid) {
        errors[field] = result.message;
        hasErrors = true;
      }
    }
  });

  return {
    valid: !hasErrors,
    errors,
    message: hasErrors
      ? `Validation failed for: ${Object.keys(errors).join(', ')}`
      : 'All validations passed',
  };
};

// ================== EXPORTS ==================

// Export all utilities as a unified object
export const ValidationUtils = {
  // Object validation
  cleanObject,
  validateRequiredProperties,
  validateObjectSchema,

  // Position validation
  isValidPosition,
  validatePosition,
  validatePositionBounds,

  // Connection validation
  validateConnection,
  validateConnectionData,

  // Indicator validation
  getIndicatorId,
  validateIndicator,

  // File validation
  validateFile,

  // ID validation
  validateObjectId,
  validateSpaceId,
  validateUserId,

  // URL and email validation
  validateUrl,
  validateEmail,

  // Array validation
  validateArray,

  // Combined validation
  validateMultiple,
};

export default ValidationUtils;
