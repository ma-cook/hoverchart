```merfolk
%% hoverchart Repository Analysis

%% Components
CellBoundaryRenderer{Component: CellBoundaryRenderer}
BatchedConnectionLines{Component: BatchedConnectionLines}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
BatchedCurvedLines{Component: BatchedCurvedLines}
BVHIntegration{Component: BVHIntegration}
AtlasTextSprite{Component: AtlasTextSprite}
StaticBillboardMesh{Component: StaticBillboardMesh}
DynamicBillboardMesh{Component: DynamicBillboardMesh}
ColorPicker{Component: ColorPicker}
App{Component: App}
CubeFace{Component: CubeFace}
Cube{Component: Cube}
DiagramOverlay2D{Component: DiagramOverlay2D}
DodecahedronFace{Component: DodecahedronFace}
CustomCamera{Component: CustomCamera}
ContainerOutline{Component: ContainerOutline}
FaceIndicator{Component: FaceIndicator}
DistanceFilteredTextLabels{Component: DistanceFilteredTextLabels}
Sphere{Component: Sphere}
DistanceFilteredConnectionText{Component: DistanceFilteredConnectionText}
Connection{Component: Connection}
ConnectionsRenderer{Component: ConnectionsRenderer}
FaceTextInput{Component: FaceTextInput}
GlobalDodecahedronEdgesRenderer{Component: GlobalDodecahedronEdgesRenderer}
HeaderInput{Component: HeaderInput}
GlobalTetrahedronEdgesRenderer{Component: GlobalTetrahedronEdgesRenderer}
FrameloopController{Component: FrameloopController}
InstancedLine{Component: InstancedLine}
FaceUI{Component: FaceUI}
FrameTicker{Component: FrameTicker}
InstancedAtlasText{Component: InstancedAtlasText}
PageInstancedMesh{Component: PageInstancedMesh}
GlobalCubeEdgesRenderer{Component: GlobalCubeEdgesRenderer}
LODManager{Component: LODManager}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
PooledLine{Component: PooledLine}
ObjectsRenderer{Component: ObjectsRenderer}
ObjectRenderer{Component: ObjectRenderer}
ModelObject{Component: ModelObject}
Plane{Component: Plane}
LineUI{Component: LineUI}
ObjectUI{Component: ObjectUI}
SnapLineIndicator{Component: SnapLineIndicator}
SpaceChat{Component: SpaceChat}
ScreenShareStream{Component: ScreenShareStream}
Tetrahedron{Component: Tetrahedron}
TextObject{Component: TextObject}
TetrahedronFace{Component: TetrahedronFace}
TextObjectUI{Component: TextObjectUI}
Avatar{Component: Avatar}
SpacePresenceAvatars{Component: SpacePresenceAvatars}
TextSprite{Component: TextSprite}
WebcamStream{Component: WebcamStream}
TextStyleUIContainer{Component: TextStyleUIContainer}
MerfolkNode{Component: MerfolkNode}
ContainerNode{Component: ContainerNode}
MerfolkEdge{Component: MerfolkEdge}
EdgeMarkerDefs{Component: EdgeMarkerDefs}
UIOverlay{Component: UIOverlay}
TextStyleUIContent{Component: TextStyleUIContent}
TextStyleUI{Component: TextStyleUI}

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
ConnectionsRenderer -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
InstancedAtlasText -.-> PageInstancedMesh : "internal"
SpacePresenceAvatars -.-> Avatar : "internal"
ContainerNode -.-> MerfolkNode : "internal"
EdgeMarkerDefs -.-> MerfolkEdge : "internal"
TextStyleUI -.-> TextStyleUIContent : "internal"

%% Functions
computeVisibleCells[Function: computeVisibleCells]
pathToSegments[Function: pathToSegments]
getSharedMaterial[Function: getSharedMaterial]
getColoredMaterial[Function: getColoredMaterial]
buildReactFlowNodes[Function: buildReactFlowNodes]
getDepth[Function: getDepth]
buildReactFlowEdges[Function: buildReactFlowEdges]
layerForType[Function: layerForType]
filterEdges[Function: filterEdges]
minimapNodeColor[Function: minimapNodeColor]
getDodecahedronColoredMaterial[Function: getDodecahedronColoredMaterial]
getIndicatorMaterial[Function: getIndicatorMaterial]
createDodecahedronGeometry[Function: createDodecahedronGeometry]
handlePointerOver[Function: handlePointerOver]
handlePointerOut[Function: handlePointerOut]
createLoaders[Function: createLoaders]
getGuestId[Function: getGuestId]
senderInitials[Function: senderInitials]
mergeMessages[Function: mergeMessages]
arraysEqual[Function: arraysEqual]
shallowObjEqual[Function: shallowObjEqual]
_createTriangleGeometry[Function: _createTriangleGeometry]
getFaceIndicatorProps[Function: getFaceIndicatorProps]
getTetrahedronColoredMaterial[Function: getTetrahedronColoredMaterial]
getInitials[Function: getInitials]
lerpVector[Function: lerpVector]
applyVideoTexture[Function: applyVideoTexture]
calculateFaceWorldPosition[Function: calculateFaceWorldPosition]
buildNodeStyles[Function: buildNodeStyles]
buildContainerStyles[Function: buildContainerStyles]
buildPrecomputedNode[Function: buildPrecomputedNode]
flowPathColor[Function: flowPathColor]
getEdgeStyle[Function: getEdgeStyle]
getMarkerEnd[Function: getMarkerEnd]
getSelectedStyle[Function: getSelectedStyle]
getUnselectedStyle[Function: getUnselectedStyle]

%% Hooks
useAuthState[Function: useAuthState]
useAuth[Function: useAuth]
useCentralizedBroadcastManager[Function: useCentralizedBroadcastManager]
useAnimatedLine[Function: useAnimatedLine]
useAnimationStats[Function: useAnimationStats]
useLinePool[Function: useLinePool]
useIndicators[Function: useIndicators]
useFrustumCulledConnections[Function: useFrustumCulledConnections]
useDynamicFrustumCulling[Function: useDynamicFrustumCulling]
useConnections[Function: useConnections]
userId[Function: userId]
useConnectionsRendererStore[Function: useConnectionsRendererStore]
useConnectionState[Function: useConnectionState]
useConnectionActions[Function: useConnectionActions]
useGlobalClickHandler[Function: useGlobalClickHandler]
useConnectionObjects[Function: useConnectionObjects]
usePathfindingObjects[Function: usePathfindingObjects]
useConnectionObjectPositions[Function: useConnectionObjectPositions]
useDebouncedUpdate[Function: useDebouncedUpdate]
useSpatialManager[Function: useSpatialManager]
useTimeoutManager[Function: useTimeoutManager]
useTextureUpdater[Function: useTextureUpdater]
useSpaceManager[Function: useSpaceManager]
useObjects[Function: useObjects]

%% Services
createVerifyAuthTokenApp[Function: createVerifyAuthTokenApp]
createBulkImportApp[Function: createBulkImportApp]
objectsByCellId[Function: objectsByCellId]
connectionsByCellId[Function: connectionsByCellId]
params[Function: params]
createBulkDeleteApp[Function: createBulkDeleteApp]
CentralizedBroadcastManager[Function: CentralizedBroadcastManager]
dummyUnsubscribe[Function: dummyUnsubscribe]
centralizedBroadcastManager[Function: centralizedBroadcastManager]
subscribePlaneToBroadcasts[Function: subscribePlaneToBroadcasts]
getBroadcastManagerDebugInfo[Function: getBroadcastManagerDebugInfo]
cleanupBroadcastManager[Function: cleanupBroadcastManager]
resolveConnectionPositions[Function: resolveConnectionPositions]
resolveConnectionEndpoint[Function: resolveConnectionEndpoint]
connectionNeedsPositionResolution[Function: connectionNeedsPositionResolution]
positionsEqual[Function: positionsEqual]
signInUser[Function: signInUser]
handlePostLoginRedirect[Function: handlePostLoginRedirect]
signOut[Function: signOut]
handleRedirectResult[Function: handleRedirectResult]
observeAuthState[Function: observeAuthState]
validateAuthToken[Function: validateAuthToken]
handleUrlAuth[Function: handleUrlAuth]
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
exchangeGithubCode[Function: exchangeGithubCode]
fetchRepositories[Function: fetchRepositories]
fetchFileContent[Function: fetchFileContent]
fetchLatestCommitSha[Function: fetchLatestCommitSha]
fetchChangedFiles[Function: fetchChangedFiles]
getFileTypeFromPath[Function: getFileTypeFromPath]
fetchRepositoryStructure[Function: fetchRepositoryStructure]
analyzeFile[Function: analyzeFile]
containsJSX[Function: containsJSX]
detectRepoType[Function: detectRepoType]
sanitizeNodeId[Function: sanitizeNodeId]
traverseVanillaAST[Function: traverseVanillaAST]
exportedNames[Function: exportedNames]
ensureContainer[Function: ensureContainer]
addSymbol[Function: addSymbol]
trackRelativeSource[Function: trackRelativeSource]
importBindings[Function: importBindings]
traversePythonSource[Function: traversePythonSource]
localNames[Function: localNames]
traverseVueSource[Function: traverseVueSource]
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
moduleImportRelationships[Function: moduleImportRelationships]
nextjsRouteMap[Function: nextjsRouteMap]
traverse[Function: traverse]
knownContainers[Function: knownContainers]
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
allSymbolNames[Function: allSymbolNames]
generateRoutedConnection[Function: generateRoutedConnection]
resolveId[Function: resolveId]
allComponentFunctions[Function: allComponentFunctions]
resolveRouteNodeId[Function: resolveRouteNodeId]
routeGroups[Function: routeGroups]
routeRepresentative[Function: routeRepresentative]
getGithubToken[Function: getGithubToken]
setGithubToken[Function: setGithubToken]
isGithubAuthenticated[Function: isGithubAuthenticated]
getGithubOAuthUrl[Function: getGithubOAuthUrl]
currentParams[Function: currentParams]
handleGithubCallback[Function: handleGithubCallback]
restoredParams[Function: restoredParams]
newUrl[Function: newUrl]
successParams[Function: successParams]
failParams[Function: failParams]
scanRepositoryAndGenerateDiagram[Function: scanRepositoryAndGenerateDiagram]
markdownBlob[Function: markdownBlob]
markdownFile[Function: markdownFile]
extractMerfolkNodeIds[Function: extractMerfolkNodeIds]
filterNewMerfolkNodes[Function: filterNewMerfolkNodes]
mergeMerfolkMarkdown[Function: mergeMerfolkMarkdown]
extractContent[Function: extractContent]
rescanRepositoryForChanges[Function: rescanRepositoryForChanges]
allNodes[Function: allNodes]
allConnections[Function: allConnections]
nodeToObjectIdMap[Function: nodeToObjectIdMap]
reader[Function: reader]
globalSubscriptions[Function: globalSubscriptions]
getOrCreateSubscription[Function: getOrCreateSubscription]
decrementSubscription[Function: decrementSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
periodicCleanup[Function: periodicCleanup]
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
connectionTags[Function: connectionTags]
addTag[Function: addTag]
existingConnectionPairs[Function: existingConnectionPairs]
getFaceForObject[Function: getFaceForObject]
computeFaceWorldPosition[Function: computeFaceWorldPosition]
calculateDodecahedronFaceCenter[Function: calculateDodecahedronFaceCenter]
connectionsByCell[Function: connectionsByCell]
groupedByType[Function: groupedByType]
createContainerForGroup[Function: createContainerForGroup]
reachableFromRootModules[Function: reachableFromRootModules]
markReachable[Function: markReachable]
componentsWithChildContainers[Function: componentsWithChildContainers]
nodesInChildContainers[Function: nodesInChildContainers]
markDescendantsInChildContainers[Function: markDescendantsInChildContainers]
nodesWithContainers[Function: nodesWithContainers]
visited[Function: visited]
adjustNodeAndDescendants[Function: adjustNodeAndDescendants]
containerDimensions[Function: containerDimensions]
processedNodes[Function: processedNodes]
existingNodeIdMap[Function: existingNodeIdMap]
calculateHeaderStyle[Function: calculateHeaderStyle]
getGroupDisplayName[Function: getGroupDisplayName]
getGroupColor[Function: getGroupColor]
parentChildMap[Function: parentChildMap]
childParentMap[Function: childParentMap]
rootNodes[Function: rootNodes]
internalComponentChildren[Function: internalComponentChildren]
componentConnectionTypes[Function: componentConnectionTypes]
wouldCreateCycle[Function: wouldCreateCycle]
dfs[Function: dfs]
warnedCycles[Function: warnedCycles]
addParentChildRelation[Function: addParentChildRelation]
moveComponentTree[Function: moveComponentTree]
getComponentChildren[Function: getComponentChildren]
checkOverlap[Function: checkOverlap]
containersByLevel[Function: containersByLevel]
resolveNodeMove[Function: resolveNodeMove]
calculateNodeScaleFromChildren[Function: calculateNodeScaleFromChildren]
calculateGroupSpacing[Function: calculateGroupSpacing]
calculateGroupBounds[Function: calculateGroupBounds]
positionGroup[Function: positionGroup]
MarkdownDiagramService[Function: MarkdownDiagramService]
markdownDiagramService[Function: markdownDiagramService]
getSpaceById[Function: getSpaceById]
createSpace[Function: createSpace]
getOrCreateDefaultSpace[Function: getOrCreateDefaultSpace]
migrateToDefaultSpace[Function: migrateToDefaultSpace]
getUserSpaces[Function: getUserSpaces]
deleteSpace[Function: deleteSpace]
hasSpaceAccess[Function: hasSpaceAccess]
getPublicSpaceMetadata[Function: getPublicSpaceMetadata]
objectsCache[Function: objectsCache]
saveTimeouts[Function: saveTimeouts]
updateThrottles[Function: updateThrottles]
lastReceivedObjects[Function: lastReceivedObjects]
movingObjects[Function: movingObjects]
objectCellMap[Function: objectCellMap]
deletingObjects[Function: deletingObjects]
pendingSaves[Function: pendingSaves]
cancelPendingSave[Function: cancelPendingSave]
enqueueSave[Function: enqueueSave]
flushSaveBatch[Function: flushSaveBatch]
saves[Function: saves]
clearAllObjectCaches[Function: clearAllObjectCaches]
removeObjectFromCaches[Function: removeObjectFromCaches]
VOLATILE_KEYS[Function: VOLATILE_KEYS]
computeNonPositionFingerprint[Function: computeNonPositionFingerprint]
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
setUserPresence[Function: setUserPresence]
setGuestPresence[Function: setGuestPresence]
subscribeToSpacePresence[Function: subscribeToSpacePresence]
sharedSpacesCache[Function: sharedSpacesCache]
sharedSpacesCacheSet[Function: sharedSpacesCacheSet]
isSharedSpace[Function: isSharedSpace]
checkSpaceExists[Function: checkSpaceExists]
registerSharedSpaceFromUrl[Function: registerSharedSpaceFromUrl]
getSpaceOwner[Function: getSpaceOwner]
findSpaceOwner[Function: findSpaceOwner]
urlParams[Function: urlParams]
generateSharingUrl[Function: generateSharingUrl]
sharingUrl[Function: sharingUrl]
getSharedSpaceInfo[Function: getSharedSpaceInfo]
ScreenRecordingService[Function: ScreenRecordingService]
rawBlob[Function: rawBlob]
screenRecorder[Function: screenRecorder]
_disposedWeakSet[Function: _disposedWeakSet]
ResourceCleanupService[Function: ResourceCleanupService]
resourceCleanupService[Function: resourceCleanupService]
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
UnifiedCacheManager[Function: UnifiedCacheManager]
unifiedCacheManager[Function: unifiedCacheManager]
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
useAnimatedConnectionLineStore[[Store: useAnimatedConnectionLineStore]]
useAuthStore[[Store: useAuthStore]]
useColorPickerStore[[Store: useColorPickerStore]]
useConnectionStore[[Store: useConnectionStore]]
useDiagramStore[[Store: useDiagramStore]]
useLODStore[[Store: useLODStore]]
useDodecahedronStore[[Store: useDodecahedronStore]]
useFaceIndicatorStore[[Store: useFaceIndicatorStore]]
useFaceStore[[Store: useFaceStore]]
useIndicatorsStore[[Store: useIndicatorsStore]]
useCubeStore[[Store: useCubeStore]]
useScreenShareStore[[Store: useScreenShareStore]]
useObjectsStore[[Store: useObjectsStore]]
usePublicSpaceStore[[Store: usePublicSpaceStore]]
useTetrahedronStore[[Store: useTetrahedronStore]]
useSpatialManagerStore[[Store: useSpatialManagerStore]]
useSpaceManagerStore[[Store: useSpaceManagerStore]]
useTextAtlasStore[[Store: useTextAtlasStore]]
useTextInputStore[[Store: useTextInputStore]]
usePlaneStore[[Store: usePlaneStore]]
useTextObjectStore[[Store: useTextObjectStore]]
useTransformControlsStore[[Store: useTransformControlsStore]]
useUIOverlayStore[[Store: useUIOverlayStore]]
useWebcamStreamStore[[Store: useWebcamStreamStore]]

%% Utilities
selectAuthState[Function: selectAuthState]
selectAuth[Function: selectAuth]
ConnectionAnimationManager[Function: ConnectionAnimationManager]
initializeResources[Function: initializeResources]
isPointInFrustum[Function: isPointInFrustum]
isConnectionVisible[Function: isConnectionVisible]
objectPositions[Function: objectPositions]
visibleConnections[Function: visibleConnections]
selectConnectionHookState[Function: selectConnectionHookState]
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
getConnectionStateSelector[Function: getConnectionStateSelector]
cleanupStaleSelectors[Function: cleanupStaleSelectors]
actionsSelector[Function: actionsSelector]
selector[Function: selector]
handleGlobalClick[Function: handleGlobalClick]
objectPositionEqual[Function: objectPositionEqual]
cleanup[Function: cleanup]
loadedCellsKey[Function: loadedCellsKey]
memoizedLoadedCells[Function: memoizedLoadedCells]
setupCameraListeners[Function: setupCameraListeners]
handleCameraMove[Function: handleCameraMove]
addObjectToSpatialSystemWrapper[Function: addObjectToSpatialSystemWrapper]
moveObjectInSpatialSystemWrapper[Function: moveObjectInSpatialSystemWrapper]
loadCellWrapper[Function: loadCellWrapper]
updateCameraPositionWrapper[Function: updateCameraPositionWrapper]
setNamedTimeout[Function: setNamedTimeout]
clearNamedTimeout[Function: clearNamedTimeout]
clearAllTimeouts[Function: clearAllTimeouts]
hasActiveTimeout[Function: hasActiveTimeout]
getTimeoutId[Function: getTimeoutId]
updateTexture[Function: updateTexture]
selectSpaceManagerState[Function: selectSpaceManagerState]
selectObjectsHookState[Function: selectObjectsHookState]
handleCreateObject[Function: handleCreateObject]
handleObjectDelete[Function: handleObjectDelete]
registerTransformingObject[Function: registerTransformingObject]
monitorConnection[Function: monitorConnection]
connectionHandler[Function: connectionHandler]
handleUrlAuthLocal[Function: handleUrlAuthLocal]
initAuth[Function: initAuth]
line_vert_glsl[Function: line_vert_glsl]
line_frag_glsl[Function: line_frag_glsl]
_buildConnectionsByObjectId[Function: _buildConnectionsByObjectId]
getCellCoords[Function: getCellCoords]
getCellIdFromCoords[Function: getCellIdFromCoords]
calculateLODLevel[Function: calculateLODLevel]
calculateParentLODLevel[Function: calculateParentLODLevel]
getCubeSelector[Function: getCubeSelector]
getCubeFaceColorSelector[Function: getCubeFaceColorSelector]
getCubeSelectedFaceSelector[Function: getCubeSelectedFaceSelector]
getCubeFaceStateSelector[Function: getCubeFaceStateSelector]
useStoreInitialization[Function: useStoreInitialization]
useCubeSelectors[Function: useCubeSelectors]
useCubeActions[Function: useCubeActions]
usePlaneSelectors[Function: usePlaneSelectors]
usePlaneActions[Function: usePlaneActions]
useGlobalStoreUtils[Function: useGlobalStoreUtils]
clearAllSelections[Function: clearAllSelections]
resetAllStores[Function: resetAllStores]
numericHash[Function: numericHash]
stringHash[Function: stringHash]
logAnimation[Function: logAnimation]
forceAnimateConnection[Function: forceAnimateConnection]
shouldAnimateConnection[Function: shouldAnimateConnection]
recordFrameTime[Function: recordFrameTime]
recordStateUpdate[Function: recordStateUpdate]
getPerfStats[Function: getPerfStats]
resetPerfStats[Function: resetPerfStats]
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
handleFaceIndicatorClick[Function: handleFaceIndicatorClick]
getIdFromIndicator[Function: getIdFromIndicator]
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
_avg3[Function: _avg3]
calculateFacePosition[Function: calculateFacePosition]
intersectionCache[Function: intersectionCache]
pathCache[Function: pathCache]
objectPositionCache[Function: objectPositionCache]
precomputedResults[Function: precomputedResults]
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
precomputeCacheKey[Function: precomputeCacheKey]
getPrecomputedResult[Function: getPrecomputedResult]
computeConnectionPath[Function: computeConnectionPath]
precomputePathsBatch[Function: precomputePathsBatch]
requestsById[Function: requestsById]
FrameCounter[Function: FrameCounter]
frameCounter[Function: frameCounter]
getIsInitialLoading[Function: getIsInitialLoading]
setIsInitialLoading[Function: setIsInitialLoading]
ObjectVirtualizer[Function: ObjectVirtualizer]
objectVirtualizer[Function: objectVirtualizer]
LinePool[Function: LinePool]
geometry[Function: geometry]
positions[Function: positions]
getLinePool[Function: getLinePool]
clearLinePool[Function: clearLinePool]
GPUResourceTracker[Function: GPUResourceTracker]
gpuTracker[Function: gpuTracker]
calculateAxisSnap[Function: calculateAxisSnap]
distanceToAxis[Function: distanceToAxis]
projectPointOntoAxis[Function: projectPointOntoAxis]
calculateMidpoint[Function: calculateMidpoint]
calculateMidpointVector[Function: calculateMidpointVector]
lerp[Function: lerp]
checkPositionJitter[Function: checkPositionJitter]
handleObjectMove[Function: handleObjectMove]
handleObjectUpdate[Function: handleObjectUpdate]
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
loadTextureFromFirebaseUrl[Function: loadTextureFromFirebaseUrl]
url[Function: url]
img[Function: img]
loadTextureFromBlob[Function: loadTextureFromBlob]
Point3D[Function: Point3D]
BoundingBox[Function: BoundingBox]
OptimizedSpatialGrid[Function: OptimizedSpatialGrid]
seenObjects[Function: seenObjects]
createStreamlinedSpatialIndex[Function: createStreamlinedSpatialIndex]
benchmarkStreamlined[Function: benchmarkStreamlined]
position[Function: position]
center[Function: center]
estimateNodeSize[Function: estimateNodeSize]
isHierarchyConnection[Function: isHierarchyConnection]
filterConnections[Function: filterConnections]
layoutNodes[Function: layoutNodes]
computeSize[Function: computeSize]
computeSubtreeWidth[Function: computeSubtreeWidth]
positionTree[Function: positionTree]
positionContained[Function: positionContained]
layoutEdges[Function: layoutEdges]
throttle[Function: throttle]
debounce[Function: debounce]
measurePerformance[Function: measurePerformance]
scheduleWork[Function: scheduleWork]
memoize[Function: memoize]
createCacheKey[Function: createCacheKey]
trackLCP[Function: trackLCP]
observer[Function: observer]
getDiagramLayoutWorker[Function: getDiagramLayoutWorker]
terminateDiagramLayoutWorker[Function: terminateDiagramLayoutWorker]
TextAtlas[Function: TextAtlas]
MultiPageTextAtlas[Function: MultiPageTextAtlas]
page[Function: page]
isOffscreenCanvasTextSupported[Function: isOffscreenCanvasTextSupported]
c[Function: c]
WorkerMultiPageTextAtlas[Function: WorkerMultiPageTextAtlas]
seen[Function: seen]
_switchToSyncAtlas[Function: _switchToSyncAtlas]
getGlobalTextAtlas[Function: getGlobalTextAtlas]
resetGlobalTextAtlas[Function: resetGlobalTextAtlas]
createAtlasTextMesh[Function: createAtlasTextMesh]
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
getTextAtlasWorker[Function: getTextAtlasWorker]
terminateTextAtlasWorker[Function: terminateTextAtlasWorker]
getSpatialIndexWorker[Function: getSpatialIndexWorker]
terminateSpatialIndexWorker[Function: terminateSpatialIndexWorker]
getKey[Function: getKey]
AtlasPage[Function: AtlasPage]
addPage[Function: addPage]
LayoutEngine[Function: LayoutEngine]
parseFlowPaths[Function: parseFlowPaths]
stripFlowPathSyntax[Function: stripFlowPathSyntax]
computeHeaderStyle[Function: computeHeaderStyle]
getMarkdownLayoutWorker[Function: getMarkdownLayoutWorker]
terminateMarkdownLayoutWorker[Function: terminateMarkdownLayoutWorker]
getPathfindingWorker[Function: getPathfindingWorker]
terminatePathfindingWorker[Function: terminatePathfindingWorker]
childLOD[Function: childLOD]
parentLOD[Function: parentLOD]

%% External Libraries
@eslint/js<Library: @eslint/js>
globals<Library: globals>
eslint-plugin-react<Library: eslint-plugin-react>
eslint-plugin-react-hooks<Library: eslint-plugin-react-hooks>
eslint-plugin-react-refresh<Library: eslint-plugin-react-refresh>
react<Library: react>
three<Library: three>
@react-three/fiber<Library: @react-three/fiber>
firebase-admin/app<Library: firebase-admin/app>
firebase-admin/auth<Library: firebase-admin/auth>
firebase-admin/firestore<Library: firebase-admin/firestore>
firebase-functions/v2/https<Library: firebase-functions/v2/https>
firebase-functions/params<Library: firebase-functions/params>
express<Library: express>
cors<Library: cors>
dotenv<Library: dotenv>
@react-three/drei<Library: @react-three/drei>
react-colorful<Library: react-colorful>
@react-three/postprocessing<Library: @react-three/postprocessing>
@react-three/drei/core/Stats<Library: @react-three/drei/core/Stats>
lodash/isEqual<Library: lodash/isEqual>
zustand/shallow<Library: zustand/shallow>
@xyflow/react<Library: @xyflow/react>
@xyflow/react/dist/style.css<Library: @xyflow/react/dist/style.css>
three/examples/jsm/lines/Line2.js<Library: three/examples/jsm/lines/Line2.js>
three/examples/jsm/loaders/GLTFLoader<Library: three/examples/jsm/loaders/GLTFLoader>
three/examples/jsm/loaders/DRACOLoader<Library: three/examples/jsm/loaders/DRACOLoader>
firebase/database<Library: firebase/database>
firebase/app<Library: firebase/app>
firebase/auth<Library: firebase/auth>
firebase/firestore<Library: firebase/firestore>
firebase/storage<Library: firebase/storage>
firebase/functions<Library: firebase/functions>
zustand<Library: zustand>
react-dom/client<Library: react-dom/client>
@babel/parser<Library: @babel/parser>
3d-ast-generator<Library: 3d-ast-generator>
fix-webm-duration<Library: fix-webm-duration>
zustand/traditional<Library: zustand/traditional>
uuid<Library: uuid>
three/examples/jsm/lines/LineGeometry.js<Library: three/examples/jsm/lines/LineGeometry.js>
three/examples/jsm/lines/LineMaterial.js<Library: three/examples/jsm/lines/LineMaterial.js>
comlink<Library: comlink>
vite<Library: vite>
@vitejs/plugin-react<Library: @vitejs/plugin-react>
vite-plugin-glsl<Library: vite-plugin-glsl>

%% Component Internal Functions
cellboundaryrendererBuildGeometry[Function: cellboundaryrendererBuildGeometry]
batchedconnectionlinesStraightConnections[Function: batchedconnectionlinesStraightConnections]
batchedconnectionlinesCustomRaycast[Function: batchedconnectionlinesCustomRaycast]
animatedconnectionlineStructuralKey[Function: animatedconnectionlineStructuralKey]
batchedcurvedlinesPathsData[Function: batchedcurvedlinesPathsData]
batchedcurvedlinesCustomRaycast[Function: batchedcurvedlinesCustomRaycast]
atlastextspriteAtlas[Function: atlastextspriteAtlas]
atlastextspriteCalculatedPosition[Function: atlastextspriteCalculatedPosition]
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
cubefaceFaceStateSelector[Function: cubefaceFaceStateSelector]
cubefaceFaceMaterial[Function: cubefaceFaceMaterial]
cubefaceOffsetMultiplier[Function: cubefaceOffsetMultiplier]
cubefaceOffsetPosition[Function: cubefaceOffsetPosition]
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
diagramoverlay2dFlowPathNames[Function: diagramoverlay2dFlowPathNames]
diagramoverlay2dSerialisedGraphData[Function: diagramoverlay2dSerialisedGraphData]
diagramoverlay2dSerialisedHierarchy[Function: diagramoverlay2dSerialisedHierarchy]
diagramoverlay2dFilteredEdges[Function: diagramoverlay2dFilteredEdges]
diagramoverlay2dToggleLayer[Function: diagramoverlay2dToggleLayer]
diagramoverlay2dToggleLayerHandlers[Function: diagramoverlay2dToggleLayerHandlers]
dodecahedronfaceFaceMaterial[Function: dodecahedronfaceFaceMaterial]
dodecahedronfaceInverseScale[Function: dodecahedronfaceInverseScale]
dodecahedronfaceAdjustedTextPosition[Function: dodecahedronfaceAdjustedTextPosition]
customcameraMemoizedTarget[Function: customcameraMemoizedTarget]
customcameraControlsRefCallback[Function: customcameraControlsRefCallback]
containeroutlineCubeEdges[Function: containeroutlineCubeEdges]
faceindicatorMaterial[Function: faceindicatorMaterial]
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
distancefilteredconnectiontextGetTextParametricT[Function: distancefilteredconnectiontextGetTextParametricT]
distancefilteredconnectiontextRedistributeFaces[Function: distancefilteredconnectiontextRedistributeFaces]
distancefilteredconnectiontextPathToLineSegments[Function: distancefilteredconnectiontextPathToLineSegments]
distancefilteredconnectiontextResolveEndpointPosition[Function: distancefilteredconnectiontextResolveEndpointPosition]
distancefilteredconnectiontextGetLineWidth[Function: distancefilteredconnectiontextGetLineWidth]
distancefilteredconnectiontextConnectionData[Function: distancefilteredconnectiontextConnectionData]
distancefilteredconnectiontextPathData[Function: distancefilteredconnectiontextPathData]
distancefilteredconnectiontextTextPositionData[Function: distancefilteredconnectiontextTextPositionData]
distancefilteredconnectiontextAvailableObjectIds[Function: distancefilteredconnectiontextAvailableObjectIds]
distancefilteredconnectiontextPathfindingObjects[Function: distancefilteredconnectiontextPathfindingObjects]
distancefilteredconnectiontextObjectsPositionHash[Function: distancefilteredconnectiontextObjectsPositionHash]
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
globaldodecahedronedgesrendererFilteredDodecahedrons[Function: globaldodecahedronedgesrendererFilteredDodecahedrons]
globaldodecahedronedgesrendererDodecahedronIds[Function: globaldodecahedronedgesrendererDodecahedronIds]
globaldodecahedronedgesrendererIsDodecahedronVisible[Function: globaldodecahedronedgesrendererIsDodecahedronVisible]
globaldodecahedronedgesrendererUpdateDodecahedronEdges[Function: globaldodecahedronedgesrendererUpdateDodecahedronEdges]
globaltetrahedronedgesrendererFilteredTetrahedrons[Function: globaltetrahedronedgesrendererFilteredTetrahedrons]
globaltetrahedronedgesrendererTetrahedronIds[Function: globaltetrahedronedgesrendererTetrahedronIds]
globaltetrahedronedgesrendererIsTetrahedronVisible[Function: globaltetrahedronedgesrendererIsTetrahedronVisible]
globaltetrahedronedgesrendererUpdateTetrahedronEdges[Function: globaltetrahedronedgesrendererUpdateTetrahedronEdges]
instancedlineFlatPoints[Function: instancedlineFlatPoints]
instancedlineGeometry[Function: instancedlineGeometry]
instancedlineCustomRaycast[Function: instancedlineCustomRaycast]
instancedlineMaterial[Function: instancedlineMaterial]
instancedatlastextAtlas[Function: instancedatlastextAtlas]
instancedatlastextPageGroups[Function: instancedatlastextPageGroups]
instancedatlastextGeometry[Function: instancedatlastextGeometry]
instancedatlastextMaterial[Function: instancedatlastextMaterial]
globalcubeedgesrendererFilteredCubes[Function: globalcubeedgesrendererFilteredCubes]
globalcubeedgesrendererCubeIds[Function: globalcubeedgesrendererCubeIds]
globalcubeedgesrendererIsCubeVisible[Function: globalcubeedgesrendererIsCubeVisible]
globalcubeedgesrendererUpdateCubeEdges[Function: globalcubeedgesrendererUpdateCubeEdges]
lodmanagerContainersKey[Function: lodmanagerContainersKey]
lodmanagerComputeContainmentSync[Function: lodmanagerComputeContainmentSync]
realtimeconnectionupdaterRunConnectionUpdate[Function: realtimeconnectionupdaterRunConnectionUpdate]
realtimeconnectionupdaterUpdateConnectionEndpoint[Function: realtimeconnectionupdaterUpdateConnectionEndpoint]
realtimeconnectionupdaterRebuildConnectionMap[Function: realtimeconnectionupdaterRebuildConnectionMap]
objectsrendererMountNextBatch[Function: objectsrendererMountNextBatch]
objectsrendererMountResume[Function: objectsrendererMountResume]
objectsrendererProgressiveVisibleObjects[Function: objectsrendererProgressiveVisibleObjects]
objectsrendererCubeObjects[Function: objectsrendererCubeObjects]
objectsrendererContainerHeaders[Function: objectsrendererContainerHeaders]
objectsrendererDodecahedronObjects[Function: objectsrendererDodecahedronObjects]
objectsrendererTetrahedronObjects[Function: objectsrendererTetrahedronObjects]
objectsrendererRenderedObjects[Function: objectsrendererRenderedObjects]
objectrendererArraysEqual[Function: objectrendererArraysEqual]
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
tetrahedronfaceFaceMaterial[Function: tetrahedronfaceFaceMaterial]
tetrahedronfaceGetFaceTextOffset[Function: tetrahedronfaceGetFaceTextOffset]
tetrahedronfaceFaceTextElement[Function: tetrahedronfaceFaceTextElement]
textspriteSpriteId[Function: textspriteSpriteId]
textspriteSetIsDragging[Function: textspriteSetIsDragging]
textspriteCalculatedPosition[Function: textspriteCalculatedPosition]
textspriteGetFontSize[Function: textspriteGetFontSize]
webcamstreamAttemptPlay[Function: webcamstreamAttemptPlay]
webcamstreamConnectToBroadcast[Function: webcamstreamConnectToBroadcast]
uioverlaySetIsRecording[Function: uioverlaySetIsRecording]
uioverlayFetchRepositories[Function: uioverlayFetchRepositories]
uioverlayFetchAppJsxFromRepo[Function: uioverlayFetchAppJsxFromRepo]
uioverlayTriggerDownload[Function: uioverlayTriggerDownload]
uioverlayHandler[Function: uioverlayHandler]
uioverlayCreateTemplate[Function: uioverlayCreateTemplate]
textstyleuicontentGetUIScale[Function: textstyleuicontentGetUIScale]

%% Component-Function Relationships
CellBoundaryRenderer -.-> cellboundaryrendererBuildGeometry : "render helper"
BatchedConnectionLines -.-> batchedconnectionlinesStraightConnections : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesCustomRaycast : "internal function"
AnimatedConnectionLine -.-> animatedconnectionlineStructuralKey : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesPathsData : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesCustomRaycast : "internal function"
AtlasTextSprite -.-> atlastextspriteAtlas : "internal function"
AtlasTextSprite -.-> atlastextspriteCalculatedPosition : "calculation helper"
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
CubeFace -.-> cubefaceFaceStateSelector : "internal function"
CubeFace -.-> cubefaceFaceMaterial : "internal function"
CubeFace -.-> cubefaceOffsetMultiplier : "setter function"
CubeFace -.-> cubefaceOffsetPosition : "setter function"
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
DiagramOverlay2D -.-> diagramoverlay2dFlowPathNames : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedGraphData : "boolean check"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedHierarchy : "boolean check"
DiagramOverlay2D -.-> diagramoverlay2dFilteredEdges : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayer : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayerHandlers : "event handler"
DodecahedronFace -.-> dodecahedronfaceFaceMaterial : "internal function"
DodecahedronFace -.-> dodecahedronfaceInverseScale : "internal function"
DodecahedronFace -.-> dodecahedronfaceAdjustedTextPosition : "internal function"
CustomCamera -.-> customcameraMemoizedTarget : "getter function"
CustomCamera -.-> customcameraControlsRefCallback : "internal function"
ContainerOutline -.-> containeroutlineCubeEdges : "internal function"
FaceIndicator -.-> faceindicatorMaterial : "internal function"
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
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextGetTextParametricT : "getter function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextRedistributeFaces : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathToLineSegments : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextResolveEndpointPosition : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextGetLineWidth : "getter function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextConnectionData : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathData : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextTextPositionData : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextAvailableObjectIds : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathfindingObjects : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextObjectsPositionHash : "boolean check"
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
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererFilteredDodecahedrons : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererDodecahedronIds : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererIsDodecahedronVisible : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererUpdateDodecahedronEdges : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererFilteredTetrahedrons : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererTetrahedronIds : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererIsTetrahedronVisible : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererUpdateTetrahedronEdges : "render helper"
InstancedLine -.-> instancedlineFlatPoints : "internal function"
InstancedLine -.-> instancedlineGeometry : "internal function"
InstancedLine -.-> instancedlineCustomRaycast : "internal function"
InstancedLine -.-> instancedlineMaterial : "internal function"
InstancedAtlasText -.-> instancedatlastextAtlas : "internal function"
InstancedAtlasText -.-> instancedatlastextPageGroups : "internal function"
InstancedAtlasText -.-> instancedatlastextGeometry : "internal function"
InstancedAtlasText -.-> instancedatlastextMaterial : "internal function"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererFilteredCubes : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererCubeIds : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererIsCubeVisible : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererUpdateCubeEdges : "render helper"
LODManager -.-> lodmanagerContainersKey : "internal function"
LODManager -.-> lodmanagerComputeContainmentSync : "calculation helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRunConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterUpdateConnectionEndpoint : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRebuildConnectionMap : "update helper"
ObjectsRenderer -.-> objectsrendererMountNextBatch : "render helper"
ObjectsRenderer -.-> objectsrendererMountResume : "render helper"
ObjectsRenderer -.-> objectsrendererProgressiveVisibleObjects : "render helper"
ObjectsRenderer -.-> objectsrendererCubeObjects : "render helper"
ObjectsRenderer -.-> objectsrendererContainerHeaders : "render helper"
ObjectsRenderer -.-> objectsrendererDodecahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererTetrahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererRenderedObjects : "render helper"
ObjectRenderer -.-> objectrendererArraysEqual : "render helper"
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
TetrahedronFace -.-> tetrahedronfaceFaceMaterial : "internal function"
TetrahedronFace -.-> tetrahedronfaceGetFaceTextOffset : "getter function"
TetrahedronFace -.-> tetrahedronfaceFaceTextElement : "internal function"
TextSprite -.-> textspriteSpriteId : "internal function"
TextSprite -.-> textspriteSetIsDragging : "setter function"
TextSprite -.-> textspriteCalculatedPosition : "calculation helper"
TextSprite -.-> textspriteGetFontSize : "getter function"
WebcamStream -.-> webcamstreamAttemptPlay : "internal function"
WebcamStream -.-> webcamstreamConnectToBroadcast : "internal function"
UIOverlay -.-> uioverlaySetIsRecording : "setter function"
UIOverlay -.-> uioverlayFetchRepositories : "internal function"
UIOverlay -.-> uioverlayFetchAppJsxFromRepo : "internal function"
UIOverlay -.-> uioverlayTriggerDownload : "internal function"
UIOverlay -.-> uioverlayHandler : "event handler"
UIOverlay -.-> uioverlayCreateTemplate : "internal function"
TextStyleUIContent -.-> textstyleuicontentGetUIScale : "getter function"

%% File Container Nodes
backend_index((Service: index))
useAuthState_file[Hook: useAuthState]
useAuth_file[Hook: useAuth]
useCentralizedBroadcastManager_file[Hook: useCentralizedBroadcastManager]
useConnectionAnimationManager[Hook: useConnectionAnimationManager]
useLinePool_file[Hook: useLinePool]
useIndicators_file[Hook: useIndicators]
useFrustumCulling[Hook: useFrustumCulling]
useConnections_file[Hook: useConnections]
useConnectionsRendererStore_file[Hook: useConnectionsRendererStore]
useGlobalClickHandler_file[Hook: useGlobalClickHandler]
useConnectionObjects_file[Hook: useConnectionObjects]
useDebouncedUpdate_file[Hook: useDebouncedUpdate]
useSpatialManager_file[Hook: useSpatialManager]
centralizedBroadcastManager_file((Service: centralizedBroadcastManager))
useTimeoutManager_file[Hook: useTimeoutManager]
useTextureUpdater_file[Hook: useTextureUpdater]
connectionPositionResolver((Service: connectionPositionResolver))
useSpaceManager_file[Hook: useSpaceManager]
useObjects_file[Hook: useObjects]
authService((Service: authService))
connectionsService((Service: connectionsService))
githubRepoService((Service: githubRepoService))
processMethods((Service: processMethods))
globalSubscriptionManager((Service: globalSubscriptionManager))
globalOptimizationCoordinator_file((Service: globalOptimizationCoordinator))
connectionMethods((Service: connectionMethods))
containerMethods((Service: containerMethods))
objectMethods((Service: objectMethods))
constants((Service: constants))
hierarchyMethods((Service: hierarchyMethods))
positionMethods((Service: positionMethods))
markdownDiagramService_file((Service: markdownDiagramService))
spacesService((Service: spacesService))
spatialObjectsService((Service: spatialObjectsService))
presenceService((Service: presenceService))
sharedSpacesService((Service: sharedSpacesService))
sharingService((Service: sharingService))
screenRecordingService((Service: screenRecordingService))
resourceCleanupService_file((Service: resourceCleanupService))
spatialPartitioning((Service: spatialPartitioning))
authStore[[Store: authStore]]
shader_shaders[Function: shaders]
unifiedCacheManager_file((Service: unifiedCacheManager))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
storageService((Service: storageService))
webRservice((Service: webRservice))
connectionStore[[Store: connectionStore]]
lodStore[[Store: lodStore]]
cubeStore[[Store: cubeStore]]
storeUtils[[Store: storeUtils]]
objectsStore[[Store: objectsStore]]
debugUtils[Function: debugUtils]
animationUtils[Function: animationUtils]
bvhRaycasting[Function: bvhRaycasting]
faceIndicatorUtils[Function: faceIndicatorUtils]
connectionUtils[Function: connectionUtils]
uiOverlayStore[[Store: uiOverlayStore]]
facePositionUtils[Function: facePositionUtils]
pathfindingUtils[Function: pathfindingUtils]
frameCounter_file[Function: frameCounter]
loadingState[Function: loadingState]
objectVirtualization[Function: objectVirtualization]
linePoolManager[Function: linePoolManager]
gpuResourceTracker[Function: gpuResourceTracker]
snappingUtils[Function: snappingUtils]
positionUtils[Function: positionUtils]
objectUpdateHandlers[Function: objectUpdateHandlers]
renderWorkScheduler[Function: renderWorkScheduler]
textureLoader[Function: textureLoader]
streamlinedSpatialIndex[Function: streamlinedSpatialIndex]
worker_diagramLayoutWorker[Function: diagramLayoutWorker]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
worker_diagramLayoutWorkerClient[Function: diagramLayoutWorkerClient]
textAtlas[Function: textAtlas]
unifiedValidationUtils[Function: unifiedValidationUtils]
worker_textAtlasWorkerClient[Function: textAtlasWorkerClient]
worker_spatialIndexWorkerClient[Function: spatialIndexWorkerClient]
worker_textAtlasWorker[Function: textAtlasWorker]
worker_markdownLayoutWorker[Function: markdownLayoutWorker]
worker_markdownLayoutWorkerClient[Function: markdownLayoutWorkerClient]
worker_pathfindingWorkerClient[Function: pathfindingWorkerClient]
worker_spatialIndexWorker[Function: spatialIndexWorker]

%% File-Function Relationships
backend_index -.-> createVerifyAuthTokenApp : "contains"
backend_index -.-> createBulkImportApp : "contains"
backend_index -.-> objectsByCellId : "contains"
backend_index -.-> connectionsByCellId : "contains"
backend_index -.-> params : "contains"
backend_index -.-> createBulkDeleteApp : "contains"
useAuthState_file -.-> selectAuthState : "contains"
useAuthState_file -.-> useAuthState : "contains"
useAuth_file -.-> selectAuth : "contains"
useAuth_file -.-> useAuth : "contains"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "contains"
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
useLinePool_file -.-> useLinePool : "contains"
useLinePool_file -.-> initializeResources : "contains"
useIndicators_file -.-> useIndicators : "contains"
useFrustumCulling -.-> isPointInFrustum : "contains"
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
useFrustumCulling -.-> objectPositions : "contains"
useFrustumCulling -.-> visibleConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
useConnections_file -.-> selectConnectionHookState : "contains"
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
useConnectionsRendererStore_file -.-> getConnectionStateSelector : "contains"
useConnectionsRendererStore_file -.-> cleanupStaleSelectors : "contains"
useConnectionsRendererStore_file -.-> actionsSelector : "contains"
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "contains"
useConnectionsRendererStore_file -.-> useConnectionState : "contains"
useConnectionsRendererStore_file -.-> selector : "contains"
useConnectionsRendererStore_file -.-> useConnectionActions : "contains"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "contains"
useGlobalClickHandler_file -.-> handleGlobalClick : "contains"
useConnectionObjects_file -.-> objectPositionEqual : "contains"
useConnectionObjects_file -.-> useConnectionObjects : "contains"
useConnectionObjects_file -.-> usePathfindingObjects : "contains"
useConnectionObjects_file -.-> useConnectionObjectPositions : "contains"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "contains"
useDebouncedUpdate_file -.-> cleanup : "contains"
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
centralizedBroadcastManager_file -.-> CentralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> dummyUnsubscribe : "contains"
centralizedBroadcastManager_file -.-> centralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> subscribePlaneToBroadcasts : "contains"
centralizedBroadcastManager_file -.-> getBroadcastManagerDebugInfo : "contains"
centralizedBroadcastManager_file -.-> cleanupBroadcastManager : "contains"
useTimeoutManager_file -.-> useTimeoutManager : "contains"
useTimeoutManager_file -.-> setNamedTimeout : "contains"
useTimeoutManager_file -.-> clearNamedTimeout : "contains"
useTimeoutManager_file -.-> clearAllTimeouts : "contains"
useTimeoutManager_file -.-> hasActiveTimeout : "contains"
useTimeoutManager_file -.-> getTimeoutId : "contains"
useTextureUpdater_file -.-> useTextureUpdater : "contains"
useTextureUpdater_file -.-> updateTexture : "contains"
connectionPositionResolver -.-> resolveConnectionPositions : "contains"
connectionPositionResolver -.-> resolveConnectionEndpoint : "contains"
connectionPositionResolver -.-> connectionNeedsPositionResolution : "contains"
connectionPositionResolver -.-> positionsEqual : "contains"
useSpaceManager_file -.-> selectSpaceManagerState : "contains"
useSpaceManager_file -.-> useSpaceManager : "contains"
useObjects_file -.-> selectObjectsHookState : "contains"
useObjects_file -.-> useObjects : "contains"
useObjects_file -.-> handleCreateObject : "contains"
useObjects_file -.-> handleObjectDelete : "contains"
useObjects_file -.-> registerTransformingObject : "contains"
authService -.-> signInUser : "contains"
authService -.-> handlePostLoginRedirect : "contains"
authService -.-> signOut : "contains"
authService -.-> handleRedirectResult : "contains"
authService -.-> observeAuthState : "contains"
authService -.-> validateAuthToken : "contains"
authService -.-> handleUrlAuth : "contains"
authService -.-> params : "contains"
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
githubRepoService -.-> exchangeGithubCode : "contains"
githubRepoService -.-> fetchRepositories : "contains"
githubRepoService -.-> fetchFileContent : "contains"
githubRepoService -.-> fetchLatestCommitSha : "contains"
githubRepoService -.-> fetchChangedFiles : "contains"
githubRepoService -.-> getFileTypeFromPath : "contains"
githubRepoService -.-> fetchRepositoryStructure : "contains"
githubRepoService -.-> analyzeFile : "contains"
githubRepoService -.-> containsJSX : "contains"
githubRepoService -.-> detectRepoType : "contains"
githubRepoService -.-> sanitizeNodeId : "contains"
githubRepoService -.-> traverseVanillaAST : "contains"
githubRepoService -.-> exportedNames : "contains"
githubRepoService -.-> ensureContainer : "contains"
githubRepoService -.-> addSymbol : "contains"
githubRepoService -.-> trackRelativeSource : "contains"
githubRepoService -.-> importBindings : "contains"
githubRepoService -.-> traversePythonSource : "contains"
githubRepoService -.-> localNames : "contains"
githubRepoService -.-> traverseVueSource : "contains"
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
githubRepoService -.-> moduleImportRelationships : "contains"
githubRepoService -.-> nextjsRouteMap : "contains"
githubRepoService -.-> traverse : "contains"
githubRepoService -.-> knownContainers : "contains"
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
githubRepoService -.-> allSymbolNames : "contains"
githubRepoService -.-> generateRoutedConnection : "contains"
githubRepoService -.-> resolveId : "contains"
githubRepoService -.-> allComponentFunctions : "contains"
githubRepoService -.-> resolveRouteNodeId : "contains"
githubRepoService -.-> routeGroups : "contains"
githubRepoService -.-> routeRepresentative : "contains"
githubRepoService -.-> getGithubToken : "contains"
githubRepoService -.-> setGithubToken : "contains"
githubRepoService -.-> isGithubAuthenticated : "contains"
githubRepoService -.-> getGithubOAuthUrl : "contains"
githubRepoService -.-> currentParams : "contains"
githubRepoService -.-> handleGithubCallback : "contains"
githubRepoService -.-> params : "contains"
githubRepoService -.-> restoredParams : "contains"
githubRepoService -.-> newUrl : "contains"
githubRepoService -.-> successParams : "contains"
githubRepoService -.-> failParams : "contains"
githubRepoService -.-> scanRepositoryAndGenerateDiagram : "contains"
githubRepoService -.-> markdownBlob : "contains"
githubRepoService -.-> markdownFile : "contains"
githubRepoService -.-> extractMerfolkNodeIds : "contains"
githubRepoService -.-> filterNewMerfolkNodes : "contains"
githubRepoService -.-> mergeMerfolkMarkdown : "contains"
githubRepoService -.-> extractContent : "contains"
githubRepoService -.-> rescanRepositoryForChanges : "contains"
processMethods -.-> allNodes : "contains"
processMethods -.-> allConnections : "contains"
processMethods -.-> nodeToObjectIdMap : "contains"
processMethods -.-> reader : "contains"
globalSubscriptionManager -.-> globalSubscriptions : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> decrementSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
globalSubscriptionManager -.-> periodicCleanup : "contains"
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
connectionMethods -.-> connectionTags : "contains"
connectionMethods -.-> addTag : "contains"
connectionMethods -.-> existingConnectionPairs : "contains"
connectionMethods -.-> getFaceForObject : "contains"
connectionMethods -.-> computeFaceWorldPosition : "contains"
connectionMethods -.-> calculateDodecahedronFaceCenter : "contains"
connectionMethods -.-> connectionsByCell : "contains"
containerMethods -.-> groupedByType : "contains"
containerMethods -.-> createContainerForGroup : "contains"
containerMethods -.-> reachableFromRootModules : "contains"
containerMethods -.-> markReachable : "contains"
containerMethods -.-> componentsWithChildContainers : "contains"
containerMethods -.-> nodesInChildContainers : "contains"
containerMethods -.-> markDescendantsInChildContainers : "contains"
containerMethods -.-> nodesWithContainers : "contains"
containerMethods -.-> visited : "contains"
containerMethods -.-> adjustNodeAndDescendants : "contains"
containerMethods -.-> containerDimensions : "contains"
objectMethods -.-> processedNodes : "contains"
objectMethods -.-> existingNodeIdMap : "contains"
objectMethods -.-> calculateHeaderStyle : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
hierarchyMethods -.-> parentChildMap : "contains"
hierarchyMethods -.-> childParentMap : "contains"
hierarchyMethods -.-> rootNodes : "contains"
hierarchyMethods -.-> internalComponentChildren : "contains"
hierarchyMethods -.-> componentConnectionTypes : "contains"
hierarchyMethods -.-> wouldCreateCycle : "contains"
hierarchyMethods -.-> visited : "contains"
hierarchyMethods -.-> dfs : "contains"
hierarchyMethods -.-> warnedCycles : "contains"
hierarchyMethods -.-> addParentChildRelation : "contains"
positionMethods -.-> moveComponentTree : "contains"
positionMethods -.-> getComponentChildren : "contains"
positionMethods -.-> checkOverlap : "contains"
positionMethods -.-> containersByLevel : "contains"
positionMethods -.-> resolveNodeMove : "contains"
positionMethods -.-> reachableFromRootModules : "contains"
positionMethods -.-> markReachable : "contains"
positionMethods -.-> componentsWithChildContainers : "contains"
positionMethods -.-> nodesInChildContainers : "contains"
positionMethods -.-> markDescendantsInChildContainers : "contains"
positionMethods -.-> groupedByType : "contains"
positionMethods -.-> calculateNodeScaleFromChildren : "contains"
positionMethods -.-> calculateGroupSpacing : "contains"
positionMethods -.-> calculateGroupBounds : "contains"
positionMethods -.-> positionGroup : "contains"
markdownDiagramService_file -.-> MarkdownDiagramService : "contains"
markdownDiagramService_file -.-> markdownDiagramService : "contains"
spacesService -.-> getSpaceById : "contains"
spacesService -.-> createSpace : "contains"
spacesService -.-> getOrCreateDefaultSpace : "contains"
spacesService -.-> migrateToDefaultSpace : "contains"
spacesService -.-> getUserSpaces : "contains"
spacesService -.-> deleteSpace : "contains"
spacesService -.-> hasSpaceAccess : "contains"
spacesService -.-> getPublicSpaceMetadata : "contains"
spatialObjectsService -.-> objectsCache : "contains"
spatialObjectsService -.-> saveTimeouts : "contains"
spatialObjectsService -.-> updateThrottles : "contains"
spatialObjectsService -.-> lastReceivedObjects : "contains"
spatialObjectsService -.-> movingObjects : "contains"
spatialObjectsService -.-> objectCellMap : "contains"
spatialObjectsService -.-> deletingObjects : "contains"
spatialObjectsService -.-> pendingSaves : "contains"
spatialObjectsService -.-> cancelPendingSave : "contains"
spatialObjectsService -.-> enqueueSave : "contains"
spatialObjectsService -.-> flushSaveBatch : "contains"
spatialObjectsService -.-> saves : "contains"
spatialObjectsService -.-> clearAllObjectCaches : "contains"
spatialObjectsService -.-> removeObjectFromCaches : "contains"
spatialObjectsService -.-> positionsEqual : "contains"
spatialObjectsService -.-> VOLATILE_KEYS : "contains"
spatialObjectsService -.-> computeNonPositionFingerprint : "contains"
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
presenceService -.-> setUserPresence : "contains"
presenceService -.-> getGuestId : "contains"
presenceService -.-> setGuestPresence : "contains"
presenceService -.-> subscribeToSpacePresence : "contains"
sharedSpacesService -.-> sharedSpacesCache : "contains"
sharedSpacesService -.-> sharedSpacesCacheSet : "contains"
sharedSpacesService -.-> isSharedSpace : "contains"
sharedSpacesService -.-> checkSpaceExists : "contains"
sharedSpacesService -.-> registerSharedSpaceFromUrl : "contains"
sharedSpacesService -.-> getSpaceOwner : "contains"
sharedSpacesService -.-> findSpaceOwner : "contains"
sharedSpacesService -.-> urlParams : "contains"
sharedSpacesService -.-> params : "contains"
sharingService -.-> generateSharingUrl : "contains"
sharingService -.-> sharingUrl : "contains"
sharingService -.-> getSharedSpaceInfo : "contains"
screenRecordingService -.-> ScreenRecordingService : "contains"
screenRecordingService -.-> rawBlob : "contains"
screenRecordingService -.-> screenRecorder : "contains"
resourceCleanupService_file -.-> _disposedWeakSet : "contains"
resourceCleanupService_file -.-> ResourceCleanupService : "contains"
resourceCleanupService_file -.-> resourceCleanupService : "contains"
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
authStore -.-> monitorConnection : "contains"
authStore -.-> connectionHandler : "contains"
authStore -.-> handleUrlAuthLocal : "contains"
authStore -.-> initAuth : "contains"
shader_shaders -.-> line_vert_glsl : "contains"
shader_shaders -.-> line_frag_glsl : "contains"
unifiedCacheManager_file -.-> cacheStats : "contains"
unifiedCacheManager_file -.-> unifiedCache : "contains"
unifiedCacheManager_file -.-> UnifiedCacheManager : "contains"
unifiedCacheManager_file -.-> unifiedCacheManager : "contains"
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
connectionStore -.-> _buildConnectionsByObjectId : "contains"
connectionStore -.-> getCellCoords : "contains"
connectionStore -.-> getCellIdFromCoords : "contains"
lodStore -.-> calculateLODLevel : "contains"
lodStore -.-> calculateParentLODLevel : "contains"
cubeStore -.-> getCubeSelector : "contains"
cubeStore -.-> getCubeFaceColorSelector : "contains"
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
cubeStore -.-> getCubeFaceStateSelector : "contains"
storeUtils -.-> useStoreInitialization : "contains"
storeUtils -.-> useCubeSelectors : "contains"
storeUtils -.-> useCubeActions : "contains"
storeUtils -.-> usePlaneSelectors : "contains"
storeUtils -.-> usePlaneActions : "contains"
storeUtils -.-> useGlobalStoreUtils : "contains"
storeUtils -.-> clearAllSelections : "contains"
storeUtils -.-> resetAllStores : "contains"
objectsStore -.-> numericHash : "contains"
objectsStore -.-> stringHash : "contains"
debugUtils -.-> logAnimation : "contains"
debugUtils -.-> forceAnimateConnection : "contains"
debugUtils -.-> shouldAnimateConnection : "contains"
debugUtils -.-> recordFrameTime : "contains"
debugUtils -.-> recordStateUpdate : "contains"
debugUtils -.-> getPerfStats : "contains"
debugUtils -.-> resetPerfStats : "contains"
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
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
faceIndicatorUtils -.-> getIdFromIndicator : "contains"
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
facePositionUtils -.-> _avg3 : "contains"
facePositionUtils -.-> calculateFacePosition : "contains"
pathfindingUtils -.-> intersectionCache : "contains"
pathfindingUtils -.-> pathCache : "contains"
pathfindingUtils -.-> objectPositionCache : "contains"
pathfindingUtils -.-> precomputedResults : "contains"
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
pathfindingUtils -.-> precomputeCacheKey : "contains"
pathfindingUtils -.-> getPrecomputedResult : "contains"
pathfindingUtils -.-> computeConnectionPath : "contains"
pathfindingUtils -.-> precomputePathsBatch : "contains"
pathfindingUtils -.-> requestsById : "contains"
frameCounter_file -.-> FrameCounter : "contains"
frameCounter_file -.-> frameCounter : "contains"
loadingState -.-> getIsInitialLoading : "contains"
loadingState -.-> setIsInitialLoading : "contains"
objectVirtualization -.-> ObjectVirtualizer : "contains"
objectVirtualization -.-> objectVirtualizer : "contains"
linePoolManager -.-> LinePool : "contains"
linePoolManager -.-> geometry : "contains"
linePoolManager -.-> positions : "contains"
linePoolManager -.-> getLinePool : "contains"
linePoolManager -.-> clearLinePool : "contains"
gpuResourceTracker -.-> GPUResourceTracker : "contains"
gpuResourceTracker -.-> gpuTracker : "contains"
snappingUtils -.-> calculateAxisSnap : "contains"
snappingUtils -.-> distanceToAxis : "contains"
snappingUtils -.-> projectPointOntoAxis : "contains"
positionUtils -.-> calculateMidpoint : "contains"
positionUtils -.-> calculateMidpointVector : "contains"
positionUtils -.-> lerp : "contains"
positionUtils -.-> checkPositionJitter : "contains"
objectUpdateHandlers -.-> handleObjectMove : "contains"
objectUpdateHandlers -.-> handleObjectUpdate : "contains"
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
textureLoader -.-> loadTextureFromFirebaseUrl : "contains"
textureLoader -.-> url : "contains"
textureLoader -.-> img : "contains"
textureLoader -.-> loadTextureFromBlob : "contains"
streamlinedSpatialIndex -.-> Point3D : "contains"
streamlinedSpatialIndex -.-> BoundingBox : "contains"
streamlinedSpatialIndex -.-> OptimizedSpatialGrid : "contains"
streamlinedSpatialIndex -.-> seenObjects : "contains"
streamlinedSpatialIndex -.-> createStreamlinedSpatialIndex : "contains"
streamlinedSpatialIndex -.-> benchmarkStreamlined : "contains"
streamlinedSpatialIndex -.-> position : "contains"
streamlinedSpatialIndex -.-> center : "contains"
worker_diagramLayoutWorker -.-> estimateNodeSize : "contains"
worker_diagramLayoutWorker -.-> isHierarchyConnection : "contains"
worker_diagramLayoutWorker -.-> filterConnections : "contains"
worker_diagramLayoutWorker -.-> layoutNodes : "contains"
worker_diagramLayoutWorker -.-> computeSize : "contains"
worker_diagramLayoutWorker -.-> computeSubtreeWidth : "contains"
worker_diagramLayoutWorker -.-> positionTree : "contains"
worker_diagramLayoutWorker -.-> positionContained : "contains"
worker_diagramLayoutWorker -.-> layoutEdges : "contains"
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
worker_diagramLayoutWorkerClient -.-> getDiagramLayoutWorker : "contains"
worker_diagramLayoutWorkerClient -.-> terminateDiagramLayoutWorker : "contains"
textAtlas -.-> TextAtlas : "contains"
textAtlas -.-> MultiPageTextAtlas : "contains"
textAtlas -.-> page : "contains"
textAtlas -.-> isOffscreenCanvasTextSupported : "contains"
textAtlas -.-> c : "contains"
textAtlas -.-> WorkerMultiPageTextAtlas : "contains"
textAtlas -.-> seen : "contains"
textAtlas -.-> _switchToSyncAtlas : "contains"
textAtlas -.-> getGlobalTextAtlas : "contains"
textAtlas -.-> resetGlobalTextAtlas : "contains"
textAtlas -.-> createAtlasTextMesh : "contains"
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
worker_textAtlasWorkerClient -.-> getTextAtlasWorker : "contains"
worker_textAtlasWorkerClient -.-> terminateTextAtlasWorker : "contains"
worker_spatialIndexWorkerClient -.-> getSpatialIndexWorker : "contains"
worker_spatialIndexWorkerClient -.-> terminateSpatialIndexWorker : "contains"
worker_textAtlasWorker -.-> getKey : "contains"
worker_textAtlasWorker -.-> AtlasPage : "contains"
worker_textAtlasWorker -.-> addPage : "contains"
worker_markdownLayoutWorker -.-> LayoutEngine : "contains"
worker_markdownLayoutWorker -.-> parseFlowPaths : "contains"
worker_markdownLayoutWorker -.-> addTag : "contains"
worker_markdownLayoutWorker -.-> stripFlowPathSyntax : "contains"
worker_markdownLayoutWorker -.-> computeHeaderStyle : "contains"
worker_markdownLayoutWorkerClient -.-> getMarkdownLayoutWorker : "contains"
worker_markdownLayoutWorkerClient -.-> terminateMarkdownLayoutWorker : "contains"
worker_pathfindingWorkerClient -.-> getPathfindingWorker : "contains"
worker_pathfindingWorkerClient -.-> terminatePathfindingWorker : "contains"
worker_spatialIndexWorker -.-> childLOD : "contains"
worker_spatialIndexWorker -.-> parentLOD : "contains"
worker_spatialIndexWorker -.-> isPointInFrustum : "contains"

%% Component Relationships
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, geometry..."
AtlasTextSprite --> StaticBillboardMesh : "receives"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, calculatedPosition..."
AtlasTextSprite --> DynamicBillboardMesh : "receives"
App --> FrameTicker : "uses"
App --> FrameloopController : "uses"
App --> LODManager : "enabled"
App --> CustomCamera : "camera"
App --> RealTimeConnectionUpdater : "connections"
App --> ConnectionsRenderer : "objects, allObjectsForPathfinding, visibleObjectIds..."
App --> ObjectsRenderer : "objects, visibleObjectIds, selectedId..."
App --> CellBoundaryRenderer : "visible"
App --> DiagramOverlay2D : "uses"
App --> UIOverlay : "onCreateObject, onToggleIndicators, user..."
CubeFace --> FaceIndicator : "position, rotation, onClick..."
Cube --> CubeFace : "cubeId, faceName, faceData..."
Cube --> FaceUI : "position, normal, onColorChange..."
Cube --> FaceTextInput : "position, onTextSubmit, inputId"
Cube --> AtlasTextSprite : "text, position, onClick..."
Cube --> TextStyleUI : "position, onStyleChange, onClose..."
Cube --> SnapLineIndicator : "points, axis, visible"
Cube --> InstancedLine : "points, color, lineWidth"
Cube --> HeaderInput : "position, onTextSubmit, inputId..."
Cube --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
DodecahedronFace --> FaceIndicator : "position, rotation, onClick..."
DodecahedronFace --> AtlasTextSprite : "text, position, onClick..."
DodecahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
ContainerOutline --> PooledLine : "points, color, lineWidth..."
DistanceFilteredTextLabels --> InstancedAtlasText : "labels, maxDistance, onLabelClick..."
Sphere --> SnapLineIndicator : "points, axis, visible"
Sphere --> DodecahedronFace : "dodecahedronId, faceIndex, faceGeometry..."
Sphere --> InstancedLine : "points, color, lineWidth"
Sphere --> ObjectUI : "position, onTransformToggle, onHeaderToggle..."
Sphere --> FaceUI : "position, onColorChange, face..."
Sphere --> HeaderInput : "position, onTextSubmit, inputId..."
Sphere --> AtlasTextSprite : "text, position, followTarget..."
Sphere --> TextStyleUI : "position, followTarget, onStyleChange..."
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
FaceUI --> ColorPicker : "onColorSelect, onClose"
InstancedAtlasText --> InstancedAtlasText : "atlas, texture, items..."
InstancedAtlasText --> PageInstancedMesh : "receives"
PooledLine --> InstancedLine : "points, color, lineWidth..."
ObjectsRenderer --> ObjectRenderer : "obj, selectedId, handleObjectClick..."
ObjectsRenderer --> GlobalCubeEdgesRenderer : "cubes, defaultLineWidth"
ObjectsRenderer --> GlobalDodecahedronEdgesRenderer : "dodecahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalTetrahedronEdgesRenderer : "tetrahedrons, defaultLineWidth"
ObjectsRenderer --> AtlasTextSprite : "text, position, billboard..."
ObjectRenderer --> Cube : "selected, onClick, onUpdate..."
ObjectRenderer --> Tetrahedron : "selected, onClick, onUpdate..."
ObjectRenderer --> Sphere : "selected, onClick, showAllIndicators..."
ObjectRenderer --> Plane : "position, scale, selected..."
ObjectRenderer --> TextObject : "position, selected, onClick..."
ObjectRenderer --> ModelObject : "obj, isSelected, onClick..."
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
LineUI --> ColorPicker : "onColorSelect, onClose"
ObjectUI --> ColorPicker : "pickerId, onColorSelect, onClose"
SnapLineIndicator --> PooledLine : "points, color, lineWidth..."
Tetrahedron --> AtlasTextSprite : "text, position, onClick..."
Tetrahedron --> TextStyleUI : "position, onStyleChange, onClose..."
Tetrahedron --> TetrahedronFace : "faceName, faceData, selected..."
Tetrahedron --> SnapLineIndicator : "points, axis, visible"
Tetrahedron --> InstancedLine : "points, color, lineWidth"
Tetrahedron --> HeaderInput : "position, onTextSubmit, inputId..."
Tetrahedron --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
TextObject --> SnapLineIndicator : "points, axis, visible"
TextObject --> FaceIndicator : "position, rotation, onClick..."
TextObject --> TextObjectUI : "textStyle, onStyleChange, onDelete..."
TetrahedronFace --> AtlasTextSprite : "text, position, followTarget..."
TetrahedronFace --> TextStyleUI : "position, onStyleChange, onClose..."
TetrahedronFace --> FaceUI : "position, normal, onColorChange..."
TetrahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
TetrahedronFace --> FaceIndicator : "position, rotation, onClick..."
TextObjectUI --> TextStyleUI : "uiType, textStyle, onStyleChange..."
TextStyleUI --> TextStyleUIContent : "receives"
TextObjectUI --> ColorPicker : "onColorSelect, onClose"
Avatar --> Avatar : "user"
TextStyleUIContainer --> TextStyleUI : "onStyleChange"
TextStyleUI --> TextStyleUIContent : "receives"
UIOverlay --> SpaceChat : "spaceId, user, isOpen..."
UIOverlay --> SpacePresenceAvatars : "spaceId"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> ColorPicker : "pickerId, onColorSelect, onClose"
TextStyleUIContent --> TextStyleUIContent : "onStyleChange, distance, onClose"

%% Component Dependencies
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
BatchedCurvedLines --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
AtlasTextSprite --> useTextAtlasStore : "uses store"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> useTextAtlasStore : "uses store"
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
AtlasTextSprite --> useTextAtlasStore : "uses store"
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
App --> useUIOverlayStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useConnectionStore : "uses store"
App --> usePlaneStore : "uses store"
App --> useCubeStore : "uses store"
App --> useTetrahedronStore : "uses store"
App --> useDodecahedronStore : "uses store"
App --> useSpatialManagerStore : "uses store"
App --> useDiagramStore : "uses store"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
App --> authService : "uses service"
authService --> signInUser : "receives"
App --> spatialObjectsService : "uses service"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> presenceService : "uses service"
presenceService --> setGuestPresence : "receives"
App --> spacesService : "uses service"
spacesService --> getPublicSpaceMetadata : "receives"
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
CubeFace --> useCubeStore : "uses store"
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
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useUIOverlayStore : "uses store"
DiagramOverlay2D --> useObjectsStore : "uses store"
DodecahedronFace --> useDodecahedronStore : "uses store"
FaceIndicator --> useFaceIndicatorStore : "uses store"
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
pathfindingUtils --> invalidatePathfindingCaches : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> precomputePathsBatch : "receives"
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
pathfindingUtils --> invalidatePathfindingCaches : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> precomputePathsBatch : "receives"
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
pathfindingUtils --> invalidatePathfindingCaches : "receives"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> precomputePathsBatch : "receives"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
FaceTextInput --> useTextInputStore : "uses store"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses store"
FrameloopController --> useUIOverlayStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FrameTicker --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
InstancedAtlasText --> useTextAtlasStore : "uses store"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> useTextAtlasStore : "uses store"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
GlobalCubeEdgesRenderer --> useLODStore : "uses store"
LODManager --> useLODStore : "uses store"
LODManager --> useObjectsStore : "uses store"
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useObjectsStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
RealTimeConnectionUpdater --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
PooledLine --> useLinePool_file : "{geometry, material, isPooled}"
useLinePool_file --> useLinePool_file : "receives"
PooledLine --> useLinePool_file : "{geometry, material, isPooled}"
useLinePool_file --> useLinePool_file : "receives"
ObjectsRenderer --> useUIOverlayStore : "uses store"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
Plane --> usePlaneStore : "uses store"
Plane --> useObjectsStore : "uses store"
Plane --> useConnectionStore : "uses store"
Plane --> useIndicatorsStore : "uses store"
Plane --> useUIOverlayStore : "uses store"
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
TetrahedronFace --> useTetrahedronStore : "uses store"
TextObjectUI --> useColorPickerStore : "uses store"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
WebcamStream --> useWebcamStreamStore : "uses store"
WebcamStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
WebcamStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useDiagramStore : "uses store"
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
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> rescanRepositoryForChanges : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUI --> useColorPickerStore : "uses store"

%% Function Call Relationships
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
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
App --> presenceService : "calls setGuestPresence"
presenceService --> setGuestPresence : "receives"
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> spacesService : "calls getPublicSpaceMetadata"
spacesService --> getPublicSpaceMetadata : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
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
App --> presenceService : "calls setGuestPresence"
presenceService --> setGuestPresence : "receives"
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> spacesService : "calls getPublicSpaceMetadata"
spacesService --> getPublicSpaceMetadata : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
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
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> useObjectsStore : ".getState()"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> useObjectsStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
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
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
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
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls precomputePathsBatch"
pathfindingUtils --> precomputePathsBatch : "receives"
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
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls precomputePathsBatch"
pathfindingUtils --> precomputePathsBatch : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
FaceTextInput --> useTextInputStore : ".getState()"
HeaderInput --> useTextInputStore : ".getState()"
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
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
RealTimeConnectionUpdater --> useConnectionStore : ".getState()"
RealTimeConnectionUpdater --> useObjectsStore : ".getState()"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> useConnectionStore : ".getState()"
RealTimeConnectionUpdater --> useConnectionStore : ".subscribe()"
RealTimeConnectionUpdater --> useObjectsStore : ".getState()"
RealTimeConnectionUpdater --> useObjectsStore : ".subscribe()"
RealTimeConnectionUpdater --> useConnectionStore : ".getState()"
RealTimeConnectionUpdater --> useObjectsStore : ".getState()"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> useConnectionStore : ".getState()"
RealTimeConnectionUpdater --> useConnectionStore : ".subscribe()"
RealTimeConnectionUpdater --> useObjectsStore : ".getState()"
RealTimeConnectionUpdater --> useObjectsStore : ".subscribe()"
ObjectsRenderer --> useUIOverlayStore : ".getState()"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> useUIOverlayStore : ".getState()"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> useUIOverlayStore : ".getState()"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> useUIOverlayStore : ".getState()"
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
TextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
TextSprite --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
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
UIOverlay --> useUIOverlayStore : ".getState()"
UIOverlay --> useUIOverlayStore : ".getState()"
UIOverlay --> useDiagramStore : ".getState()"
UIOverlay --> markdownDiagramService_file : ".hydrateStoreFromMarkdown()"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
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
UIOverlay --> useDiagramStore : ".getState()"
UIOverlay --> markdownDiagramService_file : ".hydrateStoreFromMarkdown()"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
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

%% Store Usage Details
Cube --> useObjectsStore : "isInitialLoading"
Sphere --> useObjectsStore : "isInitialLoading"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "selectConnectionWithFlowPath"
LODManager --> useLODStore : "batchSetLODLevels, batchRegisterParentChild, batchRegisterParents, setLODEnabled()..."
Tetrahedron --> useObjectsStore : "isInitialLoading"
TextObject --> useTextObjectStore : "updateTextObjectProperty()"
```
