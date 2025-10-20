# Hoverchart Project Architecture

This document provides a comprehensive architectural overview of the Hoverchart project using Merfolk diagram syntax.

```merfolk
%% ========================================
%% MAIN APPLICATION LAYER
%% ========================================

App{Component: App}
MainEntry{Component: main.jsx}
MainEntry --> App : "renders"

%% ========================================
%% CORE COMPONENTS
%% ========================================

CustomCamera{Component: CustomCamera}
UIOverlay{Component: UIOverlay}
ObjectRenderer{Component: ObjectRenderer}
ConnectionsRenderer{Component: ConnectionsRenderer}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
CellBoundaryRenderer{Component: CellBoundaryRenderer}

App --> CustomCamera : "3D camera"
App --> UIOverlay : "user interface"
App --> ObjectRenderer : "renders objects"
App --> ConnectionsRenderer : "renders connections"
App --> RealTimeConnectionUpdater : "real-time updates"
App --> CellBoundaryRenderer : "spatial boundaries"

%% ========================================
%% 3D OBJECT COMPONENTS
%% ========================================

Cube{Component: Cube}
Dodecahedron{Component: Dodecahedron}
Tetrahedron{Component: Tetrahedron}
Plane{Component: Plane}
TextObject{Component: TextObject}
ModelObject{Component: ModelObject}

ObjectRenderer --> Cube : "renders"
ObjectRenderer --> Dodecahedron : "renders"
ObjectRenderer --> Tetrahedron : "renders"
ObjectRenderer --> Plane : "renders"
ObjectRenderer --> TextObject : "renders"
ObjectRenderer --> ModelObject : "renders"

%% ========================================
%% UI COMPONENTS
%% ========================================

ObjectUI{Component: ObjectUI}
FaceUI{Component: FaceUI}
LineUI{Component: LineUI}
ColorPicker{Component: ColorPicker}
HeaderInput{Component: HeaderInput}
FaceTextInput{Component: FaceTextInput}
TextStyleUI{Component: TextStyleUI}
TextStyleUIContainer{Component: TextStyleUIContainer}
TextObjectUI{Component: TextObjectUI}
TransformControls{Component: TransformControls}

Cube --> ObjectUI : "displays"
Cube --> FaceUI : "face controls"
Cube --> HeaderInput : "header editing"
Cube --> FaceTextInput : "face text editing"
Cube --> TransformControls : "transform"
Dodecahedron --> HeaderInput : "header editing"
Dodecahedron --> FaceTextInput : "face text editing"
Tetrahedron --> HeaderInput : "header editing"
Tetrahedron --> FaceTextInput : "face text editing"
Plane --> HeaderInput : "header editing"
Plane --> FaceTextInput : "face text editing"
TextObject --> TextObjectUI : "text controls"
ConnectionsRenderer --> LineUI : "connection controls"
ConnectionsRenderer --> HeaderInput : "connection header"
UIOverlay --> ColorPicker : "color selection"

%% ========================================
%% VISUAL COMPONENTS
%% ========================================

FaceIndicator{Component: FaceIndicator}
TextSprite{Component: TextSprite}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
PooledLine{Component: PooledLine}
FrameTicker{Component: FrameTicker}
SnapIndicator{Component: SnapIndicator}
SnapLineIndicator{Component: SnapLineIndicator}
ResizeArrows{Component: ResizeArrows}
ResizeArrow2D{Component: ResizeArrow2D}
WhitePlane{Component: WhitePlane}

Cube --> FaceIndicator : "face markers"
Cube --> TextSprite : "text display"
Dodecahedron --> FaceIndicator : "face markers"
Tetrahedron --> FaceIndicator : "face markers"
Plane --> FaceIndicator : "face marker"
TextObject --> FaceIndicator : "face marker"
ConnectionsRenderer --> AnimatedConnectionLine : "animated lines"
ConnectionsRenderer --> PooledLine : "pooled rendering"
FrameTicker --> AnimatedConnectionLine : "tick"
Cube --> SnapIndicator : "snap feedback"
Cube --> SnapLineIndicator : "snap guides"

%% ========================================
%% COLLABORATION COMPONENTS
%% ========================================

PublicSpaceView{Component: PublicSpaceView}
PublicConnectionsRenderer{Component: PublicConnectionsRenderer}
ScreenShareStream{Component: ScreenShareStream}
WebcamStream{Component: WebcamStream}

App --> PublicSpaceView : "shared spaces"
PublicSpaceView --> PublicConnectionsRenderer : "shared connections"
UIOverlay --> ScreenShareStream : "screen sharing"
UIOverlay --> WebcamStream : "video stream"

%% ========================================
%% SPECIALIZED COMPONENTS
%% ========================================

BVHIntegration{Component: BVHIntegration}

App --> BVHIntegration : "3D optimization"

%% ========================================
%% STATE MANAGEMENT STORES
%% ========================================

objectsStore[[Store: objectsStore]]
connectionStore[[Store: connectionStore]]
cubeStore[[Store: cubeStore]]
dodecahedronStore[[Store: dodecahedronStore]]
tetrahedronStore[[Store: tetrahedronStore]]
planeStore[[Store: planeStore]]
textObjectStore[[Store: textObjectStore]]
faceStore[[Store: faceStore]]
faceIndicatorStore[[Store: faceIndicatorStore]]
transformControlsStore[[Store: transformControlsStore]]
colorPickerStore[[Store: colorPickerStore]]
textInputStore[[Store: textInputStore]]
uiOverlayStore[[Store: uiOverlayStore]]
authStore[[Store: authStore]]
spaceManagerStore[[Store: spaceManagerStore]]
spatialManagerStore[[Store: spatialManagerStore]]
indicatorsStore[[Store: indicatorsStore]]
publicSpaceStore[[Store: publicSpaceStore]]
screenShareStore[[Store: screenShareStore]]
webcamStreamStore[[Store: webcamStreamStore]]
animatedConnectionLineStore[[Store: animatedConnectionLineStore]]

App --> objectsStore : "manages"
App --> connectionStore : "manages"
App --> authStore : "manages"
App --> spaceManagerStore : "manages"
App --> spatialManagerStore : "manages"

Cube --> cubeStore : "state"
Dodecahedron --> dodecahedronStore : "state"
Tetrahedron --> tetrahedronStore : "state"
Plane --> planeStore : "state"
TextObject --> textObjectStore : "state"

ObjectUI --> transformControlsStore : "transform state"
ColorPicker --> colorPickerStore : "color state"
UIOverlay --> uiOverlayStore : "UI state"
FaceIndicator --> faceIndicatorStore : "indicator state"

%% ========================================
%% CUSTOM HOOKS
%% ========================================

useAuth[Function: useAuth]
useAuthState[Function: useAuthState]
useObjects[Function: useObjects]
useConnections[Function: useConnections]
useIndicators[Function: useIndicators]
useSpaceManager[Function: useSpaceManager]
useSpatialManager[Function: useSpatialManager]
useCentralizedBroadcastManager[Function: useCentralizedBroadcastManager]
useLinePool[Function: useLinePool]
useDebouncedUpdate[Function: useDebouncedUpdate]
useGlobalClickHandler[Function: useGlobalClickHandler]
useTextureUpdater[Function: useTextureUpdater]
useTimeoutManager[Function: useTimeoutManager]
handleMarkdownUpload[Function: handleMarkdownUpload]
handleMarkdownFileSelect[Function: handleMarkdownFileSelect]
markdownFileInputRef[Function: markdownFileInputRef]
isProcessingMarkdown[Function: isProcessingMarkdown]

App --> useAuthState : "uses"
App --> useObjects : "uses"
App --> useConnections : "uses"
App --> useIndicators : "uses"
App --> useSpaceManager : "uses"
App --> useSpatialManager : "uses"
App --> useCentralizedBroadcastManager : "uses"
App --> useTimeoutManager : "uses"

ConnectionsRenderer --> useLinePool : "uses"
Cube --> useDebouncedUpdate : "uses"
Cube --> useGlobalClickHandler : "uses"
Cube --> useTextureUpdater : "uses"

UIOverlay --> handleMarkdownUpload : "uses"
UIOverlay --> handleMarkdownFileSelect : "uses"
UIOverlay --> markdownFileInputRef : "uses"
UIOverlay --> isProcessingMarkdown : "uses"

%% ========================================
%% FIREBASE & EXTERNAL SERVICES
%% ========================================

Firebase((Service: Firebase))
ReactThreeFiber((Service: React Three Fiber))
ThreeJS((Service: Three.js))
Zustand((Service: Zustand))
ThreeMeshBVH((Service: three-mesh-bvh))
AstGenerator((Service: 3d-ast-generator))

<Library: RecordRTC>

App --> Firebase : "cloud backend"
App --> ReactThreeFiber : "3D rendering"
ReactThreeFiber --> ThreeJS : "uses"
objectsStore --> Zustand : "state management"
BVHIntegration --> ThreeMeshBVH : "spatial optimization"

%% ========================================
%% CORE SERVICES
%% ========================================

authService((Service: authService))
spacesService((Service: spacesService))
connectionsService((Service: connectionsService))
spatialObjectsService((Service: spatialObjectsService))
markdownDiagramService((Service: markdownDiagramService))
spatialPartitioning((Service: spatialPartitioning))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
sharedSpacesService((Service: sharedSpacesService))
sharingService((Service: sharingService))
storageService((Service: storageService))
presenceService((Service: presenceService))
webRservice((Service: webRservice))
screenRecordingService((Service: screenRecordingService))
centralizedBroadcastManager((Service: centralizedBroadcastManager))
globalSubscriptionManager((Service: globalSubscriptionManager))
resourceCleanupService((Service: resourceCleanupService))
connectionPositionResolver((Service: connectionPositionResolver))
unifiedCacheManager((Service: unifiedCacheManager))
globalOptimizationCoordinator((Service: globalOptimizationCoordinator))

App --> authService : "authentication"
App --> spacesService : "space management"
App --> connectionsService : "connections"
App --> spatialObjectsService : "spatial queries"
App --> spatialPartitioning : "spatial indexing"
App --> centralizedBroadcastManager : "broadcasting"
App --> globalSubscriptionManager : "subscriptions"
App --> resourceCleanupService : "cleanup"

UIOverlay --> markdownDiagramService : "Merfolk diagrams"
markdownDiagramService --> AstGenerator : "uses"

PublicSpaceView --> sharedSpacesService : "sharing"
PublicSpaceView --> sharingService : "collaboration"

ScreenShareStream --> screenRecordingService : "recording"
WebcamStream --> webRservice : "WebRTC"

ConnectionsRenderer --> connectionPositionResolver : "positioning"
spatialPartitioning --> unifiedCacheManager : "caching"

authService --> Firebase : "auth API"
spacesService --> Firebase : "Firestore API"
connectionsService --> Firebase : "Firestore API"
spatialObjectsService --> Firebase : "Firestore API"
storageService --> Firebase : "Storage API"

%% ========================================
%% UTILITY MODULES
%% ========================================

connectionUtils[Function: connectionUtils]
faceIndicatorUtils[Function: faceIndicatorUtils]
facePositionUtils[Function: facePositionUtils]
frameCounter[Function: frameCounter]
positionUtils[Function: positionUtils]
pathfindingUtils[Function: pathfindingUtils]
snappingUtils[Function: snappingUtils]
objectUpdateHandlers[Function: objectUpdateHandlers]
cubeHelpers[Function: cubeHelpers]
unifiedMathUtils[Function: unifiedMathUtils]
unifiedDebugUtils[Function: unifiedDebugUtils]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
unifiedValidationUtils[Function: unifiedValidationUtils]
animationUtils[Function: animationUtils]
loadingState[Function: loadingState]
textureLoader[Function: textureLoader]
linePoolManager[Function: linePoolManager]
streamlinedSpatialIndex[Function: streamlinedSpatialIndex]
objectVirtualization[Function: objectVirtualization]
bvhRaycasting[Function: bvhRaycasting]
debugUtils[Function: debugUtils]
storeValidation[Function: storeValidation]
storeUtils[Function: storeUtils]
initializeProcessor[Function: initializeProcessor]
getCameraBasedPosition[Function: getCameraBasedPosition]
buildHierarchicalRelationships[Function: buildHierarchicalRelationships]
getObjectTypeForNode[Function: getObjectTypeForNode]
calculateDodecahedronScale[Function: calculateDodecahedronScale]
calculateMaxChildSize[Function: calculateMaxChildSize]
countNestedChildren[Function: countNestedChildren]
calculateNodePosition[Function: calculateNodePosition]
getCornerPositions[Function: getCornerPositions]
positionNodeHierarchy[Function: positionNodeHierarchy]
createObjectsFromDiagram[Function: createObjectsFromDiagram]
createConnectionsFromDiagram[Function: createConnectionsFromDiagram]
saveConnections[Function: saveConnections]
processMarkdownFile[Function: processMarkdownFile]

%% Component Functions - Cube
cubePosition[Function: cubePosition]
cubeScale[Function: cubeScale]
cubeColor[Function: cubeColor]
cubeFaceColors[Function: cubeFaceColors]
cubeFaceTexts[Function: cubeFaceTexts]
cubeHeaderText[Function: cubeHeaderText]
cubeTextStyle[Function: cubeTextStyle]
cubeFaceTextStyles[Function: cubeFaceTextStyles]
cubeIsIndicatorConnected[Function: cubeIsIndicatorConnected]
cubeIsIndicatorActive[Function: cubeIsIndicatorActive]
cubeGetUIPositions[Function: cubeGetUIPositions]
cubeShouldShowIndicator[Function: cubeShouldShowIndicator]
cubeGetFaceTextOffset[Function: cubeGetFaceTextOffset]
cubeGetFaceMaterial[Function: cubeGetFaceMaterial]
cubeHandleSceneClick[Function: cubeHandleSceneClick]
cubeUpdateDatabase[Function: cubeUpdateDatabase]
cubeOnClickOutside[Function: cubeOnClickOutside]
cubeHandleFaceClick[Function: cubeHandleFaceClick]
cubeHandleColoredFaceClick[Function: cubeHandleColoredFaceClick]
cubeHandleIndicatorClick[Function: cubeHandleIndicatorClick]
cubeHandleTransformToggle[Function: cubeHandleTransformToggle]
cubeHandleResizeToggle[Function: cubeHandleResizeToggle]
cubeHandleHeaderToggle[Function: cubeHandleHeaderToggle]
cubeHandleHeaderSubmit[Function: cubeHandleHeaderSubmit]
cubeDebouncedUpdate[Function: cubeDebouncedUpdate]
cubeHandleLineColorChange[Function: cubeHandleLineColorChange]
cubeHandleFaceColorChange[Function: cubeHandleFaceColorChange]
cubeHandleTextClick[Function: cubeHandleTextClick]
cubeHandleFaceTextClick[Function: cubeHandleFaceTextClick]
cubeHandleFaceTextSubmit[Function: cubeHandleFaceTextSubmit]
cubeHandleFaceTextStyleClick[Function: cubeHandleFaceTextStyleClick]
cubeHandleStyleChange[Function: cubeHandleStyleChange]
cubeHandleScale[Function: cubeHandleScale]
cubeRenderFaces[Function: cubeRenderFaces]
cubeRenderFaceTexts[Function: cubeRenderFaceTexts]
cubeHandleDrag[Function: cubeHandleDrag]

%% Component Functions - Tetrahedron
tetrahedronTriangleFaces[Function: tetrahedronTriangleFaces]
tetrahedronDebouncedUpdate[Function: tetrahedronDebouncedUpdate]
tetrahedronIsIndicatorConnected[Function: tetrahedronIsIndicatorConnected]
tetrahedronIsIndicatorActive[Function: tetrahedronIsIndicatorActive]
tetrahedronGetUIPositions[Function: tetrahedronGetUIPositions]
tetrahedronShouldShowIndicator[Function: tetrahedronShouldShowIndicator]
tetrahedronLinePoints[Function: tetrahedronLinePoints]
tetrahedronGetFaceMaterial[Function: tetrahedronGetFaceMaterial]
tetrahedronHandleSceneClick[Function: tetrahedronHandleSceneClick]
tetrahedronUpdateDatabase[Function: tetrahedronUpdateDatabase]
tetrahedronHandleFaceClick[Function: tetrahedronHandleFaceClick]
tetrahedronHandleColoredFaceClick[Function: tetrahedronHandleColoredFaceClick]
tetrahedronHandleIndicatorClick[Function: tetrahedronHandleIndicatorClick]
tetrahedronHandleTransformToggle[Function: tetrahedronHandleTransformToggle]
tetrahedronHandleResizeToggle[Function: tetrahedronHandleResizeToggle]
tetrahedronHandleHeaderToggle[Function: tetrahedronHandleHeaderToggle]
tetrahedronHandleHeaderSubmit[Function: tetrahedronHandleHeaderSubmit]
tetrahedronHandleLineColorChange[Function: tetrahedronHandleLineColorChange]
tetrahedronHandleScale[Function: tetrahedronHandleScale]
tetrahedronGetFaceTextOffset[Function: tetrahedronGetFaceTextOffset]
tetrahedronHandleFaceTextStyleClick[Function: tetrahedronHandleFaceTextStyleClick]
tetrahedronHandleFaceTextStyleChange[Function: tetrahedronHandleFaceTextStyleChange]
tetrahedronRenderFaceTexts[Function: tetrahedronRenderFaceTexts]
tetrahedronRenderFaces[Function: tetrahedronRenderFaces]
tetrahedronGetFaceIndicatorProps[Function: tetrahedronGetFaceIndicatorProps]
tetrahedronCreateTriangleGeometry[Function: tetrahedronCreateTriangleGeometry]
tetrahedronHandleDrag[Function: tetrahedronHandleDrag]

%% Component Functions - TextObject
textObjectText[Function: textObjectText]
textObjectTextStyle[Function: textObjectTextStyle]
textObjectScale[Function: textObjectScale]
textObjectSetOrbitControlsEnabled[Function: textObjectSetOrbitControlsEnabled]
textObjectSetText[Function: textObjectSetText]
textObjectSetTextStyle[Function: textObjectSetTextStyle]
textObjectSetScale[Function: textObjectSetScale]
textObjectSetIsEditing[Function: textObjectSetIsEditing]
textObjectSetIsActivelyEditing[Function: textObjectSetIsActivelyEditing]
textObjectSetIndicatorSelected[Function: textObjectSetIndicatorSelected]
textObjectSetContentHeight[Function: textObjectSetContentHeight]
textObjectSetShowTransform[Function: textObjectSetShowTransform]
textObjectSetShowResizeControls[Function: textObjectSetShowResizeControls]
textObjectSetBulletPointMode[Function: textObjectSetBulletPointMode]
textObjectHandleTransformToggle[Function: textObjectHandleTransformToggle]
textObjectHandleResizeToggle[Function: textObjectHandleResizeToggle]
textObjectGetIndicatorOffset[Function: textObjectGetIndicatorOffset]
textObjectIsIndicatorConnected[Function: textObjectIsIndicatorConnected]
textObjectShouldShowIndicator[Function: textObjectShouldShowIndicator]
textObjectGetIndicatorPositions[Function: textObjectGetIndicatorPositions]
textObjectUpdateWorldMatrix[Function: textObjectUpdateWorldMatrix]
textObjectCloseAllUIs[Function: textObjectCloseAllUIs]
textObjectUpdateDatabase[Function: textObjectUpdateDatabase]
textObjectAutoResizeTextAreaOnly[Function: textObjectAutoResizeTextAreaOnly]
textObjectAutoResizeTextArea[Function: textObjectAutoResizeTextArea]
textObjectHandleDrag[Function: textObjectHandleDrag]
textObjectHandleStyleChange[Function: textObjectHandleStyleChange]
textObjectGetEffectivePosition[Function: textObjectGetEffectivePosition]
textObjectHandleBlur[Function: textObjectHandleBlur]
textObjectHandleDivClick[Function: textObjectHandleDivClick]
textObjectHandleTextClick[Function: textObjectHandleTextClick]
textObjectHandleIndicatorClick[Function: textObjectHandleIndicatorClick]
textObjectHandleScale[Function: textObjectHandleScale]
textObjectHandleKeyDown[Function: textObjectHandleKeyDown]
textObjectApplyStyleToSelectionInternal[Function: textObjectApplyStyleToSelectionInternal]
textObjectHandleTextSelection[Function: textObjectHandleTextSelection]
textObjectGetTextAreaStyle[Function: textObjectGetTextAreaStyle]
textObjectGetContainerStyle[Function: textObjectGetContainerStyle]
textObjectGetTransformControlSize[Function: textObjectGetTransformControlSize]

%% Component Functions - Plane
planePosition[Function: planePosition]
planeScale[Function: planeScale]
planeColor[Function: planeColor]
planeHeaderText[Function: planeHeaderText]
planeBorderStyle[Function: planeBorderStyle]
planeBorderColor[Function: planeBorderColor]
planeLineThickness[Function: planeLineThickness]
planeHeaderStyle[Function: planeHeaderStyle]
planeFaceText[Function: planeFaceText]
planeFaceTextStyle[Function: planeFaceTextStyle]
planeImageUrl[Function: planeImageUrl]
planeWebcamActive[Function: planeWebcamActive]
planeWebcamInitialized[Function: planeWebcamInitialized]
planeScreenShareActive[Function: planeScreenShareActive]
planeScreenShareInitialized[Function: planeScreenShareInitialized]
planeIsBroadcasting[Function: planeIsBroadcasting]
planeIsScreenSharing[Function: planeIsScreenSharing]
planeIsViewingBroadcast[Function: planeIsViewingBroadcast]
planeBroadcastInfo[Function: planeBroadcastInfo]
planeShowUI[Function: planeShowUI]
planeShowTextInput[Function: planeShowTextInput]
planeShowTextStyleUI[Function: planeShowTextStyleUI]
planeShowTransform[Function: planeShowTransform]
planeIsResizing[Function: planeIsResizing]
planeShowHeader[Function: planeShowHeader]
planeShowHeaderStyleUI[Function: planeShowHeaderStyleUI]
planeIsUploadingImage[Function: planeIsUploadingImage]
planeIndicatorSelected[Function: planeIndicatorSelected]
planeViewerCount[Function: planeViewerCount]
planeCloseAllUIs[Function: planeCloseAllUIs]
planeUpdateDatabase[Function: planeUpdateDatabase]
planeHandleScale[Function: planeHandleScale]
planeHandleResizeEnd[Function: planeHandleResizeEnd]
planeHandleDrag[Function: planeHandleDrag]
planeHandleTransformStart[Function: planeHandleTransformStart]
planeHandleTransformEnd[Function: planeHandleTransformEnd]
planeHandleClick[Function: planeHandleClick]
planeHandleTextClick[Function: planeHandleTextClick]
planeHandleTextSubmit[Function: planeHandleTextSubmit]
planeHandleTextStyleChange[Function: planeHandleTextStyleChange]
planeHandleTextSpriteClick[Function: planeHandleTextSpriteClick]
planeHandleTransformToggle[Function: planeHandleTransformToggle]
planeHandleResizeToggle[Function: planeHandleResizeToggle]
planeHandleColorChange[Function: planeHandleColorChange]
planeHandleHeaderToggle[Function: planeHandleHeaderToggle]
planeHandleHeaderSubmit[Function: planeHandleHeaderSubmit]
planeHandleHeaderTextClick[Function: planeHandleHeaderTextClick]
planeHandleHeaderStyleChange[Function: planeHandleHeaderStyleChange]
planeHandleBorderToggle[Function: planeHandleBorderToggle]
planeHandleIndicatorClick[Function: planeHandleIndicatorClick]
planeIsIndicatorConnected[Function: planeIsIndicatorConnected]
planeShouldShowIndicator[Function: planeShouldShowIndicator]
planeHandleBroadcastStopped[Function: planeHandleBroadcastStopped]
planeHandleWebcamToggle[Function: planeHandleWebcamToggle]
planeHandleScreenShareToggle[Function: planeHandleScreenShareToggle]
planeHandleImageUpload[Function: planeHandleImageUpload]
planeHandleBroadcastStarted[Function: planeHandleBroadcastStarted]
planeHandleViewerCountChange[Function: planeHandleViewerCountChange]
planeUiPositions[Function: planeUiPositions]
planeIndicatorPosition[Function: planeIndicatorPosition]
planeMeshMaterial[Function: planeMeshMaterial]
planeLineMaterialProps[Function: planeLineMaterialProps]
planePoints[Function: planePoints]

%% Component Functions - Dodecahedron
dodecahedronPosition[Function: dodecahedronPosition]
dodecahedronScale[Function: dodecahedronScale]
dodecahedronHeaderText[Function: dodecahedronHeaderText]
dodecahedronLineColor[Function: dodecahedronLineColor]
dodecahedronFaceColors[Function: dodecahedronFaceColors]
dodecahedronFaceTexts[Function: dodecahedronFaceTexts]
dodecahedronFaceTextStyles[Function: dodecahedronFaceTextStyles]
dodecahedronHeaderStyle[Function: dodecahedronHeaderStyle]
dodecahedronUpdateObjectAndStores[Function: dodecahedronUpdateObjectAndStores]
dodecahedronUpdateFaceProperty[Function: dodecahedronUpdateFaceProperty]
dodecahedronIsIndicatorConnected[Function: dodecahedronIsIndicatorConnected]
dodecahedronOnClickOutside[Function: dodecahedronOnClickOutside]
dodecahedronUpdateDatabase[Function: dodecahedronUpdateDatabase]
dodecahedronHandleDrag[Function: dodecahedronHandleDrag]
dodecahedronPhi[Function: dodecahedronPhi]
dodecahedronHandleTransformToggle[Function: dodecahedronHandleTransformToggle]
dodecahedronHandleHeaderToggle[Function: dodecahedronHandleHeaderToggle]
dodecahedronHandleHeaderSubmit[Function: dodecahedronHandleHeaderSubmit]
dodecahedronHandleResizeToggle[Function: dodecahedronHandleResizeToggle]
dodecahedronHandleScale[Function: dodecahedronHandleScale]
dodecahedronHandleFaceClick[Function: dodecahedronHandleFaceClick]
dodecahedronHandleIndicatorClick[Function: dodecahedronHandleIndicatorClick]
dodecahedronHandleHeaderClick[Function: dodecahedronHandleHeaderClick]
dodecahedronHandleStyleChange[Function: dodecahedronHandleStyleChange]
dodecahedronHandleLineColorChange[Function: dodecahedronHandleLineColorChange]
dodecahedronHandleBackgroundClick[Function: dodecahedronHandleBackgroundClick]
dodecahedronHandleFaceTextSubmit[Function: dodecahedronHandleFaceTextSubmit]
dodecahedronHandleFaceTextButtonClick[Function: dodecahedronHandleFaceTextButtonClick]
dodecahedronHandleFaceTextClick[Function: dodecahedronHandleFaceTextClick]
dodecahedronHandleFaceTextStyleChange[Function: dodecahedronHandleFaceTextStyleChange]
dodecahedronGetUIPosition[Function: dodecahedronGetUIPosition]
dodecahedronGetHeaderPosition[Function: dodecahedronGetHeaderPosition]
dodecahedronGetFaceUIPosition[Function: dodecahedronGetFaceUIPosition]

ConnectionsRenderer --> connectionUtils : "uses"
FaceIndicator --> faceIndicatorUtils : "uses"
Cube --> facePositionUtils : "uses"
Cube --> positionUtils : "uses"
ConnectionsRenderer --> pathfindingUtils : "uses"
Cube --> snappingUtils : "uses"
App --> objectUpdateHandlers : "uses"
Cube --> cubeHelpers : "uses"

%% Component function relationships
Cube --> cubePosition : "position ([x,y,z]) from objects store"
Cube --> cubeScale : "scale ([x,y,z]) from objects store"
Cube --> cubeColor : "color (hex)"
Cube --> cubeFaceColors : "faceColors map {face: color}"
Cube --> cubeFaceTexts : "faceTexts map {face: text}"
Cube --> cubeHeaderText : "headerText (string)"
Cube --> cubeTextStyle : "textStyle object (fontSize, color, etc.)"
Cube --> cubeFaceTextStyles : "faceTextStyles map {face: style}"
Cube --> cubeIsIndicatorConnected : "isIndicatorConnected(faceName) -> bool"
Cube --> cubeIsIndicatorActive : "isIndicatorActive(faceName) -> bool"
Cube --> cubeGetUIPositions : "getUIPositions() -> computed UI positions"
Cube --> cubeShouldShowIndicator : "shouldShowIndicator(faceName) -> bool"
Cube --> cubeGetFaceTextOffset : "getFaceTextOffset(fontSize, faceName) -> offset"
Cube --> cubeGetFaceMaterial : "getFaceMaterial(faceName) -> material props"
Cube --> cubeHandleSceneClick : "handleSceneClick() -> open object UI & selection"
Cube --> cubeUpdateDatabase : "updateDatabase() -> persist object state"
Cube --> cubeOnClickOutside : "onClickOutside() global handler"
Cube --> cubeHandleFaceClick : "handleFaceClick(event, faceName)"
Cube --> cubeHandleColoredFaceClick : "handleColoredFaceClick(event, faceName)"
Cube --> cubeHandleIndicatorClick : "handleIndicatorClick(event, faceName) -> indicator data"
Cube --> cubeHandleTransformToggle : "handleTransformToggle() -> toggle transform mode"
Cube --> cubeHandleResizeToggle : "handleResizeToggle() -> toggle resize mode"
Cube --> cubeHandleHeaderToggle : "handleHeaderToggle() -> toggle header UI"
Cube --> cubeHandleHeaderSubmit : "handleHeaderSubmit(text) -> save header text"
Cube --> cubeDebouncedUpdate : "debouncedUpdate(id, data) helper"
Cube --> cubeHandleLineColorChange : "handleLineColorChange(color) -> update & persist"
Cube --> cubeHandleFaceColorChange : "handleFaceColorChange(color, face) -> update face color"
Cube --> cubeHandleTextClick : "handleTextClick(event) -> open header text style UI"
Cube --> cubeHandleFaceTextClick : "handleFaceTextClick() -> open face text input"
Cube --> cubeHandleFaceTextSubmit : "handleFaceTextSubmit(text) -> save face text"
Cube --> cubeHandleFaceTextStyleClick : "handleFaceTextStyleClick(event, faceName)"
Cube --> cubeHandleStyleChange : "handleStyleChange(newStyle) -> update styles & persist"
Cube --> cubeHandleScale : "handleScale(event) -> update scale & objects store"
Cube --> cubeRenderFaces : "renderFaces() -> face meshes/components"
Cube --> cubeRenderFaceTexts : "renderFaceTexts() -> face text elements"
Cube --> cubeHandleDrag : "handleDrag(event) -> update position & call onUpdate"

Tetrahedron --> tetrahedronTriangleFaces : "triangle face geometries"
Tetrahedron --> tetrahedronDebouncedUpdate : "debouncedUpdate(id, data) helper"
Tetrahedron --> tetrahedronIsIndicatorConnected : "isIndicatorConnected(faceName) -> bool"
Tetrahedron --> tetrahedronIsIndicatorActive : "isIndicatorActive(faceName) -> bool"
Tetrahedron --> tetrahedronGetUIPositions : "getUIPositions() -> UI positions for header & controls"
Tetrahedron --> tetrahedronShouldShowIndicator : "shouldShowIndicator(faceName) -> bool"
Tetrahedron --> tetrahedronLinePoints : "wireframe line points (edge coordinates)"
Tetrahedron --> tetrahedronGetFaceMaterial : "getFaceMaterial(faceName) -> material props"
Tetrahedron --> tetrahedronHandleSceneClick : "handleSceneClick() -> open object UI & selection"
Tetrahedron --> tetrahedronUpdateDatabase : "updateDatabase() -> persist object state"
Tetrahedron --> tetrahedronHandleFaceClick : "handleFaceClick(event, faceName)"
Tetrahedron --> tetrahedronHandleColoredFaceClick : "handleColoredFaceClick(event, faceName)"
Tetrahedron --> tetrahedronHandleIndicatorClick : "handleIndicatorClick(event, faceName) -> indicator data"
Tetrahedron --> tetrahedronHandleTransformToggle : "handleTransformToggle() -> toggle transform mode"
Tetrahedron --> tetrahedronHandleResizeToggle : "handleResizeToggle() -> toggle resize mode"
Tetrahedron --> tetrahedronHandleHeaderToggle : "handleHeaderToggle() -> toggle header UI"
Tetrahedron --> tetrahedronHandleHeaderSubmit : "handleHeaderSubmit(text) -> save header text"
Tetrahedron --> tetrahedronHandleLineColorChange : "handleLineColorChange(color) -> update color & persist"
Tetrahedron --> tetrahedronHandleScale : "handleScale(event) -> update scale"
Tetrahedron --> tetrahedronGetFaceTextOffset : "getFaceTextOffset(fontSize, faceName) -> offset"
Tetrahedron --> tetrahedronHandleFaceTextStyleClick : "handleFaceTextStyleClick(event, faceName)"
Tetrahedron --> tetrahedronHandleFaceTextStyleChange : "handleFaceTextStyleChange(newStyle)"
Tetrahedron --> tetrahedronRenderFaceTexts : "renderFaceTexts() -> face text elements"
Tetrahedron --> tetrahedronRenderFaces : "renderFaces() -> face meshes/components"
Tetrahedron --> tetrahedronGetFaceIndicatorProps : "getFaceIndicatorProps(faceName) -> position/rotation/normal"
Tetrahedron --> tetrahedronCreateTriangleGeometry : "createTriangleGeometry(vertices) -> geometry"
Tetrahedron --> tetrahedronHandleDrag : "handleDrag(event) -> update position & call onUpdate"

TextObject --> textObjectText : "display text (string)"
TextObject --> textObjectTextStyle : "text style object (fontSize, color, weight, etc.)"
TextObject --> textObjectScale : "visual scale ([x,y,z])"
TextObject --> textObjectSetOrbitControlsEnabled : "setOrbitControlsEnabled(enabled) helper"
TextObject --> textObjectSetText : "setText(value) -> persists text"
TextObject --> textObjectSetTextStyle : "setTextStyle(style) -> persists style"
TextObject --> textObjectSetScale : "setScale([x,y,z]) -> persists scale"
TextObject --> textObjectSetIsEditing : "setIsEditing(bool) UI state"
TextObject --> textObjectSetIsActivelyEditing : "setIsActivelyEditing(bool) editing state"
TextObject --> textObjectSetIndicatorSelected : "setIndicatorSelected(bool)"
TextObject --> textObjectSetContentHeight : "setContentHeight(px)"
TextObject --> textObjectSetShowTransform : "setShowTransform(bool)"
TextObject --> textObjectSetShowResizeControls : "setShowResizeControls(bool)"
TextObject --> textObjectSetBulletPointMode : "setBulletPointMode(bool)"
TextObject --> textObjectHandleTransformToggle : "handleTransformToggle()"
TextObject --> textObjectHandleResizeToggle : "handleResizeToggle()"
TextObject --> textObjectGetIndicatorOffset : "getIndicatorOffset() -> [x,y,z]"
TextObject --> textObjectIsIndicatorConnected : "isIndicatorConnected() -> bool"
TextObject --> textObjectShouldShowIndicator : "shouldShowIndicator() -> bool"
TextObject --> textObjectGetIndicatorPositions : "getIndicatorPositions() -> positions"
TextObject --> textObjectUpdateWorldMatrix : "updateWorldMatrix() -> worldPos & matrix"
TextObject --> textObjectCloseAllUIs : "closeAllUIs() helper"
TextObject --> textObjectUpdateDatabase : "updateDatabase() -> persist position/scale/style"
TextObject --> textObjectAutoResizeTextAreaOnly : "autoResizeTextAreaOnly() (UI only)"
TextObject --> textObjectAutoResizeTextArea : "autoResizeTextArea() (resizes & may update scale)"
TextObject --> textObjectHandleDrag : "handleDrag(event) -> update position & connections"
TextObject --> textObjectHandleStyleChange : "handleStyleChange(newStyle)"
TextObject --> textObjectGetEffectivePosition : "getEffectivePosition() -> position used for rendering"
TextObject --> textObjectHandleBlur : "handleBlur(event) -> finish editing"
TextObject --> textObjectHandleDivClick : "handleDivClick(event) -> focus/selection"
TextObject --> textObjectHandleTextClick : "handleTextClick(event) -> focus/edit"
TextObject --> textObjectHandleIndicatorClick : "handleIndicatorClick(event) -> toggle indicators/connect"
TextObject --> textObjectHandleScale : "handleScale(event) -> adjust visualScale & state"
TextObject --> textObjectHandleKeyDown : "handleKeyDown(event) keyboard shortcuts"
TextObject --> textObjectApplyStyleToSelectionInternal : "applyStyleToSelectionInternal(style)"
TextObject --> textObjectHandleTextSelection : "handleTextSelection() -> update selectedText"
TextObject --> textObjectGetTextAreaStyle : "getTextAreaStyle() -> inline CSS object"
TextObject --> textObjectGetContainerStyle : "getContainerStyle() -> inline CSS object"
TextObject --> textObjectGetTransformControlSize : "getTransformControlSize() -> size for controls"

Plane --> planePosition : "object position"
Plane --> planeScale : "object scale"
Plane --> planeColor : "final color"
Plane --> planeHeaderText : "header text"
Plane --> planeBorderStyle : "border style"
Plane --> planeBorderColor : "border color"
Plane --> planeLineThickness : "line thickness"
Plane --> planeHeaderStyle : "header style"
Plane --> planeFaceText : "face text"
Plane --> planeFaceTextStyle : "face text style"
Plane --> planeImageUrl : "image URL"
Plane --> planeWebcamActive : "webcam active flag"
Plane --> planeWebcamInitialized : "webcam initialized flag"
Plane --> planeScreenShareActive : "screen share active flag"
Plane --> planeScreenShareInitialized : "screen share initialized flag"
Plane --> planeIsBroadcasting : "is broadcasting flag"
Plane --> planeIsScreenSharing : "is screen sharing flag"
Plane --> planeIsViewingBroadcast : "is viewing broadcast flag"
Plane --> planeBroadcastInfo : "broadcast metadata"
Plane --> planeShowUI : "show UI flag"
Plane --> planeShowTextInput : "show text input flag"
Plane --> planeShowTextStyleUI : "show text style UI flag"
Plane --> planeShowTransform : "show transform flag"
Plane --> planeIsResizing : "is resizing flag"
Plane --> planeShowHeader : "show header flag"
Plane --> planeShowHeaderStyleUI : "show header style UI flag"
Plane --> planeIsUploadingImage : "is uploading image flag"
Plane --> planeIndicatorSelected : "indicator selected flag"
Plane --> planeViewerCount : "viewer count"
Plane --> planeCloseAllUIs : "closeAllUIs() helper"
Plane --> planeUpdateDatabase : "updateDatabase() / persistence"
Plane --> planeHandleScale : "handleScale(event) → new scale"
Plane --> planeHandleResizeEnd : "handleResizeEnd()"
Plane --> planeHandleDrag : "handleDrag(event) → new position"
Plane --> planeHandleTransformStart : "handleTransformStart()"
Plane --> planeHandleTransformEnd : "handleTransformEnd()"
Plane --> planeHandleClick : "handleClick(event)"
Plane --> planeHandleTextClick : "handleTextClick()"
Plane --> planeHandleTextSubmit : "handleTextSubmit(text)"
Plane --> planeHandleTextStyleChange : "handleTextStyleChange(style)"
Plane --> planeHandleTextSpriteClick : "handleTextSpriteClick(event)"
Plane --> planeHandleTransformToggle : "handleTransformToggle()"
Plane --> planeHandleResizeToggle : "handleResizeToggle()"
Plane --> planeHandleColorChange : "handleColorChange(newColor)"
Plane --> planeHandleHeaderToggle : "handleHeaderToggle()"
Plane --> planeHandleHeaderSubmit : "handleHeaderSubmit(text)"
Plane --> planeHandleHeaderTextClick : "handleHeaderTextClick(event)"
Plane --> planeHandleHeaderStyleChange : "handleHeaderStyleChange(style)"
Plane --> planeHandleBorderToggle : "handleBorderToggle(option)"
Plane --> planeHandleIndicatorClick : "handleIndicatorClick(event)"
Plane --> planeIsIndicatorConnected : "indicator-connected check"
Plane --> planeShouldShowIndicator : "shouldShowIndicator()"
Plane --> planeHandleBroadcastStopped : "handleBroadcastStopped()"
Plane --> planeHandleWebcamToggle : "handleWebcamToggle()"
Plane --> planeHandleScreenShareToggle : "handleScreenShareToggle()"
Plane --> planeHandleImageUpload : "handleImageUpload(file)"
Plane --> planeHandleBroadcastStarted : "handleBroadcastStarted(info)"
Plane --> planeHandleViewerCountChange : "handleViewerCountChange(count)"
Plane --> planeUiPositions : "computed UI positions"
Plane --> planeIndicatorPosition : "indicator position"
Plane --> planeMeshMaterial : "mesh material props"
Plane --> planeLineMaterialProps : "line material props"
Plane --> planePoints : "geometry corner points"

Dodecahedron --> dodecahedronPosition : "object position"
Dodecahedron --> dodecahedronScale : "object scale"
Dodecahedron --> dodecahedronHeaderText : "header text"
Dodecahedron --> dodecahedronLineColor : "line color"
Dodecahedron --> dodecahedronFaceColors : "face colors map"
Dodecahedron --> dodecahedronFaceTexts : "face texts map"
Dodecahedron --> dodecahedronFaceTextStyles : "face text styles map"
Dodecahedron --> dodecahedronHeaderStyle : "header style"
Dodecahedron --> dodecahedronUpdateObjectAndStores : "updateObjectAndStores(updates)"
Dodecahedron --> dodecahedronUpdateFaceProperty : "updateFaceProperty(name, faceIndex, value)"
Dodecahedron --> dodecahedronIsIndicatorConnected : "indicator-connected check"
Dodecahedron --> dodecahedronOnClickOutside : "onClickOutside handler"
Dodecahedron --> dodecahedronUpdateDatabase : "updateDatabase() / persistence"
Dodecahedron --> dodecahedronHandleDrag : "handleDrag(event) → new position"
Dodecahedron --> dodecahedronPhi : "golden-ratio (phi) constant"
Dodecahedron --> dodecahedronHandleTransformToggle : "toggle transform mode"
Dodecahedron --> dodecahedronHandleHeaderToggle : "toggle header UI"
Dodecahedron --> dodecahedronHandleHeaderSubmit : "handleHeaderSubmit(text)"
Dodecahedron --> dodecahedronHandleResizeToggle : "toggle resize mode"
Dodecahedron --> dodecahedronHandleScale : "handleScale(event) → new scale"
Dodecahedron --> dodecahedronHandleFaceClick : "handleFaceClick(faceIndex)"
Dodecahedron --> dodecahedronHandleIndicatorClick : "handleIndicatorClick(faceIndex)"
Dodecahedron --> dodecahedronHandleHeaderClick : "handleHeaderClick(event)"
Dodecahedron --> dodecahedronHandleStyleChange : "handleStyleChange(newStyle)"
Dodecahedron --> dodecahedronHandleLineColorChange : "handleLineColorChange(color)"
Dodecahedron --> dodecahedronHandleBackgroundClick : "handleBackgroundClick(event)"
Dodecahedron --> dodecahedronHandleFaceTextSubmit : "handleFaceTextSubmit(text)"
Dodecahedron --> dodecahedronHandleFaceTextButtonClick : "face text button click"
Dodecahedron --> dodecahedronHandleFaceTextClick : "handleFaceTextClick(faceIndex)"
Dodecahedron --> dodecahedronHandleFaceTextStyleChange : "handleFaceTextStyleChange(style)"
Dodecahedron --> dodecahedronGetUIPosition : "computed UI position"
Dodecahedron --> dodecahedronGetHeaderPosition : "computed header position"
Dodecahedron --> dodecahedronGetFaceUIPosition : "computed face UI position(faceIndex, offset)"

connectionUtils --> unifiedMathUtils : "math operations"
positionUtils --> unifiedMathUtils : "math operations"
pathfindingUtils --> unifiedMathUtils : "math operations"

App --> unifiedDebugUtils : "debugging"
App --> unifiedPerformanceUtils : "performance"
objectsStore --> unifiedValidationUtils : "validation"
connectionStore --> unifiedValidationUtils : "validation"

App --> animationUtils : "animations"
App --> loadingState : "loading states"
Cube --> textureLoader : "texture loading"
ConnectionsRenderer --> linePoolManager : "line pooling"

spatialPartitioning --> streamlinedSpatialIndex : "spatial indexing"
ObjectRenderer --> objectVirtualization : "virtualization"
BVHIntegration --> bvhRaycasting : "raycasting"

objectsStore --> storeValidation : "validation"
objectsStore --> storeUtils : "utilities"

markdownDiagramService --> initializeProcessor : "processor config"
markdownDiagramService --> getCameraBasedPosition : "camera positioning logic"
markdownDiagramService --> buildHierarchicalRelationships : "graph connections → parent/child maps"
markdownDiagramService --> getObjectTypeForNode : "node.type → object mapping"
markdownDiagramService --> calculateDodecahedronScale : "component children → scale/container size"
markdownDiagramService --> calculateMaxChildSize : "nested children → max size"
markdownDiagramService --> countNestedChildren : "count of nested child nodes"
markdownDiagramService --> calculateNodePosition : "hierarchy + layout → [x,y,z]"
markdownDiagramService --> getCornerPositions : "corner placement positions"
markdownDiagramService --> positionNodeHierarchy : "hierarchy traversal & positioning"
markdownDiagramService --> createObjectsFromDiagram : "diagram.graph → 3D object data"
markdownDiagramService --> createConnectionsFromDiagram : "diagram.connections → connection data"
markdownDiagramService --> saveConnections : "bulk connections payload"
markdownDiagramService --> processMarkdownFile : "markdown file → parsed diagram"

%% ========================================
%% CONFIGURATION & BUILD
%% ========================================

firebaseConfig[Function: firebase.js]
viteConfig[Function: vite.config.js]
eslintConfig[Function: eslint.config.js]

App --> firebaseConfig : "Firebase setup"

%% ========================================
%% DATA FLOW PATTERNS
%% ========================================

%% User interaction flow
UIOverlay -.-> App : "user events"
App -.-> objectsStore : "updates"
objectsStore -.-> ObjectRenderer : "notifies"
ObjectRenderer -.-> Cube : "renders"

%% Connection creation flow
FaceIndicator -.-> faceIndicatorUtils : "click event"
faceIndicatorUtils -.-> connectionUtils : "validate"
connectionUtils -.-> connectionStore : "create"
connectionStore -.-> ConnectionsRenderer : "notifies"

%% Spatial partitioning flow
Cube -.-> objectUpdateHandlers : "move event"
objectUpdateHandlers -.-> spatialPartitioning : "update position"
spatialPartitioning -.-> spatialObjectsService : "sync to DB"

%% Real-time collaboration flow
Firebase -.-> RealTimeConnectionUpdater : "changes"
RealTimeConnectionUpdater -.-> connectionStore : "updates"
connectionStore -.-> ConnectionsRenderer : "re-render"

%% Markdown diagram flow
UIOverlay -.-> markdownDiagramService : "upload file"
markdownDiagramService -.-> AstGenerator : "parse Merfolk"
AstGenerator -.-> markdownDiagramService : "AST"
markdownDiagramService -.-> objectsStore : "create objects"
markdownDiagramService -.-> connectionStore : "create connections"

%% ========================================
%% INHERITANCE & DEPENDENCIES
%% ========================================

%% Store inheritance pattern (all stores use Zustand)
cubeStore == Zustand
dodecahedronStore == Zustand
tetrahedronStore == Zustand
planeStore == Zustand
objectsStore == Zustand
connectionStore == Zustand
authStore == Zustand

%% All 3D objects inherit from Three.js
Cube == ThreeJS
Dodecahedron == ThreeJS
Tetrahedron == ThreeJS
Plane == ThreeJS
TextObject == ThreeJS

%% All components depend on React
App == ReactThreeFiber
CustomCamera == ReactThreeFiber
ObjectRenderer == ReactThreeFiber
ConnectionsRenderer == ReactThreeFiber
```

