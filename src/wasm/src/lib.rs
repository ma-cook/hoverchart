//! hoverchart-wasm
//!
//! CPU-side compute kernels for the three main per-frame hot paths:
//!
//! 1. `fill_edge_buffers` — Applies scale-then-translate to each object's
//!    local-space edge template and writes the result into pre-allocated
//!    instanceStart / instanceEnd / instanceColor Float32Array buffers.
//!    Replaces the JS loop of N×edges `applyMatrix4` calls.
//!
//! 2. `compute_lod_updates` — Squared-distance LOD thresholding for N objects
//!    given a flat Float32Array of positions and a camera position. Returns
//!    only the (index, newLevel) pairs that differ from the current levels so
//!    the JS side can write minimal Zustand deltas.
//!
//! 3. `frustum_cull_connections` — Tests each connection's start, end and
//!    midpoint against 6 frustum planes, returning a Uint8Array visibility
//!    bitmask (1=visible). Replaces the JS per-connection loop in the worker.
//!
//! All public functions are exposed via `#[wasm_bindgen]`.
//! Scratch buffers for the edge kernel are maintained as module-level statics
//! to avoid per-call allocation; JS accesses them as views into wasm linear
//! memory (zero-copy reads after the computation).

use wasm_bindgen::prelude::*;
use js_sys::Float32Array;

// ---------------------------------------------------------------------------
// Module-level scratch buffers — grown lazily, never shrunk.
// These back the zero-copy view returned after each fill_edge_buffers call.
// ---------------------------------------------------------------------------
static mut SCRATCH_START: Vec<f32> = Vec::new();
static mut SCRATCH_END: Vec<f32> = Vec::new();
static mut SCRATCH_COLOR: Vec<f32> = Vec::new();

// ---------------------------------------------------------------------------
// Edge-buffer fill kernel
// ---------------------------------------------------------------------------

/// Fill instanceStart, instanceEnd, and instanceColor scratch buffers for
/// `count` objects, where each object contributes `edges_per_object` line
/// segments defined by the caller-supplied `template_start` and `template_end`
/// arrays (local-space, `edges_per_object * 3` floats each).
///
/// Transform applied per object:
///   world_point = local_point * scale + position
///
/// (No rotation — hoverchart objects are axis-aligned.)
///
/// Inputs
/// ------
/// - `positions`      — flat `[x0,y0,z0, x1,y1,z1, …]`, `count * 3` floats
/// - `scales`         — flat `[sx0,sy0,sz0, …]`,         `count * 3` floats
/// - `colors_rgb`     — flat `[r0,g0,b0, …]`,            `count * 3` floats (0–1)
/// - `visible`        — `count` bytes; 0 = hidden (write zeros), 1 = write transform
/// - `template_start` — `edges_per_object * 3` floats: local start points
/// - `template_end`   — `edges_per_object * 3` floats: local end points
/// - `edges_per_object` — number of edges per object (12 = cube, 30 = dodecahedron, 6 = tetra)
///
/// After the call, retrieve results with `get_scratch_start_view`,
/// `get_scratch_end_view`, `get_scratch_color_view`.
#[wasm_bindgen]
pub fn fill_edge_buffers(
    positions: &[f32],
    scales: &[f32],
    colors_rgb: &[f32],
    visible: &[u8],
    template_start: &[f32],
    template_end: &[f32],
    edges_per_object: usize,
) {
    let count = visible.len();
    let total = count * edges_per_object;

    // Ensure scratch capacity
    unsafe {
        if SCRATCH_START.len() < total * 3 {
            SCRATCH_START.resize(total * 3, 0.0);
            SCRATCH_END.resize(total * 3, 0.0);
            SCRATCH_COLOR.resize(total * 3, 0.0);
        }
    }

    unsafe {
        let start_out = SCRATCH_START.as_mut_ptr();
        let end_out = SCRATCH_END.as_mut_ptr();
        let color_out = SCRATCH_COLOR.as_mut_ptr();

        for obj_idx in 0..count {
            let pi = obj_idx * 3;
            let px = *positions.get_unchecked(pi);
            let py = *positions.get_unchecked(pi + 1);
            let pz = *positions.get_unchecked(pi + 2);

            let sx = *scales.get_unchecked(pi);
            let sy = *scales.get_unchecked(pi + 1);
            let sz = *scales.get_unchecked(pi + 2);

            let cr = *colors_rgb.get_unchecked(pi);
            let cg = *colors_rgb.get_unchecked(pi + 1);
            let cb = *colors_rgb.get_unchecked(pi + 2);

            let edge_base = obj_idx * edges_per_object;

            if *visible.get_unchecked(obj_idx) == 0 {
                // Hidden — zero out all edges for this object
                for e in 0..edges_per_object {
                    let out_i = (edge_base + e) * 3;
                    *start_out.add(out_i) = 0.0;
                    *start_out.add(out_i + 1) = 0.0;
                    *start_out.add(out_i + 2) = 0.0;
                    *end_out.add(out_i) = 0.0;
                    *end_out.add(out_i + 1) = 0.0;
                    *end_out.add(out_i + 2) = 0.0;
                    *color_out.add(out_i) = 0.0;
                    *color_out.add(out_i + 1) = 0.0;
                    *color_out.add(out_i + 2) = 0.0;
                }
            } else {
                for e in 0..edges_per_object {
                    let ti = e * 3;
                    let out_i = (edge_base + e) * 3;

                    // Transform start point: local * scale + position
                    let ls_x = *template_start.get_unchecked(ti);
                    let ls_y = *template_start.get_unchecked(ti + 1);
                    let ls_z = *template_start.get_unchecked(ti + 2);
                    *start_out.add(out_i) = ls_x * sx + px;
                    *start_out.add(out_i + 1) = ls_y * sy + py;
                    *start_out.add(out_i + 2) = ls_z * sz + pz;

                    // Transform end point
                    let le_x = *template_end.get_unchecked(ti);
                    let le_y = *template_end.get_unchecked(ti + 1);
                    let le_z = *template_end.get_unchecked(ti + 2);
                    *end_out.add(out_i) = le_x * sx + px;
                    *end_out.add(out_i + 1) = le_y * sy + py;
                    *end_out.add(out_i + 2) = le_z * sz + pz;

                    // Replicate color for each edge
                    *color_out.add(out_i) = cr;
                    *color_out.add(out_i + 1) = cg;
                    *color_out.add(out_i + 2) = cb;
                }
            }
        }
    }
}

