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
import useLODStore from '../stores/lodStore';
import { computeConnectionPath } from './pathfindingUtils';
import { calculateFacePosition } from './facePositionUtils';

/**
 * Per-connection camera-follow speed multipliers, classified by how the two
 * endpoint objects relate spatially:
 *   short  – internal child ↔ parent of the same object (containment link)
 *   medium – both endpoint objects inside the SAME container group
 *   long   – endpoints in different container groups (or ungrouped)
 * Attached to each follow path as `speedMultiplier`; CameraFollowController
 * multiplies its base SPEED by it for that segment.
 */
export const FOLLOW_SPEED_MULTIPLIERS = { short: 1, medium: 1.5, long: 6 };

// Group containers are cubes: world half-extent = scale * DEFAULT_CUBE_SIZE.
const CONTAINER_HALF_SIZE = 5;

const _groupContainers = (objects) => {
  const list = [];
  for (const obj of objects) {
    if (!obj?.merfolkData?.isContainer) continue;
    if (!Array.isArray(obj.position)) continue;
    const s = Array.isArray(obj.scale) ? obj.scale : [1, 1, 1];
    const half = [
      Math.abs(s[0] || 1) * CONTAINER_HALF_SIZE,
      Math.abs(s[1] || 1) * CONTAINER_HALF_SIZE,
      Math.abs(s[2] || 1) * CONTAINER_HALF_SIZE,
    ];
    list.push({
      id: String(obj.id),
      center: obj.position,
      half,
      volume: half[0] * half[1] * half[2],
    });
  }
  return list;
};

// An object's "container group" is the SMALLEST container box containing its
// centre. Containers nest (per-component ⊂ boundary ⊂ Component Hierarchy),
// so the most-specific box is the group the object actually belongs to —
// testing "any shared box" would put nearly every component in the same giant
// hierarchy container and classify almost everything medium.
const _smallestContainerId = (pos, containers) => {
  if (!Array.isArray(pos)) return null;
  let best = null;
  for (const c of containers) {
    if (Math.abs(pos[0] - c.center[0]) > c.half[0]) continue;
    if (Math.abs(pos[1] - c.center[1]) > c.half[1]) continue;
    if (Math.abs(pos[2] - c.center[2]) > c.half[2]) continue;
    if (!best || c.volume < best.volume) best = c;
  }
  return best ? best.id : null;
};

/**
 * Classify a connection into a follow-speed multiplier.
 * Positions prefer the live store object and fall back to the endpoint
 * snapshot baked into the connection (works for cell-unloaded far objects).
 */
function classifyFollowSpeed(conn, startObjId, endObjId, objectsById, containers) {
  const a = objectsById.get(startObjId) || null;
  const b = objectsById.get(endObjId) || null;

  // short: internal child ↔ parent of the same object. parentNodeId links a
  // child to its containing parent's node id.
  const aNode = a?.merfolkData?.nodeId;
  const aParent = a?.merfolkData?.parentNodeId;
  const bNode = b?.merfolkData?.nodeId;
  const bParent = b?.merfolkData?.parentNodeId;
  if ((aParent && aParent === bNode) || (bParent && bParent === aNode)) {
    return FOLLOW_SPEED_MULTIPLIERS.short;
  }
  // Fallback when merfolkData is unavailable (unloaded objects): the LOD
  // hierarchy carries the same linkage keyed by object id.
  try {
    const { childParentMap } = useLODStore.getState();
    if (
      childParentMap &&
      (String(childParentMap.get(startObjId)) === endObjId ||
        String(childParentMap.get(endObjId)) === startObjId)
    ) {
      return FOLLOW_SPEED_MULTIPLIERS.short;
    }
  } catch { /* hierarchy unavailable */ }

  // medium: both endpoints belong to the same (most-specific) container group.
  const aPos = a?.position || conn.start?.cube?.position || conn.start?.position || null;
  const bPos = b?.position || conn.end?.cube?.position || conn.end?.position || null;
  const aGroup = _smallestContainerId(aPos, containers);
  const bGroup = _smallestContainerId(bPos, containers);
  if (aGroup && aGroup === bGroup) {
    return FOLLOW_SPEED_MULTIPLIERS.medium;
  }

  // long: different groups, or either endpoint outside every container.
  return FOLLOW_SPEED_MULTIPLIERS.long;
}

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
 * @returns {Array<{ connectionId: string, startObjectId: string, endObjectId: string, points: number[][], turnaroundDistance: number, speedMultiplier: number }>}
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
  const containers = _groupContainers(objects);

  const paths = [];
  for (const conn of connections) {
    if (!conn?.id) continue;
    const startObjId = (
      conn.start?.objectId ?? conn.start?.cube?.id ?? conn.start?.id
    )?.toString();
    const endObjId = (
      conn.end?.objectId ?? conn.end?.cube?.id ?? conn.end?.id
    )?.toString();

    if (!startObjId || !endObjId) continue;

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

    // Compute turnaround distance (arc length of outbound leg)
    let turnaroundDistance = 0;
    for (let i = 1; i < out.length; i++) {
      const a = out[i - 1];
      const b = out[i];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dz = b[2] - a[2];
      turnaroundDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // Round trip: out along the line, then back along it.
    const roundTrip = out.concat(out.slice(0, -1).reverse());
    paths.push({
      connectionId: String(conn.id),
      startObjectId: startObjId,
      endObjectId: endObjId,
      points: roundTrip,
      turnaroundDistance,
      speedMultiplier: classifyFollowSpeed(conn, startObjId, endObjId, objectsById, containers),
    });
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
