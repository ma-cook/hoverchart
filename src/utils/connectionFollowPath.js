/**
 * connectionFollowPath.js
 *
 * Builds the world-space polylines the camera "follow" mode traverses. For a
 * given object, every connection incident to it becomes one round-trip path:
 * from the object's endpoint along the line to the far endpoint, then back.
 *
 * Endpoint resolution mirrors ConnectionsRenderer.resolveEndpointPosition:
 *   1. face-aware (calculateFacePosition) when the endpoint has a face and the
 *      object is available (most accurate),
 *   2. stored endpoint position (position/facePosition/worldPosition) — this is
 *      what lets us follow lines whose far object isn't currently loaded,
 *   3. the object's centre as a last resort.
 *
 * Curves reuse computeConnectionPath, the exact polyline the renderers draw.
 */
import useConnectionStore from '../stores/connectionStore';
import useObjectsStore from '../stores/objectsStore';
import { computeConnectionPath } from './pathfindingUtils';
import { calculateFacePosition } from './facePositionUtils';

const _objectsById = (objects) => {
  const map = new Map();
  if (Array.isArray(objects)) {
    for (const obj of objects) {
      if (obj?.id != null) map.set(String(obj.id), obj);
    }
  }
  return map;
};

const _pathfindingObjects = (objects) =>
  objects.map((obj) => ({
    id: obj.id,
    position: obj.position,
    scale: obj.scale || [1, 1, 1],
    type: obj.type,
    faceSize: obj.faceSize,
  }));

/**
 * Resolve a connection endpoint to a world-space [x, y, z].
 */
function resolveEndpoint(endpoint, objectsById, allObjects) {
  if (!endpoint) return null;
  const objId = endpoint.objectId?.toString();

  // 1. Face-aware
  if (endpoint.face !== undefined && objId) {
    const obj = objectsById.get(objId);
    if (obj?.position) {
      try {
        return calculateFacePosition(
          {
            type: endpoint.type || obj.type || 'cube',
            face: endpoint.face,
            objectId: endpoint.objectId,
            faceCenter: endpoint.faceCenter,
            cube: { position: obj.position, scale: obj.scale || [1, 1, 1] },
            plane:
              obj.type === 'plane'
                ? { position: obj.position, scale: obj.scale || [1, 1, 1] }
                : undefined,
          },
          allObjects
        );
      } catch {
        // fall through
      }
    }
  }

  // 2. Stored position
  const stored =
    endpoint.position || endpoint.facePosition || endpoint.worldPosition;
  if (stored) return stored;

  // 3. Object centre
  if (!objId) return null;
  const obj = objectsById.get(objId);
  return obj?.position || null;
}

/**
 * Build round-trip follow paths for every connection incident to objectId.
 * @returns {Array<{ connectionId: string, points: number[][] }>}
 */
export function buildFollowPaths(objectId) {
  const idStr = objectId != null ? String(objectId) : null;
  if (!idStr) return [];

  const connectionStore = useConnectionStore.getState();
  const connections =
    connectionStore.getConnectionsForObject?.(idStr) || [];
  if (!connections.length) return [];

  const objects = useObjectsStore.getState().objects || [];
  const objectsById = _objectsById(objects);
  const allObjects = _pathfindingObjects(objects);

  const paths = [];
  for (const conn of connections) {
    if (!conn?.id) continue;
    const startObjId = (
      conn.start?.objectId ?? conn.start?.cube?.id ?? conn.start?.id
    )?.toString();
    const endObjId = (
      conn.end?.objectId ?? conn.end?.cube?.id ?? conn.end?.id
    )?.toString();

    const startPos = resolveEndpoint(conn.start, objectsById, allObjects);
    const endPos = resolveEndpoint(conn.end, objectsById, allObjects);
    if (!startPos || !endPos) continue;

    const { pathPoints } = computeConnectionPath(
      startPos,
      endPos,
      allObjects,
      startObjId,
      endObjId
    );
    const out = Array.isArray(pathPoints) && pathPoints.length >= 2
      ? pathPoints
      : [startPos, endPos];

    // Round trip: out along the line, then back along it.
    const roundTrip = out.concat(out.slice(0, -1).reverse());
    paths.push({ connectionId: String(conn.id), points: roundTrip });
  }
  return paths;
}

/**
 * Arc-length-resample a polyline so travel can advance at constant speed
 * regardless of segment length. Returns { points, lengths, total }.
 */
export function resamplePath(points, spacing) {
  if (!Array.isArray(points) || points.length < 2) {
    return { points: points || [], lengths: [0], total: 0 };
  }
  const step = spacing > 0 ? spacing : 1;

  const out = [points[0].slice()];
  const lengths = [0];
  let total = 0;
  let carry = 0; // distance accumulated toward the next emitted sample

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (segLen <= 1e-9) continue;

    let travelled = 0;
    while (carry + (segLen - travelled) >= step) {
      travelled += step - carry;
      const t = travelled / segLen;
      out.push([a[0] + dx * t, a[1] + dy * t, a[2] + dz * t]);
      total += step;
      lengths.push(total);
      carry = 0;
    }
    carry += segLen - travelled;
  }

  // Ensure the final point is present.
  const last = points[points.length - 1];
  const lastOut = out[out.length - 1];
  const dLast = Math.hypot(
    last[0] - lastOut[0],
    last[1] - lastOut[1],
    last[2] - lastOut[2]
  );
  if (dLast > 1e-6) {
    total += dLast;
    out.push(last.slice());
    lengths.push(total);
  }

  return { points: out, lengths, total };
}

/**
 * Interpolate a world-space point at a given arc-length distance along a
 * resampled path (as returned by resamplePath).
 */
export function samplePathAt(resampled, distance, target) {
  const { points, lengths } = resampled;
  const t = target || [0, 0, 0];
  if (!points || points.length === 0) return t;
  if (points.length === 1 || distance <= 0) {
    t[0] = points[0][0];
    t[1] = points[0][1];
    t[2] = points[0][2];
    return t;
  }
  const total = lengths[lengths.length - 1];
  if (distance >= total) {
    const p = points[points.length - 1];
    t[0] = p[0];
    t[1] = p[1];
    t[2] = p[2];
    return t;
  }

  // Binary search for the segment containing `distance`.
  let lo = 0;
  let hi = lengths.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (lengths[mid] <= distance) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const segStart = lengths[i - 1];
  const segEnd = lengths[i];
  const segLen = segEnd - segStart;
  const localT = segLen > 1e-9 ? (distance - segStart) / segLen : 0;
  const a = points[i - 1];
  const b = points[i];
  t[0] = a[0] + (b[0] - a[0]) * localT;
  t[1] = a[1] + (b[1] - a[1]) * localT;
  t[2] = a[2] + (b[2] - a[2]) * localT;
  return t;
}
