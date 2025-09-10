# App.jsx Component Architecture - Merfolk Diagram

This Merfolk diagram represents the React Three.js application architecture showing the main component, hooks, services, stores, and their data flow relationships.

```merfolk
%% === MAIN APPLICATION COMPONENT ===
App[Component: Main Application]

%% === CORE REACT THREE.JS COMPONENTS ===
Canvas[Component: React Three Fiber Canvas]
CustomCamera[Component: Custom Camera Controller]
EffectComposer[Component: Post-processing Effects]
SMAA[Component: Anti-aliasing Effect]

%% === 3D SCENE COMPONENTS ===
ObjectRenderer[Component: 3D Object Renderer]
ConnectionsRenderer[Component: Connection Lines Renderer]
CellBoundaryRenderer[Component: Spatial Cell Boundaries]
RealTimeConnectionUpdater[Component: Real-time Connection Updates]

%% === UI OVERLAY COMPONENTS ===
UIOverlay[Component: User Interface Overlay]

%% === CUSTOM HOOKS (State Management) ===
useAuthState{Function: Authentication State Hook}
useSpaceManager{Function: Space Management Hook}
useObjects{Function: Object Management Hook}
useIndicators{Function: Visual Indicators Hook}
useSpatialManager{Function: Spatial Partitioning Hook}
useCentralizedBroadcastManager{Function: Real-time Broadcasting Hook}
useConnections{Function: Connection Management Hook}

%% === ZUSTAND STORES (Global State) ===
useObjectsStore[[Store: Objects Global State]]
useConnectionStore[[Store: Connections Global State]]
usePlaneStore[[Store: Plane Objects State]]
useCubeStore[[Store: Cube Objects State]]
useTetrahedronStore[[Store: Tetrahedron Objects State]]
useDodecahedronStore[[Store: Dodecahedron Objects State]]

%% === SERVICES (Backend Integration) ===
authService((Service: Firebase Authentication))
spatialObjectsService((Service: Spatial Objects Database))
spatialPartitioning((Service: Spatial Cell Management))
webRTCService((Service: Real-time Communication))
animationSystem((Service: 3D Animation System))

%% === UTILITY MODULES ===
objectUpdateHandlers{Function: Object Update Logic}
faceIndicatorUtils{Function: Face Interaction Utils}
positionUtils{Function: Position Validation Utils}
loadingState{Function: Loading State Management}
objectVirtualization{Function: Performance Optimization}

%% === EXTERNAL LIBRARIES ===
THREE<Library: Three.js 3D Engine>
Firebase<Library: Firebase Backend>
Lodash<Library: Utility Functions>

%% === MAIN APPLICATION FLOW ===
App --> Canvas : "renders"
App --> UIOverlay : "renders"
Canvas --> CustomCamera : "contains"
Canvas --> EffectComposer : "contains"
EffectComposer --> SMAA : "contains"

%% === 3D SCENE RENDERING ===
Canvas --> ObjectRenderer : "renders objects"
Canvas --> ConnectionsRenderer : "renders connections"
Canvas --> CellBoundaryRenderer : "renders boundaries"
Canvas --> RealTimeConnectionUpdater : "manages updates"

%% === HOOK INTEGRATION ===
App --> useAuthState : "authentication"
App --> useSpaceManager : "space management"
App --> useObjects : "object management"
App --> useIndicators : "visual indicators"
App --> useSpatialManager : "spatial partitioning"
App --> useCentralizedBroadcastManager : "broadcasting"
App --> useConnections : "connection management"

%% === STORE INTEGRATION ===
App --> useObjectsStore : "object state"
App --> useConnectionStore : "connection state"
App --> usePlaneStore : "plane state"
App --> useCubeStore : "cube state"
App --> useTetrahedronStore : "tetrahedron state"
App --> useDodecahedronStore : "dodecahedron state"

%% === COMPONENT DATA FLOW ===
useAuthState --> App : "user authentication data"
useSpaceManager --> App : "current space information"
useObjects --> ObjectRenderer : "object manipulation"
useIndicators --> ObjectRenderer : "visual indicators"
useSpatialManager --> App : "spatial cell data"
useConnections --> ConnectionsRenderer : "connection data"

%% === STORE DATA FLOW ===
useObjectsStore --> App : "global object state"
useConnectionStore --> ConnectionsRenderer : "connection state"
usePlaneStore --> ObjectRenderer : "plane-specific state"
useCubeStore --> ObjectRenderer : "cube-specific state"
useTetrahedronStore --> ObjectRenderer : "tetrahedron-specific state"
useDodecahedronStore --> ObjectRenderer : "dodecahedron-specific state"

%% === SERVICE INTEGRATION ===
authService --> useAuthState : "authentication logic"
spatialObjectsService --> useSpatialManager : "spatial data"
spatialPartitioning --> useSpatialManager : "cell management"
webRTCService --> useCentralizedBroadcastManager : "real-time sync"
animationSystem --> App : "animation initialization"

%% === UTILITY INTEGRATION ===
objectUpdateHandlers --> useObjects : "update logic"
faceIndicatorUtils --> ObjectRenderer : "face interactions"
positionUtils --> App : "position validation"
loadingState --> App : "loading management"
objectVirtualization --> App : "performance optimization"

%% === EXTERNAL LIBRARY INTEGRATION ===
THREE --> Canvas : "3D rendering engine"
THREE --> ObjectRenderer : "3D object creation"
THREE --> ConnectionsRenderer : "3D line rendering"
Firebase --> authService : "backend authentication"
Firebase --> spatialObjectsService : "database operations"
Lodash --> App : "utility functions"

%% === EVENT FLOW ===
UIOverlay --> App : "user interactions"
ObjectRenderer --> App : "object manipulations"
ConnectionsRenderer --> App : "connection interactions"
CustomCamera --> App : "camera state changes"

%% === PERFORMANCE OPTIMIZATION ===
objectVirtualization --> ObjectRenderer : "LOD optimization"
App --> ObjectRenderer : "visibility culling"
useSpatialManager --> App : "cell-based loading"
```

## Architecture Overview

This Merfolk diagram illustrates the complex React Three.js application architecture with the following key patterns:

### **Component Hierarchy**

- **App**: Main application container managing state and coordination
- **Canvas**: React Three Fiber rendering context
- **Scene Components**: 3D object rendering, connections, and spatial boundaries
- **UI Overlay**: 2D user interface layer

### **State Management Architecture**

- **Custom Hooks**: Encapsulate complex state logic and side effects
- **Zustand Stores**: Global state management for different object types
- **Local State**: Component-specific state using React hooks

### **Service Layer**

- **Authentication**: Firebase-based user management
- **Spatial Database**: Real-time spatial object synchronization
- **WebRTC**: Peer-to-peer communication
- **Animation**: 3D animation and transition management

### **Data Flow Patterns**

- **Reactive Updates**: Real-time data synchronization
- **Event-driven Architecture**: User interactions trigger state changes
- **Spatial Partitioning**: Performance optimization through cell-based loading
- **Virtualization**: LOD (Level of Detail) for complex 3D scenes

### **Key Features Represented**

- Multi-user collaborative 3D environment
- Real-time object synchronization
- Spatial partitioning for performance
- Complex 3D object types (planes, cubes, tetrahedrons, dodecahedrons)
- Connection management between objects
- Authentication and space management
- Mobile optimization and performance tuning
