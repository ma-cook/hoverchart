/**
 * sceneRenderService.js
 *
 * Materializes the 3D scene (objects + connections, persisted to the backend)
 * from raw merfolk markdown. The durable server-scan hydrate path only
 * populates the 2D diagramStore (hydrateStoreFromMarkdown) — without this
 * step a server scan leaves the canvas empty of objects. Extracted from
 * SpaceChat's renderMerfolkToScene so every hydrate entry point shares one
 * implementation.
 */

import { getMarkdownLayoutWorker } from '../workers/markdownLayoutWorkerClient';
import { markdownDiagramService } from './markdownDiagramService';
import { extractMerfolkBlocks } from './merfolkExtractor';
import useDiagramStore from '../stores/diagramStore';

/**
 * @param {string} markdown - full markdown document containing merfolk blocks
 * @param {string} spaceId
 * @param {object|null} user
 * @returns {Promise<boolean>} true when objects or connections were created
 */
export async function renderMerfolkMarkdownToScene(markdown, spaceId, user) {
  const blocks = extractMerfolkBlocks(markdown);
  if (!blocks || blocks.length === 0) return false;

  const normalized = blocks
    .map((block) => '```merfolk\n' + block + '\n```')
    .join('\n\n');

  const basePosition = markdownDiagramService.getCameraBasedPosition();

  let workerResult = null;
  try {
    const layoutWorker = getMarkdownLayoutWorker();
    workerResult = await layoutWorker.computeLayout(normalized, basePosition);
  } catch (err) {
    console.warn('[sceneRender] Layout worker failed:', err.message);
    return false;
  }

  if (!workerResult || !workerResult.diagramLayouts || workerResult.diagramLayouts.length === 0) {
    return false;
  }

  const diagrams = workerResult.diagramLayouts.map((layout) => ({
    graph: {
      nodes: new Map(layout.graphNodes),
      connections: new Map(
        layout.rawConnections.map((c, i) => [
          `hc-${i}`,
          {
            source: c.source,
            target: c.target,
            label: c.label,
            type: c.connectionType,
            visual: c.visual || null,
          },
        ])
      ),
    },
    errors: layout.errors || [],
  }));

  const connectionTags = new Map(
    workerResult.connectionTags.map(([key, tags]) => [key, new Set(tags)])
  );

  const nodeToObjectIdMap = new Map();
  // Per-node object data captured while objects are created. createConnections-
  // FromDiagram resolves endpoints from this map (falling back to a store
  // lookup that misses objects not yet flushed to useObjectsStore, which is why
  // only a single connection rendered after a server scan). Mirrors the
  // main-thread scan path (processMethods.processMarkdownFile).
  const nodeDataMap = new Map();
  const allConnectionsToSave = [];
  const allObjectsToSave = [];
  window._faceDistributionCounters = window._faceDistributionCounters || new Map();

  for (let diagramIndex = 0; diagramIndex < diagrams.length; diagramIndex++) {
    const diagram = diagrams[diagramIndex];
    if (diagram.errors && diagram.errors.length > 0) continue;

    // Pass the worker-computed layout so positions/scales and the hierarchy
    // maps come straight from the layout worker — matching the main-thread
    // scan path (processMethods.processMarkdownFile). Passing null here forced
    // a main-thread recompute that produced an inconsistent hierarchy, so most
    // connections failed to resolve to objects and never rendered.
    const precomputedLayout = workerResult.diagramLayouts[diagramIndex] ?? null;

    await markdownDiagramService.createObjectsFromDiagram(
      diagram,
      () => {},
      nodeToObjectIdMap,
      basePosition,
      user,
      spaceId,
      allObjectsToSave,
      precomputedLayout,
      nodeDataMap
    );

    markdownDiagramService.createConnectionsFromDiagram(
      diagram,
      nodeToObjectIdMap,
      allConnectionsToSave,
      connectionTags,
      nodeDataMap
    );
  }

  if (allConnectionsToSave.length > 0 || allObjectsToSave.length > 0) {
    await markdownDiagramService.saveConnections(
      allConnectionsToSave,
      spaceId,
      user,
      allObjectsToSave
    );
  }

  // Cross-reference map for the 2D view: hydrateStoreFromMarkdown built this
  // from loaded 3D objects before any existed — refresh it with the objects
  // this pass just created.
  if (nodeToObjectIdMap.size > 0) {
    useDiagramStore.getState().setNodeToObjectIdMap(nodeToObjectIdMap);
  }

  return allObjectsToSave.length > 0 || allConnectionsToSave.length > 0;
}
