/**
 * Shared constants for MarkdownDiagramService.
 * These are exported as named values so method modules can import them
 * without creating circular dependencies on the class itself.
 */

// Node type constants
export const NODE_TYPE_COMPONENT = 'component';
export const NODE_TYPE_FUNCTION = 'function';
export const NODE_TYPE_STORE = 'store';
export const NODE_TYPE_SERVICE = 'service';
export const NODE_TYPE_LIBRARY = 'library';
export const NODE_TYPE_UTILITY = 'utility';
export const NODE_TYPE_DATAPATH = 'datapath';
export const NODE_TYPE_HANDLER = 'handler';
export const NODE_TYPE_CONTROL = 'control';
export const NODE_TYPE_STATE = 'state';
export const NODE_TYPE_DATA = 'data';
export const NODE_TYPE_HOOK = 'hook';

// Object type constants
export const OBJECT_TYPE_CUBE = 'cube';
export const OBJECT_TYPE_DODECAHEDRON = 'dodecahedron';
export const OBJECT_TYPE_TETRAHEDRON = 'tetrahedron';

// UI component identifiers
export const UI_COMPONENTS = [
  'HeaderInput',
  'FaceTextInput',
  'TextObjectUI',
  'TextStyleUIContainer',
];

// Magic number constants
export const MAX_RECURSION_DEPTH = 15;
export const BASE_DODECAHEDRON_SIZE = 10;
export const BASE_DODECAHEDRON_RADIUS = 10;
export const DEFAULT_CAMERA_DISTANCE = 100;
export const SPACING_BETWEEN_COMPONENTS = 200;
export const DEFAULT_CUBE_SIZE = 5;
export const DEFAULT_SPHERE_SIZE = 4;
export const DEFAULT_CONTAINER_SIZE = 50;
export const MIN_SCALE_FACTOR = 1.0;
export const DESIRED_GAP = 8;
