import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import InstancedLine from './InstancedLine';
import useEarthSettingsStore from '../stores/earthSettingsStore';
import { generateGlobeGeometry, generateGlobeMesh, generateLocalGlobeGeometry, generateLocalGlobeMesh, setHeightmapData } from '../utils/earthTerrainGenerator';
import { loadEarthHeightmap } from '../utils/earthHeightmapLoader';
import { prefetchArea, setOnTilesLoaded } from '../utils/terrainTileCache';

const GLOBE_CENTER = [5000, 5000, 5000];
const _globeCenter = new THREE.Vector3(...GLOBE_CENTER);

// Click-to-fly config
const CLICK_MAX_MS = 250;        // max pointerdown→pointerup for a "click"
const CLICK_MAX_PX = 5;          // max pointer movement in pixels
const FLY_LERP_SPEED = 2.5;      // lerp speed (higher = faster)
const FLY_ALTITUDE = 1.5;        // units above the surface at the clicked point
const FLY_LATERAL = 3.0;         // lateral offset along tangent for angled view

// LOD grid steps — index 0 is highest detail (closest), last is coarsest (farthest)
const LOD_STEPS = [
  { latStep: 0.5, lonStep: 0.5 }, // very close — harbour / valley detail
  { latStep: 1,   lonStep: 1 },   // close — mountain range detail
  { latStep: 2,   lonStep: 2 },   // medium — continental features
  { latStep: 4,   lonStep: 4 },   // far
  { latStep: 8,   lonStep: 8 },   // very far
  { latStep: 16,  lonStep: 16 },  // extreme distance — basic outline
];

// The surface mesh provides opacity; wireframe provides terrain detail.
const MESH_LOD_OFFSET = 0;

// Local detail patch config — when camera is very close, render a high-res
// wireframe + mesh patch covering only the area around the camera target.
const LOCAL_DETAIL = [
  { maxRel: 0.05, latStep: 0.05, lonStep: 0.05, patchDeg: 8 },  // ultra-close
  { maxRel: 0.15, latStep: 0.1,  lonStep: 0.1,  patchDeg: 15 }, // close
];

// Camera position quantization step (degrees) — prevents constant re-renders
// as camera moves. Patch shifts only when camera crosses a quantization boundary.
const CAM_QUANT_DEG = 2;

