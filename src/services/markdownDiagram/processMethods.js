import { MarkdownProcessor } from '3d-ast-generator';
import * as THREE from 'three';
import { DEFAULT_CAMERA_DISTANCE } from './constants.js';

export const processMethods = {
  initializeProcessor() {
    this.processor = new MarkdownProcessor({
      layout: {
        algorithm: 'none',
        nodeSpacing: 60.0,
        layers: 5,
        basePosition: [0, 0, 0],
        enableAutoLayout: false,
      },
      visual: {
        theme: 'dark',
        colors: {
          function: '#4CAF50',
          component: '#2196F3',
          datapath: '#FF9800',
        },
      },
    });
  },

  /**
   * Get camera position for positioning the objects
   * @returns {Array} - [x, y, z] position
   */
  getCameraBasedPosition() {
    const DEFAULT_POSITION = [0, 0, -50];

    try {
      const workingCamera =
        window.cameraRef?.current?.camera ||
        window.camera ||
        window.orbitControls?.object;

      if (!workingCamera?.position) {
        return DEFAULT_POSITION;
      }

      const cameraDirection = new THREE.Vector3();
      try {
        workingCamera.getWorldDirection(cameraDirection);
      } catch {
        cameraDirection.set(0, 0, -1);
      }

      const distance = DEFAULT_CAMERA_DISTANCE;
      const cameraPos = workingCamera.position;

      return [
        cameraPos.x + cameraDirection.x * distance,
        cameraPos.y + cameraDirection.y * distance,
        cameraPos.z + cameraDirection.z * distance,
      ];
    } catch {
      return DEFAULT_POSITION;
    }
  },

  /**
   * Main entry point: parse and process a Markdown/Merfolk file
   */
  async processMarkdownFile(file, onCreateObject, currentSpaceId, user) {
    this.scaleCache.clear();
    this.boundingBoxCache.clear();

    const validExtensions = ['.md', '.markdown'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      throw new Error('Please select a Markdown file (.md or .markdown)');
    }

    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    if (!this.processor) {
      this.initializeProcessor();
    }

    const connectionTags = this.parseFlowPaths(content);
    const processedContent = this.stripFlowPathSyntax(content);

    const diagrams = this.processor.processMarkdown(processedContent);

    if (!diagrams || diagrams.length === 0) {
      throw new Error(
        'No Merfolk diagrams found in the markdown file. Make sure your file contains properly formatted Merfolk syntax with ```merfolk code blocks.'
      );
    }

    window._lastMerfolkProcessTime = performance.now();

    const basePosition = this.getCameraBasedPosition();

    let totalObjectsCreated = 0;
    const nodeToObjectIdMap = new Map();
    const allConnectionsToSave = [];
    const allObjectsToSave = [];

    window._faceDistributionCounters = new Map();

    for (let diagramIndex = 0; diagramIndex < diagrams.length; diagramIndex++) {
      const diagram = diagrams[diagramIndex];

      if (diagram.errors && diagram.errors.length > 0) {
        console.warn(`Diagram ${diagramIndex} has errors:`, diagram.errors);
        continue;
      }

      const objectsCreated = await this.createObjectsFromDiagram(
        diagram,
        onCreateObject,
        nodeToObjectIdMap,
        basePosition,
        user,
        currentSpaceId,
        allObjectsToSave
      );

      totalObjectsCreated += objectsCreated;

      this.createConnectionsFromDiagram(
        diagram,
        nodeToObjectIdMap,
        allConnectionsToSave,
        connectionTags
      );
    }

    const savePromise = this.saveConnections(
      allConnectionsToSave,
      currentSpaceId,
      user,
      allObjectsToSave
    );

    const validDiagrams = diagrams.filter(
      (d) => !d.errors || d.errors.length === 0
    );

    return {
      diagramCount: validDiagrams.length,
      objectsCreated: totalObjectsCreated,
      connectionsCreated: allConnectionsToSave.length,
      success: totalObjectsCreated > 0,
      savePromise: savePromise,
    };
  },
};
