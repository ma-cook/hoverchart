import { hierarchyMethods } from './markdownDiagram/hierarchyMethods.js';
import { scaleMethods } from './markdownDiagram/scaleMethods.js';
import { positionMethods } from './markdownDiagram/positionMethods.js';
import { containerMethods } from './markdownDiagram/containerMethods.js';
import { objectMethods } from './markdownDiagram/objectMethods.js';
import { connectionMethods } from './markdownDiagram/connectionMethods.js';
import { processMethods } from './markdownDiagram/processMethods.js';

/**
 * Service for processing Markdown files containing Merfolk diagrams
 * and converting them to 3D objects and connections.
 *
 * Implementation is split across src/services/markdownDiagram/ for maintainability.
 */
export class MarkdownDiagramService {
  // Node type constants
  static NODE_TYPE_COMPONENT = 'component';
  static NODE_TYPE_FUNCTION = 'function';
  static NODE_TYPE_STORE = 'store';
  static NODE_TYPE_SERVICE = 'service';
  static NODE_TYPE_LIBRARY = 'library';
  static NODE_TYPE_UTILITY = 'utility';
  static NODE_TYPE_DATAPATH = 'datapath';
  static NODE_TYPE_HANDLER = 'handler';
  static NODE_TYPE_CONTROL = 'control';
  static NODE_TYPE_STATE = 'state';
  static NODE_TYPE_DATA = 'data';
  static NODE_TYPE_HOOK = 'hook';

  // Object type constants
  static OBJECT_TYPE_CUBE = 'cube';
  static OBJECT_TYPE_DODECAHEDRON = 'dodecahedron';
  static OBJECT_TYPE_TETRAHEDRON = 'tetrahedron';

  // UI component identifiers
  static UI_COMPONENTS = [
    'HeaderInput',
    'FaceTextInput',
    'TextObjectUI',
    'TextStyleUIContainer',
  ];

  // Magic number constants
  static MAX_RECURSION_DEPTH = 15;
  static BASE_DODECAHEDRON_SIZE = 10;
  static BASE_DODECAHEDRON_RADIUS = 10;
  static DEFAULT_CAMERA_DISTANCE = 100;
  static SPACING_BETWEEN_COMPONENTS = 200;
  static DEFAULT_CUBE_SIZE = 5;
  static DEFAULT_SPHERE_SIZE = 4;
  static DEFAULT_CONTAINER_SIZE = 50;
  static MIN_SCALE_FACTOR = 1.0;
  static DESIRED_GAP = 8;

  constructor() {
    this.processor = null;
    this.scaleCache = new Map();
    this.boundingBoxCache = new Map();
  }

  /**
   * Check if a node ID belongs to a UI component
   * @param {string} nodeId - The node ID to check
   * @returns {boolean} - True if the node is a UI component
   */
  static isUIComponent(nodeId) {
    return MarkdownDiagramService.UI_COMPONENTS.includes(nodeId);
  }
}

// Mix in all method groups via prototype assignment so 	his bindings work correctly
Object.assign(MarkdownDiagramService.prototype, hierarchyMethods);
Object.assign(MarkdownDiagramService.prototype, scaleMethods);
Object.assign(MarkdownDiagramService.prototype, positionMethods);
Object.assign(MarkdownDiagramService.prototype, containerMethods);
Object.assign(MarkdownDiagramService.prototype, objectMethods);
Object.assign(MarkdownDiagramService.prototype, connectionMethods);
Object.assign(MarkdownDiagramService.prototype, processMethods);

// Export singleton instance
export const markdownDiagramService = new MarkdownDiagramService();
