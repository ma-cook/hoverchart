# HoverChart Project Architecture - Merfolk Diagram

This Merfolk diagram represents the complete React Three.js HoverChart application architecture showing components, hooks, services, stores, and their complex data flow relationships for collaborative 3D object manipulation.

```merfolk
%% === MAIN APPLICATION COMPONENT ===
App{Component: Main Application}

%% === CORE REACT THREE.JS COMPONENTS ===
Canvas{Component: React Three Fiber Canvas}
CustomCamera{Component: Custom Camera Controller}
EffectComposer{Component: Post-processing Effects}
SMAA{Component: Anti-aliasing Effect}

%% === 3D SCENE COMPONENTS ===
ObjectRenderer{Component: 3D Object Renderer}
ConnectionsRenderer{Component: Connection Lines Renderer}
CellBoundaryRenderer{Component: Spatial Cell Boundaries}
RealTimeConnectionUpdater{Component: Real-time Connection Updates}

%% === 3D OBJECT COMPONENTS ===
Cube{Component: 3D Cube Object}
Tetrahedron{Component: 3D Tetrahedron Object}
Dodecahedron{Component: 3D Dodecahedron Object}
Plane{Component: 3D Plane Object}
TextObject{Component: 3D Text Object}
ModelObject{Component: 3D Model Object}

%% === UI OVERLAY COMPONENTS ===
UIOverlay{Component: User Interface Overlay}
FaceUI{Component: Face Interaction UI}
TextStyleUI{Component: Text Styling Interface}
LineUI{Component: Connection Line UI}
ObjectUI{Component: Object Properties UI}
ColorPicker{Component: Color Selection Interface}

%% === INTERACTION COMPONENTS ===
FaceIndicator{Component: Face Interaction Indicators}
SnapIndicator{Component: Object Snapping Indicators}
TransformControls{Component: 3D Transform Controls}
TextSprite{Component: 3D Text Rendering}
FaceTextInput{Component: Face Text Input}
HeaderInput{Component: Header Text Input}

%% === STREAMING COMPONENTS ===
WebcamStream{Component: Webcam Video Stream}
ScreenShareStream{Component: Screen Share Stream}

%% === CUSTOM HOOKS (State Management) ===
useAuthState[Function: Authentication State Hook]
useSpaceManager[Function: Space Management Hook]
useObjects[Function: Object Management Hook]
useIndicators[Function: Visual Indicators Hook]
useSpatialManager[Function: Spatial Partitioning Hook]
useCentralizedBroadcastManager[Function: Real-time Broadcasting Hook]
useConnections[Function: Connection Management Hook]

%% === ZUSTAND STORES (Global State) ===
useObjectsStore<Store: Objects Global State>
useConnectionStore<Store: Connections Global State>
usePlaneStore<Store: Plane Objects State>
useCubeStore<Store: Cube Objects State>
useTetrahedronStore<Store: Tetrahedron Objects State>
useDodecahedronStore<Store: Dodecahedron Objects State>
useTextObjectStore<Store: Text Objects State>
useAuthStore<Store: Authentication State>
useIndicatorsStore<Store: Indicators State>
useSpaceManagerStore<Store: Space Management State>
useSpatialManagerStore<Store: Spatial Management State>
useColorPickerStore<Store: Color Picker State>
useWebcamStreamStore<Store: Webcam Stream State>
useScreenShareStore<Store: Screen Share State>
useUIOverlayStore<Store: UI Overlay State>
useTransformControlsStore<Store: Transform Controls State>

%% === SERVICES (Backend Integration) ===
authService<Service: Firebase Authentication>
spatialObjectsService<Service: Spatial Objects Database>
spatialPartitioning<Service: Spatial Cell Management>
connectionsService<Service: Connection Management>
sharingService<Service: Object Sharing>
storageService<Service: File Storage>
presenceService<Service: User Presence>
broadcastManager<Service: Real-time Broadcasting>
centralizedBroadcastManager<Service: Centralized Broadcasting>
webRservice<Service: WebRTC Communication>
screenRecordingService<Service: Screen Recording>

%% === UTILITY MODULES ===
objectUpdateHandlers[Function: Object Update Logic]
faceIndicatorUtils[Function: Face Interaction Utils]
positionUtils[Function: Position Validation Utils]
loadingState[Function: Loading State Management]
objectVirtualization[Function: Performance Optimization]
animationUtils[Function: 3D Animation Utils]
pathfindingUtils[Function: Path Calculation Utils]
connectionUtils[Function: Connection Utilities]
snappingUtils[Function: Object Snapping Utils]
performance[Function: Performance Monitoring]

%% === EXTERNAL LIBRARIES ===
THREE<Library: Three.js 3D Engine>
ReactThreeFiber<Library: React Three Fiber>
ReactThreeDrei<Library: React Three Drei>
Firebase<Library: Firebase Backend>
Zustand<Library: State Management>
Lodash<Library: Utility Functions>
RecordRTC<Library: Media Recording>

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

%% === OBJECT RENDERING ===
ObjectRenderer --> Cube : "renders cubes"
ObjectRenderer --> Tetrahedron : "renders tetrahedrons"
ObjectRenderer --> Dodecahedron : "renders dodecahedrons"
ObjectRenderer --> Plane : "renders planes"
ObjectRenderer --> TextObject : "renders text"
ObjectRenderer --> ModelObject : "renders models"

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
App --> useTextObjectStore : "text state"
App --> useAuthStore : "auth state"
App --> useIndicatorsStore : "indicator state"
App --> useSpaceManagerStore : "space state"
App --> useSpatialManagerStore : "spatial state"

%% === UI COMPONENT INTEGRATION ===
Cube --> FaceUI : "face interactions"
Tetrahedron --> FaceUI : "face interactions"
Dodecahedron --> FaceUI : "face interactions"
Plane --> FaceUI : "face interactions"
FaceUI --> ColorPicker : "color selection"
FaceUI --> TextStyleUI : "text styling"
ConnectionsRenderer --> LineUI : "line styling"

%% === INTERACTION COMPONENTS ===
Cube --> FaceIndicator : "face indicators"
Tetrahedron --> FaceIndicator : "face indicators"
Dodecahedron --> FaceIndicator : "face indicators"
Plane --> FaceIndicator : "face indicators"
App --> TransformControls : "transform objects"
App --> SnapIndicator : "snapping feedback"

%% === TEXT AND INPUT COMPONENTS ===
Cube --> TextSprite : "text rendering"
Tetrahedron --> TextSprite : "text rendering"
Dodecahedron --> TextSprite : "text rendering"
Plane --> TextSprite : "text rendering"
FaceUI --> FaceTextInput : "text input"
ObjectUI --> HeaderInput : "header input"

%% === STREAMING INTEGRATION ===
Plane --> WebcamStream : "webcam display"
Plane --> ScreenShareStream : "screen share"
UIOverlay --> WebcamStream : "webcam controls"
UIOverlay --> ScreenShareStream : "screen controls"

%% === COMPONENT DATA FLOW ===
useAuthState --> App : "user authentication data"
useSpaceManager --> App : "current space information"
useObjects --> ObjectRenderer : "object manipulation"
useIndicators --> ObjectRenderer : "visual indicators"
useSpatialManager --> App : "spatial cell data"
useConnections --> ConnectionsRenderer : "connection data"
useCentralizedBroadcastManager --> App : "broadcast data"

%% === STORE DATA FLOW ===
useObjectsStore --> App : "global object state"
useConnectionStore --> ConnectionsRenderer : "connection state"
usePlaneStore --> Plane : "plane-specific state"
useCubeStore --> Cube : "cube-specific state"
useTetrahedronStore --> Tetrahedron : "tetrahedron-specific state"
useDodecahedronStore --> Dodecahedron : "dodecahedron-specific state"
useTextObjectStore --> TextObject : "text object state"
useAuthStore --> useAuthState : "authentication state"
useIndicatorsStore --> useIndicators : "indicator state"
useSpaceManagerStore --> useSpaceManager : "space state"
useSpatialManagerStore --> useSpatialManager : "spatial state"
useColorPickerStore --> ColorPicker : "color picker state"
useWebcamStreamStore --> WebcamStream : "webcam state"
useScreenShareStore --> ScreenShareStream : "screen share state"
useUIOverlayStore --> UIOverlay : "overlay state"
useTransformControlsStore --> TransformControls : "transform state"

%% === SERVICE INTEGRATION ===
authService --> useAuthState : "authentication logic"
spatialObjectsService --> useSpatialManager : "spatial data"
spatialPartitioning --> useSpatialManager : "cell management"
connectionsService --> useConnections : "connection persistence"
sharingService --> App : "object sharing"
storageService --> App : "file management"
presenceService --> App : "user presence"
broadcastManager --> useCentralizedBroadcastManager : "broadcasting"
centralizedBroadcastManager --> useCentralizedBroadcastManager : "centralized sync"
webRservice --> App : "WebRTC communication"
screenRecordingService --> UIOverlay : "screen recording"

%% === UTILITY INTEGRATION ===
objectUpdateHandlers --> useObjects : "update logic"
faceIndicatorUtils --> ObjectRenderer : "face interactions"
positionUtils --> App : "position validation"
loadingState --> App : "loading management"
objectVirtualization --> App : "performance optimization"
animationUtils --> App : "animation system"
pathfindingUtils --> ConnectionsRenderer : "connection paths"
connectionUtils --> ConnectionsRenderer : "connection utilities"
snappingUtils --> App : "object snapping"
performance --> App : "performance monitoring"

%% === EXTERNAL LIBRARY INTEGRATION ===
THREE --> Canvas : "3D rendering engine"
THREE --> ObjectRenderer : "3D object creation"
THREE --> ConnectionsRenderer : "3D line rendering"
ReactThreeFiber --> Canvas : "React integration"
ReactThreeDrei --> CustomCamera : "camera controls"
ReactThreeDrei --> TransformControls : "transform controls"
Firebase --> authService : "backend authentication"
Firebase --> spatialObjectsService : "database operations"
Firebase --> connectionsService : "connection storage"
Firebase --> storageService : "file storage"
Zustand --> useObjectsStore : "state management"
Zustand --> useConnectionStore : "connection state"
Lodash --> App : "utility functions"
RecordRTC --> screenRecordingService : "media recording"

%% === EVENT FLOW ===
UIOverlay --> App : "user interactions"
ObjectRenderer --> App : "object manipulations"
ConnectionsRenderer --> App : "connection interactions"
CustomCamera --> App : "camera state changes"
FaceUI --> App : "face interactions"
TextStyleUI --> App : "text style changes"
LineUI --> App : "line style changes"
ObjectUI --> App : "object property changes"
ColorPicker --> App : "color selections"

%% === REAL-TIME SYNCHRONIZATION ===
centralizedBroadcastManager --> spatialObjectsService : "object sync"
broadcastManager --> connectionsService : "connection sync"
webRservice --> presenceService : "presence sync"
RealTimeConnectionUpdater --> centralizedBroadcastManager : "real-time updates"

%% === PERFORMANCE OPTIMIZATION ===
objectVirtualization --> ObjectRenderer : "LOD optimization"
App --> ObjectRenderer : "visibility culling"
useSpatialManager --> App : "cell-based loading"
performance --> App : "performance tracking"
spatialPartitioning --> spatialObjectsService : "spatial indexing"

%% === STREAMING AND MEDIA ===
WebcamStream --> useWebcamStreamStore : "webcam state"
ScreenShareStream --> useScreenShareStore : "screen share state"
screenRecordingService --> UIOverlay : "recording controls"
webRservice --> WebcamStream : "WebRTC streaming"
webRservice --> ScreenShareStream : "screen sharing"

%% === FACE CONNECTIONS (3D OBJECT SPECIFIC) ===
Cube@front --> FaceIndicator@target : "face interaction"
Tetrahedron@bottom --> FaceIndicator@target : "face interaction"
Dodecahedron@face_0 --> FaceIndicator@target : "face interaction"
Plane@center --> FaceIndicator@target : "face interaction"

%% === INHERITANCE AND DEPENDENCIES ===
ObjectRenderer == Cube : "component inheritance"
ObjectRenderer == Tetrahedron : "component inheritance"
ObjectRenderer == Dodecahedron : "component inheritance"
ObjectRenderer == Plane : "component inheritance"
ObjectRenderer == TextObject : "component inheritance"
ObjectRenderer == ModelObject : "component inheritance"

%% === CONTROL FLOW ===
App -.-> useAuthState : "authentication check"
App -.-> useSpaceManager : "space validation"
App -.-> useSpatialManager : "spatial loading"
ObjectRenderer -.-> useObjects : "object creation"
ConnectionsRenderer -.-> useConnections : "connection creation"
FaceUI -.-> ColorPicker : "color picker open"
UIOverlay -.-> App : "object creation trigger"
```

