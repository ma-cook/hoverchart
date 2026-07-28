/* @ts-self-types="./hoverchart_wasm.d.ts" */

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
 * @param {Float32Array} positions
 * @param {Uint8Array} meta_flags
 * @param {Uint8Array} current_levels
 * @param {number} cx
 * @param {number} cy
 * @param {number} cz
 * @param {number} child_full_sq
 * @param {number} child_medium_sq
 * @param {number} parent_full_sq
 * @param {number} parent_medium_sq
 * @returns {Uint32Array}
 */
export function compute_lod_updates(positions, meta_flags, current_levels, cx, cy, cz, child_full_sq, child_medium_sq, parent_full_sq, parent_medium_sq) {
    const ptr0 = passArrayF32ToWasm0(positions, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(meta_flags, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(current_levels, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.compute_lod_updates(ptr0, len0, ptr1, len1, ptr2, len2, cx, cy, cz, child_full_sq, child_medium_sq, parent_full_sq, parent_medium_sq);
    var v4 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v4;
}

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
 * @param {Float32Array} positions
 * @param {Float32Array} scales
 * @param {Float32Array} colors_rgb
 * @param {Uint8Array} visible
 * @param {Float32Array} template_start
 * @param {Float32Array} template_end
 * @param {number} edges_per_object
 */
export function fill_edge_buffers(positions, scales, colors_rgb, visible, template_start, template_end, edges_per_object) {
    const ptr0 = passArrayF32ToWasm0(positions, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF32ToWasm0(scales, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayF32ToWasm0(colors_rgb, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(visible, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passArrayF32ToWasm0(template_start, wasm.__wbindgen_malloc);
    const len4 = WASM_VECTOR_LEN;
    const ptr5 = passArrayF32ToWasm0(template_end, wasm.__wbindgen_malloc);
    const len5 = WASM_VECTOR_LEN;
    wasm.fill_edge_buffers(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, edges_per_object);
}

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
 * @param {Float32Array} start_positions
 * @param {Float32Array} end_positions
 * @param {Float32Array} planes
 * @returns {Uint8Array}
 */
export function frustum_cull_connections(start_positions, end_positions, planes) {
    const ptr0 = passArrayF32ToWasm0(start_positions, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF32ToWasm0(end_positions, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayF32ToWasm0(planes, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.frustum_cull_connections(ptr0, len0, ptr1, len1, ptr2, len2);
    var v4 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v4;
}

/**
 * Zero-copy view of the instanceColor scratch buffer.
 * Panics if `len` exceeds the scratch buffer length.
 * @param {number} len
 * @returns {Float32Array}
 */
export function get_scratch_color_view(len) {
    const ret = wasm.get_scratch_color_view(len);
    return ret;
}

/**
 * Zero-copy view of the instanceEnd scratch buffer.
 * Panics if `len` exceeds the scratch buffer length.
 * @param {number} len
 * @returns {Float32Array}
 */
export function get_scratch_end_view(len) {
    const ret = wasm.get_scratch_end_view(len);
    return ret;
}

/**
 * Zero-copy view of the instanceStart scratch buffer produced by the last
 * `fill_edge_buffers` call.  The view is valid until the next Rust allocation
 * (i.e. until the next call to this module that triggers a heap resize).
 * JS must consume it before calling any other wasm function.
 *
 * `len` must not exceed `count * edges_per_object * 3` from the last call.
 * Panics if `len` exceeds the scratch buffer length.
 * @param {number} len
 * @returns {Float32Array}
 */
export function get_scratch_start_view(len) {
    const ret = wasm.get_scratch_start_view(len);
    return ret;
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_81fc77679af83bc6: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(F32)) -> NamedExternref("Float32Array")`.
            const ret = getArrayF32FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./hoverchart_wasm_bg.js": import0,
    };
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let _wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    _wasmModule = module;
    cachedFloat32ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('hoverchart_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
