/**
 * pathfindingWorker.js
 *
 * Web Worker that offloads the CPU-intensive pathfinding computations
 * (line–object intersection testing + curved-path generation) from the
 * main thread.
 *
 * Safe to import here:
 *   - pathfindingUtils.js  (only depends on THREE — no DOM, no stores)
 *
 * The worker gets its OWN copy of module-level caches so repeated calls
 * for the same connection (unchanged positions) are instant cache hits
 * inside the worker too.
 */

import { expose } from 'comlink';
import {
  checkLineIntersection,
  generateCurvedPath,
  invalidatePathfindingCaches,
} from '../utils/pathfindingUtils.js';

const workerApi = {
  /**
   * Batch-compute paths for many connections at once.
   *
   * @param {Array<{id: string, startPos: number[], endPos: number[],
   *                 startConnId: string, endConnId: string}>} requests
   * @param {Array<{id: string, type: string, position: number[],
   *                 scale: number[]}>} objects  — plain serialisable data
   * @returns {Array<{id: string, hasIntersections: boolean,
   *                   pathPoints: number[][]}>}
   */
  computePathsBatch(requests, objects) {
    const results = new Array(requests.length);

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      const { id, startPos, endPos, startConnId, endConnId } = req;

      try {
        // checkLineIntersection creates THREE objects internally and
        // returns intersection objects with boundingBoxes (THREE.Box3).
        // Since generateCurvedPath runs in the same worker context these
        // prototyped objects survive — only plain data leaves the worker.
        const intersections = checkLineIntersection(startPos, endPos, objects);
        const hasIntersections =
          intersections !== null &&
          intersections !== undefined &&
          intersections.length > 0;

        let pathPoints;
        if (hasIntersections) {
          pathPoints = generateCurvedPath(
            startPos,
            endPos,
            intersections,
            startConnId,
            endConnId,
            true
          );
        } else {
          pathPoints = [startPos, endPos];
        }

        results[i] = { id, hasIntersections, pathPoints };
      } catch (err) {
        // On any per-connection error, return a straight line so the
        // connection still renders rather than disappearing.
        results[i] = {
          id,
          hasIntersections: false,
          pathPoints: [startPos, endPos],
        };
      }
    }

    return results;
  },

  /**
   * Clear the worker-side pathfinding caches.
   * Call this after objects move so the next computePathsBatch() uses
   * fresh geometry.
   */
  invalidateCaches() {
    invalidatePathfindingCaches();
  },
};

expose(workerApi);
