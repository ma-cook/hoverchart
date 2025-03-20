/**
 * Utility functions for connection line styles and persistence
 */

/**
 * Persists connection style to session storage
 *
 * @param {string} spaceId - The current space ID
 * @param {string} connectionId - The connection ID
 * @param {object} styleData - The style data to persist
 */
export const persistConnectionStyle = (spaceId, connectionId, styleData) => {
  try {
    if (!spaceId || !connectionId || !styleData) return;

    const stylesKey = `connectionStyles_${spaceId}`;
    const storedStyles = JSON.parse(sessionStorage.getItem(stylesKey) || '{}');

    storedStyles[connectionId] = {
      ...(storedStyles[connectionId] || {}),
      ...styleData,
    };

    sessionStorage.setItem(stylesKey, JSON.stringify(storedStyles));
  } catch (err) {
    console.warn('Failed to persist connection style', err);
  }
};

/**
 * Loads persisted connection styles for a space
 *
 * @param {string} spaceId - The space ID
 * @returns {object} The persisted styles or an empty object
 */
export const loadPersistedConnectionStyles = (spaceId) => {
  try {
    if (!spaceId) return {};

    const stylesKey = `connectionStyles_${spaceId}`;
    const storedStyles = sessionStorage.getItem(stylesKey);
    return storedStyles ? JSON.parse(storedStyles) : {};
  } catch (err) {
    console.warn('Failed to load persisted connection styles', err);
    return {};
  }
};

/**
 * Updates connection with stored style if available
 *
 * @param {object} connection - The connection object
 * @param {object} storedStyles - The stored styles object
 * @returns {object} - Updated connection with applied styles
 */
export const applyStoredStyleToConnection = (connection, storedStyles) => {
  if (!connection || !storedStyles || !storedStyles[connection.id]) {
    return connection;
  }

  const storedStyle = storedStyles[connection.id];
  const updatedConn = { ...connection };

  if (storedStyle.lineStyle && !updatedConn.lineStyle) {
    updatedConn.lineStyle = storedStyle.lineStyle;
  }

  if (storedStyle.dashDirection && !updatedConn.dashDirection) {
    updatedConn.dashDirection = storedStyle.dashDirection;
  }

  if (storedStyle.color && !updatedConn.color) {
    updatedConn.color = storedStyle.color;
  }

  updatedConn._styleApplied = true;
  return updatedConn;
};