## Architecture Overview

This Merfolk diagram illustrates the comprehensive React Three.js HoverChart application architecture with the following key patterns:

### **Component Hierarchy**

- **App**: Main application container managing state coordination and global systems
- **Canvas**: React Three Fiber rendering context with camera and post-processing
- **Scene Components**: 3D object rendering, connections, spatial boundaries, and real-time updates
- **3D Objects**: Cube, Tetrahedron, Dodecahedron, Plane, Text, and Model objects
- **UI Components**: Face interactions, text styling, line controls, and overlays
- **Interaction**: Face indicators, transform controls, snap indicators, and text inputs
- **Streaming**: Webcam and screen share integration

### **State Management Architecture**

- **Custom Hooks**: Encapsulate complex state logic and side effects for authentication, space management, objects, indicators, spatial management, broadcasting, and connections
- **Zustand Stores**: Global state management for objects, connections, individual object types, auth, UI components, and streaming
- **Local State**: Component-specific state using React hooks for UI interactions

### **Service Layer**

- **Authentication**: Firebase-based user management and authorization
- **Spatial Database**: Real-time spatial object synchronization with cell-based partitioning
- **Connection Management**: Persistent connection storage and real-time updates
- **WebRTC**: Peer-to-peer communication for streaming and presence
- **Broadcasting**: Centralized and decentralized real-time data synchronization
- **Storage**: File upload and management for 3D models and media
- **Recording**: Screen recording and media capture capabilities