/// Zero-copy view of the instanceStart scratch buffer produced by the last
/// `fill_edge_buffers` call.  The view is valid until the next Rust allocation
/// (i.e. until the next call to this module that triggers a heap resize).
/// JS must consume it before calling any other wasm function.
///
/// `len` must not exceed `count * edges_per_object * 3` from the last call.
/// Panics if `len` exceeds the scratch buffer length.
#[wasm_bindgen]
pub unsafe fn get_scratch_start_view(len: usize) -> Float32Array {
    assert!(len <= SCRATCH_START.len(), "get_scratch_start_view: len out of bounds");
    Float32Array::view(&SCRATCH_START[..len])
}

/// Zero-copy view of the instanceEnd scratch buffer.
/// Panics if `len` exceeds the scratch buffer length.
#[wasm_bindgen]
pub unsafe fn get_scratch_end_view(len: usize) -> Float32Array {
    assert!(len <= SCRATCH_END.len(), "get_scratch_end_view: len out of bounds");
    Float32Array::view(&SCRATCH_END[..len])
}

/// Zero-copy view of the instanceColor scratch buffer.
/// Panics if `len` exceeds the scratch buffer length.
#[wasm_bindgen]
pub unsafe fn get_scratch_color_view(len: usize) -> Float32Array {
    assert!(len <= SCRATCH_COLOR.len(), "get_scratch_color_view: len out of bounds");
    Float32Array::view(&SCRATCH_COLOR[..len])
}

// ---------------------------------------------------------------------------
// LOD computation kernel  (runs inside the spatial-index web worker)
// ---------------------------------------------------------------------------

