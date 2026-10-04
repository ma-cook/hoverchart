import * as THREE from 'three';

// GPU-side billboarding for the LOW-LOD 2D stand-ins (the four
// Global*LowLODRenderer.jsx components).
//
// Those renderers write an instance matrix of scale + translation with no
// rotation, and rebuild it only when an object's transform or LOD level
// changes. Re-orienting the quads on the CPU would therefore mean rewriting
// every matrix on every camera frame -- the wrong trade for meshes that exist
// specifically to stay at one draw call for thousands of objects.
//
// Instead the CPU matrices are left exactly as they are and the orientation is
// resolved in the vertex shader: read position and per-axis scale out of
// `instanceMatrix`, then lay the quad out along the view-space right/up axes.
// Every quad faces the camera for free, with no per-frame CPU work, no extra
// draw calls and no React re-renders.
//
// Trade-off: `InstancedMesh.raycast` still tests the un-billboarded CPU
// matrices, so hit-testing is exact head-on and can be off by up to half the
// quad's diagonal at grazing angles. LOW-LOD objects are only drawn beyond
// LOD_CHILD_MEDIUM_SQ (see spatialIndexWorker.js), so that error stays well
// under 1% of the view distance in practice.

const BILLBOARD_PROJECT_VERTEX = /* glsl */ `
#ifdef USE_INSTANCING
	// instanceMatrix holds scale + translation only (see the makeScale /
	// setPosition calls in the LOW-LOD renderers), so the lengths of its first
	// two basis columns are the scale factors and its fourth column is the
	// instance's world position.
	vec3 billboardPosition = instanceMatrix[ 3 ].xyz;
	vec2 billboardScale = vec2(
		length( instanceMatrix[ 0 ].xyz ),
		length( instanceMatrix[ 1 ].xyz )
	);

	// mvPosition keeps its usual name so later chunks (fog, etc.) still bind
	// to it exactly as they do with the stock project_vertex chunk.
	vec4 mvPosition = modelViewMatrix * vec4( billboardPosition, 1.0 );
	mvPosition.xy += position.xy * billboardScale;

	gl_Position = projectionMatrix * mvPosition;
#else
	#include <project_vertex>
#endif
`;

// Declared once at module scope so every billboarding material compiles a single
// shared program: `Material.customProgramCacheKey()` keys off the source text of
// `onBeforeCompile`, so one identical function reference means one cache key --
// and an unpatched material still gets a different one.
function billboardOnBeforeCompile(shader) {
	shader.vertexShader = shader.vertexShader.replace(
		'#include <project_vertex>',
		BILLBOARD_PROJECT_VERTEX
	);
}

/**
 * MeshBasicMaterial whose instanced quads always face the camera.
 * Accepts the usual MeshBasicMaterial params as overrides.
 */
export function createBillboardLowLodMaterial(params = {}) {
	const material = new THREE.MeshBasicMaterial({
		transparent: true,
		opacity: 0.5,
		side: THREE.DoubleSide,
		depthWrite: true,
		...params,
	});
	material.onBeforeCompile = billboardOnBeforeCompile;
	return material;
}

export default createBillboardLowLodMaterial;
