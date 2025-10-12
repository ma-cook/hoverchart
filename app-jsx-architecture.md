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
Cube --> cubePosition : "uses"
Cube --> cubeScale : "uses"
Cube --> cubeColor : "uses"
Cube --> cubeFaceColors : "uses"
Cube --> cubeFaceTexts : "uses"
Cube --> cubeHeaderText : "uses"
Cube --> cubeTextStyle : "uses"
Cube --> cubeFaceTextStyles : "uses"
Cube --> cubeIsIndicatorConnected : "uses"
Cube --> cubeIsIndicatorActive : "uses"
Cube --> cubeGetUIPositions : "uses"
Cube --> cubeShouldShowIndicator : "uses"
Cube --> cubeGetFaceTextOffset : "uses"
Cube --> cubeGetFaceMaterial : "uses"
Cube --> cubeHandleSceneClick : "uses"
Cube --> cubeUpdateDatabase : "uses"
Cube --> cubeOnClickOutside : "uses"
Cube --> cubeHandleFaceClick : "uses"
Cube --> cubeHandleColoredFaceClick : "uses"
Cube --> cubeHandleIndicatorClick : "uses"
Cube --> cubeHandleTransformToggle : "uses"
Cube --> cubeHandleResizeToggle : "uses"
Cube --> cubeHandleHeaderToggle : "uses"
Cube --> cubeHandleHeaderSubmit : "uses"
Cube --> cubeDebouncedUpdate : "uses"
Cube --> cubeHandleLineColorChange : "uses"
Cube --> cubeHandleFaceColorChange : "uses"
Cube --> cubeHandleTextClick : "uses"
Cube --> cubeHandleFaceTextClick : "uses"
Cube --> cubeHandleFaceTextSubmit : "uses"
Cube --> cubeHandleFaceTextStyleClick : "uses"
Cube --> cubeHandleStyleChange : "uses"
Cube --> cubeHandleScale : "uses"
Cube --> cubeRenderFaces : "uses"
Cube --> cubeRenderFaceTexts : "uses"
Cube --> cubeHandleDrag : "uses"

Tetrahedron --> tetrahedronTriangleFaces : "uses"
Tetrahedron --> tetrahedronDebouncedUpdate : "uses"
Tetrahedron --> tetrahedronIsIndicatorConnected : "uses"
Tetrahedron --> tetrahedronIsIndicatorActive : "uses"
Tetrahedron --> tetrahedronGetUIPositions : "uses"
Tetrahedron --> tetrahedronShouldShowIndicator : "uses"
Tetrahedron --> tetrahedronLinePoints : "uses"
Tetrahedron --> tetrahedronGetFaceMaterial : "uses"
Tetrahedron --> tetrahedronHandleSceneClick : "uses"
Tetrahedron --> tetrahedronUpdateDatabase : "uses"
Tetrahedron --> tetrahedronHandleFaceClick : "uses"
Tetrahedron --> tetrahedronHandleColoredFaceClick : "uses"
Tetrahedron --> tetrahedronHandleIndicatorClick : "uses"
Tetrahedron --> tetrahedronHandleTransformToggle : "uses"
Tetrahedron --> tetrahedronHandleResizeToggle : "uses"
Tetrahedron --> tetrahedronHandleHeaderToggle : "uses"
Tetrahedron --> tetrahedronHandleHeaderSubmit : "uses"
Tetrahedron --> tetrahedronHandleLineColorChange : "uses"
Tetrahedron --> tetrahedronHandleScale : "uses"
Tetrahedron --> tetrahedronGetFaceTextOffset : "uses"
Tetrahedron --> tetrahedronHandleFaceTextStyleClick : "uses"
Tetrahedron --> tetrahedronHandleFaceTextStyleChange : "uses"
Tetrahedron --> tetrahedronRenderFaceTexts : "uses"
Tetrahedron --> tetrahedronRenderFaces : "uses"
Tetrahedron --> tetrahedronGetFaceIndicatorProps : "uses"
Tetrahedron --> tetrahedronCreateTriangleGeometry : "uses"
Tetrahedron --> tetrahedronHandleDrag : "uses"