/// Compute LOD levels for N objects from a flat position array and a camera
/// position.  Only returns entries where the new level differs from the
/// current level to minimise Zustand store writes.
///
/// Inputs
/// ------
/// - `positions`      — flat `[x0,y0,z0, …]`, `count * 3` floats
/// - `meta_flags`     — `count` bytes:
///                      bit 0 (0x01) = isContainer (skip, always FULL)
///                      bit 1 (0x02) = isParent    (use parent thresholds)
/// - `current_levels` — `count` bytes: current LOD level (0=FULL, 1=MEDIUM, 2=LOW)
/// - `cx, cy, cz`     — camera world position
/// - `child_full_sq`, `child_medium_sq`   — squared distance thresholds for child objects
/// - `parent_full_sq`, `parent_medium_sq` — squared distance thresholds for parent objects
///
/// Returns a `Uint32Array` of interleaved `[index, newLevel, index, newLevel, …]`
/// for all changed entries.  The JS caller maps indices back to object IDs.
#[wasm_bindgen]
pub fn compute_lod_updates(
    positions: &[f32],
    meta_flags: &[u8],
    current_levels: &[u8],
    cx: f32,
    cy: f32,
    cz: f32,
    child_full_sq: f32,
    child_medium_sq: f32,
    parent_full_sq: f32,
    parent_medium_sq: f32,
) -> Vec<u32> {
    let count = meta_flags.len();
    // Start with a modest capacity — typically only a fraction of objects
    // change LOD in any single call. Vec grows dynamically if needed.
    let mut updates: Vec<u32> = Vec::with_capacity(count / 4 + 8);

    for i in 0..count {
        let flags = unsafe { *meta_flags.get_unchecked(i) };

        // Skip grouping containers (always full detail)
        if flags & 0x01 != 0 {
            continue;
        }

        let pi = i * 3;
        let dx = cx - unsafe { *positions.get_unchecked(pi) };
        let dy = cy - unsafe { *positions.get_unchecked(pi + 1) };
        let dz = cz - unsafe { *positions.get_unchecked(pi + 2) };
        let dist_sq = dx * dx + dy * dy + dz * dz;

        let is_parent = flags & 0x02 != 0;
        let new_level = if is_parent {
            if dist_sq < parent_full_sq {
                0u32
            } else if dist_sq < parent_medium_sq {
                1u32
            } else {
                2u32
            }
        } else {
            if dist_sq < child_full_sq {
                0u32
            } else if dist_sq < child_medium_sq {
                1u32
            } else {
                2u32
            }
        };

        let current = unsafe { *current_levels.get_unchecked(i) } as u32;
        if new_level != current {
            updates.push(i as u32);
            updates.push(new_level);
        }
    }

    updates
}

// ---------------------------------------------------------------------------
// Frustum-cull connections kernel  (runs inside the spatial-index web worker)
// ---------------------------------------------------------------------------

/// Test N connection endpoints against 6 frustum planes.
///
/// A connection is visible if its start point, end point, or midpoint lies
/// inside all 6 planes (same logic as the existing JS implementation).
///
/// Inputs
/// ------
/// - `start_positions` — flat `[x0,y0,z0, …]`, `conn_count * 3` floats
/// - `end_positions`   — flat `[x0,y0,z0, …]`, `conn_count * 3` floats
/// - `planes`          — 24 floats: `[nx0,ny0,nz0,d0, nx1,ny1,nz1,d1, …]` for 6 planes
///
/// Returns a `Uint8Array` of length `conn_count`: 1 = visible, 0 = hidden.
/// Missing endpoints (represented by NaN in the input) cause that connection
/// to be marked visible (safe default).
#[wasm_bindgen]
pub fn frustum_cull_connections(
    start_positions: &[f32],
    end_positions: &[f32],
    planes: &[f32],
) -> Vec<u8> {
    let conn_count = start_positions.len() / 3;
    let mut visible = vec![0u8; conn_count];

    for i in 0..conn_count {
        let pi = i * 3;
        let sx = unsafe { *start_positions.get_unchecked(pi) };
        let sy = unsafe { *start_positions.get_unchecked(pi + 1) };
        let sz = unsafe { *start_positions.get_unchecked(pi + 2) };
        let ex = unsafe { *end_positions.get_unchecked(pi) };
        let ey = unsafe { *end_positions.get_unchecked(pi + 1) };
        let ez = unsafe { *end_positions.get_unchecked(pi + 2) };

        // If either endpoint is NaN (missing), mark visible (safe default)
        if sx.is_nan() || ex.is_nan() {
            visible[i] = 1;
            continue;
        }

        let mx = (sx + ex) * 0.5;
        let my = (sy + ey) * 0.5;
        let mz = (sz + ez) * 0.5;

        if point_in_frustum(sx, sy, sz, planes)
            || point_in_frustum(ex, ey, ez, planes)
            || point_in_frustum(mx, my, mz, planes)
        {
            visible[i] = 1;
        }
    }

    visible
}

#[inline(always)]
fn point_in_frustum(px: f32, py: f32, pz: f32, planes: &[f32]) -> bool {
    for plane in 0..6 {
        let off = plane * 4;
        let nx = unsafe { *planes.get_unchecked(off) };
        let ny = unsafe { *planes.get_unchecked(off + 1) };
        let nz = unsafe { *planes.get_unchecked(off + 2) };
        let d = unsafe { *planes.get_unchecked(off + 3) };
        if nx * px + ny * py + nz * pz + d < 0.0 {
            return false;
        }
    }
    true
}
