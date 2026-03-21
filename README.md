Volscape

Hoverchart(Volscape) is a collaborative 3D code architecture visualization tool. It scans a GitHub repository, analyses its source code via AST parsing, and generates an interactive 3D diagram where components, hooks, services, stores, utilities, workers, and libraries are represented as geometric objects — dodecahedrons, cubes, and tetrahedrons — with connections drawn between them to show data flow, containment, and dependency relationships.

Users authenticate with GitHub, select a repository, and the app produces a explorable 3D scene backed by Firebase for real-time collaboration and persistent storage.

## Scanning Service

The scanning service connects to the GitHub API, recursively fetches every supported source file, parses each one, extracts architectural elements and their relationships, and emits a Merfolk diagram that the layout engine turns into positioned 3D objects.

### Runtime Website Scanner

In addition to static repository scanning, Hoverchart can scan a **live website by URL** and render its runtime behaviour as a 3D Merfolk diagram.

Enter a public `https://` URL in the **Scan Live Website** panel, choose a capture duration (5 – 30 seconds), and press **🌐 Scan Runtime**. The app:

1. Validates the URL client-side (blocks `localhost`, private IP ranges, and non-HTTP protocols for SSRF prevention)
2. Invokes the `scanWebsiteRuntime` Firebase Cloud Function, which:
   - Launches a headless Chromium instance via **Puppeteer**
   - Navigates to the target URL
   - Uses the **Chrome DevTools Protocol (CDP)** to capture:
     - **Network requests** — XHR/fetch calls, their HTTP method and path
     - **CPU profile** — function call tree sampled at 100 ms intervals
     - **Console messages** — for framework signals
   - Detects the frontend framework at runtime (`React`, `Next.js`, `Vue`, `Angular`, `Svelte`) by inspecting global DevTools hooks
   - Walks the **React fiber tree** (when React is detected) to extract component names, hook usage, and state store presence
   - Falls back to DOM custom-element enumeration for non-framework sites
3. Maps the captured data to Merfolk node types:
   - UI Components → `{Component: name}` (Dodecahedron)
   - Event handlers / profiled functions → `[Function: name]` (Cube)
   - API/fetch calls → `((Service: METHOD /path))` (Tetrahedron)
   - State stores (Redux, Zustand, Vuex, MobX) → `[[Store: name]]` (Cube)
   - React hooks → `[Hook: name]` (Cube)
   - External script libraries → `<Library: name>` (Cube)
4. Generates Merfolk markdown and feeds it into the same layout/3D pipeline used by the static scanner
5. Uploads the markdown to Firebase Storage and persists it to the current space

**Security constraints:** The Cloud Function blocks `localhost`, `127.0.0.1`, `0.0.0.0`, all RFC-1918 private ranges (`10.x`, `172.16-31.x`, `192.168.x`), and link-local addresses. It enforces a hard 30-second navigation timeout and a 2-minute Cloud Function timeout. A maximum of 3 concurrent headless browser instances are allowed.


### Supported Languages

| Language | Parser | What It Extracts |
|---|---|---|
| **JavaScript** (.js) | Babel AST (JSX/TS plugins, error recovery) | Components, hooks, services, stores, utilities, workers, libraries, function calls, hook returns, store state/actions, props |
| **JSX** (.jsx) | Babel AST | Same as JS plus JSX element relationships and component nesting |
| **TypeScript** (.ts, .tsx) | Babel AST (TypeScript plugin) | Same as JS/JSX with type-aware extraction |
| **Python** (.py) | Regex-based source analysis | Classes, top-level functions, import relationships, module dependencies |
| **Shader files** (.glsl, .wgsl, .hlsl, .vert, .frag, .comp) | File-level grouping | Shader files grouped into a shader container |

### Supported Frameworks & Project Types

| Framework / Type | Detection Signal | Special Handling |
|---|---|---|
| **React** | `react` in package.json dependencies | Full component hierarchy — parent/child nesting via JSX, hook usage tracking, store subscriptions, prop passing |
| **Next.js** | `next` in package.json dependencies | Route hierarchy from `app/` and `pages/` directories, layout/page/loading/error file detection, API route grouping |
| **Vanilla JS/TS** | No React or Next.js dependency detected | File-as-module traversal, inter-module import tracking, automatic filtering of example/test/debug directories |
| **Python** | `.py` files + `setup.py`, `pyproject.toml`, `requirements.txt`, `Pipfile`, or `manage.py` | Django/Flask folder conventions (models, views, controllers, serializers, tasks, middleware, migrations) |