TextObject --> textObjectText : "uses"
TextObject --> textObjectTextStyle : "uses"
TextObject --> textObjectScale : "uses"
TextObject --> textObjectSetOrbitControlsEnabled : "uses"
TextObject --> textObjectSetText : "uses"
TextObject --> textObjectSetTextStyle : "uses"
TextObject --> textObjectSetScale : "uses"
TextObject --> textObjectSetIsEditing : "uses"
TextObject --> textObjectSetIsActivelyEditing : "uses"
TextObject --> textObjectSetIndicatorSelected : "uses"
TextObject --> textObjectSetContentHeight : "uses"
TextObject --> textObjectSetShowTransform : "uses"
TextObject --> textObjectSetShowResizeControls : "uses"
TextObject --> textObjectSetBulletPointMode : "uses"
TextObject --> textObjectHandleTransformToggle : "uses"
TextObject --> textObjectHandleResizeToggle : "uses"
TextObject --> textObjectGetIndicatorOffset : "uses"
TextObject --> textObjectIsIndicatorConnected : "uses"
TextObject --> textObjectShouldShowIndicator : "uses"
TextObject --> textObjectGetIndicatorPositions : "uses"
TextObject --> textObjectUpdateWorldMatrix : "uses"
TextObject --> textObjectCloseAllUIs : "uses"
TextObject --> textObjectUpdateDatabase : "uses"
TextObject --> textObjectAutoResizeTextAreaOnly : "uses"
TextObject --> textObjectAutoResizeTextArea : "uses"
TextObject --> textObjectHandleDrag : "uses"
TextObject --> textObjectHandleStyleChange : "uses"
TextObject --> textObjectGetEffectivePosition : "uses"
TextObject --> textObjectHandleBlur : "uses"
TextObject --> textObjectHandleDivClick : "uses"
TextObject --> textObjectHandleTextClick : "uses"
TextObject --> textObjectHandleIndicatorClick : "uses"
TextObject --> textObjectHandleScale : "uses"
TextObject --> textObjectHandleKeyDown : "uses"
TextObject --> textObjectApplyStyleToSelectionInternal : "uses"
TextObject --> textObjectHandleTextSelection : "uses"
TextObject --> textObjectGetTextAreaStyle : "uses"
TextObject --> textObjectGetContainerStyle : "uses"
TextObject --> textObjectGetTransformControlSize : "uses"

Plane --> planePosition : "uses"
Plane --> planeScale : "uses"
Plane --> planeColor : "uses"
Plane --> planeHeaderText : "uses"
Plane --> planeBorderStyle : "uses"
Plane --> planeBorderColor : "uses"
Plane --> planeLineThickness : "uses"
Plane --> planeHeaderStyle : "uses"
Plane --> planeFaceText : "uses"
Plane --> planeFaceTextStyle : "uses"
Plane --> planeImageUrl : "uses"
Plane --> planeWebcamActive : "uses"
Plane --> planeWebcamInitialized : "uses"
Plane --> planeScreenShareActive : "uses"
Plane --> planeScreenShareInitialized : "uses"
Plane --> planeIsBroadcasting : "uses"
Plane --> planeIsScreenSharing : "uses"
Plane --> planeIsViewingBroadcast : "uses"
Plane --> planeBroadcastInfo : "uses"
Plane --> planeShowUI : "uses"
Plane --> planeShowTextInput : "uses"
Plane --> planeShowTextStyleUI : "uses"
Plane --> planeShowTransform : "uses"
Plane --> planeIsResizing : "uses"
Plane --> planeShowHeader : "uses"
Plane --> planeShowHeaderStyleUI : "uses"
Plane --> planeIsUploadingImage : "uses"
Plane --> planeIndicatorSelected : "uses"
Plane --> planeViewerCount : "uses"
Plane --> planeCloseAllUIs : "uses"
Plane --> planeUpdateDatabase : "uses"
Plane --> planeHandleScale : "uses"
Plane --> planeHandleResizeEnd : "uses"
Plane --> planeHandleDrag : "uses"
Plane --> planeHandleTransformStart : "uses"
Plane --> planeHandleTransformEnd : "uses"
Plane --> planeHandleClick : "uses"
Plane --> planeHandleTextClick : "uses"
Plane --> planeHandleTextSubmit : "uses"
Plane --> planeHandleTextStyleChange : "uses"
Plane --> planeHandleTextSpriteClick : "uses"
Plane --> planeHandleTransformToggle : "uses"
Plane --> planeHandleResizeToggle : "uses"
Plane --> planeHandleColorChange : "uses"
Plane --> planeHandleHeaderToggle : "uses"
Plane --> planeHandleHeaderSubmit : "uses"
Plane --> planeHandleHeaderTextClick : "uses"
Plane --> planeHandleHeaderStyleChange : "uses"
Plane --> planeHandleBorderToggle : "uses"
Plane --> planeHandleIndicatorClick : "uses"
Plane --> planeIsIndicatorConnected : "uses"
Plane --> planeShouldShowIndicator : "uses"
Plane --> planeHandleBroadcastStopped : "uses"
Plane --> planeHandleWebcamToggle : "uses"
Plane --> planeHandleScreenShareToggle : "uses"
Plane --> planeHandleImageUpload : "uses"
Plane --> planeHandleBroadcastStarted : "uses"
Plane --> planeHandleViewerCountChange : "uses"
Plane --> planeUiPositions : "uses"
Plane --> planeIndicatorPosition : "uses"
Plane --> planeMeshMaterial : "uses"
Plane --> planeLineMaterialProps : "uses"
Plane --> planePoints : "uses"