## Architecture Overview

### Core Layers

1. **Application Layer** - Main app component orchestrating the 3D workspace
2. **Component Layer** - React components for 3D objects, UI, and visualization
3. **State Management Layer** - Zustand stores managing application state
4. **Service Layer** - Business logic and external integrations
5. **Utility Layer** - Helper functions and reusable utilities

### Key Features

- **3D Object System**: Support for cubes, dodecahedrons, tetrahedrons, planes, and text objects
- **Connection System**: Face-to-face connections with pathfinding and animations
- **Spatial Partitioning**: Optimized rendering and queries using spatial indexing
- **Real-time Collaboration**: Shared spaces with WebRTC and Firebase sync
- **Markdown Diagrams**: Support for Merfolk syntax to create 3D diagrams from markdown
- **Transform Controls**: Interactive 3D transformations with snapping
- **Visual Feedback**: Face indicators, snap guides, and UI overlays

### External Dependencies

- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics library
- **Zustand** - State management
- **Firebase** - Backend services (Auth, Firestore, Storage)
- **3d-ast-generator** - Merfolk diagram parser
- **three-mesh-bvh** - Spatial acceleration for raycasting

### Design Patterns

- **Component-based architecture** - Modular React components
- **State management** - Centralized Zustand stores
- **Service layer** - Separation of business logic
- **Utility modules** - Reusable helper functions
- **Hook composition** - Custom React hooks for logic reuse
- **Real-time sync** - Firebase listeners and WebRTC for collaboration