### Folder Convention Recognition

The scanner classifies files by path patterns:

- `components/` → Components
- `hooks/` → Hooks  
- `services/` → Services
- `stores/` → Stores
- `utils/` → Utilities
- `workers/` or `*Worker.js` → Workers
- `shaders/` or shader extensions → Shaders
- `functions/`, `api/`, `server/`, `backend/`, `lambda/`, `routes/` → Backend services
- Python: `models/`, `views/`, `templates/`, `controllers/`, `handlers/`, `middleware/`, `config/`, `settings/`, `serializers/`, `schemas/`, `tasks/`, `celery/`, `commands/`, `management/`

### Incremental Rescan

After an initial scan the app records the commit SHA. When the rescan button is pressed:

1. Fetches the latest commit SHA (single API call)
2. If unchanged → "No changes detected" with no further API calls
3. If changed → uses the GitHub Compare API to get only the files that were added, modified, or removed since the last scan
4. Generates merfolk entries for only the changed files
5. Merges new nodes and connections into the existing diagram without duplicating existing elements
6. Processes only the new section to create additional 3D objects

## Performance Optimisations

### Rendering

- **Instanced edge rendering** — `GlobalCubeEdgesRenderer`, `GlobalDodecahedronEdgesRenderer`, and `GlobalTetrahedronEdgesRenderer` batch all wireframe edges of each geometry type into a single draw call with frustum culling
- **Instanced text atlas** — `InstancedAtlasText` renders all text labels via a shared texture atlas (4096×4096 pages, up to 32 pages) using custom shaders and instanced meshes instead of individual sprite objects
- **Batched connection lines** — `BatchedConnectionLines` and `BatchedCurvedLines` batch all connection rendering with reusable geometry objects allocated at module level to avoid GC pressure
- **Level of Detail (LOD)** — `LODManager` throttles LOD updates at 100ms intervals, switches geometry complexity based on camera distance, and uses a spatial index worker for distance calculations
- **BVH raycasting** — `BVHIntegration` builds a Bounding Volume Hierarchy for fast mouse picking instead of brute-force intersection testing
- **Object pooling** — `PooledLine` reuses Line2 geometries and materials via a line pool hook
- **Global frame ticker** — `FrameTicker` provides a singleton frame counter so components share a single animation loop reference instead of each calling `Date.now()`
- **Frustum culling** — Edge renderers skip culling math when object count is below 50, and reuse frustum/matrix objects across frames

### Web Workers (Comlink)

All CPU-intensive work is offloaded to dedicated Web Workers communicating via Comlink proxies:

| Worker | Responsibility |
|---|---|
| `markdownLayoutWorker` | Merfolk parsing, hierarchy building, node positioning, collision resolution |
| `pathfindingWorker` | Connection path computation, line–object intersection testing, curved-path generation |
| `spatialIndexWorker` | LOD distance queries, frustum culling of connections, spatial containment checks |
| `textAtlasWorker` | Text rendering into OffscreenCanvas atlas pages |

Each worker has a matching client module that provides a lazy singleton proxy with `get*Worker()` / `terminate*Worker()`.

### Spatial Partitioning

Two spatial systems work together:

1. **Cell-based loading** — The 3D space is divided into cells (6667 world units each). Only a 3×3 horizontal grid of cells around the camera is loaded at any time. Objects and connections are loaded/unloaded as the camera moves, with hysteresis at cell boundaries to prevent thrashing.
2. **Streamlined spatial index** — A lightweight local spatial index optimised for 100+ objects with minimal overhead, used for runtime queries like LOD and containment.

### Data Pipeline

- **Parallel file fetching** — Repository files are fetched from the GitHub API in parallel batches of 10
- **Bulk Firebase saves** — Objects and connections are saved via a Cloud Function (`bulkimport`) for payloads under 9 MB, with automatic fallback to client-side batch writes (batches of 20 per cell)
- **Worker fallback** — Layout computation attempts the Web Worker first and falls back to main-thread execution on failure
- **Incremental rescan** — Uses the GitHub Compare API so only changed files are fetched and analysed instead of the entire repository

## Tech Stack

- **UI**: React 18 with JSX
- **3D Rendering**: React Three Fiber + Three.js + @react-three/drei
- **State Management**: Zustand
- **Backend**: Firebase (Firestore, Auth, Storage, Realtime Database, Cloud Functions)
- **Build**: Vite
- **AST Parsing**: Babel with JSX/TypeScript plugins
- **Merfolk Parsing**: `3d-ast-generator` package
- **Worker Communication**: Comlink