Dodecahedron --> dodecahedronPosition : "uses"
Dodecahedron --> dodecahedronScale : "uses"
Dodecahedron --> dodecahedronHeaderText : "uses"
Dodecahedron --> dodecahedronLineColor : "uses"
Dodecahedron --> dodecahedronFaceColors : "uses"
Dodecahedron --> dodecahedronFaceTexts : "uses"
Dodecahedron --> dodecahedronFaceTextStyles : "uses"
Dodecahedron --> dodecahedronHeaderStyle : "uses"
Dodecahedron --> dodecahedronUpdateObjectAndStores : "uses"
Dodecahedron --> dodecahedronUpdateFaceProperty : "uses"
Dodecahedron --> dodecahedronIsIndicatorConnected : "uses"
Dodecahedron --> dodecahedronOnClickOutside : "uses"
Dodecahedron --> dodecahedronUpdateDatabase : "uses"
Dodecahedron --> dodecahedronHandleDrag : "uses"
Dodecahedron --> dodecahedronPhi : "uses"
Dodecahedron --> dodecahedronHandleTransformToggle : "uses"
Dodecahedron --> dodecahedronHandleHeaderToggle : "uses"
Dodecahedron --> dodecahedronHandleHeaderSubmit : "uses"
Dodecahedron --> dodecahedronHandleResizeToggle : "uses"
Dodecahedron --> dodecahedronHandleScale : "uses"
Dodecahedron --> dodecahedronHandleFaceClick : "uses"
Dodecahedron --> dodecahedronHandleIndicatorClick : "uses"
Dodecahedron --> dodecahedronHandleHeaderClick : "uses"
Dodecahedron --> dodecahedronHandleStyleChange : "uses"
Dodecahedron --> dodecahedronHandleLineColorChange : "uses"
Dodecahedron --> dodecahedronHandleBackgroundClick : "uses"
Dodecahedron --> dodecahedronHandleFaceTextSubmit : "uses"
Dodecahedron --> dodecahedronHandleFaceTextButtonClick : "uses"
Dodecahedron --> dodecahedronHandleFaceTextClick : "uses"
Dodecahedron --> dodecahedronHandleFaceTextStyleChange : "uses"
Dodecahedron --> dodecahedronGetUIPosition : "uses"
Dodecahedron --> dodecahedronGetHeaderPosition : "uses"
Dodecahedron --> dodecahedronGetFaceUIPosition : "uses"

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

markdownDiagramService --> initializeProcessor : "uses"
markdownDiagramService --> getCameraBasedPosition : "uses"
markdownDiagramService --> buildHierarchicalRelationships : "uses"
markdownDiagramService --> getObjectTypeForNode : "uses"
markdownDiagramService --> calculateDodecahedronScale : "uses"
markdownDiagramService --> calculateMaxChildSize : "uses"
markdownDiagramService --> countNestedChildren : "uses"
markdownDiagramService --> calculateNodePosition : "uses"
markdownDiagramService --> getCornerPositions : "uses"
markdownDiagramService --> positionNodeHierarchy : "uses"
markdownDiagramService --> createObjectsFromDiagram : "uses"
markdownDiagramService --> createConnectionsFromDiagram : "uses"
markdownDiagramService --> saveConnections : "uses"
markdownDiagramService --> processMarkdownFile : "uses"

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
