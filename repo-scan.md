```merfolk
%% hoverchart App.jsx Analysis

%% Locally Defined Components
App{Component: App}

%% Imported Components
Canvas{Component: Canvas}
EffectComposer{Component: EffectComposer}
CustomCamera{Component: CustomCamera}
UIOverlay{Component: UIOverlay}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
ObjectRenderer{Component: ObjectRenderer}
ConnectionsRenderer{Component: ConnectionsRenderer}
CellBoundaryRenderer{Component: CellBoundaryRenderer}
FrameTicker{Component: FrameTicker}

%% Imported Hooks
useRef[Hook: useRef]
useState[Hook: useState]
useCallback[Hook: useCallback]
useEffect[Hook: useEffect]
useMemo[Hook: useMemo]
useAuthState[Hook: useAuthState]
useSpaceManager[Hook: useSpaceManager]
useObjects[Hook: useObjects]
useIndicators[Hook: useIndicators]
useSpatialManager[Hook: useSpatialManager]
useCentralizedBroadcastManager[Hook: useCentralizedBroadcastManager]
useConnections[Hook: useConnections]
useTimeoutManager[Hook: useTimeoutManager]

%% Imported Stores
useUIOverlayStore[[Store: useUIOverlayStore]]
useObjectsStore[[Store: useObjectsStore]]
useConnectionStore[[Store: useConnectionStore]]
usePlaneStore[[Store: usePlaneStore]]
useCubeStore[[Store: useCubeStore]]
useTetrahedronStore[[Store: useTetrahedronStore]]
useDodecahedronStore[[Store: useDodecahedronStore]]

%% External Libraries
SMAA<Library: SMAA>
getCellCoordinates<Library: getCellCoordinates>
handleObjectMove<Library: handleObjectMove>
handleObjectUpdate<Library: handleObjectUpdate>
handleFaceIndicatorClick<Library: handleFaceIndicatorClick>
checkPositionJitter<Library: checkPositionJitter>
throttle<Library: throttle>
signInUser<Library: signInUser>
subscribeToSpatialObjects<Library: subscribeToSpatialObjects>
CELL_SIZE<Library: CELL_SIZE>
setIsInitialLoading<Library: setIsInitialLoading>
db<Library: db>
isEqual<Library: isEqual>
initWebRTC<Library: initWebRTC>
initAnimationSystem<Library: initAnimationSystem>
objectVirtualizer<Library: objectVirtualizer>

%% App uses Imported Components
App --> Canvas : "renders"
App --> EffectComposer : "renders"
App --> CustomCamera : "renders"
App --> UIOverlay : "renders"
App --> RealTimeConnectionUpdater : "renders"
App --> ObjectRenderer : "renders"
App --> ConnectionsRenderer : "renders"
App --> CellBoundaryRenderer : "renders"
App --> FrameTicker : "renders"

%% App uses Imported Hooks
App --> useRef : "uses"
App --> useState : "uses"
App --> useCallback : "uses"
App --> useEffect : "uses"
App --> useMemo : "uses"
App --> useAuthState : "uses"
App --> useSpaceManager : "uses"
App --> useObjects : "uses"
App --> useIndicators : "uses"
App --> useSpatialManager : "uses"
App --> useCentralizedBroadcastManager : "uses"
App --> useConnections : "uses"
App --> useTimeoutManager : "uses"

%% App uses Imported Stores
App --> useUIOverlayStore : "manages"
App --> useObjectsStore : "manages"
App --> useConnectionStore : "manages"
App --> usePlaneStore : "manages"
App --> useCubeStore : "manages"
App --> useTetrahedronStore : "manages"
App --> useDodecahedronStore : "manages"

%% App uses External Libraries
App --> SMAA : "uses"
App --> getCellCoordinates : "uses"
App --> handleObjectMove : "uses"
App --> handleObjectUpdate : "uses"
App --> handleFaceIndicatorClick : "uses"
App --> checkPositionJitter : "uses"
App --> throttle : "uses"
App --> signInUser : "uses"
App --> subscribeToSpatialObjects : "uses"
App --> CELL_SIZE : "uses"
App --> setIsInitialLoading : "uses"
App --> db : "uses"
App --> isEqual : "uses"
App --> initWebRTC : "uses"
App --> initAnimationSystem : "uses"
App --> objectVirtualizer : "uses"

%% Component Functions - App
handleSpatialObjectChange[Function: handleSpatialObjectChange]
checkPositionJitterWithHistory[Function: checkPositionJitterWithHistory]
performInitialObjectFetch[Function: performInitialObjectFetch]
scheduleLoadingComplete[Function: scheduleLoadingComplete]
handleObjectMatrixChanged[Function: handleObjectMatrixChanged]
disableOrbitControls[Function: disableOrbitControls]
enableOrbitControls[Function: enableOrbitControls]
handleLogin[Function: handleLogin]
handleObjectClick[Function: handleObjectClick]
handleObjectMoveCallback[Function: handleObjectMoveCallback]
handleObjectUpdateCallback[Function: handleObjectUpdateCallback]
handleFaceIndicatorClickCallback[Function: handleFaceIndicatorClickCallback]
handleFaceClick[Function: handleFaceClick]
handleCanvasClick[Function: handleCanvasClick]
updateVisibleObjects[Function: updateVisibleObjects]
handleCameraUpdate[Function: handleCameraUpdate]
upgradeQuality[Function: upgradeQuality]
getCanvasSettings[Function: getCanvasSettings]

%% Component function relationships
App --> handleSpatialObjectChange : "handles spatial object changes"
App --> checkPositionJitterWithHistory : "checks position jitter with history"
App --> performInitialObjectFetch : "performs initial object fetch"
App --> scheduleLoadingComplete : "schedules loading complete"
App --> handleObjectMatrixChanged : "handles object matrix changed"
App --> disableOrbitControls : "disables orbit controls"
App --> enableOrbitControls : "enables orbit controls"
App --> handleLogin : "handles login"
App --> handleObjectClick : "handles object click"
App --> handleObjectMoveCallback : "handles object move callback"
App --> handleObjectUpdateCallback : "handles object update callback"
App --> handleFaceIndicatorClickCallback : "handles face indicator click callback"
App --> handleFaceClick : "handles face click"
App --> handleCanvasClick : "handles canvas click"
App --> updateVisibleObjects : "updates visible objects"
App --> handleCameraUpdate : "handles camera update"
App --> upgradeQuality : "upgrades quality"
App --> getCanvasSettings : "gets canvas settings"


```