### **Data Flow Patterns**

- **Reactive Updates**: Real-time data synchronization across all connected clients
- **Event-driven Architecture**: User interactions trigger state changes through hooks
- **Spatial Partitioning**: Performance optimization through cell-based spatial indexing
- **Virtualization**: LOD (Level of Detail) and culling for complex 3D scenes
- **Broadcasting**: Multi-tier real-time synchronization system

### **Key Features Represented**

- **Multi-user Collaborative 3D Environment**: Real-time object manipulation with conflict resolution
- **Complex 3D Object Types**: Cubes, tetrahedrons, dodecahedrons, planes, text objects, and 3D models
- **Advanced Connection System**: Visual connections between objects with styling and text
- **Face-based Interactions**: Individual face manipulation on 3D objects
- **Streaming Integration**: Webcam and screen sharing capabilities
- **Spatial Optimization**: Cell-based spatial partitioning for performance
- **Real-time Synchronization**: Multiple broadcasting systems for different data types
- **Advanced UI Systems**: Context-aware face UIs, text styling, and transform controls
- **Authentication and Spaces**: User management with space-based collaboration
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Media Recording**: Screen recording and media capture functionality

### **Technical Architecture Patterns**

- **Component Composition**: Modular React components with clear separation of concerns
- **Hook-based State Management**: Custom hooks for encapsulating complex state logic
- **Store Pattern**: Zustand stores for global state with selective subscriptions
- **Service Layer Pattern**: Dedicated services for external system integration
- **Observer Pattern**: Real-time updates through Firebase and WebRTC
- **Spatial Indexing**: Efficient 3D space management through cell-based partitioning
- **Event Sourcing**: Real-time collaborative updates with conflict resolution
- **Dependency Injection**: Services and utilities injected through React context and props