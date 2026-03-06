```merfolk
%% hoverchart Repository Analysis

%% Components
App{Component: App}
CellBoundaryRenderer{Component: CellBoundaryRenderer}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
AtlasTextSprite{Component: AtlasTextSprite}
StaticBillboardMesh{Component: StaticBillboardMesh}
DynamicBillboardMesh{Component: DynamicBillboardMesh}
ColorPicker{Component: ColorPicker}
BVHIntegration{Component: BVHIntegration}
BatchedConnectionLines{Component: BatchedConnectionLines}
BatchedCurvedLines{Component: BatchedCurvedLines}
FaceTextInput{Component: FaceTextInput}
ContainerOutline{Component: ContainerOutline}
FaceIndicator{Component: FaceIndicator}
CubeFace{Component: CubeFace}
DistanceFilteredConnectionText{Component: DistanceFilteredConnectionText}
Connection{Component: Connection}
ConnectionsRenderer{Component: ConnectionsRenderer}
Cube{Component: Cube}
DistanceFilteredTextLabels{Component: DistanceFilteredTextLabels}
Sphere{Component: Sphere}
DodecahedronFace{Component: DodecahedronFace}
CustomCamera{Component: CustomCamera}
GlobalDodecahedronEdgesRenderer{Component: GlobalDodecahedronEdgesRenderer}
GlobalTetrahedronEdgesRenderer{Component: GlobalTetrahedronEdgesRenderer}
FaceUI{Component: FaceUI}
LODManager{Component: LODManager}
FrameTicker{Component: FrameTicker}
GlobalCubeEdgesRenderer{Component: GlobalCubeEdgesRenderer}
InstancedAtlasText{Component: InstancedAtlasText}
PageInstancedMesh{Component: PageInstancedMesh}
HeaderInput{Component: HeaderInput}
InstancedLine{Component: InstancedLine}
PooledLine{Component: PooledLine}
ObjectsRenderer{Component: ObjectsRenderer}
Plane{Component: Plane}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
ObjectRenderer{Component: ObjectRenderer}
LineUI{Component: LineUI}
ObjectUI{Component: ObjectUI}
ModelObject{Component: ModelObject}
ScreenShareStream{Component: ScreenShareStream}
Tetrahedron{Component: Tetrahedron}
TextObjectUI{Component: TextObjectUI}
TetrahedronFace{Component: TetrahedronFace}
TextStyleUIContainer{Component: TextStyleUIContainer}
TextSprite{Component: TextSprite}
TextObject{Component: TextObject}
SpaceChat{Component: SpaceChat}
Avatar{Component: Avatar}
SpacePresenceAvatars{Component: SpacePresenceAvatars}
SnapLineIndicator{Component: SnapLineIndicator}
TextStyleUIContent{Component: TextStyleUIContent}
TextStyleUI{Component: TextStyleUI}
UIOverlay{Component: UIOverlay}
WebcamStream{Component: WebcamStream}

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
ConnectionsRenderer -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
InstancedAtlasText -.-> PageInstancedMesh : "internal"
SpacePresenceAvatars -.-> Avatar : "internal"
TextStyleUI -.-> TextStyleUIContent : "internal"

%% Functions
getSharedMaterial[Function: getSharedMaterial]
pathToSegments[Function: pathToSegments]
getIndicatorMaterial[Function: getIndicatorMaterial]
getColoredMaterial[Function: getColoredMaterial]
createDodecahedronGeometry[Function: createDodecahedronGeometry]
getDodecahedronColoredMaterial[Function: getDodecahedronColoredMaterial]
createLoaders[Function: createLoaders]
arraysEqual[Function: arraysEqual]
shallowObjEqual[Function: shallowObjEqual]
_createTriangleGeometry[Function: _createTriangleGeometry]
getFaceIndicatorProps[Function: getFaceIndicatorProps]
getTetrahedronColoredMaterial[Function: getTetrahedronColoredMaterial]
lerpVector[Function: lerpVector]
senderInitials[Function: senderInitials]
mergeMessages[Function: mergeMessages]
getInitials[Function: getInitials]
calculateFaceWorldPosition[Function: calculateFaceWorldPosition]
applyVideoTexture[Function: applyVideoTexture]

%% Hooks
useConnectionObjects[Function: useConnectionObjects]
usePathfindingObjects[Function: usePathfindingObjects]
useConnectionObjectPositions[Function: useConnectionObjectPositions]
useAnimatedLine[Function: useAnimatedLine]
useAnimationStats[Function: useAnimationStats]
useAuth[Function: useAuth]
useConnections[Function: useConnections]
userId[Function: userId]
useAuthState[Function: useAuthState]
useCentralizedBroadcastManager[Function: useCentralizedBroadcastManager]
useFrustumCulledConnections[Function: useFrustumCulledConnections]
useDynamicFrustumCulling[Function: useDynamicFrustumCulling]
useLinePool[Function: useLinePool]
useIndicators[Function: useIndicators]
useGlobalClickHandler[Function: useGlobalClickHandler]
useObjects[Function: useObjects]
useConnectionsRendererStore[Function: useConnectionsRendererStore]
useConnectionState[Function: useConnectionState]
useConnectionActions[Function: useConnectionActions]
useDebouncedUpdate[Function: useDebouncedUpdate]
useLOD[Function: useLOD]
useSpatialManager[Function: useSpatialManager]
useSpaceManager[Function: useSpaceManager]
useTextureUpdater[Function: useTextureUpdater]
useTimeoutManager[Function: useTimeoutManager]

%% Services
createVerifyAuthTokenApp[Function: createVerifyAuthTokenApp]
createBulkImportApp[Function: createBulkImportApp]
objectsByCellId[Function: objectsByCellId]
connectionsByCellId[Function: connectionsByCellId]
params[Function: params]
createBulkDeleteApp[Function: createBulkDeleteApp]
exchangeGithubCode[Function: exchangeGithubCode]
fetchRepositories[Function: fetchRepositories]
fetchFileContent[Function: fetchFileContent]
fetchRepositoryStructure[Function: fetchRepositoryStructure]
analyzeFile[Function: analyzeFile]
containsJSX[Function: containsJSX]
generateMerfolkFromRepository[Function: generateMerfolkFromRepository]
componentFunctions[Function: componentFunctions]
componentRelationships[Function: componentRelationships]
componentDependencies[Function: componentDependencies]
internalComponents[Function: internalComponents]
exportedComponents[Function: exportedComponents]
fileFunctions[Function: fileFunctions]
internalHooks[Function: internalHooks]
filesNeedingSuffix[Function: filesNeedingSuffix]
functionCallRelationships[Function: functionCallRelationships]
componentPropsRelationships[Function: componentPropsRelationships]
storeUsageRelationships[Function: storeUsageRelationships]
hookReturnValueRelationships[Function: hookReturnValueRelationships]
traverse[Function: traverse]
generateMerfolkMarkdown[Function: generateMerfolkMarkdown]
storesSet[Function: storesSet]
servicesSet[Function: servicesSet]
componentInternalFunctions[Function: componentInternalFunctions]
componentsSet[Function: componentsSet]
filtered[Function: filtered]
hooksSet[Function: hooksSet]
servicesSetForFilter[Function: servicesSetForFilter]
storesSetForFilter[Function: storesSetForFilter]
utilitiesSetForFilter[Function: utilitiesSetForFilter]
nodeIds[Function: nodeIds]
childToParentMap[Function: childToParentMap]
generateRoutedConnection[Function: generateRoutedConnection]
allComponentFunctions[Function: allComponentFunctions]
getGithubToken[Function: getGithubToken]
setGithubToken[Function: setGithubToken]
isGithubAuthenticated[Function: isGithubAuthenticated]
getGithubOAuthUrl[Function: getGithubOAuthUrl]
currentParams[Function: currentParams]
handleGithubCallback[Function: handleGithubCallback]
restoredParams[Function: restoredParams]
newUrl[Function: newUrl]
scanRepositoryAndGenerateDiagram[Function: scanRepositoryAndGenerateDiagram]
markdownBlob[Function: markdownBlob]
markdownFile[Function: markdownFile]
connectionListeners[Function: connectionListeners]
globalActiveListeners[Function: globalActiveListeners]
pauseConnectionListeners[Function: pauseConnectionListeners]
resumeConnectionListeners[Function: resumeConnectionListeners]
notifyConnectionListeners[Function: notifyConnectionListeners]
addConnectionStateListener[Function: addConnectionStateListener]
connectionCache[Function: connectionCache]
clearConnectionCache[Function: clearConnectionCache]
connectionDataChanged[Function: connectionDataChanged]
serializeConnection[Function: serializeConnection]
enableConnectionNetwork[Function: enableConnectionNetwork]
disableConnectionNetwork[Function: disableConnectionNetwork]
getConnectionNetworkState[Function: getConnectionNetworkState]
saveConnection[Function: saveConnection]
subscribeToConnections[Function: subscribeToConnections]
subscribeToCellConnections[Function: subscribeToCellConnections]
unsubscribeFunctions[Function: unsubscribeFunctions]
activeSubscriptionCells[Function: activeSubscriptionCells]
startCellSubscriptions[Function: startCellSubscriptions]
deleteConnection[Function: deleteConnection]
deleteConnectionEnhanced[Function: deleteConnectionEnhanced]
CentralizedBroadcastManager[Function: CentralizedBroadcastManager]
dummyUnsubscribe[Function: dummyUnsubscribe]
centralizedBroadcastManager[Function: centralizedBroadcastManager]
subscribePlaneToBroadcasts[Function: subscribePlaneToBroadcasts]
getBroadcastManagerDebugInfo[Function: getBroadcastManagerDebugInfo]
cleanupBroadcastManager[Function: cleanupBroadcastManager]
globalSubscriptions[Function: globalSubscriptions]
getOrCreateSubscription[Function: getOrCreateSubscription]
decrementSubscription[Function: decrementSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
periodicCleanup[Function: periodicCleanup]
resolveConnectionPositions[Function: resolveConnectionPositions]
resolveConnectionEndpoint[Function: resolveConnectionEndpoint]
connectionNeedsPositionResolution[Function: connectionNeedsPositionResolution]
positionsEqual[Function: positionsEqual]
GlobalOptimizationCoordinator[Function: GlobalOptimizationCoordinator]
spatialManager[Function: spatialManager]
unifiedCache[Function: unifiedCache]
cacheStats[Function: cacheStats]
later[Function: later]
cache[Function: cache]
memoized[Function: memoized]
session[Function: session]
globalOptimizationCoordinator[Function: globalOptimizationCoordinator]
initializeOptimizationCoordinator[Function: initializeOptimizationCoordinator]
getOptimizationStatus[Function: getOptimizationStatus]
consolidateSystem[Function: consolidateSystem]
cleanupOptimizationCoordinator[Function: cleanupOptimizationCoordinator]
signInUser[Function: signInUser]
handlePostLoginRedirect[Function: handlePostLoginRedirect]
signOut[Function: signOut]
handleRedirectResult[Function: handleRedirectResult]
observeAuthState[Function: observeAuthState]
validateAuthToken[Function: validateAuthToken]
handleUrlAuth[Function: handleUrlAuth]
reachableFromRootModules[Function: reachableFromRootModules]
markReachable[Function: markReachable]
createContainerForGroup[Function: createContainerForGroup]
componentsWithChildContainers[Function: componentsWithChildContainers]
nodesInChildContainers[Function: nodesInChildContainers]
markDescendantsInChildContainers[Function: markDescendantsInChildContainers]
nodesWithContainers[Function: nodesWithContainers]
visited[Function: visited]
adjustNodeAndDescendants[Function: adjustNodeAndDescendants]
containerDimensions[Function: containerDimensions]
MarkdownDiagramService[Function: MarkdownDiagramService]
markdownDiagramService[Function: markdownDiagramService]
parentChildMap[Function: parentChildMap]
childParentMap[Function: childParentMap]
rootNodes[Function: rootNodes]
internalComponentChildren[Function: internalComponentChildren]
componentConnectionTypes[Function: componentConnectionTypes]
wouldCreateCycle[Function: wouldCreateCycle]
dfs[Function: dfs]
addParentChildRelation[Function: addParentChildRelation]
connectionTags[Function: connectionTags]
addTag[Function: addTag]
existingConnectionPairs[Function: existingConnectionPairs]
getFaceForObject[Function: getFaceForObject]
computeFaceWorldPosition[Function: computeFaceWorldPosition]
calculateDodecahedronFaceCenter[Function: calculateDodecahedronFaceCenter]
connectionsByCell[Function: connectionsByCell]
moveComponentTree[Function: moveComponentTree]
getComponentChildren[Function: getComponentChildren]
checkOverlap[Function: checkOverlap]
containersByLevel[Function: containersByLevel]
calculateGroupSpacing[Function: calculateGroupSpacing]
calculateGroupBounds[Function: calculateGroupBounds]
positionGroup[Function: positionGroup]
nodePositions[Function: nodePositions]
nodeScales[Function: nodeScales]
processedNodes[Function: processedNodes]
existingNodeIdMap[Function: existingNodeIdMap]
calculateHeaderStyle[Function: calculateHeaderStyle]
setUserPresence[Function: setUserPresence]
getGuestId[Function: getGuestId]
setGuestPresence[Function: setGuestPresence]
subscribeToSpacePresence[Function: subscribeToSpacePresence]
reader[Function: reader]
nodeToObjectIdMap[Function: nodeToObjectIdMap]
ScreenRecordingService[Function: ScreenRecordingService]
rawBlob[Function: rawBlob]
screenRecorder[Function: screenRecorder]
UnifiedCacheManager[Function: UnifiedCacheManager]
unifiedCacheManager[Function: unifiedCacheManager]
_disposedWeakSet[Function: _disposedWeakSet]
ResourceCleanupService[Function: ResourceCleanupService]
resourceCleanupService[Function: resourceCleanupService]
objectsCache[Function: objectsCache]
saveTimeouts[Function: saveTimeouts]
updateThrottles[Function: updateThrottles]
lastReceivedObjects[Function: lastReceivedObjects]
movingObjects[Function: movingObjects]
objectCellMap[Function: objectCellMap]
deletingObjects[Function: deletingObjects]
clearAllObjectCaches[Function: clearAllObjectCaches]
removeObjectFromCaches[Function: removeObjectFromCaches]
saveObjectToCell[Function: saveObjectToCell]
deleteObjectFromSpatialCell[Function: deleteObjectFromSpatialCell]
updateObjectInSpatialCell[Function: updateObjectInSpatialCell]
clearCellCache[Function: clearCellCache]
objectSubscriptionsByCell[Function: objectSubscriptionsByCell]
subscribeToSpatialObjects[Function: subscribeToSpatialObjects]
localSubscriptionKeys[Function: localSubscriptionKeys]
updateCellSubscriptions[Function: updateCellSubscriptions]
moveObjectBetweenCells[Function: moveObjectBetweenCells]
loadObjectsFromCells[Function: loadObjectsFromCells]
saveObject[Function: saveObject]
deleteObject[Function: deleteObject]
updateObject[Function: updateObject]
subscribeToObjects[Function: subscribeToObjects]
getObjectDeletionStatus[Function: getObjectDeletionStatus]
clearObjectDeletionBlacklist[Function: clearObjectDeletionBlacklist]
getSpaceById[Function: getSpaceById]
createSpace[Function: createSpace]
getOrCreateDefaultSpace[Function: getOrCreateDefaultSpace]
migrateToDefaultSpace[Function: migrateToDefaultSpace]
getUserSpaces[Function: getUserSpaces]
deleteSpace[Function: deleteSpace]
hasSpaceAccess[Function: hasSpaceAccess]
getPublicSpaceMetadata[Function: getPublicSpaceMetadata]
sharedSpacesCache[Function: sharedSpacesCache]
isSharedSpace[Function: isSharedSpace]
checkSpaceExists[Function: checkSpaceExists]
registerSharedSpaceFromUrl[Function: registerSharedSpaceFromUrl]
getSpaceOwner[Function: getSpaceOwner]
findSpaceOwner[Function: findSpaceOwner]
urlParams[Function: urlParams]
cellExistenceCache[Function: cellExistenceCache]
cleanupCache[Function: cleanupCache]
getCellCoordinates[Function: getCellCoordinates]
getCellCoordinatesWithHysteresis[Function: getCellCoordinatesWithHysteresis]
getCellId[Function: getCellId]
parseCellId[Function: parseCellId]
getCellBounds[Function: getCellBounds]
createCell[Function: createCell]
createCellsBatch[Function: createCellsBatch]
createCellsBatchOptimized[Function: createCellsBatchOptimized]
cellExists[Function: cellExists]
cellExistsBulk[Function: cellExistsBulk]
getCell[Function: getCell]
addObjectToCell[Function: addObjectToCell]
removeObjectFromCell[Function: removeObjectFromCell]
getLoadedCells[Function: getLoadedCells]
getObjectsFromCells[Function: getObjectsFromCells]
updateObjectInCell[Function: updateObjectInCell]
deleteObjectFromCell[Function: deleteObjectFromCell]
cellCallbacks[Function: cellCallbacks]
subscribeToCells[Function: subscribeToCells]
getOccupiedCells[Function: getOccupiedCells]
getCellDistance[Function: getCellDistance]
getCellsToUnload[Function: getCellsToUnload]
addConnectionToCells[Function: addConnectionToCells]
bulkSaveConnectionsToCell[Function: bulkSaveConnectionsToCell]
addConnectionToCell[Function: addConnectionToCell]
removeConnectionFromAllCells[Function: removeConnectionFromAllCells]
normalizePosition[Function: normalizePosition]
removeConnectionFromCells[Function: removeConnectionFromCells]
removeConnectionFromCell[Function: removeConnectionFromCell]
getConnectionsFromCells[Function: getConnectionsFromCells]
seenConnectionIds[Function: seenConnectionIds]
updateConnectionInCells[Function: updateConnectionInCells]
getCellsInRadius[Function: getCellsInRadius]
getNeighborCells[Function: getNeighborCells]
debugCellRadius[Function: debugCellRadius]
debugNeighborCells[Function: debugNeighborCells]
debugCurrentCellLoading[Function: debugCurrentCellLoading]
findObjectInCells[Function: findObjectInCells]
getAllObjectsInSpace[Function: getAllObjectsInSpace]
findConnectionInCells[Function: findConnectionInCells]
purgeConnectionFromAllCells[Function: purgeConnectionFromAllCells]
deleteAllCellsInSpace[Function: deleteAllCellsInSpace]
generateSharingUrl[Function: generateSharingUrl]
sharingUrl[Function: sharingUrl]
getSharedSpaceInfo[Function: getSharedSpaceInfo]
StreamlinedSpatialManager[Function: StreamlinedSpatialManager]
getStreamlinedSpatialManager[Function: getStreamlinedSpatialManager]
initializeStreamlinedSpatialPartitioning[Function: initializeStreamlinedSpatialPartitioning]
benchmarkStreamlinedSystem[Function: benchmarkStreamlinedSystem]
manager[Function: manager]
getStorageInstance[Function: getStorageInstance]
ALLOWED_IMAGE_TYPES[Function: ALLOWED_IMAGE_TYPES]
uploadFileGeneric[Function: uploadFileGeneric]
uploadImageToStorage[Function: uploadImageToStorage]
uploadModelToStorage[Function: uploadModelToStorage]
uploadMarkdownToStorage[Function: uploadMarkdownToStorage]
blob[Function: blob]
activeStreams[Function: activeStreams]
getRTCConfiguration[Function: getRTCConfiguration]
initWebRTC[Function: initWebRTC]
BroadcastSession[Function: BroadcastSession]
peerConnection[Function: peerConnection]
startBroadcasting[Function: startBroadcasting]
broadcastSession[Function: broadcastSession]
joinBroadcast[Function: joinBroadcast]
isPlaneBeingBroadcast[Function: isPlaneBeingBroadcast]
findAvailableBroadcasts[Function: findAvailableBroadcasts]
cleanupWebRTC[Function: cleanupWebRTC]
registerUserPresence[Function: registerUserPresence]
subscribeToUsersInSpace[Function: subscribeToUsersInSpace]
activeUsers[Function: activeUsers]
fiveMinutesAgo[Function: fiveMinutesAgo]

%% Stores
useAuthStore[[Store: useAuthStore]]
useFaceStore[[Store: useFaceStore]]
useConnectionStore[[Store: useConnectionStore]]
useDodecahedronStore[[Store: useDodecahedronStore]]
useAnimatedConnectionLineStore[[Store: useAnimatedConnectionLineStore]]
useFaceIndicatorStore[[Store: useFaceIndicatorStore]]
useColorPickerStore[[Store: useColorPickerStore]]
useCubeStore[[Store: useCubeStore]]
useSpatialManagerStore[[Store: useSpatialManagerStore]]
useSpaceManagerStore[[Store: useSpaceManagerStore]]
usePublicSpaceStore[[Store: usePublicSpaceStore]]
usePlaneStore[[Store: usePlaneStore]]
useObjectsStore[[Store: useObjectsStore]]
useLODStore[[Store: useLODStore]]
useIndicatorsStore[[Store: useIndicatorsStore]]
useScreenShareStore[[Store: useScreenShareStore]]
useTetrahedronStore[[Store: useTetrahedronStore]]
useUIOverlayStore[[Store: useUIOverlayStore]]
useTextInputStore[[Store: useTextInputStore]]
useTransformControlsStore[[Store: useTransformControlsStore]]
useTextObjectStore[[Store: useTextObjectStore]]
useWebcamStreamStore[[Store: useWebcamStreamStore]]

%% Utilities
ConnectionAnimationManager[Function: ConnectionAnimationManager]
spaceId[Function: spaceId]
stableLoadedCells[Function: stableLoadedCells]
connectionCallback[Function: connectionCallback]
enhancedConnectionCallback[Function: enhancedConnectionCallback]
handleLineStyleChange[Function: handleLineStyleChange]
handleLineColorChange[Function: handleLineColorChange]
handleConnectionClick[Function: handleConnectionClick]
handleLineTextClick[Function: handleLineTextClick]
handleLineTextSubmit[Function: handleLineTextSubmit]
handleLineTextStyleChange[Function: handleLineTextStyleChange]
isPointInFrustum[Function: isPointInFrustum]
isConnectionVisible[Function: isConnectionVisible]
objectPositions[Function: objectPositions]
visibleConnections[Function: visibleConnections]
initializeResources[Function: initializeResources]
handleGlobalClick[Function: handleGlobalClick]
handleCreateObject[Function: handleCreateObject]
handleObjectDelete[Function: handleObjectDelete]
registerTransformingObject[Function: registerTransformingObject]
getConnectionStateSelector[Function: getConnectionStateSelector]
cleanupStaleSelectors[Function: cleanupStaleSelectors]
actionsSelector[Function: actionsSelector]
selector[Function: selector]
cleanup[Function: cleanup]
calculateObjectLOD[Function: calculateObjectLOD]
loadedCellsKey[Function: loadedCellsKey]
memoizedLoadedCells[Function: memoizedLoadedCells]
setupCameraListeners[Function: setupCameraListeners]
handleCameraMove[Function: handleCameraMove]
addObjectToSpatialSystemWrapper[Function: addObjectToSpatialSystemWrapper]
moveObjectInSpatialSystemWrapper[Function: moveObjectInSpatialSystemWrapper]
loadCellWrapper[Function: loadCellWrapper]
updateCameraPositionWrapper[Function: updateCameraPositionWrapper]
updateTexture[Function: updateTexture]
setNamedTimeout[Function: setNamedTimeout]
clearNamedTimeout[Function: clearNamedTimeout]
clearAllTimeouts[Function: clearAllTimeouts]
hasActiveTimeout[Function: hasActiveTimeout]
getTimeoutId[Function: getTimeoutId]
monitorConnection[Function: monitorConnection]
connectionHandler[Function: connectionHandler]
initAuth[Function: initAuth]
getCellCoords[Function: getCellCoords]
getCellIdFromCoords[Function: getCellIdFromCoords]
getCubeSelector[Function: getCubeSelector]
getCubeFaceColorSelector[Function: getCubeFaceColorSelector]
getCubeSelectedFaceSelector[Function: getCubeSelectedFaceSelector]
getCubeFaceStateSelector[Function: getCubeFaceStateSelector]
numericHash[Function: numericHash]
calculateLODLevel[Function: calculateLODLevel]
calculateParentLODLevel[Function: calculateParentLODLevel]
validateConnection[Function: validateConnection]
getIndicatorId[Function: getIndicatorId]
getConnectionKey[Function: getConnectionKey]
prepareTextObjectIndicator[Function: prepareTextObjectIndicator]
objectsAreConnectedInStore[Function: objectsAreConnectedInStore]
getConnectionsForObject[Function: getConnectionsForObject]
createConnectionInStore[Function: createConnectionInStore]
updateConnectionPositionsInStore[Function: updateConnectionPositionsInStore]
removeConnectionsForObject[Function: removeConnectionsForObject]
isInConnectionCreationMode[Function: isInConnectionCreationMode]
startConnectionCreation[Function: startConnectionCreation]
completeConnectionCreation[Function: completeConnectionCreation]
cancelConnectionCreation[Function: cancelConnectionCreation]
setCellBoundariesVisible[Function: setCellBoundariesVisible]
useStoreInitialization[Function: useStoreInitialization]
useCubeSelectors[Function: useCubeSelectors]
useCubeActions[Function: useCubeActions]
usePlaneSelectors[Function: usePlaneSelectors]
usePlaneActions[Function: usePlaneActions]
useGlobalStoreUtils[Function: useGlobalStoreUtils]
clearAllSelections[Function: clearAllSelections]
resetAllStores[Function: resetAllStores]
animatedMaterials[Function: animatedMaterials]
registerMaterial[Function: registerMaterial]
unregisterMaterial[Function: unregisterMaterial]
setAnimationSpeed[Function: setAnimationSpeed]
startAnimationLoop[Function: startAnimationLoop]
animate[Function: animate]
stopAnimationLoop[Function: stopAnimationLoop]
initAnimationSystem[Function: initAnimationSystem]
BVHNode[Function: BVHNode]
BVHAcceleratedRaycaster[Function: BVHAcceleratedRaycaster]
leftChild[Function: leftChild]
rightChild[Function: rightChild]
initBVHRaycasting[Function: initBVHRaycasting]
getBVH[Function: getBVH]
updateBVHObjects[Function: updateBVHObjects]
bvhIntersectObjects[Function: bvhIntersectObjects]
getBVHStats[Function: getBVHStats]
updateLODLevels[Function: updateLODLevels]
registerObjectRelationships[Function: registerObjectRelationships]
calculateFacePosition[Function: calculateFacePosition]
calculateFaceCenter[Function: calculateFaceCenter]
intersectionCache[Function: intersectionCache]
pathCache[Function: pathCache]
objectPositionCache[Function: objectPositionCache]
invalidatePathfindingCaches[Function: invalidatePathfindingCaches]
checkObjectMovement[Function: checkObjectMovement]
cleanCaches[Function: cleanCaches]
roundForCache[Function: roundForCache]
lineIntersectsBoundingBox[Function: lineIntersectsBoundingBox]
generateCacheKey[Function: generateCacheKey]
havePositionsChanged[Function: havePositionsChanged]
checkLineIntersection[Function: checkLineIntersection]
d[Function: d]
generateCurvedPath[Function: generateCurvedPath]
checkCurveIntersections[Function: checkCurveIntersections]
generateMultiSegmentPath[Function: generateMultiSegmentPath]
GPUResourceTracker[Function: GPUResourceTracker]
gpuTracker[Function: gpuTracker]
FrameCounter[Function: FrameCounter]
frameCounter[Function: frameCounter]
logAnimation[Function: logAnimation]
forceAnimateConnection[Function: forceAnimateConnection]
shouldAnimateConnection[Function: shouldAnimateConnection]
recordFrameTime[Function: recordFrameTime]
recordStateUpdate[Function: recordStateUpdate]
getPerfStats[Function: getPerfStats]
resetPerfStats[Function: resetPerfStats]
handleFaceIndicatorClick[Function: handleFaceIndicatorClick]
getIdFromIndicator[Function: getIdFromIndicator]
handleObjectMove[Function: handleObjectMove]
handleObjectUpdate[Function: handleObjectUpdate]
getIsInitialLoading[Function: getIsInitialLoading]
setIsInitialLoading[Function: setIsInitialLoading]
LinePool[Function: LinePool]
geometry[Function: geometry]
positions[Function: positions]
getLinePool[Function: getLinePool]
clearLinePool[Function: clearLinePool]
ObjectVirtualizer[Function: ObjectVirtualizer]
getMaxObjects[Function: getMaxObjects]
objectVirtualizer[Function: objectVirtualizer]
loadTextureFromFirebaseUrl[Function: loadTextureFromFirebaseUrl]
url[Function: url]
img[Function: img]
loadTextureFromBlob[Function: loadTextureFromBlob]
throttle[Function: throttle]
debounce[Function: debounce]
measurePerformance[Function: measurePerformance]
scheduleWork[Function: scheduleWork]
memoize[Function: memoize]
createCacheKey[Function: createCacheKey]
trackLCP[Function: trackLCP]
observer[Function: observer]
calculateMidpoint[Function: calculateMidpoint]
calculateMidpointVector[Function: calculateMidpointVector]
lerp[Function: lerp]
checkPositionJitter[Function: checkPositionJitter]
TextAtlas[Function: TextAtlas]
MultiPageTextAtlas[Function: MultiPageTextAtlas]
page[Function: page]
getGlobalTextAtlas[Function: getGlobalTextAtlas]
resetGlobalTextAtlas[Function: resetGlobalTextAtlas]
createAtlasTextMesh[Function: createAtlasTextMesh]
calculateAxisSnap[Function: calculateAxisSnap]
distanceToAxis[Function: distanceToAxis]
projectPointOntoAxis[Function: projectPointOntoAxis]
Point3D[Function: Point3D]
BoundingBox[Function: BoundingBox]
OptimizedSpatialGrid[Function: OptimizedSpatialGrid]
seenObjects[Function: seenObjects]
createStreamlinedSpatialIndex[Function: createStreamlinedSpatialIndex]
benchmarkStreamlined[Function: benchmarkStreamlined]
position[Function: position]
center[Function: center]
_frameTimeTracker[Function: _frameTimeTracker]
_resetForNextFrame[Function: _resetForNextFrame]
acquireBudget[Function: acquireBudget]
setFrameBudget[Function: setFrameBudget]
getFrameBudget[Function: getFrameBudget]
notifyCameraMove[Function: notifyCameraMove]
isCameraMoving[Function: isCameraMoving]
isCameraMovingRapidly[Function: isCameraMovingRapidly]
isFrameBudgetExhausted[Function: isFrameBudgetExhausted]
getSmoothedFrameTime[Function: getSmoothedFrameTime]
cleanObject[Function: cleanObject]
validateRequiredProperties[Function: validateRequiredProperties]
validateObjectSchema[Function: validateObjectSchema]
isValidPosition[Function: isValidPosition]
validatePosition[Function: validatePosition]
validatePositionBounds[Function: validatePositionBounds]
validateConnectionData[Function: validateConnectionData]
validateIndicator[Function: validateIndicator]
validateFile[Function: validateFile]
validateObjectId[Function: validateObjectId]
validateSpaceId[Function: validateSpaceId]
validateUserId[Function: validateUserId]
validateUrl[Function: validateUrl]
urlObj[Function: urlObj]
validateEmail[Function: validateEmail]
validateArray[Function: validateArray]
validateMultiple[Function: validateMultiple]

%% External Libraries
firebase-admin/app<Library: firebase-admin/app>
firebase-admin/auth<Library: firebase-admin/auth>
firebase-admin/firestore<Library: firebase-admin/firestore>
firebase-functions/v2/https<Library: firebase-functions/v2/https>
firebase-functions/params<Library: firebase-functions/params>
express<Library: express>
cors<Library: cors>
dotenv<Library: dotenv>
react<Library: react>
@react-three/fiber<Library: @react-three/fiber>
@react-three/postprocessing<Library: @react-three/postprocessing>
@react-three/drei/core/Stats<Library: @react-three/drei/core/Stats>
lodash/isEqual<Library: lodash/isEqual>
three<Library: three>
@react-three/drei<Library: @react-three/drei>
@eslint/js<Library: @eslint/js>
globals<Library: globals>
eslint-plugin-react<Library: eslint-plugin-react>
eslint-plugin-react-hooks<Library: eslint-plugin-react-hooks>
eslint-plugin-react-refresh<Library: eslint-plugin-react-refresh>
react-colorful<Library: react-colorful>
zustand/shallow<Library: zustand/shallow>
three/examples/jsm/lines/Line2.js<Library: three/examples/jsm/lines/Line2.js>
three/examples/jsm/loaders/GLTFLoader<Library: three/examples/jsm/loaders/GLTFLoader>
three/examples/jsm/loaders/DRACOLoader<Library: three/examples/jsm/loaders/DRACOLoader>
firebase/database<Library: firebase/database>
firebase/auth<Library: firebase/auth>
zustand<Library: zustand>
firebase/app<Library: firebase/app>
firebase/firestore<Library: firebase/firestore>
firebase/storage<Library: firebase/storage>
@babel/parser<Library: @babel/parser>
react-dom/client<Library: react-dom/client>
3d-ast-generator<Library: 3d-ast-generator>
fix-webm-duration<Library: fix-webm-duration>
uuid<Library: uuid>
zustand/traditional<Library: zustand/traditional>
three/examples/jsm/lines/LineGeometry.js<Library: three/examples/jsm/lines/LineGeometry.js>
three/examples/jsm/lines/LineMaterial.js<Library: three/examples/jsm/lines/LineMaterial.js>
vite<Library: vite>
@vitejs/plugin-react<Library: @vitejs/plugin-react>
vite-plugin-glsl<Library: vite-plugin-glsl>

%% Component Internal Functions
appObjects[Function: appObjects]
appCanViewSpace[Function: appCanViewSpace]
appShouldRedirect[Function: appShouldRedirect]
appSpatialManagerDebug[Function: appSpatialManagerDebug]
appCheckPositionJitterWithHistory[Function: appCheckPositionJitterWithHistory]
appLoadedCellsKey[Function: appLoadedCellsKey]
appPerformInitialObjectFetch[Function: appPerformInitialObjectFetch]
appScheduleLoadingComplete[Function: appScheduleLoadingComplete]
appDisableOrbitControls[Function: appDisableOrbitControls]
appEnableOrbitControls[Function: appEnableOrbitControls]
appUpdateVisibleObjects[Function: appUpdateVisibleObjects]
appThrottledUpdateVisibility[Function: appThrottledUpdateVisibility]
appDeviceInfo[Function: appDeviceInfo]
appCanvasSettings[Function: appCanvasSettings]
cellboundaryrendererCellsToRender[Function: cellboundaryrendererCellsToRender]
cellboundaryrendererGeometry[Function: cellboundaryrendererGeometry]
animatedconnectionlineStructuralKey[Function: animatedconnectionlineStructuralKey]
atlastextspriteAtlas[Function: atlastextspriteAtlas]
atlastextspriteCalculatedPosition[Function: atlastextspriteCalculatedPosition]
batchedconnectionlinesStraightConnections[Function: batchedconnectionlinesStraightConnections]
batchedconnectionlinesCustomRaycast[Function: batchedconnectionlinesCustomRaycast]
batchedcurvedlinesPathsData[Function: batchedcurvedlinesPathsData]
batchedcurvedlinesCustomRaycast[Function: batchedcurvedlinesCustomRaycast]
containeroutlineCubeEdges[Function: containeroutlineCubeEdges]
faceindicatorMaterial[Function: faceindicatorMaterial]
cubefaceFaceStateSelector[Function: cubefaceFaceStateSelector]
cubefaceFaceMaterial[Function: cubefaceFaceMaterial]
cubefaceOffsetMultiplier[Function: cubefaceOffsetMultiplier]
cubefaceOffsetPosition[Function: cubefaceOffsetPosition]
distancefilteredconnectiontextGetTextParametricT[Function: distancefilteredconnectiontextGetTextParametricT]
distancefilteredconnectiontextRedistributeFaces[Function: distancefilteredconnectiontextRedistributeFaces]
distancefilteredconnectiontextPathToLineSegments[Function: distancefilteredconnectiontextPathToLineSegments]
distancefilteredconnectiontextResolveEndpointPosition[Function: distancefilteredconnectiontextResolveEndpointPosition]
distancefilteredconnectiontextGetLineWidth[Function: distancefilteredconnectiontextGetLineWidth]
distancefilteredconnectiontextConnectionData[Function: distancefilteredconnectiontextConnectionData]
distancefilteredconnectiontextNearbyObjectsHash[Function: distancefilteredconnectiontextNearbyObjectsHash]
distancefilteredconnectiontextPathData[Function: distancefilteredconnectiontextPathData]
distancefilteredconnectiontextTextPositionData[Function: distancefilteredconnectiontextTextPositionData]
distancefilteredconnectiontextAvailableObjectIds[Function: distancefilteredconnectiontextAvailableObjectIds]
distancefilteredconnectiontextPathfindingObjects[Function: distancefilteredconnectiontextPathfindingObjects]
distancefilteredconnectiontextObjectVisibleConnections[Function: distancefilteredconnectiontextObjectVisibleConnections]
distancefilteredconnectiontextFocusedConnections[Function: distancefilteredconnectiontextFocusedConnections]
distancefilteredconnectiontextFlowPathHighlightedConnections[Function: distancefilteredconnectiontextFlowPathHighlightedConnections]
distancefilteredconnectiontextConnectionsForCulling[Function: distancefilteredconnectiontextConnectionsForCulling]
distancefilteredconnectiontextMountNextBatch[Function: distancefilteredconnectiontextMountNextBatch]
distancefilteredconnectiontextProgressiveConnections[Function: distancefilteredconnectiontextProgressiveConnections]
distancefilteredconnectiontextObjectPositions[Function: distancefilteredconnectiontextObjectPositions]
distancefilteredconnectiontextAllStraightConnections[Function: distancefilteredconnectiontextAllStraightConnections]
distancefilteredconnectiontextFaceOverrides[Function: distancefilteredconnectiontextFaceOverrides]
distancefilteredconnectiontextTextLabels[Function: distancefilteredconnectiontextTextLabels]
cubeCubeData[Function: cubeCubeData]
cubeIsIndicatorConnected[Function: cubeIsIndicatorConnected]
cubeIsIndicatorActive[Function: cubeIsIndicatorActive]
cubeGetUIPositions[Function: cubeGetUIPositions]
cubeShouldShowIndicator[Function: cubeShouldShowIndicator]
cubeGetFaceTextOffset[Function: cubeGetFaceTextOffset]
cubeUpdateDatabase[Function: cubeUpdateDatabase]
cubeDebouncedUpdate[Function: cubeDebouncedUpdate]
cubeRenderFaces[Function: cubeRenderFaces]
cubeRenderFaceTexts[Function: cubeRenderFaceTexts]
cubeArraysEqual[Function: cubeArraysEqual]
cubeShallowObjEqual[Function: cubeShallowObjEqual]
sphereDodecahedronData[Function: sphereDodecahedronData]
sphereUpdateObjectAndStores[Function: sphereUpdateObjectAndStores]
sphereUpdateFaceProperty[Function: sphereUpdateFaceProperty]
sphereIsIndicatorConnected[Function: sphereIsIndicatorConnected]
sphereUpdateDatabase[Function: sphereUpdateDatabase]
sphereGetUIPosition[Function: sphereGetUIPosition]
sphereGetHeaderPosition[Function: sphereGetHeaderPosition]
sphereGetFaceUIPosition[Function: sphereGetFaceUIPosition]
sphereGetFaceTextPosition[Function: sphereGetFaceTextPosition]
sphereGetFaceInfo[Function: sphereGetFaceInfo]
sphereGetFaceRotation[Function: sphereGetFaceRotation]
sphereShouldShowFaceIndicator[Function: sphereShouldShowFaceIndicator]
sphereGetHeaderInputPosition[Function: sphereGetHeaderInputPosition]
dodecahedronfaceFaceMaterial[Function: dodecahedronfaceFaceMaterial]
dodecahedronfaceInverseScale[Function: dodecahedronfaceInverseScale]
dodecahedronfaceAdjustedTextPosition[Function: dodecahedronfaceAdjustedTextPosition]
customcameraMemoizedTarget[Function: customcameraMemoizedTarget]
customcameraControlsRefCallback[Function: customcameraControlsRefCallback]
globaldodecahedronedgesrendererFilteredDodecahedrons[Function: globaldodecahedronedgesrendererFilteredDodecahedrons]
globaldodecahedronedgesrendererDodecahedronIds[Function: globaldodecahedronedgesrendererDodecahedronIds]
globaldodecahedronedgesrendererIsDodecahedronVisible[Function: globaldodecahedronedgesrendererIsDodecahedronVisible]
globaldodecahedronedgesrendererUpdateDodecahedronEdges[Function: globaldodecahedronedgesrendererUpdateDodecahedronEdges]
globaltetrahedronedgesrendererFilteredTetrahedrons[Function: globaltetrahedronedgesrendererFilteredTetrahedrons]
globaltetrahedronedgesrendererTetrahedronIds[Function: globaltetrahedronedgesrendererTetrahedronIds]
globaltetrahedronedgesrendererIsTetrahedronVisible[Function: globaltetrahedronedgesrendererIsTetrahedronVisible]
globaltetrahedronedgesrendererUpdateTetrahedronEdges[Function: globaltetrahedronedgesrendererUpdateTetrahedronEdges]
lodmanagerContainersKey[Function: lodmanagerContainersKey]
globalcubeedgesrendererFilteredCubes[Function: globalcubeedgesrendererFilteredCubes]
globalcubeedgesrendererCubeIds[Function: globalcubeedgesrendererCubeIds]
globalcubeedgesrendererIsCubeVisible[Function: globalcubeedgesrendererIsCubeVisible]
globalcubeedgesrendererUpdateCubeEdges[Function: globalcubeedgesrendererUpdateCubeEdges]
instancedatlastextAtlas[Function: instancedatlastextAtlas]
instancedatlastextPageGroups[Function: instancedatlastextPageGroups]
instancedatlastextGeometry[Function: instancedatlastextGeometry]
instancedatlastextMaterial[Function: instancedatlastextMaterial]
instancedlineFlatPoints[Function: instancedlineFlatPoints]
instancedlineGeometry[Function: instancedlineGeometry]
instancedlineCustomRaycast[Function: instancedlineCustomRaycast]
instancedlineMaterial[Function: instancedlineMaterial]
objectsrendererMountNextBatch[Function: objectsrendererMountNextBatch]
objectsrendererProgressiveVisibleObjects[Function: objectsrendererProgressiveVisibleObjects]
objectsrendererCubeObjects[Function: objectsrendererCubeObjects]
objectsrendererDodecahedronObjects[Function: objectsrendererDodecahedronObjects]
objectsrendererTetrahedronObjects[Function: objectsrendererTetrahedronObjects]
objectsrendererRenderedObjects[Function: objectsrendererRenderedObjects]
planePlaneData[Function: planePlaneData]
planeCloseAllUIs[Function: planeCloseAllUIs]
planeUpdateDatabase[Function: planeUpdateDatabase]
planeIsIndicatorConnected[Function: planeIsIndicatorConnected]
planeShouldShowIndicator[Function: planeShouldShowIndicator]
planeUiPositions[Function: planeUiPositions]
planeIndicatorPosition[Function: planeIndicatorPosition]
planeMeshMaterial[Function: planeMeshMaterial]
planeLineMaterialProps[Function: planeLineMaterialProps]
planeBorderEdgePoints[Function: planeBorderEdgePoints]
realtimeconnectionupdaterRunConnectionUpdate[Function: realtimeconnectionupdaterRunConnectionUpdate]
realtimeconnectionupdaterUpdateConnectionEndpoint[Function: realtimeconnectionupdaterUpdateConnectionEndpoint]
objectrendererArraysEqual[Function: objectrendererArraysEqual]
lineuiGetFullStyle[Function: lineuiGetFullStyle]
lineuiGetBaseStyle[Function: lineuiGetBaseStyle]
screensharestreamScreenShareConstraints[Function: screensharestreamScreenShareConstraints]
screensharestreamAttemptPlay[Function: screensharestreamAttemptPlay]
screensharestreamConnectToBroadcast[Function: screensharestreamConnectToBroadcast]
tetrahedronTetrahedronFaces[Function: tetrahedronTetrahedronFaces]
tetrahedronDebouncedUpdate[Function: tetrahedronDebouncedUpdate]
tetrahedronIsIndicatorConnected[Function: tetrahedronIsIndicatorConnected]
tetrahedronIsIndicatorActive[Function: tetrahedronIsIndicatorActive]
tetrahedronGetUIPositions[Function: tetrahedronGetUIPositions]
tetrahedronShouldShowIndicator[Function: tetrahedronShouldShowIndicator]
tetrahedronTetrahedronEdgePoints[Function: tetrahedronTetrahedronEdgePoints]
tetrahedronUpdateDatabase[Function: tetrahedronUpdateDatabase]
tetrahedronGetFaceTextOffset[Function: tetrahedronGetFaceTextOffset]
tetrahedronRenderFaceTexts[Function: tetrahedronRenderFaceTexts]
tetrahedronRenderFaces[Function: tetrahedronRenderFaces]
tetrahedronfaceFaceMaterial[Function: tetrahedronfaceFaceMaterial]
tetrahedronfaceGetFaceTextOffset[Function: tetrahedronfaceGetFaceTextOffset]
tetrahedronfaceFaceTextElement[Function: tetrahedronfaceFaceTextElement]
textspriteSpriteId[Function: textspriteSpriteId]
textspriteSetIsDragging[Function: textspriteSetIsDragging]
textspriteCalculatedPosition[Function: textspriteCalculatedPosition]
textspriteGetFontSize[Function: textspriteGetFontSize]
textobjectText[Function: textobjectText]
textobjectTextStyle[Function: textobjectTextStyle]
textobjectScale[Function: textobjectScale]
textobjectSetOrbitControlsEnabled[Function: textobjectSetOrbitControlsEnabled]
textobjectSetText[Function: textobjectSetText]
textobjectSetTextStyle[Function: textobjectSetTextStyle]
textobjectSetScale[Function: textobjectSetScale]
textobjectSetIsEditing[Function: textobjectSetIsEditing]
textobjectSetIsActivelyEditing[Function: textobjectSetIsActivelyEditing]
textobjectSetIndicatorSelected[Function: textobjectSetIndicatorSelected]
textobjectSetContentHeight[Function: textobjectSetContentHeight]
textobjectSetShowTransform[Function: textobjectSetShowTransform]
textobjectSetShowResizeControls[Function: textobjectSetShowResizeControls]
textobjectSetBulletPointMode[Function: textobjectSetBulletPointMode]
textobjectGetIndicatorOffset[Function: textobjectGetIndicatorOffset]
textobjectIsIndicatorConnected[Function: textobjectIsIndicatorConnected]
textobjectShouldShowIndicator[Function: textobjectShouldShowIndicator]
textobjectGetIndicatorPositions[Function: textobjectGetIndicatorPositions]
textobjectUpdateWorldMatrix[Function: textobjectUpdateWorldMatrix]
textobjectCloseAllUIs[Function: textobjectCloseAllUIs]
textobjectUpdateDatabase[Function: textobjectUpdateDatabase]
textobjectAutoResizeTextAreaOnly[Function: textobjectAutoResizeTextAreaOnly]
textobjectAutoResizeTextArea[Function: textobjectAutoResizeTextArea]
textobjectApplyStyleToSelectionInternal[Function: textobjectApplyStyleToSelectionInternal]
textobjectGetTextAreaStyle[Function: textobjectGetTextAreaStyle]
textobjectGetContainerStyle[Function: textobjectGetContainerStyle]
textobjectGetEffectivePosition[Function: textobjectGetEffectivePosition]
textobjectGetTransformControlSize[Function: textobjectGetTransformControlSize]
textstyleuicontentGetUIScale[Function: textstyleuicontentGetUIScale]
uioverlaySetIsRecording[Function: uioverlaySetIsRecording]
uioverlayFetchRepositories[Function: uioverlayFetchRepositories]
uioverlayFetchAppJsxFromRepo[Function: uioverlayFetchAppJsxFromRepo]
uioverlayHandler[Function: uioverlayHandler]
uioverlayCreateTemplate[Function: uioverlayCreateTemplate]
webcamstreamAttemptPlay[Function: webcamstreamAttemptPlay]
webcamstreamConnectToBroadcast[Function: webcamstreamConnectToBroadcast]

%% Component-Function Relationships
App -.-> appObjects : "internal function"
App -.-> appCanViewSpace : "internal function"
App -.-> appShouldRedirect : "boolean check"
App -.-> appSpatialManagerDebug : "internal function"
App -.-> appCheckPositionJitterWithHistory : "boolean check"
App -.-> appLoadedCellsKey : "internal function"
App -.-> appPerformInitialObjectFetch : "internal function"
App -.-> appScheduleLoadingComplete : "internal function"
App -.-> appDisableOrbitControls : "boolean check"
App -.-> appEnableOrbitControls : "internal function"
App -.-> appUpdateVisibleObjects : "update helper"
App -.-> appThrottledUpdateVisibility : "update helper"
App -.-> appDeviceInfo : "internal function"
App -.-> appCanvasSettings : "setter function"
CellBoundaryRenderer -.-> cellboundaryrendererCellsToRender : "render helper"
CellBoundaryRenderer -.-> cellboundaryrendererGeometry : "render helper"
AnimatedConnectionLine -.-> animatedconnectionlineStructuralKey : "internal function"
AtlasTextSprite -.-> atlastextspriteAtlas : "internal function"
AtlasTextSprite -.-> atlastextspriteCalculatedPosition : "calculation helper"
BatchedConnectionLines -.-> batchedconnectionlinesStraightConnections : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesCustomRaycast : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesPathsData : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesCustomRaycast : "internal function"
ContainerOutline -.-> containeroutlineCubeEdges : "internal function"
FaceIndicator -.-> faceindicatorMaterial : "internal function"
CubeFace -.-> cubefaceFaceStateSelector : "internal function"
CubeFace -.-> cubefaceFaceMaterial : "internal function"
CubeFace -.-> cubefaceOffsetMultiplier : "setter function"
CubeFace -.-> cubefaceOffsetPosition : "setter function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextGetTextParametricT : "getter function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextRedistributeFaces : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathToLineSegments : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextResolveEndpointPosition : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextGetLineWidth : "getter function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextConnectionData : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextNearbyObjectsHash : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathData : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextTextPositionData : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextAvailableObjectIds : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathfindingObjects : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextObjectVisibleConnections : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextFocusedConnections : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextFlowPathHighlightedConnections : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextConnectionsForCulling : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextMountNextBatch : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextProgressiveConnections : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextObjectPositions : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextAllStraightConnections : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextFaceOverrides : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextTextLabels : "boolean check"
Cube -.-> cubeCubeData : "internal function"
Cube -.-> cubeIsIndicatorConnected : "boolean check"
Cube -.-> cubeIsIndicatorActive : "boolean check"
Cube -.-> cubeGetUIPositions : "getter function"
Cube -.-> cubeShouldShowIndicator : "boolean check"
Cube -.-> cubeGetFaceTextOffset : "getter function"
Cube -.-> cubeUpdateDatabase : "update helper"
Cube -.-> cubeDebouncedUpdate : "update helper"
Cube -.-> cubeRenderFaces : "render helper"
Cube -.-> cubeRenderFaceTexts : "render helper"
Cube -.-> cubeArraysEqual : "internal function"
Cube -.-> cubeShallowObjEqual : "internal function"
Sphere -.-> sphereDodecahedronData : "internal function"
Sphere -.-> sphereUpdateObjectAndStores : "update helper"
Sphere -.-> sphereUpdateFaceProperty : "update helper"
Sphere -.-> sphereIsIndicatorConnected : "boolean check"
Sphere -.-> sphereUpdateDatabase : "update helper"
Sphere -.-> sphereGetUIPosition : "getter function"
Sphere -.-> sphereGetHeaderPosition : "getter function"
Sphere -.-> sphereGetFaceUIPosition : "getter function"
Sphere -.-> sphereGetFaceTextPosition : "getter function"
Sphere -.-> sphereGetFaceInfo : "getter function"
Sphere -.-> sphereGetFaceRotation : "getter function"
Sphere -.-> sphereShouldShowFaceIndicator : "boolean check"
Sphere -.-> sphereGetHeaderInputPosition : "getter function"
DodecahedronFace -.-> dodecahedronfaceFaceMaterial : "internal function"
DodecahedronFace -.-> dodecahedronfaceInverseScale : "internal function"
DodecahedronFace -.-> dodecahedronfaceAdjustedTextPosition : "internal function"
CustomCamera -.-> customcameraMemoizedTarget : "getter function"
CustomCamera -.-> customcameraControlsRefCallback : "internal function"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererFilteredDodecahedrons : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererDodecahedronIds : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererIsDodecahedronVisible : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererUpdateDodecahedronEdges : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererFilteredTetrahedrons : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererTetrahedronIds : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererIsTetrahedronVisible : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererUpdateTetrahedronEdges : "render helper"
LODManager -.-> lodmanagerContainersKey : "internal function"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererFilteredCubes : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererCubeIds : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererIsCubeVisible : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererUpdateCubeEdges : "render helper"
InstancedAtlasText -.-> instancedatlastextAtlas : "internal function"
InstancedAtlasText -.-> instancedatlastextPageGroups : "internal function"
InstancedAtlasText -.-> instancedatlastextGeometry : "internal function"
InstancedAtlasText -.-> instancedatlastextMaterial : "internal function"
InstancedLine -.-> instancedlineFlatPoints : "internal function"
InstancedLine -.-> instancedlineGeometry : "internal function"
InstancedLine -.-> instancedlineCustomRaycast : "internal function"
InstancedLine -.-> instancedlineMaterial : "internal function"
ObjectsRenderer -.-> objectsrendererMountNextBatch : "render helper"
ObjectsRenderer -.-> objectsrendererProgressiveVisibleObjects : "render helper"
ObjectsRenderer -.-> objectsrendererCubeObjects : "render helper"
ObjectsRenderer -.-> objectsrendererDodecahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererTetrahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererRenderedObjects : "render helper"
Plane -.-> planePlaneData : "internal function"
Plane -.-> planeCloseAllUIs : "boolean check"
Plane -.-> planeUpdateDatabase : "update helper"
Plane -.-> planeIsIndicatorConnected : "boolean check"
Plane -.-> planeShouldShowIndicator : "boolean check"
Plane -.-> planeUiPositions : "internal function"
Plane -.-> planeIndicatorPosition : "internal function"
Plane -.-> planeMeshMaterial : "internal function"
Plane -.-> planeLineMaterialProps : "internal function"
Plane -.-> planeBorderEdgePoints : "internal function"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRunConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterUpdateConnectionEndpoint : "update helper"
ObjectRenderer -.-> objectrendererArraysEqual : "render helper"
LineUI -.-> lineuiGetFullStyle : "getter function"
LineUI -.-> lineuiGetBaseStyle : "getter function"
ScreenShareStream -.-> screensharestreamScreenShareConstraints : "internal function"
ScreenShareStream -.-> screensharestreamAttemptPlay : "internal function"
ScreenShareStream -.-> screensharestreamConnectToBroadcast : "internal function"
Tetrahedron -.-> tetrahedronTetrahedronFaces : "internal function"
Tetrahedron -.-> tetrahedronDebouncedUpdate : "update helper"
Tetrahedron -.-> tetrahedronIsIndicatorConnected : "boolean check"
Tetrahedron -.-> tetrahedronIsIndicatorActive : "boolean check"
Tetrahedron -.-> tetrahedronGetUIPositions : "getter function"
Tetrahedron -.-> tetrahedronShouldShowIndicator : "boolean check"
Tetrahedron -.-> tetrahedronTetrahedronEdgePoints : "internal function"
Tetrahedron -.-> tetrahedronUpdateDatabase : "update helper"
Tetrahedron -.-> tetrahedronGetFaceTextOffset : "getter function"
Tetrahedron -.-> tetrahedronRenderFaceTexts : "render helper"
Tetrahedron -.-> tetrahedronRenderFaces : "render helper"
TetrahedronFace -.-> tetrahedronfaceFaceMaterial : "internal function"
TetrahedronFace -.-> tetrahedronfaceGetFaceTextOffset : "getter function"
TetrahedronFace -.-> tetrahedronfaceFaceTextElement : "internal function"
TextSprite -.-> textspriteSpriteId : "internal function"
TextSprite -.-> textspriteSetIsDragging : "setter function"
TextSprite -.-> textspriteCalculatedPosition : "calculation helper"
TextSprite -.-> textspriteGetFontSize : "getter function"
TextObject -.-> textobjectText : "internal function"
TextObject -.-> textobjectTextStyle : "internal function"
TextObject -.-> textobjectScale : "internal function"
TextObject -.-> textobjectSetOrbitControlsEnabled : "setter function"
TextObject -.-> textobjectSetText : "setter function"
TextObject -.-> textobjectSetTextStyle : "setter function"
TextObject -.-> textobjectSetScale : "setter function"
TextObject -.-> textobjectSetIsEditing : "setter function"
TextObject -.-> textobjectSetIsActivelyEditing : "setter function"
TextObject -.-> textobjectSetIndicatorSelected : "setter function"
TextObject -.-> textobjectSetContentHeight : "setter function"
TextObject -.-> textobjectSetShowTransform : "setter function"
TextObject -.-> textobjectSetShowResizeControls : "setter function"
TextObject -.-> textobjectSetBulletPointMode : "setter function"
TextObject -.-> textobjectGetIndicatorOffset : "getter function"
TextObject -.-> textobjectIsIndicatorConnected : "boolean check"
TextObject -.-> textobjectShouldShowIndicator : "boolean check"
TextObject -.-> textobjectGetIndicatorPositions : "getter function"
TextObject -.-> textobjectUpdateWorldMatrix : "update helper"
TextObject -.-> textobjectCloseAllUIs : "boolean check"
TextObject -.-> textobjectUpdateDatabase : "update helper"
TextObject -.-> textobjectAutoResizeTextAreaOnly : "internal function"
TextObject -.-> textobjectAutoResizeTextArea : "internal function"
TextObject -.-> textobjectApplyStyleToSelectionInternal : "internal function"
TextObject -.-> textobjectGetTextAreaStyle : "getter function"
TextObject -.-> textobjectGetContainerStyle : "getter function"
TextObject -.-> textobjectGetEffectivePosition : "getter function"
TextObject -.-> textobjectGetTransformControlSize : "getter function"
TextStyleUIContent -.-> textstyleuicontentGetUIScale : "getter function"
UIOverlay -.-> uioverlaySetIsRecording : "setter function"
UIOverlay -.-> uioverlayFetchRepositories : "internal function"
UIOverlay -.-> uioverlayFetchAppJsxFromRepo : "internal function"
UIOverlay -.-> uioverlayHandler : "event handler"
UIOverlay -.-> uioverlayCreateTemplate : "internal function"
WebcamStream -.-> webcamstreamAttemptPlay : "internal function"
WebcamStream -.-> webcamstreamConnectToBroadcast : "internal function"

%% File Container Nodes
backend_index((Service: index))
useConnectionObjects_file[Hook: useConnectionObjects]
useConnectionAnimationManager[Hook: useConnectionAnimationManager]
useAuth_file[Hook: useAuth]
useConnections_file[Hook: useConnections]
useAuthState_file[Hook: useAuthState]
useCentralizedBroadcastManager_file[Hook: useCentralizedBroadcastManager]
useFrustumCulling[Hook: useFrustumCulling]
useLinePool_file[Hook: useLinePool]
useIndicators_file[Hook: useIndicators]
useGlobalClickHandler_file[Hook: useGlobalClickHandler]
useObjects_file[Hook: useObjects]
useConnectionsRendererStore_file[Hook: useConnectionsRendererStore]
useDebouncedUpdate_file[Hook: useDebouncedUpdate]
useLOD_file[Hook: useLOD]
useSpatialManager_file[Hook: useSpatialManager]
useSpaceManager_file[Hook: useSpaceManager]
githubRepoService((Service: githubRepoService))
useTextureUpdater_file[Hook: useTextureUpdater]
useTimeoutManager_file[Hook: useTimeoutManager]
connectionsService((Service: connectionsService))
centralizedBroadcastManager_file((Service: centralizedBroadcastManager))
globalSubscriptionManager((Service: globalSubscriptionManager))
connectionPositionResolver((Service: connectionPositionResolver))
globalOptimizationCoordinator_file((Service: globalOptimizationCoordinator))
authService((Service: authService))
containerMethods((Service: containerMethods))
markdownDiagramService_file((Service: markdownDiagramService))
hierarchyMethods((Service: hierarchyMethods))
connectionMethods((Service: connectionMethods))
positionMethods((Service: positionMethods))
objectMethods((Service: objectMethods))
presenceService((Service: presenceService))
processMethods((Service: processMethods))
screenRecordingService((Service: screenRecordingService))
unifiedCacheManager_file((Service: unifiedCacheManager))
resourceCleanupService_file((Service: resourceCleanupService))
spatialObjectsService((Service: spatialObjectsService))
spacesService((Service: spacesService))
sharedSpacesService((Service: sharedSpacesService))
spatialPartitioning((Service: spatialPartitioning))
sharingService((Service: sharingService))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
storageService((Service: storageService))
webRservice((Service: webRservice))
authStore[[Store: authStore]]
connectionStore[[Store: connectionStore]]
cubeStore[[Store: cubeStore]]
objectsStore[[Store: objectsStore]]
lodStore[[Store: lodStore]]
connectionUtils[Function: connectionUtils]
uiOverlayStore[[Store: uiOverlayStore]]
storeUtils[[Store: storeUtils]]
animationUtils[Function: animationUtils]
bvhRaycasting[Function: bvhRaycasting]
facePositionUtils[Function: facePositionUtils]
pathfindingUtils[Function: pathfindingUtils]
gpuResourceTracker[Function: gpuResourceTracker]
frameCounter_file[Function: frameCounter]
debugUtils[Function: debugUtils]
faceIndicatorUtils[Function: faceIndicatorUtils]
objectUpdateHandlers[Function: objectUpdateHandlers]
loadingState[Function: loadingState]
linePoolManager[Function: linePoolManager]
objectVirtualization[Function: objectVirtualization]
textureLoader[Function: textureLoader]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
positionUtils[Function: positionUtils]
textAtlas[Function: textAtlas]
snappingUtils[Function: snappingUtils]
streamlinedSpatialIndex[Function: streamlinedSpatialIndex]
renderWorkScheduler[Function: renderWorkScheduler]
unifiedValidationUtils[Function: unifiedValidationUtils]

%% File-Function Relationships
backend_index -.-> createVerifyAuthTokenApp : "contains"
backend_index -.-> createBulkImportApp : "contains"
backend_index -.-> objectsByCellId : "contains"
backend_index -.-> connectionsByCellId : "contains"
backend_index -.-> params : "contains"
backend_index -.-> createBulkDeleteApp : "contains"
useConnectionObjects_file -.-> useConnectionObjects : "contains"
useConnectionObjects_file -.-> usePathfindingObjects : "contains"
useConnectionObjects_file -.-> useConnectionObjectPositions : "contains"
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
useAuth_file -.-> useAuth : "contains"
useConnections_file -.-> useConnections : "contains"
useConnections_file -.-> spaceId : "contains"
useConnections_file -.-> userId : "contains"
useConnections_file -.-> stableLoadedCells : "contains"
useConnections_file -.-> connectionCallback : "contains"
useConnections_file -.-> enhancedConnectionCallback : "contains"
useConnections_file -.-> handleLineStyleChange : "contains"
useConnections_file -.-> handleLineColorChange : "contains"
useConnections_file -.-> handleConnectionClick : "contains"
useConnections_file -.-> handleLineTextClick : "contains"
useConnections_file -.-> handleLineTextSubmit : "contains"
useConnections_file -.-> handleLineTextStyleChange : "contains"
useAuthState_file -.-> useAuthState : "contains"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "contains"
useFrustumCulling -.-> isPointInFrustum : "contains"
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
useFrustumCulling -.-> objectPositions : "contains"
useFrustumCulling -.-> visibleConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
useLinePool_file -.-> useLinePool : "contains"
useLinePool_file -.-> initializeResources : "contains"
useIndicators_file -.-> useIndicators : "contains"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "contains"
useGlobalClickHandler_file -.-> handleGlobalClick : "contains"
useObjects_file -.-> useObjects : "contains"
useObjects_file -.-> handleCreateObject : "contains"
useObjects_file -.-> handleObjectDelete : "contains"
useObjects_file -.-> registerTransformingObject : "contains"
useConnectionsRendererStore_file -.-> getConnectionStateSelector : "contains"
useConnectionsRendererStore_file -.-> cleanupStaleSelectors : "contains"
useConnectionsRendererStore_file -.-> actionsSelector : "contains"
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "contains"
useConnectionsRendererStore_file -.-> useConnectionState : "contains"
useConnectionsRendererStore_file -.-> selector : "contains"
useConnectionsRendererStore_file -.-> useConnectionActions : "contains"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "contains"
useDebouncedUpdate_file -.-> cleanup : "contains"
useLOD_file -.-> useLOD : "contains"
useLOD_file -.-> calculateObjectLOD : "contains"
useSpatialManager_file -.-> useSpatialManager : "contains"
useSpatialManager_file -.-> loadedCellsKey : "contains"
useSpatialManager_file -.-> memoizedLoadedCells : "contains"
useSpatialManager_file -.-> cleanup : "contains"
useSpatialManager_file -.-> setupCameraListeners : "contains"
useSpatialManager_file -.-> handleCameraMove : "contains"
useSpatialManager_file -.-> addObjectToSpatialSystemWrapper : "contains"
useSpatialManager_file -.-> moveObjectInSpatialSystemWrapper : "contains"
useSpatialManager_file -.-> loadCellWrapper : "contains"
useSpatialManager_file -.-> updateCameraPositionWrapper : "contains"
useSpaceManager_file -.-> useSpaceManager : "contains"
githubRepoService -.-> exchangeGithubCode : "contains"
githubRepoService -.-> fetchRepositories : "contains"
githubRepoService -.-> fetchFileContent : "contains"
githubRepoService -.-> fetchRepositoryStructure : "contains"
githubRepoService -.-> analyzeFile : "contains"
githubRepoService -.-> containsJSX : "contains"
githubRepoService -.-> generateMerfolkFromRepository : "contains"
githubRepoService -.-> componentFunctions : "contains"
githubRepoService -.-> componentRelationships : "contains"
githubRepoService -.-> componentDependencies : "contains"
githubRepoService -.-> internalComponents : "contains"
githubRepoService -.-> exportedComponents : "contains"
githubRepoService -.-> fileFunctions : "contains"
githubRepoService -.-> internalHooks : "contains"
githubRepoService -.-> filesNeedingSuffix : "contains"
githubRepoService -.-> functionCallRelationships : "contains"
githubRepoService -.-> componentPropsRelationships : "contains"
githubRepoService -.-> storeUsageRelationships : "contains"
githubRepoService -.-> hookReturnValueRelationships : "contains"
githubRepoService -.-> traverse : "contains"
githubRepoService -.-> generateMerfolkMarkdown : "contains"
githubRepoService -.-> storesSet : "contains"
githubRepoService -.-> servicesSet : "contains"
githubRepoService -.-> componentInternalFunctions : "contains"
githubRepoService -.-> componentsSet : "contains"
githubRepoService -.-> filtered : "contains"
githubRepoService -.-> hooksSet : "contains"
githubRepoService -.-> servicesSetForFilter : "contains"
githubRepoService -.-> storesSetForFilter : "contains"
githubRepoService -.-> utilitiesSetForFilter : "contains"
githubRepoService -.-> nodeIds : "contains"
githubRepoService -.-> childToParentMap : "contains"
githubRepoService -.-> generateRoutedConnection : "contains"
githubRepoService -.-> allComponentFunctions : "contains"
githubRepoService -.-> getGithubToken : "contains"
githubRepoService -.-> setGithubToken : "contains"
githubRepoService -.-> isGithubAuthenticated : "contains"
githubRepoService -.-> getGithubOAuthUrl : "contains"
githubRepoService -.-> currentParams : "contains"
githubRepoService -.-> handleGithubCallback : "contains"
githubRepoService -.-> params : "contains"
githubRepoService -.-> restoredParams : "contains"
githubRepoService -.-> newUrl : "contains"
githubRepoService -.-> scanRepositoryAndGenerateDiagram : "contains"
githubRepoService -.-> markdownBlob : "contains"
githubRepoService -.-> markdownFile : "contains"
useTextureUpdater_file -.-> useTextureUpdater : "contains"
useTextureUpdater_file -.-> updateTexture : "contains"
useTimeoutManager_file -.-> useTimeoutManager : "contains"
useTimeoutManager_file -.-> setNamedTimeout : "contains"
useTimeoutManager_file -.-> clearNamedTimeout : "contains"
useTimeoutManager_file -.-> clearAllTimeouts : "contains"
useTimeoutManager_file -.-> hasActiveTimeout : "contains"
useTimeoutManager_file -.-> getTimeoutId : "contains"
connectionsService -.-> connectionListeners : "contains"
connectionsService -.-> globalActiveListeners : "contains"
connectionsService -.-> pauseConnectionListeners : "contains"
connectionsService -.-> resumeConnectionListeners : "contains"
connectionsService -.-> notifyConnectionListeners : "contains"
connectionsService -.-> addConnectionStateListener : "contains"
connectionsService -.-> connectionCache : "contains"
connectionsService -.-> clearConnectionCache : "contains"
connectionsService -.-> connectionDataChanged : "contains"
connectionsService -.-> serializeConnection : "contains"
connectionsService -.-> enableConnectionNetwork : "contains"
connectionsService -.-> disableConnectionNetwork : "contains"
connectionsService -.-> getConnectionNetworkState : "contains"
connectionsService -.-> saveConnection : "contains"
connectionsService -.-> subscribeToConnections : "contains"
connectionsService -.-> subscribeToCellConnections : "contains"
connectionsService -.-> unsubscribeFunctions : "contains"
connectionsService -.-> activeSubscriptionCells : "contains"
connectionsService -.-> startCellSubscriptions : "contains"
connectionsService -.-> deleteConnection : "contains"
connectionsService -.-> deleteConnectionEnhanced : "contains"
centralizedBroadcastManager_file -.-> CentralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> dummyUnsubscribe : "contains"
centralizedBroadcastManager_file -.-> centralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> subscribePlaneToBroadcasts : "contains"
centralizedBroadcastManager_file -.-> getBroadcastManagerDebugInfo : "contains"
centralizedBroadcastManager_file -.-> cleanupBroadcastManager : "contains"
globalSubscriptionManager -.-> globalSubscriptions : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> decrementSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
globalSubscriptionManager -.-> periodicCleanup : "contains"
connectionPositionResolver -.-> resolveConnectionPositions : "contains"
connectionPositionResolver -.-> resolveConnectionEndpoint : "contains"
connectionPositionResolver -.-> connectionNeedsPositionResolution : "contains"
connectionPositionResolver -.-> positionsEqual : "contains"
globalOptimizationCoordinator_file -.-> GlobalOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> spatialManager : "contains"
globalOptimizationCoordinator_file -.-> unifiedCache : "contains"
globalOptimizationCoordinator_file -.-> cacheStats : "contains"
globalOptimizationCoordinator_file -.-> later : "contains"
globalOptimizationCoordinator_file -.-> cache : "contains"
globalOptimizationCoordinator_file -.-> memoized : "contains"
globalOptimizationCoordinator_file -.-> session : "contains"
globalOptimizationCoordinator_file -.-> globalOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> initializeOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> getOptimizationStatus : "contains"
globalOptimizationCoordinator_file -.-> consolidateSystem : "contains"
globalOptimizationCoordinator_file -.-> cleanupOptimizationCoordinator : "contains"
authService -.-> signInUser : "contains"
authService -.-> handlePostLoginRedirect : "contains"
authService -.-> signOut : "contains"
authService -.-> handleRedirectResult : "contains"
authService -.-> observeAuthState : "contains"
authService -.-> validateAuthToken : "contains"
authService -.-> handleUrlAuth : "contains"
authService -.-> params : "contains"
containerMethods -.-> reachableFromRootModules : "contains"
containerMethods -.-> markReachable : "contains"
containerMethods -.-> createContainerForGroup : "contains"
containerMethods -.-> componentsWithChildContainers : "contains"
containerMethods -.-> nodesInChildContainers : "contains"
containerMethods -.-> markDescendantsInChildContainers : "contains"
containerMethods -.-> nodesWithContainers : "contains"
containerMethods -.-> visited : "contains"
containerMethods -.-> adjustNodeAndDescendants : "contains"
containerMethods -.-> containerDimensions : "contains"
markdownDiagramService_file -.-> MarkdownDiagramService : "contains"
markdownDiagramService_file -.-> markdownDiagramService : "contains"
hierarchyMethods -.-> parentChildMap : "contains"
hierarchyMethods -.-> childParentMap : "contains"
hierarchyMethods -.-> rootNodes : "contains"
hierarchyMethods -.-> internalComponentChildren : "contains"
hierarchyMethods -.-> componentConnectionTypes : "contains"
hierarchyMethods -.-> wouldCreateCycle : "contains"
hierarchyMethods -.-> visited : "contains"
hierarchyMethods -.-> dfs : "contains"
hierarchyMethods -.-> addParentChildRelation : "contains"
connectionMethods -.-> connectionTags : "contains"
connectionMethods -.-> addTag : "contains"
connectionMethods -.-> existingConnectionPairs : "contains"
connectionMethods -.-> getFaceForObject : "contains"
connectionMethods -.-> computeFaceWorldPosition : "contains"
connectionMethods -.-> calculateDodecahedronFaceCenter : "contains"
connectionMethods -.-> connectionsByCell : "contains"
positionMethods -.-> moveComponentTree : "contains"
positionMethods -.-> getComponentChildren : "contains"
positionMethods -.-> checkOverlap : "contains"
positionMethods -.-> containersByLevel : "contains"
positionMethods -.-> reachableFromRootModules : "contains"
positionMethods -.-> markReachable : "contains"
positionMethods -.-> componentsWithChildContainers : "contains"
positionMethods -.-> nodesInChildContainers : "contains"
positionMethods -.-> markDescendantsInChildContainers : "contains"
positionMethods -.-> calculateGroupSpacing : "contains"
positionMethods -.-> calculateGroupBounds : "contains"
positionMethods -.-> positionGroup : "contains"
objectMethods -.-> nodePositions : "contains"
objectMethods -.-> nodeScales : "contains"
objectMethods -.-> processedNodes : "contains"
objectMethods -.-> existingNodeIdMap : "contains"
objectMethods -.-> calculateHeaderStyle : "contains"
presenceService -.-> setUserPresence : "contains"
presenceService -.-> getGuestId : "contains"
presenceService -.-> setGuestPresence : "contains"
presenceService -.-> subscribeToSpacePresence : "contains"
processMethods -.-> reader : "contains"
processMethods -.-> nodeToObjectIdMap : "contains"
screenRecordingService -.-> ScreenRecordingService : "contains"
screenRecordingService -.-> rawBlob : "contains"
screenRecordingService -.-> screenRecorder : "contains"
unifiedCacheManager_file -.-> cacheStats : "contains"
unifiedCacheManager_file -.-> unifiedCache : "contains"
unifiedCacheManager_file -.-> UnifiedCacheManager : "contains"
unifiedCacheManager_file -.-> unifiedCacheManager : "contains"
resourceCleanupService_file -.-> _disposedWeakSet : "contains"
resourceCleanupService_file -.-> ResourceCleanupService : "contains"
resourceCleanupService_file -.-> resourceCleanupService : "contains"
spatialObjectsService -.-> objectsCache : "contains"
spatialObjectsService -.-> saveTimeouts : "contains"
spatialObjectsService -.-> updateThrottles : "contains"
spatialObjectsService -.-> lastReceivedObjects : "contains"
spatialObjectsService -.-> movingObjects : "contains"
spatialObjectsService -.-> objectCellMap : "contains"
spatialObjectsService -.-> deletingObjects : "contains"
spatialObjectsService -.-> clearAllObjectCaches : "contains"
spatialObjectsService -.-> removeObjectFromCaches : "contains"
spatialObjectsService -.-> positionsEqual : "contains"
spatialObjectsService -.-> saveObjectToCell : "contains"
spatialObjectsService -.-> deleteObjectFromSpatialCell : "contains"
spatialObjectsService -.-> updateObjectInSpatialCell : "contains"
spatialObjectsService -.-> clearCellCache : "contains"
spatialObjectsService -.-> objectSubscriptionsByCell : "contains"
spatialObjectsService -.-> subscribeToSpatialObjects : "contains"
spatialObjectsService -.-> unsubscribeFunctions : "contains"
spatialObjectsService -.-> localSubscriptionKeys : "contains"
spatialObjectsService -.-> startCellSubscriptions : "contains"
spatialObjectsService -.-> updateCellSubscriptions : "contains"
spatialObjectsService -.-> moveObjectBetweenCells : "contains"
spatialObjectsService -.-> loadObjectsFromCells : "contains"
spatialObjectsService -.-> saveObject : "contains"
spatialObjectsService -.-> deleteObject : "contains"
spatialObjectsService -.-> updateObject : "contains"
spatialObjectsService -.-> subscribeToObjects : "contains"
spatialObjectsService -.-> getObjectDeletionStatus : "contains"
spatialObjectsService -.-> clearObjectDeletionBlacklist : "contains"
spacesService -.-> getSpaceById : "contains"
spacesService -.-> createSpace : "contains"
spacesService -.-> getOrCreateDefaultSpace : "contains"
spacesService -.-> migrateToDefaultSpace : "contains"
spacesService -.-> getUserSpaces : "contains"
spacesService -.-> deleteSpace : "contains"
spacesService -.-> hasSpaceAccess : "contains"
spacesService -.-> getPublicSpaceMetadata : "contains"
sharedSpacesService -.-> sharedSpacesCache : "contains"
sharedSpacesService -.-> isSharedSpace : "contains"
sharedSpacesService -.-> checkSpaceExists : "contains"
sharedSpacesService -.-> registerSharedSpaceFromUrl : "contains"
sharedSpacesService -.-> getSpaceOwner : "contains"
sharedSpacesService -.-> findSpaceOwner : "contains"
sharedSpacesService -.-> urlParams : "contains"
sharedSpacesService -.-> params : "contains"
spatialPartitioning -.-> cellExistenceCache : "contains"
spatialPartitioning -.-> cleanupCache : "contains"
spatialPartitioning -.-> movingObjects : "contains"
spatialPartitioning -.-> getCellCoordinates : "contains"
spatialPartitioning -.-> getCellCoordinatesWithHysteresis : "contains"
spatialPartitioning -.-> getCellId : "contains"
spatialPartitioning -.-> parseCellId : "contains"
spatialPartitioning -.-> getCellBounds : "contains"
spatialPartitioning -.-> createCell : "contains"
spatialPartitioning -.-> createCellsBatch : "contains"
spatialPartitioning -.-> createCellsBatchOptimized : "contains"
spatialPartitioning -.-> cellExists : "contains"
spatialPartitioning -.-> cellExistsBulk : "contains"
spatialPartitioning -.-> getCell : "contains"
spatialPartitioning -.-> addObjectToCell : "contains"
spatialPartitioning -.-> removeObjectFromCell : "contains"
spatialPartitioning -.-> moveObjectBetweenCells : "contains"
spatialPartitioning -.-> getLoadedCells : "contains"
spatialPartitioning -.-> getObjectsFromCells : "contains"
spatialPartitioning -.-> updateObjectInCell : "contains"
spatialPartitioning -.-> deleteObjectFromCell : "contains"
spatialPartitioning -.-> cellCallbacks : "contains"
spatialPartitioning -.-> subscribeToCells : "contains"
spatialPartitioning -.-> getOccupiedCells : "contains"
spatialPartitioning -.-> getCellDistance : "contains"
spatialPartitioning -.-> getCellsToUnload : "contains"
spatialPartitioning -.-> addConnectionToCells : "contains"
spatialPartitioning -.-> bulkSaveConnectionsToCell : "contains"
spatialPartitioning -.-> addConnectionToCell : "contains"
spatialPartitioning -.-> removeConnectionFromAllCells : "contains"
spatialPartitioning -.-> normalizePosition : "contains"
spatialPartitioning -.-> removeConnectionFromCells : "contains"
spatialPartitioning -.-> removeConnectionFromCell : "contains"
spatialPartitioning -.-> getConnectionsFromCells : "contains"
spatialPartitioning -.-> seenConnectionIds : "contains"
spatialPartitioning -.-> updateConnectionInCells : "contains"
spatialPartitioning -.-> getCellsInRadius : "contains"
spatialPartitioning -.-> getNeighborCells : "contains"
spatialPartitioning -.-> debugCellRadius : "contains"
spatialPartitioning -.-> debugNeighborCells : "contains"
spatialPartitioning -.-> debugCurrentCellLoading : "contains"
spatialPartitioning -.-> findObjectInCells : "contains"
spatialPartitioning -.-> getAllObjectsInSpace : "contains"
spatialPartitioning -.-> findConnectionInCells : "contains"
spatialPartitioning -.-> purgeConnectionFromAllCells : "contains"
spatialPartitioning -.-> deleteAllCellsInSpace : "contains"
sharingService -.-> generateSharingUrl : "contains"
sharingService -.-> sharingUrl : "contains"
sharingService -.-> getSharedSpaceInfo : "contains"
streamlinedSpatialPartitioning -.-> StreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> getStreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> initializeStreamlinedSpatialPartitioning : "contains"
streamlinedSpatialPartitioning -.-> benchmarkStreamlinedSystem : "contains"
streamlinedSpatialPartitioning -.-> manager : "contains"
storageService -.-> getStorageInstance : "contains"
storageService -.-> ALLOWED_IMAGE_TYPES : "contains"
storageService -.-> uploadFileGeneric : "contains"
storageService -.-> uploadImageToStorage : "contains"
storageService -.-> uploadModelToStorage : "contains"
storageService -.-> uploadMarkdownToStorage : "contains"
storageService -.-> blob : "contains"
webRservice -.-> activeStreams : "contains"
webRservice -.-> getRTCConfiguration : "contains"
webRservice -.-> initWebRTC : "contains"
webRservice -.-> BroadcastSession : "contains"
webRservice -.-> peerConnection : "contains"
webRservice -.-> startBroadcasting : "contains"
webRservice -.-> broadcastSession : "contains"
webRservice -.-> joinBroadcast : "contains"
webRservice -.-> isPlaneBeingBroadcast : "contains"
webRservice -.-> findAvailableBroadcasts : "contains"
webRservice -.-> cleanupWebRTC : "contains"
webRservice -.-> registerUserPresence : "contains"
webRservice -.-> subscribeToUsersInSpace : "contains"
webRservice -.-> activeUsers : "contains"
webRservice -.-> fiveMinutesAgo : "contains"
authStore -.-> monitorConnection : "contains"
authStore -.-> connectionHandler : "contains"
authStore -.-> handleUrlAuth : "contains"
authStore -.-> initAuth : "contains"
connectionStore -.-> getCellCoords : "contains"
connectionStore -.-> getCellIdFromCoords : "contains"
cubeStore -.-> getCubeSelector : "contains"
cubeStore -.-> getCubeFaceColorSelector : "contains"
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
cubeStore -.-> getCubeFaceStateSelector : "contains"
objectsStore -.-> numericHash : "contains"
lodStore -.-> calculateLODLevel : "contains"
lodStore -.-> calculateParentLODLevel : "contains"
connectionUtils -.-> validateConnection : "contains"
connectionUtils -.-> getIndicatorId : "contains"
connectionUtils -.-> getConnectionKey : "contains"
connectionUtils -.-> prepareTextObjectIndicator : "contains"
connectionUtils -.-> objectsAreConnectedInStore : "contains"
connectionUtils -.-> getConnectionsForObject : "contains"
connectionUtils -.-> createConnectionInStore : "contains"
connectionUtils -.-> updateConnectionPositionsInStore : "contains"
connectionUtils -.-> removeConnectionsForObject : "contains"
connectionUtils -.-> isInConnectionCreationMode : "contains"
connectionUtils -.-> startConnectionCreation : "contains"
connectionUtils -.-> completeConnectionCreation : "contains"
connectionUtils -.-> cancelConnectionCreation : "contains"
uiOverlayStore -.-> setCellBoundariesVisible : "contains"
storeUtils -.-> useStoreInitialization : "contains"
storeUtils -.-> useCubeSelectors : "contains"
storeUtils -.-> useCubeActions : "contains"
storeUtils -.-> usePlaneSelectors : "contains"
storeUtils -.-> usePlaneActions : "contains"
storeUtils -.-> useGlobalStoreUtils : "contains"
storeUtils -.-> clearAllSelections : "contains"
storeUtils -.-> resetAllStores : "contains"
animationUtils -.-> animatedMaterials : "contains"
animationUtils -.-> registerMaterial : "contains"
animationUtils -.-> unregisterMaterial : "contains"
animationUtils -.-> setAnimationSpeed : "contains"
animationUtils -.-> startAnimationLoop : "contains"
animationUtils -.-> animate : "contains"
animationUtils -.-> stopAnimationLoop : "contains"
animationUtils -.-> initAnimationSystem : "contains"
bvhRaycasting -.-> BVHNode : "contains"
bvhRaycasting -.-> BVHAcceleratedRaycaster : "contains"
bvhRaycasting -.-> leftChild : "contains"
bvhRaycasting -.-> rightChild : "contains"
bvhRaycasting -.-> initBVHRaycasting : "contains"
bvhRaycasting -.-> getBVH : "contains"
bvhRaycasting -.-> updateBVHObjects : "contains"
bvhRaycasting -.-> bvhIntersectObjects : "contains"
bvhRaycasting -.-> getBVHStats : "contains"
bvhRaycasting -.-> updateLODLevels : "contains"
bvhRaycasting -.-> registerObjectRelationships : "contains"
facePositionUtils -.-> calculateFacePosition : "contains"
facePositionUtils -.-> calculateFaceCenter : "contains"
pathfindingUtils -.-> intersectionCache : "contains"
pathfindingUtils -.-> pathCache : "contains"
pathfindingUtils -.-> objectPositionCache : "contains"
pathfindingUtils -.-> invalidatePathfindingCaches : "contains"
pathfindingUtils -.-> checkObjectMovement : "contains"
pathfindingUtils -.-> cleanCaches : "contains"
pathfindingUtils -.-> roundForCache : "contains"
pathfindingUtils -.-> lineIntersectsBoundingBox : "contains"
pathfindingUtils -.-> generateCacheKey : "contains"
pathfindingUtils -.-> havePositionsChanged : "contains"
pathfindingUtils -.-> checkLineIntersection : "contains"
pathfindingUtils -.-> d : "contains"
pathfindingUtils -.-> generateCurvedPath : "contains"
pathfindingUtils -.-> checkCurveIntersections : "contains"
pathfindingUtils -.-> generateMultiSegmentPath : "contains"
gpuResourceTracker -.-> GPUResourceTracker : "contains"
gpuResourceTracker -.-> gpuTracker : "contains"
frameCounter_file -.-> FrameCounter : "contains"
frameCounter_file -.-> frameCounter : "contains"
debugUtils -.-> logAnimation : "contains"
debugUtils -.-> forceAnimateConnection : "contains"
debugUtils -.-> shouldAnimateConnection : "contains"
debugUtils -.-> recordFrameTime : "contains"
debugUtils -.-> recordStateUpdate : "contains"
debugUtils -.-> getPerfStats : "contains"
debugUtils -.-> resetPerfStats : "contains"
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
faceIndicatorUtils -.-> getIdFromIndicator : "contains"
objectUpdateHandlers -.-> handleObjectMove : "contains"
objectUpdateHandlers -.-> handleObjectUpdate : "contains"
loadingState -.-> getIsInitialLoading : "contains"
loadingState -.-> setIsInitialLoading : "contains"
linePoolManager -.-> LinePool : "contains"
linePoolManager -.-> geometry : "contains"
linePoolManager -.-> positions : "contains"
linePoolManager -.-> getLinePool : "contains"
linePoolManager -.-> clearLinePool : "contains"
objectVirtualization -.-> ObjectVirtualizer : "contains"
objectVirtualization -.-> getMaxObjects : "contains"
objectVirtualization -.-> objectVirtualizer : "contains"
textureLoader -.-> loadTextureFromFirebaseUrl : "contains"
textureLoader -.-> url : "contains"
textureLoader -.-> img : "contains"
textureLoader -.-> loadTextureFromBlob : "contains"
unifiedPerformanceUtils -.-> throttle : "contains"
unifiedPerformanceUtils -.-> debounce : "contains"
unifiedPerformanceUtils -.-> later : "contains"
unifiedPerformanceUtils -.-> measurePerformance : "contains"
unifiedPerformanceUtils -.-> scheduleWork : "contains"
unifiedPerformanceUtils -.-> memoize : "contains"
unifiedPerformanceUtils -.-> cache : "contains"
unifiedPerformanceUtils -.-> createCacheKey : "contains"
unifiedPerformanceUtils -.-> memoized : "contains"
unifiedPerformanceUtils -.-> trackLCP : "contains"
unifiedPerformanceUtils -.-> observer : "contains"
positionUtils -.-> calculateMidpoint : "contains"
positionUtils -.-> calculateMidpointVector : "contains"
positionUtils -.-> lerp : "contains"
positionUtils -.-> checkPositionJitter : "contains"
textAtlas -.-> TextAtlas : "contains"
textAtlas -.-> MultiPageTextAtlas : "contains"
textAtlas -.-> page : "contains"
textAtlas -.-> getGlobalTextAtlas : "contains"
textAtlas -.-> resetGlobalTextAtlas : "contains"
textAtlas -.-> createAtlasTextMesh : "contains"
snappingUtils -.-> calculateAxisSnap : "contains"
snappingUtils -.-> distanceToAxis : "contains"
snappingUtils -.-> projectPointOntoAxis : "contains"
streamlinedSpatialIndex -.-> Point3D : "contains"
streamlinedSpatialIndex -.-> BoundingBox : "contains"
streamlinedSpatialIndex -.-> OptimizedSpatialGrid : "contains"
streamlinedSpatialIndex -.-> seenObjects : "contains"
streamlinedSpatialIndex -.-> createStreamlinedSpatialIndex : "contains"
streamlinedSpatialIndex -.-> benchmarkStreamlined : "contains"
streamlinedSpatialIndex -.-> position : "contains"
streamlinedSpatialIndex -.-> center : "contains"
renderWorkScheduler -.-> _frameTimeTracker : "contains"
renderWorkScheduler -.-> _resetForNextFrame : "contains"
renderWorkScheduler -.-> acquireBudget : "contains"
renderWorkScheduler -.-> setFrameBudget : "contains"
renderWorkScheduler -.-> getFrameBudget : "contains"
renderWorkScheduler -.-> notifyCameraMove : "contains"
renderWorkScheduler -.-> isCameraMoving : "contains"
renderWorkScheduler -.-> isCameraMovingRapidly : "contains"
renderWorkScheduler -.-> isFrameBudgetExhausted : "contains"
renderWorkScheduler -.-> getSmoothedFrameTime : "contains"
unifiedValidationUtils -.-> cleanObject : "contains"
unifiedValidationUtils -.-> validateRequiredProperties : "contains"
unifiedValidationUtils -.-> validateObjectSchema : "contains"
unifiedValidationUtils -.-> isValidPosition : "contains"
unifiedValidationUtils -.-> validatePosition : "contains"
unifiedValidationUtils -.-> validatePositionBounds : "contains"
unifiedValidationUtils -.-> validateConnection : "contains"
unifiedValidationUtils -.-> validateConnectionData : "contains"
unifiedValidationUtils -.-> getIndicatorId : "contains"
unifiedValidationUtils -.-> validateIndicator : "contains"
unifiedValidationUtils -.-> validateFile : "contains"
unifiedValidationUtils -.-> validateObjectId : "contains"
unifiedValidationUtils -.-> validateSpaceId : "contains"
unifiedValidationUtils -.-> validateUserId : "contains"
unifiedValidationUtils -.-> validateUrl : "contains"
unifiedValidationUtils -.-> urlObj : "contains"
unifiedValidationUtils -.-> validateEmail : "contains"
unifiedValidationUtils -.-> validateArray : "contains"
unifiedValidationUtils -.-> validateMultiple : "contains"

%% Component Relationships
App --> FrameTicker : "uses"
App --> LODManager : "enabled"
App --> CustomCamera : "camera"
App --> RealTimeConnectionUpdater : "connections"
App --> ConnectionsRenderer : "objects, allObjectsForPathfinding, visibleObjectIds..."
App --> ObjectsRenderer : "objects, visibleObjectIds, selectedId..."
App --> CellBoundaryRenderer : "loadedCells, visible"
App --> UIOverlay : "onCreateObject, onToggleIndicators, user..."
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, geometry..."
AtlasTextSprite --> StaticBillboardMesh : "receives"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, calculatedPosition..."
AtlasTextSprite --> DynamicBillboardMesh : "receives"
ContainerOutline --> PooledLine : "points, color, lineWidth..."
CubeFace --> FaceIndicator : "position, rotation, onClick..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> InstancedLine : "points, color, lineWidth..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AnimatedConnectionLine : "points, connectionId, color..."
DistanceFilteredConnectionText --> DistanceFilteredConnectionText : "position, maxDistance"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AtlasTextSprite : "text, position, onClick..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> HeaderInput : "position, onTextSubmit, inputId..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> TextStyleUI : "position, onStyleChange, onClose..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> LineUI : "position, onColorChange, onToggleDashed..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> BatchedConnectionLines : "connections, objectPositions, selectedConnectionId..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> BatchedCurvedLines : "connections, objectPositions, pathfindingObjects..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> DistanceFilteredTextLabels : "labels, maxDistance, onLabelClick"
DistanceFilteredConnectionText --> Connection : "connection, allObjectsForPathfinding, onLineStyleChange..."
Cube --> CubeFace : "cubeId, faceName, faceData..."
Cube --> FaceUI : "position, normal, onColorChange..."
Cube --> FaceTextInput : "position, onTextSubmit, inputId"
Cube --> AtlasTextSprite : "text, position, onClick..."
Cube --> TextStyleUI : "position, onStyleChange, onClose..."
Cube --> SnapLineIndicator : "points, axis, visible"
Cube --> InstancedLine : "points, color, lineWidth"
Cube --> HeaderInput : "position, onTextSubmit, inputId..."
Cube --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
DistanceFilteredTextLabels --> InstancedAtlasText : "labels, maxDistance, onLabelClick..."
Sphere --> SnapLineIndicator : "points, axis, visible"
Sphere --> DodecahedronFace : "dodecahedronId, faceIndex, faceGeometry..."
Sphere --> InstancedLine : "points, color, lineWidth"
Sphere --> ObjectUI : "position, onTransformToggle, onHeaderToggle..."
Sphere --> FaceUI : "position, onColorChange, face..."
Sphere --> HeaderInput : "position, onTextSubmit, inputId..."
Sphere --> AtlasTextSprite : "text, position, followTarget..."
Sphere --> TextStyleUI : "position, followTarget, onStyleChange..."
DodecahedronFace --> FaceIndicator : "position, rotation, onClick..."
DodecahedronFace --> AtlasTextSprite : "text, position, onClick..."
DodecahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
FaceUI --> ColorPicker : "onColorSelect, onClose"
InstancedAtlasText --> InstancedAtlasText : "atlas, texture, items..."
InstancedAtlasText --> PageInstancedMesh : "receives"
PooledLine --> InstancedLine : "points, color, lineWidth..."
ObjectsRenderer --> ObjectRenderer : "obj, selectedId, handleObjectClick..."
ObjectsRenderer --> GlobalCubeEdgesRenderer : "cubes, defaultLineWidth"
ObjectsRenderer --> GlobalDodecahedronEdgesRenderer : "dodecahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalTetrahedronEdgesRenderer : "tetrahedrons, defaultLineWidth"
Plane --> SnapLineIndicator : "points, axis, visible"
Plane --> WebcamStream : "meshRef, active, userId..."
Plane --> ScreenShareStream : "meshRef, active, userId..."
Plane --> InstancedLine : "points, color, lineWidth..."
Plane --> FaceIndicator : "position, onClick, isActive..."
Plane --> AtlasTextSprite : "text, position, onClick..."
Plane --> TextStyleUI : "position, onStyleChange, onClose..."
Plane --> FaceUI : "position, onColorChange, onTextClick..."
Plane --> FaceTextInput : "position, onTextSubmit, inputId..."
Plane --> HeaderInput : "position, onTextSubmit, inputId..."
ObjectRenderer --> Cube : "selected, onClick, onUpdate..."
ObjectRenderer --> Tetrahedron : "selected, onClick, onUpdate..."
ObjectRenderer --> Sphere : "selected, onClick, showAllIndicators..."
ObjectRenderer --> Plane : "position, scale, selected..."
ObjectRenderer --> TextObject : "position, selected, onClick..."
ObjectRenderer --> ModelObject : "obj, isSelected, onClick..."
LineUI --> ColorPicker : "onColorSelect, onClose"
ObjectUI --> ColorPicker : "pickerId, onColorSelect, onClose"
Tetrahedron --> AtlasTextSprite : "text, position, onClick..."
Tetrahedron --> TextStyleUI : "position, onStyleChange, onClose..."
Tetrahedron --> TetrahedronFace : "faceName, faceData, selected..."
Tetrahedron --> SnapLineIndicator : "points, axis, visible"
Tetrahedron --> InstancedLine : "points, color, lineWidth"
Tetrahedron --> HeaderInput : "position, onTextSubmit, inputId..."
Tetrahedron --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
TextObjectUI --> TextStyleUI : "uiType, textStyle, onStyleChange..."
TextStyleUI --> TextStyleUIContent : "receives"
TextObjectUI --> ColorPicker : "onColorSelect, onClose"
TetrahedronFace --> AtlasTextSprite : "text, position, followTarget..."
TetrahedronFace --> TextStyleUI : "position, onStyleChange, onClose..."
TetrahedronFace --> FaceUI : "position, normal, onColorChange..."
TetrahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
TetrahedronFace --> FaceIndicator : "position, rotation, onClick..."
TextStyleUIContainer --> TextStyleUI : "onStyleChange"
TextStyleUI --> TextStyleUIContent : "receives"
TextObject --> SnapLineIndicator : "points, axis, visible"
TextObject --> FaceIndicator : "position, rotation, onClick..."
TextObject --> TextObjectUI : "textStyle, onStyleChange, onDelete..."
Avatar --> Avatar : "user"
SnapLineIndicator --> PooledLine : "points, color, lineWidth..."
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> ColorPicker : "pickerId, onColorSelect, onClose"
TextStyleUIContent --> TextStyleUIContent : "onStyleChange, distance, onClose"
UIOverlay --> SpaceChat : "spaceId, user, isOpen"
UIOverlay --> SpacePresenceAvatars : "spaceId"

%% Component Dependencies
App --> useUIOverlayStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useConnectionStore : "uses store"
App --> usePlaneStore : "uses store"
App --> useCubeStore : "uses store"
App --> useTetrahedronStore : "uses store"
App --> useDodecahedronStore : "uses store"
App --> useSpatialManagerStore : "uses store"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
App --> authService : "uses service"
authService --> signInUser : "receives"
App --> spatialObjectsService : "uses service"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> webRservice : "uses service"
webRservice --> initWebRTC : "receives"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useObjects_file : "{selectedId, setSelectedId, handleCreateObject...}"
useObjects_file --> useObjects_file : "receives"
App --> useIndicators_file : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator...}"
useIndicators_file --> useIndicators_file : "receives"
App --> useSpatialManager_file : "{loadedCells, isInitialized, currentCellCoords...}"
useSpatialManager_file --> useSpatialManager_file : "receives"
App --> useCentralizedBroadcastManager_file : "uses hook"
useCentralizedBroadcastManager_file --> useCentralizedBroadcastManager_file : "receives"
App --> useConnections_file : "{connections, handleLineStyleChange, handleLineColorChange...}"
useConnections_file --> useConnections_file : "receives"
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
App --> objectUpdateHandlers : "uses utility"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectUpdateHandlers : "uses utility"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> faceIndicatorUtils : "uses utility"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> positionUtils : "uses utility"
positionUtils --> checkPositionJitter : "receives"
App --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> loadingState : "uses utility"
loadingState --> setIsInitialLoading : "receives"
App --> animationUtils : "uses utility"
animationUtils --> initAnimationSystem : "receives"
App --> objectVirtualization : "uses utility"
objectVirtualization --> objectVirtualizer : "receives"
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useSpatialManager_file : "{loadedCells, isInitialized, currentCellCoords...}"
useSpatialManager_file --> useSpatialManager_file : "receives"
App --> useCentralizedBroadcastManager_file : "uses hook"
useCentralizedBroadcastManager_file --> useCentralizedBroadcastManager_file : "receives"
App --> useConnections_file : "{connections, handleLineStyleChange, handleLineColorChange...}"
useConnections_file --> useConnections_file : "receives"
App --> useObjects_file : "{selectedId, setSelectedId, handleCreateObject...}"
useObjects_file --> useObjects_file : "receives"
App --> useIndicators_file : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator...}"
useIndicators_file --> useIndicators_file : "receives"
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useSpatialManager_file : "{loadedCells, isInitialized, currentCellCoords...}"
useSpatialManager_file --> useSpatialManager_file : "receives"
App --> useCentralizedBroadcastManager_file : "uses hook"
useCentralizedBroadcastManager_file --> useCentralizedBroadcastManager_file : "receives"
App --> useConnections_file : "{connections, handleLineStyleChange, handleLineColorChange...}"
useConnections_file --> useConnections_file : "receives"
App --> useObjects_file : "{selectedId, setSelectedId, handleCreateObject...}"
useObjects_file --> useObjects_file : "receives"
App --> useIndicators_file : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator...}"
useIndicators_file --> useIndicators_file : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellBounds : "receives"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
ColorPicker --> useColorPickerStore : "uses store"
BatchedCurvedLines --> pathfindingUtils : "uses utility"
pathfindingUtils --> checkLineIntersection : "receives"
BatchedCurvedLines --> pathfindingUtils : "uses utility"
pathfindingUtils --> generateCurvedPath : "receives"
FaceTextInput --> useTextInputStore : "uses store"
FaceIndicator --> useFaceIndicatorStore : "uses store"
CubeFace --> useCubeStore : "uses store"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "uses store"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "{startObject, endObject}"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "{connections, connectionsVisible, focusedObjectId...}"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
useFrustumCulling --> useFrustumCulledConnections : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> checkLineIntersection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> generateCurvedPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "{startObject, endObject}"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "{connections, connectionsVisible, focusedObjectId...}"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
useFrustumCulling --> useFrustumCulledConnections : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "{connections, connectionsVisible, focusedObjectId...}"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
useFrustumCulling --> useFrustumCulledConnections : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "uses store"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "uses hook"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "uses hook"
useFrustumCulling --> useFrustumCulledConnections : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> checkLineIntersection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> generateCurvedPath : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
ConnectionsRenderer --> useConnectionStore : "uses store"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
ConnectionsRenderer --> useConnectionObjects_file : "uses hook"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
ConnectionsRenderer --> useFrustumCulling : "uses hook"
useFrustumCulling --> useFrustumCulledConnections : "receives"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> checkLineIntersection : "receives"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> generateCurvedPath : "receives"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
Cube --> useFaceIndicatorStore : "uses store"
Cube --> useCubeStore : "uses store"
Cube --> useObjectsStore : "uses store"
Cube --> useConnectionStore : "uses store"
Cube --> useIndicatorsStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Cube --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Cube --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Cube --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Cube --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Cube --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Sphere --> useDodecahedronStore : "uses store"
Sphere --> useObjectsStore : "uses store"
Sphere --> useConnectionStore : "uses store"
Sphere --> useIndicatorsStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Sphere --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Sphere --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Sphere --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
DodecahedronFace --> useDodecahedronStore : "uses store"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses store"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useFaceStore : "uses store"
LODManager --> useLODStore : "uses store"
LODManager --> useObjectsStore : "uses store"
FrameTicker --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
GlobalCubeEdgesRenderer --> useLODStore : "uses store"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
HeaderInput --> useTextInputStore : "uses store"
PooledLine --> useLinePool_file : "{geometry, material, isPooled}"
useLinePool_file --> useLinePool_file : "receives"
PooledLine --> useLinePool_file : "{geometry, material, isPooled}"
useLinePool_file --> useLinePool_file : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
Plane --> usePlaneStore : "uses store"
Plane --> useObjectsStore : "uses store"
Plane --> useConnectionStore : "uses store"
Plane --> useIndicatorsStore : "uses store"
Plane --> storageService : "uses service"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Plane --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
Plane --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Plane --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useObjectsStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
RealTimeConnectionUpdater --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useConnectionStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> useTextureUpdater_file : "uses hook"
useTextureUpdater_file --> useTextureUpdater_file : "receives"
ScreenShareStream --> useTextureUpdater_file : "uses hook"
useTextureUpdater_file --> useTextureUpdater_file : "receives"
ScreenShareStream --> useTextureUpdater_file : "uses hook"
useTextureUpdater_file --> useTextureUpdater_file : "receives"
Tetrahedron --> useFaceIndicatorStore : "uses store"
Tetrahedron --> useTetrahedronStore : "uses store"
Tetrahedron --> useObjectsStore : "uses store"
Tetrahedron --> useConnectionStore : "uses store"
Tetrahedron --> useIndicatorsStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Tetrahedron --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
TextObjectUI --> useColorPickerStore : "uses store"
TetrahedronFace --> useTetrahedronStore : "uses store"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useObjectsStore : "uses store"
TextObject --> useConnectionStore : "uses store"
TextObject --> useIndicatorsStore : "uses store"
TextObject --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
TextObject --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextObject --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUI --> useColorPickerStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> storageService : "uses service"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> storageService : "uses service"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> screenRecordingService : "uses service"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> markdownDiagramService_file : "uses service"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> handleGithubCallback : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> fetchRepositories : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> isGithubAuthenticated : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> getGithubOAuthUrl : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
WebcamStream --> useWebcamStreamStore : "uses store"
WebcamStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
WebcamStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"

%% Function Call Relationships
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> loadingState : "calls setIsInitialLoading"
loadingState --> setIsInitialLoading : "receives"
App --> spatialObjectsService : "calls subscribeToSpatialObjects"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
App --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> useConnectionStore : ".getState()"
App --> useConnectionStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> useObjectsStore : ".getState()"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> useConnectionStore : ".getState()"
App --> usePlaneStore : ".getState()"
App --> useCubeStore : ".getState()"
App --> useTetrahedronStore : ".getState()"
App --> useDodecahedronStore : ".getState()"
App --> useConnectionStore : ".getState()"
App --> usePlaneStore : ".getState()"
App --> useCubeStore : ".getState()"
App --> useTetrahedronStore : ".getState()"
App --> useDodecahedronStore : ".getState()"
App --> objectVirtualization : ".updateVisibility()"
objectVirtualization --> objectVirtualizer : "receives"
App --> objectVirtualization : ".updateVisibility()"
objectVirtualization --> objectVirtualizer : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> webRservice : "calls initWebRTC"
webRservice --> initWebRTC : "receives"
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> loadingState : "calls setIsInitialLoading"
loadingState --> setIsInitialLoading : "receives"
App --> spatialObjectsService : "calls subscribeToSpatialObjects"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
App --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> useConnectionStore : ".getState()"
App --> useConnectionStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> useObjectsStore : ".getState()"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> useConnectionStore : ".getState()"
App --> usePlaneStore : ".getState()"
App --> useCubeStore : ".getState()"
App --> useTetrahedronStore : ".getState()"
App --> useDodecahedronStore : ".getState()"
App --> useConnectionStore : ".getState()"
App --> usePlaneStore : ".getState()"
App --> useCubeStore : ".getState()"
App --> useTetrahedronStore : ".getState()"
App --> useDodecahedronStore : ".getState()"
App --> objectVirtualization : ".updateVisibility()"
objectVirtualization --> objectVirtualizer : "receives"
App --> objectVirtualization : ".updateVisibility()"
objectVirtualization --> objectVirtualizer : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> webRservice : "calls initWebRTC"
webRservice --> initWebRTC : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : ".setMaxGPUTextureSize()"
textAtlas --> TextAtlas : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : ".setMaxGPUTextureSize()"
textAtlas --> TextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls checkLineIntersection"
pathfindingUtils --> checkLineIntersection : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls generateCurvedPath"
pathfindingUtils --> generateCurvedPath : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls checkLineIntersection"
pathfindingUtils --> checkLineIntersection : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls generateCurvedPath"
pathfindingUtils --> generateCurvedPath : "receives"
FaceTextInput --> useTextInputStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "calls calculateMidpoint"
positionUtils --> calculateMidpoint : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "calls calculateMidpoint"
positionUtils --> calculateMidpoint : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls checkLineIntersection"
pathfindingUtils --> checkLineIntersection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls generateCurvedPath"
pathfindingUtils --> generateCurvedPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls checkLineIntersection"
pathfindingUtils --> checkLineIntersection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls generateCurvedPath"
pathfindingUtils --> generateCurvedPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls invalidatePathfindingCaches"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls checkLineIntersection"
pathfindingUtils --> checkLineIntersection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls invalidatePathfindingCaches"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls checkLineIntersection"
pathfindingUtils --> checkLineIntersection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> useObjectsStore : ".getState()"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> useObjectsStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
FrameTicker --> frameCounter_file : ".tick()"
frameCounter_file --> frameCounter : "receives"
FrameTicker --> frameCounter_file : ".tick()"
frameCounter_file --> frameCounter : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : ".setMaxGPUTextureSize()"
textAtlas --> TextAtlas : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : ".setMaxGPUTextureSize()"
textAtlas --> TextAtlas : "receives"
InstancedAtlasText --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
HeaderInput --> useTextInputStore : ".getState()"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
Plane --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
Plane --> useObjectsStore : ".getState()"
Plane --> useObjectsStore : ".getState()"
Plane --> useObjectsStore : ".getState()"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> useObjectsStore : ".getState()"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> resourceCleanupService_file : ".disposeTexture()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeTexture()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
Plane --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
Plane --> useObjectsStore : ".getState()"
Plane --> useObjectsStore : ".getState()"
Plane --> useObjectsStore : ".getState()"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> useObjectsStore : ".getState()"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> resourceCleanupService_file : ".disposeTexture()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeTexture()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
TextSprite --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
TextObject --> useObjectsStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextObject --> useObjectsStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "calls subscribeToSpacePresence"
presenceService --> subscribeToSpacePresence : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "calls subscribeToSpacePresence"
presenceService --> subscribeToSpacePresence : "receives"
UIOverlay --> useUIOverlayStore : ".getState()"
UIOverlay --> useUIOverlayStore : ".getState()"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls handleGithubCallback"
githubRepoService --> handleGithubCallback : "receives"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
UIOverlay --> useUIOverlayStore : ".getState()"
UIOverlay --> useUIOverlayStore : ".getState()"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls handleGithubCallback"
githubRepoService --> handleGithubCallback : "receives"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"

%% Store Usage Details
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "selectConnectionWithFlowPath"
Cube --> useObjectsStore : "isInitialLoading"
Sphere --> useObjectsStore : "isInitialLoading"
Tetrahedron --> useObjectsStore : "isInitialLoading"
TextObject --> useTextObjectStore : "updateTextObjectProperty()"
```