const EarthGlobe = () => {
  const radius = useEarthSettingsStore((s) => s.radius);
  const exaggeration = useEarthSettingsStore((s) => s.exaggeration);
  const colorScheme = useEarthSettingsStore((s) => s.colorScheme);
  const showOceanFloor = useEarthSettingsStore((s) => s.showOceanFloor);
  const lineWidth = useEarthSettingsStore((s) => s.lineWidth);

  const [lodLevel, setLodLevel] = useState(LOD_STEPS.length - 1);
  const [heightmapLoaded, setHeightmapLoaded] = useState(false);
  const [cameraLat, setCameraLat] = useState(0);
  const [cameraLon, setCameraLon] = useState(0);
  const [tileVersion, setTileVersion] = useState(0);
  const lodLevelRef = useRef(LOD_STEPS.length - 1);
  const lastCheckRef = useRef(0);
  const meshGeoRef = useRef(null);
  const localMeshGeoRef = useRef(null);
  const cameraLatRef = useRef(0);
  const cameraLonRef = useRef(0);
  const relDistRef = useRef(100);
  const tileTimerRef = useRef(null);

  // Click-to-fly state
  const pointerDownRef = useRef(null);       // { time, x, y }
  const flyTargetRef = useRef(null);          // { position, lookAt } or null
  const flyingRef = useRef(false);

  const controls = useThree((state) => state.controls);
  const camera = useThree((state) => state.camera);

  // --- Click-to-fly handlers ---

  const handlePointerDown = useCallback((e) => {
    pointerDownRef.current = {
      time: performance.now(),
      x: e.clientX,
      y: e.clientY,
    };
  }, []);

  const handlePointerUp = useCallback((e) => {
    const pd = pointerDownRef.current;
    if (!pd) return;
    pointerDownRef.current = null;

    const elapsed = performance.now() - pd.time;
    const dx = e.clientX - pd.x;
    const dy = e.clientY - pd.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only treat as a click if it was fast and didn't move much
    if (elapsed > CLICK_MAX_MS || dist > CLICK_MAX_PX) return;

    // Get the 3D intersection point on the globe surface
    const hit = e.point;
    if (!hit) return;

    // "Up" at the clicked point = direction from globe centre outward
    const up = new THREE.Vector3().subVectors(hit, _globeCenter).normalize();

    // Build a tangent basis at the hit point
    const arbitrary = Math.abs(up.y) < 0.99
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    const tangent = new THREE.Vector3().crossVectors(up, arbitrary).normalize();

    // Position camera directly above the clicked point, then offset laterally
    // to create an angled bird-in-valley view while staying close to the spot
    const targetPos = hit.clone()
      .addScaledVector(up, FLY_ALTITUDE)
      .addScaledVector(tangent, FLY_LATERAL);

    // Look at the clicked surface point — the lateral offset creates the angle
    const lookAt = hit.clone();

    flyTargetRef.current = { position: targetPos, lookAt, up: up.clone() };
    flyingRef.current = true;
  }, [radius]);

  // Load heightmap on mount
  useEffect(() => {
    loadEarthHeightmap().then((data) => {
      if (data) {
        setHeightmapData(data);
        setHeightmapLoaded(true);
      }
    });
  }, []);

  // Register tile-loaded callback (debounce to batch tile arrivals)
  useEffect(() => {
    setOnTilesLoaded(() => {
      if (tileTimerRef.current) return;
      tileTimerRef.current = setTimeout(() => {
        tileTimerRef.current = null;
        setTileVersion((v) => v + 1);
      }, 500);
    });
    return () => {
      setOnTilesLoaded(null);
      if (tileTimerRef.current) clearTimeout(tileTimerRef.current);
    };
  }, []);

  // Dynamic camera min distance — adjusted in useFrame based on orbit target

  // Throttled LOD check + camera tracking + tile prefetching + fly animation
  useFrame(({ camera, clock }, delta) => {
    // --- Dynamic minDistance ---
    // When orbit target is near the surface (after fly-to), allow the camera
    // to get very close. When target is at globe center (normal orbit), prevent
    // clipping through the surface.
    if (controls) {
      const targetDistFromCenter = controls.target.distanceTo(_globeCenter);
      if (targetDistFromCenter > radius * 0.5) {
        // Target is on/near the surface — allow camera right down to it
        controls.minDistance = 0.5;
      } else {
        // Target is at/near globe center — prevent entering the sphere
        controls.minDistance = radius + 0.5;
      }
    }

    // --- Fly-to animation (runs every frame for smooth motion) ---
    if (flyingRef.current && flyTargetRef.current && controls) {
      const t = Math.min(1, FLY_LERP_SPEED * delta);
      camera.position.lerp(flyTargetRef.current.position, t);

      // Orbit target lerps to the clicked surface point so the camera
      // looks across the terrain like a bird in a valley, not straight down
      controls.target.lerp(flyTargetRef.current.lookAt, t);

      // Rotate the camera's up vector to match the local surface normal
      // so "up" on screen = away from the globe surface (horizontal orientation)
      camera.up.lerp(flyTargetRef.current.up, t).normalize();
      controls.update();

      // Stop when close enough
      if (camera.position.distanceTo(flyTargetRef.current.position) < 0.3) {
        // Lock final position precisely
        camera.position.copy(flyTargetRef.current.position);
        controls.target.copy(flyTargetRef.current.lookAt);
        camera.up.copy(flyTargetRef.current.up);
        controls.update();
        flyingRef.current = false;
        flyTargetRef.current = null;
      }
    }

    // --- Throttled checks (LOD, camera lat/lon, tile prefetch) ---
    const now = clock.elapsedTime * 1000;
    if (now - lastCheckRef.current < 200) return;
    lastCheckRef.current = now;

    const dx = camera.position.x - GLOBE_CENTER[0];
    const dy = camera.position.y - GLOBE_CENTER[1];
    const dz = camera.position.z - GLOBE_CENTER[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const surfaceDist = Math.max(0, dist - radius);
    const relDist = surfaceDist / radius;
    relDistRef.current = relDist;

    // Dynamic near plane — pull it in when close to the surface to prevent clipping
    if (surfaceDist < 20) {
      camera.near = 0.01;
      camera.updateProjectionMatrix();
    } else if (camera.near !== 1) {
      camera.near = 1;
      camera.updateProjectionMatrix();
    }

    let newLevel;
    if (relDist < 0.15) newLevel = 0;       // very close — 0.5°
    else if (relDist < 0.5) newLevel = 1;    // close — 1°
    else if (relDist < 1.5) newLevel = 2;    // medium — 2°
    else if (relDist < 4.0) newLevel = 3;    // far — 4°
    else if (relDist < 10.0) newLevel = 4;   // very far — 8°
    else newLevel = 5;                        // extreme — 16°

    if (newLevel !== lodLevelRef.current) {
      lodLevelRef.current = newLevel;
      setLodLevel(newLevel);
    }

    // Camera-facing lat/lon (surface point closest to camera)
    // Z is negated in the geometry (to fix east-west mirroring), so negate dz for lon
    const invDist = 1 / dist;
    const camLat = Math.asin(Math.max(-1, Math.min(1, dy * invDist))) * 180 / Math.PI;
    const camLon = Math.atan2(-dz, dx) * 180 / Math.PI;

    // Quantize to prevent churn
    const qLat = Math.round(camLat / CAM_QUANT_DEG) * CAM_QUANT_DEG;
    const qLon = Math.round(camLon / CAM_QUANT_DEG) * CAM_QUANT_DEG;
    if (qLat !== cameraLatRef.current || qLon !== cameraLonRef.current) {
      cameraLatRef.current = qLat;
      cameraLonRef.current = qLon;
      setCameraLat(qLat);
      setCameraLon(qLon);
    }

    // Progressive tile prefetching — load ahead of when we need them
    if (relDist < 1.0) prefetchArea(camLat, camLon, 7, 7);
    if (relDist < 0.3) prefetchArea(camLat, camLon, 9, 5);
    if (relDist < 0.1) prefetchArea(camLat, camLon, 11, 3);
  });

  const { latStep, lonStep } = LOD_STEPS[lodLevel] || LOD_STEPS[LOD_STEPS.length - 1];
  const meshLod = LOD_STEPS[Math.min(lodLevel + MESH_LOD_OFFSET, LOD_STEPS.length - 1)];

  // Wireframe geometry
  const bands = useMemo(() => {
    return generateGlobeGeometry({
      radius, exaggeration, center: GLOBE_CENTER,
      latStep, lonStep, colorScheme, showOceanFloor,
    });
  }, [radius, exaggeration, latStep, lonStep, colorScheme, showOceanFloor, heightmapLoaded, tileVersion]);

  // Opaque surface mesh geometry
  const meshGeometry = useMemo(() => {
    const { positions, colors, indices } = generateGlobeMesh({
      radius, exaggeration, center: GLOBE_CENTER,
      latStep: meshLod.latStep, lonStep: meshLod.lonStep,
      colorScheme, showOceanFloor, darken: 0.08,
    });

    // Dispose previous geometry
    if (meshGeoRef.current) meshGeoRef.current.dispose();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();

    meshGeoRef.current = geo;
    return geo;
  }, [radius, exaggeration, meshLod.latStep, meshLod.lonStep, colorScheme, showOceanFloor, heightmapLoaded, tileVersion]);

  // Determine which local detail level to use (if any)
  const localDetail = useMemo(() => {
    const rel = relDistRef.current;
    if (lodLevel > 0) return null;
    for (const ld of LOCAL_DETAIL) {
      if (rel < ld.maxRel) return ld;
    }
    return LOCAL_DETAIL[LOCAL_DETAIL.length - 1];
  }, [lodLevel, cameraLat, cameraLon]);

  // Local detail wireframe (fine grid for a small area around camera)
  const localBands = useMemo(() => {
    if (!localDetail) return null;
    return generateLocalGlobeGeometry({
      radius, exaggeration, center: GLOBE_CENTER,
      latStep: localDetail.latStep, lonStep: localDetail.lonStep,
      centerLat: cameraLat, centerLon: cameraLon,
      patchDeg: localDetail.patchDeg,
      colorScheme, showOceanFloor,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDetail, cameraLat, cameraLon, radius, exaggeration, colorScheme, showOceanFloor, tileVersion]);

  // Local detail mesh (solid surface for local patch)
  const localMeshGeometry = useMemo(() => {
    if (!localDetail) {
      if (localMeshGeoRef.current) { localMeshGeoRef.current.dispose(); localMeshGeoRef.current = null; }
      return null;
    }
    const { positions, colors, indices } = generateLocalGlobeMesh({
      radius, exaggeration, center: GLOBE_CENTER,
      latStep: localDetail.latStep, lonStep: localDetail.lonStep,
      centerLat: cameraLat, centerLon: cameraLon,
      patchDeg: localDetail.patchDeg,
      colorScheme, showOceanFloor, darken: 0.08,
    });

    if (localMeshGeoRef.current) localMeshGeoRef.current.dispose();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();

    localMeshGeoRef.current = geo;
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDetail, cameraLat, cameraLon, radius, exaggeration, colorScheme, showOceanFloor, tileVersion]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      if (meshGeoRef.current) {
        meshGeoRef.current.dispose();
        meshGeoRef.current = null;
      }
      if (localMeshGeoRef.current) {
        localMeshGeoRef.current.dispose();
        localMeshGeoRef.current = null;
      }
    };
  }, []);

  return (
    <group>
      {/* Opaque surface mesh — rendered first so wireframe draws on top */}
      <mesh
        geometry={meshGeometry}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <meshBasicMaterial
          vertexColors
          side={THREE.DoubleSide}
          depthWrite
        />
      </mesh>

      {/* Wireframe overlay */}
      {bands.map((band, i) => (
        <InstancedLine
          key={`earth-${band.color}-${lodLevel}-${i}`}
          points={band.points}
          color={band.color}
          lineWidth={lineWidth}
          depthWrite
          materialOpacity={2.0}
        />
      ))}

      {/* Local detail patch — high-res mesh overlay for close-up area */}
      {localMeshGeometry && (
        <mesh
          geometry={localMeshGeometry}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <meshBasicMaterial
            vertexColors
            side={THREE.DoubleSide}
            depthWrite
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}

      {/* Local detail wireframe — fine grid for close-up area */}
      {localBands && localBands.map((band, i) => (
        <InstancedLine
          key={`local-${band.color}-${cameraLat}-${cameraLon}-${i}`}
          points={band.points}
          color={band.color}
          lineWidth={lineWidth}
          depthWrite
          materialOpacity={2.0}
        />
      ))}
    </group>
  );
};

export default EarthGlobe;
