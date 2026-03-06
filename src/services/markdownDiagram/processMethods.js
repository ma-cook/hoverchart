import { MarkdownProcessor } from '3d-ast-generator';
import * as THREE from 'three';
import { DEFAULT_CAMERA_DISTANCE } from './constants.js';
import { getMarkdownLayoutWorker } from '../../workers/markdownLayoutWorkerClient.js';

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
   * Main entry point: parse and process a Markdown/Merfolk file.
   *
   * The heavy layout computation (AST parsing, hierarchy building, position/scale
   * resolution) is offloaded to markdownLayoutWorker via Comlink so the main
   * thread stays responsive.  If the worker is unavailable or throws, the
   * existing main-thread path is used as a transparent fallback.
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

    // Read file on the main thread (FileReader requires DOM access)
    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    // Camera position must be sampled on the main thread
    const basePosition = this.getCameraBasedPosition();

    // ── Attempt worker-computed layout ────────────────────────────────────
    let workerResult = null;
    try {
      const layoutWorker = getMarkdownLayoutWorker();
      workerResult = await layoutWorker.computeLayout(content, basePosition);
    } catch (workerError) {
      console.warn(
        '[MarkdownDiagramService] Layout worker failed – falling back to main thread:',
        workerError
      );
    }

    // ── Build diagrams + connectionTags from worker output or main thread ─
    let diagrams;
    let connectionTags;

    if (workerResult) {
      // Reconstruct diagram-like objects from the serialised worker output so
      // createObjectsFromDiagram and createConnectionsFromDiagram can consume
      // them via the same interface they already expect.
      diagrams = workerResult.diagramLayouts.map((layout) => ({
        graph: {
          // Restore graph.nodes as a Map<nodeId, {id, type, name, properties}>
          nodes: new Map(layout.graphNodes),
          // Restore graph.connections as a Map so .values() iteration works
          connections: new Map(
            layout.rawConnections.map((c, i) => [
              `wc-${i}`,
              { source: c.source, target: c.target, label: c.label, type: c.connectionType, visual: c.visual || null },
            ])
          ),
        },
        errors: layout.errors || [],
      }));
      // Restore Map<string, Set<string>> from [[key, [tag,...]]]
      connectionTags = new Map(
        workerResult.connectionTags.map(([key, tags]) => [key, new Set(tags)])
      );
    } else {
      // ── Main-thread fallback (original behaviour) ──────────────────────
      if (!this.processor) {
        this.initializeProcessor();
      }
      connectionTags = this.parseFlowPaths(content);
      const processedContent = this.stripFlowPathSyntax(content);
      diagrams = this.processor.processMarkdown(processedContent);
    }

    if (!diagrams || diagrams.length === 0) {
      throw new Error(
        'No Merfolk diagrams found in the markdown file. Make sure your file contains properly formatted Merfolk syntax with ```merfolk code blocks.'
      );
    }

    window._lastMerfolkProcessTime = performance.now();

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

      // Pass worker-computed layout to skip position/scale on the main thread.
      // When null (fallback path) createObjectsFromDiagram computes it locally.
      const precomputedLayout = workerResult?.diagramLayouts?.[diagramIndex] ?? null;

      const objectsCreated = await this.createObjectsFromDiagram(
        diagram,
        onCreateObject,
        nodeToObjectIdMap,
        basePosition,
        user,
        currentSpaceId,
        allObjectsToSave,
        precomputedLayout
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
