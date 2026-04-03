/* tslint:disable */
/* eslint-disable */

/**
 * Compute LOD levels for N objects from a flat position array and a camera
 * position.  Only returns entries where the new level differs from the
 * current level to minimise Zustand store writes.
 *
 * Inputs
 * ------
 * - `positions`      — flat `[x0,y0,z0, …]`, `count * 3` floats
 * - `meta_flags`     — `count` bytes:
 *                      bit 0 (0x01) = isContainer (skip, always FULL)
 *                      bit 1 (0x02) = isParent    (use parent thresholds)
 * - `current_levels` — `count` bytes: current LOD level (0=FULL, 1=MEDIUM, 2=LOW)
 * - `cx, cy, cz`     — camera world position
 * - `child_full_sq`, `child_medium_sq`   — squared distance thresholds for child objects
 * - `parent_full_sq`, `parent_medium_sq` — squared distance thresholds for parent objects
 *
 * Returns a `Uint32Array` of interleaved `[index, newLevel, index, newLevel, …]`
 * for all changed entries.  The JS caller maps indices back to object IDs.
 */
export function compute_lod_updates(positions: Float32Array, meta_flags: Uint8Array, current_levels: Uint8Array, cx: number, cy: number, cz: number, child_full_sq: number, child_medium_sq: number, parent_full_sq: number, parent_medium_sq: number): Uint32Array;

/**
 * Fill instanceStart, instanceEnd, and instanceColor scratch buffers for
 * `count` objects, where each object contributes `edges_per_object` line
 * segments defined by the caller-supplied `template_start` and `template_end`
 * arrays (local-space, `edges_per_object * 3` floats each).
 *
 * Transform applied per object:
 *   world_point = local_point * scale + position
 *
 * (No rotation — hoverchart objects are axis-aligned.)
 *
 * Inputs
 * ------
 * - `positions`      — flat `[x0,y0,z0, x1,y1,z1, …]`, `count * 3` floats
 * - `scales`         — flat `[sx0,sy0,sz0, …]`,         `count * 3` floats
 * - `colors_rgb`     — flat `[r0,g0,b0, …]`,            `count * 3` floats (0–1)
 * - `visible`        — `count` bytes; 0 = hidden (write zeros), 1 = write transform
 * - `template_start` — `edges_per_object * 3` floats: local start points
 * - `template_end`   — `edges_per_object * 3` floats: local end points
 * - `edges_per_object` — number of edges per object (12 = cube, 30 = dodecahedron, 6 = tetra)
 *
 * After the call, retrieve results with `get_scratch_start_view`,
 * `get_scratch_end_view`, `get_scratch_color_view`.
 */
export function fill_edge_buffers(positions: Float32Array, scales: Float32Array, colors_rgb: Float32Array, visible: Uint8Array, template_start: Float32Array, template_end: Float32Array, edges_per_object: number): void;

/**
 * Test N connection endpoints against 6 frustum planes.
 *
 * A connection is visible if its start point, end point, or midpoint lies
 * inside all 6 planes (same logic as the existing JS implementation).
 *
 * Inputs
 * ------
 * - `start_positions` — flat `[x0,y0,z0, …]`, `conn_count * 3` floats
 * - `end_positions`   — flat `[x0,y0,z0, …]`, `conn_count * 3` floats
 * - `planes`          — 24 floats: `[nx0,ny0,nz0,d0, nx1,ny1,nz1,d1, …]` for 6 planes
 *
 * Returns a `Uint8Array` of length `conn_count`: 1 = visible, 0 = hidden.
 * Missing endpoints (represented by NaN in the input) cause that connection
 * to be marked visible (safe default).
 */
export function frustum_cull_connections(start_positions: Float32Array, end_positions: Float32Array, planes: Float32Array): Uint8Array;

/**
 * Zero-copy view of the instanceColor scratch buffer.
 * Panics if `len` exceeds the scratch buffer length.
 */
export function get_scratch_color_view(len: number): Float32Array;

/**
 * Zero-copy view of the instanceEnd scratch buffer.
 * Panics if `len` exceeds the scratch buffer length.
 */
export function get_scratch_end_view(len: number): Float32Array;

/**
 * Zero-copy view of the instanceStart scratch buffer produced by the last
 * `fill_edge_buffers` call.  The view is valid until the next Rust allocation
 * (i.e. until the next call to this module that triggers a heap resize).
 * JS must consume it before calling any other wasm function.
 *
 * `len` must not exceed `count * edges_per_object * 3` from the last call.
 * Panics if `len` exceeds the scratch buffer length.
 */
export function get_scratch_start_view(len: number): Float32Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly compute_lod_updates: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => [number, number];
    readonly fill_edge_buffers: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
    readonly frustum_cull_connections: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly get_scratch_color_view: (a: number) => any;
    readonly get_scratch_end_view: (a: number) => any;
    readonly get_scratch_start_view: (a: number) => any;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
