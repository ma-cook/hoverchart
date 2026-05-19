```merfolk
%% hoverchart Repository Analysis

%% Components
AtlasTextSprite{Component: AtlasTextSprite}
StaticBillboardMesh{Component: StaticBillboardMesh}
DynamicBillboardMesh{Component: DynamicBillboardMesh}
BatchedCurvedLines{Component: BatchedCurvedLines}
BatchedConnectionLines{Component: BatchedConnectionLines}
CellBoundaryRenderer{Component: CellBoundaryRenderer}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
App{Component: App}
BVHIntegration{Component: BVHIntegration}
AppShell{Component: AppShell}
Sphere{Component: Sphere}
CustomCamera{Component: CustomCamera}
DodecahedronFace{Component: DodecahedronFace}
Cube{Component: Cube}
ColorPicker{Component: ColorPicker}
DistanceFilteredConnectionText{Component: DistanceFilteredConnectionText}
Connection{Component: Connection}
ConnectionsRenderer{Component: ConnectionsRenderer}
CubeFace{Component: CubeFace}
EarthGlobe{Component: EarthGlobe}
DistanceFilteredTextLabels{Component: DistanceFilteredTextLabels}
DiagramOverlay2D{Component: DiagramOverlay2D}
FaceUI{Component: FaceUI}
FrameloopController{Component: FrameloopController}
FaceTextInput{Component: FaceTextInput}
GlobalCubeMediumLODRenderer{Component: GlobalCubeMediumLODRenderer}
FrameTicker{Component: FrameTicker}
GlobalCubeEdgesRenderer{Component: GlobalCubeEdgesRenderer}
FaceIndicator{Component: FaceIndicator}
GlobalCubeFaceRenderer{Component: GlobalCubeFaceRenderer}
GlobalCubeFullLODInstancedRenderer{Component: GlobalCubeFullLODInstancedRenderer}
GlobalDodecahedronEdgesRenderer{Component: GlobalDodecahedronEdgesRenderer}
GlobalTetrahedronEdgesRenderer{Component: GlobalTetrahedronEdgesRenderer}
HandsRenderer{Component: HandsRenderer}
HeaderInput{Component: HeaderInput}
GlobalDodecahedronMediumLODRenderer{Component: GlobalDodecahedronMediumLODRenderer}
GlobalTetrahedronMediumLODRenderer{Component: GlobalTetrahedronMediumLODRenderer}
InstancedAtlasText{Component: InstancedAtlasText}
PageInstancedMesh{Component: PageInstancedMesh}
LODManager{Component: LODManager}
LineUI{Component: LineUI}
InstancedLine{Component: InstancedLine}
ObjectRenderer{Component: ObjectRenderer}
ObjectsRenderer{Component: ObjectsRenderer}
RepoGrid{Component: RepoGrid}
RepoGridLines{Component: RepoGridLines}
Plane{Component: Plane}
ScreenShareStream{Component: ScreenShareStream}
ObjectUI{Component: ObjectUI}
ModelObject{Component: ModelObject}
TreeRow{Component: TreeRow}
GroupedView{Component: GroupedView}
RepoAnalysisOverlay{Component: RepoAnalysisOverlay}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
Tetrahedron{Component: Tetrahedron}
Avatar{Component: Avatar}
HandTrackingToggle{Component: HandTrackingToggle}
SpacePresenceAvatars{Component: SpacePresenceAvatars}
SnapLineIndicator{Component: SnapLineIndicator}
TextStyleUIContainer{Component: TextStyleUIContainer}
TextObject{Component: TextObject}
SpaceChat{Component: SpaceChat}
TextSprite{Component: TextSprite}
TetrahedronFace{Component: TetrahedronFace}
TextStyleUIContent{Component: TextStyleUIContent}
TextStyleUI{Component: TextStyleUI}
TextObjectUI{Component: TextObjectUI}
WebcamStream{Component: WebcamStream}
EarthSidebarSections{Component: EarthSidebarSections}
UIOverlay{Component: UIOverlay}
MerfolkEdge{Component: MerfolkEdge}
EdgeMarkerDefs{Component: EdgeMarkerDefs}
MerfolkNode{Component: MerfolkNode}
ContainerNode{Component: ContainerNode}
DodecahedronWireframe{Component: DodecahedronWireframe}
LandingApp{Component: LandingApp}
CubeOutline{Component: CubeOutline}
FakeGlowMaterial{Component: FakeGlowMaterial}
PerspectiveGrid{Component: PerspectiveGrid}
OrderHeader{Component: OrderHeader}
Loader{Component: Loader}
UpdatesViewer{Component: UpdatesViewer}
SectionEyebrow{Component: SectionEyebrow}
Bullet{Component: Bullet}
ContentPanel{Component: ContentPanel}
DiagramContent{Component: DiagramContent}
FeaturesContent{Component: FeaturesContent}
AudienceContent{Component: AudienceContent}
CtaContent{Component: CtaContent}
LandingScrollContent{Component: LandingScrollContent}
Model{Component: Model}
UserForm{Component: UserForm}
CreateOrganizationPopup{Component: CreateOrganizationPopup}
UpdatesEditor{Component: UpdatesEditor}
UpdatesContainer{Component: UpdatesContainer}
DodecahedronWireframe2{Component: DodecahedronWireframe2}
CreateSpacePopup{Component: CreateSpacePopup}
OrgMemberDropdown{Component: OrgMemberDropdown}
OrganizationManager{Component: OrganizationManager}
UserLoginSection{Component: UserLoginSection}
ShareSpacePopup{Component: ShareSpacePopup}
main{Component: main}
WelcomeOverlay{Component: WelcomeOverlay}
SpacesTable{Component: SpacesTable}
UpgradePrompt{Component: UpgradePrompt}

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
ConnectionsRenderer -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
InstancedAtlasText -.-> PageInstancedMesh : "internal"
RepoGrid -.-> RepoGridLines : "internal"
RepoAnalysisOverlay -.-> TreeRow : "internal"
RepoAnalysisOverlay -.-> GroupedView : "internal"
SpacePresenceAvatars -.-> Avatar : "internal"
SpacePresenceAvatars -.-> HandTrackingToggle : "internal"
TextStyleUI -.-> TextStyleUIContent : "internal"
UIOverlay -.-> EarthSidebarSections : "internal"
EdgeMarkerDefs -.-> MerfolkEdge : "internal"
ContainerNode -.-> MerfolkNode : "internal"
LandingScrollContent -.-> SectionEyebrow : "internal"
LandingScrollContent -.-> Bullet : "internal"
LandingScrollContent -.-> ContentPanel : "internal"
LandingScrollContent -.-> DiagramContent : "internal"
LandingScrollContent -.-> FeaturesContent : "internal"
LandingScrollContent -.-> AudienceContent : "internal"
LandingScrollContent -.-> CtaContent : "internal"

%% Functions
calculateFaceWorldPosition[Function: calculateFaceWorldPosition]

%% Hooks
useAuth[Function: useAuth]
useAuthState[Function: useAuthState]
useAnimatedLine[Function: useAnimatedLine]
useAnimationStats[Function: useAnimationStats]
useCentralizedBroadcastManager[Function: useCentralizedBroadcastManager]
useConnectionObjects[Function: useConnectionObjects]
usePathfindingObjects[Function: usePathfindingObjects]
useConnectionObjectPositions[Function: useConnectionObjectPositions]
useGlobalClickHandler[Function: useGlobalClickHandler]
useIndicators[Function: useIndicators]
useDebouncedUpdate[Function: useDebouncedUpdate]
useConnectionsRendererStore[Function: useConnectionsRendererStore]
useConnectionState[Function: useConnectionState]
useConnectionActions[Function: useConnectionActions]
useSpaceManager[Function: useSpaceManager]
useFrustumCulledConnections[Function: useFrustumCulledConnections]
useDynamicFrustumCulling[Function: useDynamicFrustumCulling]
useConnections[Function: useConnections]
userId[Function: userId]
useSpatialManager[Function: useSpatialManager]
useObjects[Function: useObjects]
useTextureUpdater[Function: useTextureUpdater]
useTimeoutManager[Function: useTimeoutManager]
useWindowSize[Function: useWindowSize]

%% Services
createVerifyAuthTokenApp[Function: createVerifyAuthTokenApp]
createBulkImportApp[Function: createBulkImportApp]
objectsByCellId[Function: objectsByCellId]
connectionsByCellId[Function: connectionsByCellId]
params[Function: params]
generateJobId[Function: generateJobId]
toMillis[Function: toMillis]
deleteCellContents[Function: deleteCellContents]
createBulkDeleteApp[Function: createBulkDeleteApp]
runBulkDeleteJob[Function: runBulkDeleteJob]
cellsToKeep[Function: cellsToKeep]
validateRuntimeScanUrl[Function: validateRuntimeScanUrl]
sanitizeMerfolkId[Function: sanitizeMerfolkId]
generateMerfolkFromRuntimeTrace[Function: generateMerfolkFromRuntimeTrace]
EXCLUDED_PROFILER_NAMES[Function: EXCLUDED_PROFILER_NAMES]
BUNDLE_NOISE_NAMES[Function: BUNDLE_NOISE_NAMES]
REACT_DEVTOOLS_INJECTION[Function: REACT_DEVTOOLS_INJECTION]
getCompName[Function: getCompName]
walkFiber[Function: walkFiber]
extractSourceMapUrl[Function: extractSourceMapUrl]
scanOriginalSource[Function: scanOriginalSource]
extractNamesFromSourceMap[Function: extractNamesFromSourceMap]
scanJsBundles[Function: scanJsBundles]
bundleComponents[Function: bundleComponents]
bundleHooks[Function: bundleHooks]
bundleFunctions[Function: bundleFunctions]
captureRuntimeTrace[Function: captureRuntimeTrace]
urlObj[Function: urlObj]
seen[Function: seen]
seenFns[Function: seenFns]
dedup[Function: dedup]
deduplicateApiCalls[Function: deduplicateApiCalls]
buildConnections[Function: buildConnections]
createScanWebsiteRuntimeApp[Function: createScanWebsiteRuntimeApp]
signInUser[Function: signInUser]
completeRedirectSignIn[Function: completeRedirectSignIn]
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
getTreeSitterLanguage[Function: getTreeSitterLanguage]
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
addVariableDecl[Function: addVariableDecl]
trackRelativeSource[Function: trackRelativeSource]
importBindings[Function: importBindings]
traversePythonSource[Function: traversePythonSource]
localNames[Function: localNames]
traverseVueSource[Function: traverseVueSource]
generateMerfolkFromRepository[Function: generateMerfolkFromRepository]
componentFunctions[Function: componentFunctions]
componentFuncDisplayNames[Function: componentFuncDisplayNames]
funcIdCounters[Function: funcIdCounters]
allocateFuncId[Function: allocateFuncId]
componentRelationships[Function: componentRelationships]
componentToFile[Function: componentToFile]
componentImportSources[Function: componentImportSources]
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
apiEndpoints[Function: apiEndpoints]
dbModels[Function: dbModels]
dbModelUsers[Function: dbModelUsers]
authGuards[Function: authGuards]
eventEmitters[Function: eventEmitters]
eventListeners[Function: eventListeners]
errorBoundaries[Function: errorBoundaries]
suspenseBoundaries[Function: suspenseBoundaries]
sharedInterfaces[Function: sharedInterfaces]
interfaceUsages[Function: interfaceUsages]
traversedBodies[Function: traversedBodies]
traverse[Function: traverse]
isMiddlewareParams[Function: isMiddlewareParams]
knownContainers[Function: knownContainers]
componentsSetForResolve[Function: componentsSetForResolve]
fileToComponent[Function: fileToComponent]
generateMerfolkMarkdown[Function: generateMerfolkMarkdown]
ENTRY_POINT_COMPONENT_NAMES[Function: ENTRY_POINT_COMPONENT_NAMES]
isValidComponentName[Function: isValidComponentName]
storesSet[Function: storesSet]
servicesSet[Function: servicesSet]
classesSet[Function: classesSet]
constantsSet[Function: constantsSet]
variablesSet[Function: variablesSet]
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
allEventNames[Function: allEventNames]
ifaceOnlyContainers[Function: ifaceOnlyContainers]
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
imageDataToTensor[Function: imageDataToTensor]
letterboxToImageData[Function: letterboxToImageData]
extractRotatedRoi[Function: extractRotatedRoi]
roiToImage[Function: roiToImage]
parseCsv[Function: parseCsv]
splitCsvLine[Function: splitCsvLine]
isNumericColumn[Function: isNumericColumn]
parseNumeric[Function: parseNumeric]
detectColumns[Function: detectColumns]
filterAggregateRows[Function: filterAggregateRows]
buildGroups[Function: buildGroups]
groups[Function: groups]
layoutGroup[Function: layoutGroup]
computeBounds[Function: computeBounds]
getCameraBasePosition[Function: getCameraBasePosition]
processCsvFile[Function: processCsvFile]
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
dummyUnsubscribe[Function: dummyUnsubscribe]
centralizedBroadcastManager[Function: centralizedBroadcastManager]
subscribePlaneToBroadcasts[Function: subscribePlaneToBroadcasts]
getBroadcastManagerDebugInfo[Function: getBroadcastManagerDebugInfo]
cleanupBroadcastManager[Function: cleanupBroadcastManager]
resolveConnectionPositions[Function: resolveConnectionPositions]
resolveConnectionEndpoint[Function: resolveConnectionEndpoint]
connectionNeedsPositionResolution[Function: connectionNeedsPositionResolution]
positionsEqual[Function: positionsEqual]
enc[Function: enc]
githubFetch[Function: githubFetch]
createIssue[Function: createIssue]
assignCopilotToIssue[Function: assignCopilotToIssue]
getIssue[Function: getIssue]
findPullRequestForIssue[Function: findPullRequestForIssue]
approvePullRequest[Function: approvePullRequest]
mergePullRequest[Function: mergePullRequest]
getPullRequest[Function: getPullRequest]
getRepoInfo[Function: getRepoInfo]
getBranchRef[Function: getBranchRef]
createBranchRef[Function: createBranchRef]
deleteBranchRef[Function: deleteBranchRef]
getFileContents[Function: getFileContents]
createFileOnBranch[Function: createFileOnBranch]
createPullRequest[Function: createPullRequest]
addComment[Function: addComment]
enableAutoMerge[Function: enableAutoMerge]
revertCommit[Function: revertCommit]
globalSubscriptions[Function: globalSubscriptions]
getOrCreateSubscription[Function: getOrCreateSubscription]
decrementSubscription[Function: decrementSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
periodicCleanup[Function: periodicCleanup]
getAnchors[Function: getAnchors]
allNodes[Function: allNodes]
allConnections[Function: allConnections]
nodeToObjectIdMap[Function: nodeToObjectIdMap]
reader[Function: reader]
connectionTags[Function: connectionTags]
addTag[Function: addTag]
existingConnectionPairs[Function: existingConnectionPairs]
getFaceForObject[Function: getFaceForObject]
computeFaceWorldPosition[Function: computeFaceWorldPosition]
calculateDodecahedronFaceCenter[Function: calculateDodecahedronFaceCenter]
connectionsByCell[Function: connectionsByCell]
parentChildMap[Function: parentChildMap]
childParentMap[Function: childParentMap]
rootNodes[Function: rootNodes]
internalComponentChildren[Function: internalComponentChildren]
componentConnectionTypes[Function: componentConnectionTypes]
wouldCreateCycle[Function: wouldCreateCycle]
visited[Function: visited]
dfs[Function: dfs]
warnedCycles[Function: warnedCycles]
addParentChildRelation[Function: addParentChildRelation]
isCubeChild[Function: isCubeChild]
isContainerType[Function: isContainerType]
hierarchyComponents[Function: hierarchyComponents]
markHierarchyReachable[Function: markHierarchyReachable]
groupedByType[Function: groupedByType]
createContainerForGroup[Function: createContainerForGroup]
existingGroupTypes[Function: existingGroupTypes]
reachableFromRootModules[Function: reachableFromRootModules]
markReachable[Function: markReachable]
componentsWithChildContainers[Function: componentsWithChildContainers]
nodesInChildContainers[Function: nodesInChildContainers]
markDescendantsInChildContainers[Function: markDescendantsInChildContainers]
includableTypes[Function: includableTypes]
nodesWithContainers[Function: nodesWithContainers]
adjustNodeAndDescendants[Function: adjustNodeAndDescendants]
containerDimensions[Function: containerDimensions]
containerEligibleTypes[Function: containerEligibleTypes]
existingParentNodeIds[Function: existingParentNodeIds]
ensureWorker[Function: ensureWorker]
openCamera[Function: openCamera]
onLoaded[Function: onLoaded]
onError[Function: onError]
cleanup[Function: cleanup]
runOnce[Function: runOnce]
scheduleNext[Function: scheduleNext]
onFrame[Function: onFrame]
onVisibilityChange[Function: onVisibilityChange]
teardownCamera[Function: teardownCamera]
startHandTracking[Function: startHandTracking]
stopHandTracking[Function: stopHandTracking]
sigmoid[Function: sigmoid]
decodePalmDetections[Function: decodePalmDetections]
kps[Function: kps]
iou[Function: iou]
detectionToRoi[Function: detectionToRoi]
processedNodes[Function: processedNodes]
existingNodeIdMap[Function: existingNodeIdMap]
calculateHeaderStyle[Function: calculateHeaderStyle]
getGroupDisplayName[Function: getGroupDisplayName]
getGroupColor[Function: getGroupColor]
moveComponentTree[Function: moveComponentTree]
getComponentChildren[Function: getComponentChildren]
checkOverlap[Function: checkOverlap]
containersByLevel[Function: containersByLevel]
collectAllDescendants[Function: collectAllDescendants]
allDescendants[Function: allDescendants]
resolveNodeMove[Function: resolveNodeMove]
calculateNodeScaleFromChildren[Function: calculateNodeScaleFromChildren]
calculateGroupSpacing[Function: calculateGroupSpacing]
calculateGroupBounds[Function: calculateGroupBounds]
positionGroup[Function: positionGroup]
setUserPresence[Function: setUserPresence]
getGuestId[Function: getGuestId]
setGuestPresence[Function: setGuestPresence]
subscribeToSpacePresence[Function: subscribeToSpacePresence]
validateScanUrl[Function: validateScanUrl]
sanitizeId[Function: sanitizeId]
scanWebsiteAndGenerateDiagram[Function: scanWebsiteAndGenerateDiagram]
simulateProgress[Function: simulateProgress]
rawBlob[Function: rawBlob]
screenRecorder[Function: screenRecorder]
_disposedWeakSet[Function: _disposedWeakSet]
resourceCleanupService[Function: resourceCleanupService]
markdownDiagramService[Function: markdownDiagramService]
processTask[Function: processTask]
pollPR[Function: pollPR]
startPipeline[Function: startPipeline]
getLatestTasks[Function: getLatestTasks]
processed[Function: processed]
checkResume[Function: checkResume]
pausePipeline[Function: pausePipeline]
resumePipeline[Function: resumePipeline]
reconcilePendingTasks[Function: reconcilePendingTasks]
repoSlugsToReposition[Function: repoSlugsToReposition]
stopPipeline[Function: stopPipeline]
generateId[Function: generateId]
getCellId[Function: getCellId]
computeGridLayout[Function: computeGridLayout]
computeContainerScale[Function: computeContainerScale]
getGridCellPosition[Function: getGridCellPosition]
repositionAllTasks[Function: repositionAllTasks]
dividerIds[Function: dividerIds]
activeIds[Function: activeIds]
mergedIds[Function: mergedIds]
newCreatedIds[Function: newCreatedIds]
findRepoContainer[Function: findRepoContainer]
getAllRepoContainers[Function: getAllRepoContainers]
assignRepoSlugToOrphanTasks[Function: assignRepoSlugToOrphanTasks]
orphanIds[Function: orphanIds]
countRepoContainers[Function: countRepoContainers]
createRepoContainer[Function: createRepoContainer]
repositionIncomingTasks[Function: repositionIncomingTasks]
unpositionedIds[Function: unpositionedIds]
renumberMap[Function: renumberMap]
rewriteHeader[Function: rewriteHeader]
createTaskObjects[Function: createTaskObjects]
clearRepoTasks[Function: clearRepoTasks]
taskIds[Function: taskIds]
updatedById[Function: updatedById]
toggleTaskExpansion[Function: toggleTaskExpansion]
createOrganization[Function: createOrganization]
getUserOrganizations[Function: getUserOrganizations]
getOrganizationById[Function: getOrganizationById]
getOrganizationMembers[Function: getOrganizationMembers]
getMemberCount[Function: getMemberCount]
isOrganizationAdmin[Function: isOrganizationAdmin]
inviteUserToOrganization[Function: inviteUserToOrganization]
getPendingInvitesForUser[Function: getPendingInvitesForUser]
acceptInvite[Function: acceptInvite]
declineInvite[Function: declineInvite]
removeMemberFromOrganization[Function: removeMemberFromOrganization]
leaveOrganization[Function: leaveOrganization]
updateOrganizationPlan[Function: updateOrganizationPlan]
deleteOrganization[Function: deleteOrganization]
getStatusColor[Function: getStatusColor]
getStatusLabel[Function: getStatusLabel]
isTaskObject[Function: isTaskObject]
getPipelineTasks[Function: getPipelineTasks]
getNextQueuedTask[Function: getNextQueuedTask]
getNextActionableTask[Function: getNextActionableTask]
getPipelineTasksForRepo[Function: getPipelineTasksForRepo]
getRepoSlugsFromTasks[Function: getRepoSlugsFromTasks]
slugs[Function: slugs]
updateTaskStatus[Function: updateTaskStatus]
sharedSpacesCache[Function: sharedSpacesCache]
sharedSpacesCacheSet[Function: sharedSpacesCacheSet]
isSharedSpace[Function: isSharedSpace]
checkSpaceExists[Function: checkSpaceExists]
registerSharedSpaceFromUrl[Function: registerSharedSpaceFromUrl]
getSpaceOwner[Function: getSpaceOwner]
findSpaceOwner[Function: findSpaceOwner]
urlParams[Function: urlParams]
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
cleanupSpatialObjectSubscriptions[Function: cleanupSpatialObjectSubscriptions]
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
getStorageInstance[Function: getStorageInstance]
ALLOWED_IMAGE_TYPES[Function: ALLOWED_IMAGE_TYPES]
uploadFileGeneric[Function: uploadFileGeneric]
uploadImageToStorage[Function: uploadImageToStorage]
uploadModelToStorage[Function: uploadModelToStorage]
uploadMarkdownToStorage[Function: uploadMarkdownToStorage]
blob[Function: blob]
getStreamlinedSpatialManager[Function: getStreamlinedSpatialManager]
initializeStreamlinedSpatialPartitioning[Function: initializeStreamlinedSpatialPartitioning]
benchmarkStreamlinedSystem[Function: benchmarkStreamlinedSystem]
manager[Function: manager]
activeStreams[Function: activeStreams]
getRTCConfiguration[Function: getRTCConfiguration]
initWebRTC[Function: initWebRTC]
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
cellExistenceCache[Function: cellExistenceCache]
cleanupCache[Function: cleanupCache]
getCellCoordinates[Function: getCellCoordinates]
getCellCoordinatesWithHysteresis[Function: getCellCoordinatesWithHysteresis]
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
isPrivate[Function: isPrivate]
isDunder[Function: isDunder]
resolveContainerType[Function: resolveContainerType]
scanWithTreeSitter[Function: scanWithTreeSitter]
importedNames[Function: importedNames]
scanPythonWithTreeSitter[Function: scanPythonWithTreeSitter]
unifiedCacheManager[Function: unifiedCacheManager]
getSpaceById[Function: getSpaceById]
createSpace[Function: createSpace]
getOrCreateDefaultSpace[Function: getOrCreateDefaultSpace]
migrateToDefaultSpace[Function: migrateToDefaultSpace]
getUserSpaces[Function: getUserSpaces]
deleteSpace[Function: deleteSpace]
hasSpaceAccess[Function: hasSpaceAccess]
getPublicSpaceMetadata[Function: getPublicSpaceMetadata]
generateSharingUrl[Function: generateSharingUrl]
sharingUrl[Function: sharingUrl]
getSharedSpaceInfo[Function: getSharedSpaceInfo]

%% Stores
useColorPickerStore[[Store: useColorPickerStore]]
useCubeStore[[Store: useCubeStore]]
useEarthSettingsStore[[Store: useEarthSettingsStore]]
useAuthStore[[Store: useAuthStore]]
useDodecahedronStore[[Store: useDodecahedronStore]]
useAnimatedConnectionLineStore[[Store: useAnimatedConnectionLineStore]]
useDiagramStore[[Store: useDiagramStore]]
useConnectionStore[[Store: useConnectionStore]]
usePipelineStore[[Store: usePipelineStore]]
useFaceIndicatorStore[[Store: useFaceIndicatorStore]]
useObjectsStore[[Store: useObjectsStore]]
useHandTrackingStore[[Store: useHandTrackingStore]]
useLODStore[[Store: useLODStore]]
usePlaneStore[[Store: usePlaneStore]]
useIndicatorsStore[[Store: useIndicatorsStore]]
useFaceStore[[Store: useFaceStore]]
useTextInputStore[[Store: useTextInputStore]]
useTransformControlsStore[[Store: useTransformControlsStore]]
useTextObjectStore[[Store: useTextObjectStore]]
useScreenShareStore[[Store: useScreenShareStore]]
usePublicSpaceStore[[Store: usePublicSpaceStore]]
useTetrahedronStore[[Store: useTetrahedronStore]]
useSpatialManagerStore[[Store: useSpatialManagerStore]]
useSpaceManagerStore[[Store: useSpaceManagerStore]]
useTextAtlasStore[[Store: useTextAtlasStore]]
useUIOverlayStore[[Store: useUIOverlayStore]]
useWebcamStreamStore[[Store: useWebcamStreamStore]]

%% Utilities

%% External Libraries
_eslint/js<Library: @eslint/js>
globals<Library: globals>
eslint-plugin-react<Library: eslint-plugin-react>
eslint-plugin-react-hooks<Library: eslint-plugin-react-hooks>
eslint-plugin-react-refresh<Library: eslint-plugin-react-refresh>
react<Library: react>
three<Library: three>
_react-three/fiber<Library: @react-three/fiber>
firebase-admin/app<Library: firebase-admin/app>
firebase-admin/auth<Library: firebase-admin/auth>
firebase-admin/firestore<Library: firebase-admin/firestore>
firebase-functions/v2/https<Library: firebase-functions/v2/https>
firebase-functions/v2/firestore<Library: firebase-functions/v2/firestore>
firebase-functions/params<Library: firebase-functions/params>
puppeteer-core<Library: puppeteer-core>
_sparticuz/chromium<Library: @sparticuz/chromium>
express<Library: express>
cors<Library: cors>
dotenv<Library: dotenv>
_react-three/drei<Library: @react-three/drei>
_react-three/postprocessing<Library: @react-three/postprocessing>
_react-three/drei/core/Stats<Library: @react-three/drei/core/Stats>
lodash/isEqual<Library: lodash/isEqual>
zustand/shallow<Library: zustand/shallow>
react-colorful<Library: react-colorful>
_xyflow/react<Library: @xyflow/react>
_xyflow/react/dist/style.css<Library: @xyflow/react/dist/style.css>
three/examples/jsm/loaders/GLTFLoader<Library: three/examples/jsm/loaders/GLTFLoader>
three/examples/jsm/loaders/DRACOLoader<Library: three/examples/jsm/loaders/DRACOLoader>
firebase/database<Library: firebase/database>
firebase/auth<Library: firebase/auth>
firebase/firestore<Library: firebase/firestore>
firebase/app<Library: firebase/app>
firebase/storage<Library: firebase/storage>
firebase/functions<Library: firebase/functions>
zustand<Library: zustand>
prop-types<Library: prop-types>
draft-js<Library: draft-js>
draft-js/dist/Draft.css<Library: draft-js/dist/Draft.css>
react-dom/client<Library: react-dom/client>
_babel/parser<Library: @babel/parser>
comlink<Library: comlink>
fix-webm-duration<Library: fix-webm-duration>
uuid<Library: uuid>
zustand/traditional<Library: zustand/traditional>
wasm_bindgen<Library: wasm_bindgen>
js_sys<Library: js_sys>
web-tree-sitter<Library: web-tree-sitter>
web-tree-sitter/tree-sitter.wasm?url<Library: web-tree-sitter/tree-sitter.wasm?url>
tree-sitter-wasms/out/tree-sitter-python.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-python.wasm?url>
tree-sitter-wasms/out/tree-sitter-javascript.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-javascript.wasm?url>
tree-sitter-wasms/out/tree-sitter-typescript.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-typescript.wasm?url>
tree-sitter-wasms/out/tree-sitter-tsx.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-tsx.wasm?url>
tree-sitter-wasms/out/tree-sitter-go.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-go.wasm?url>
tree-sitter-wasms/out/tree-sitter-rust.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-rust.wasm?url>
tree-sitter-wasms/out/tree-sitter-java.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-java.wasm?url>
tree-sitter-wasms/out/tree-sitter-c.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-c.wasm?url>
tree-sitter-wasms/out/tree-sitter-cpp.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-cpp.wasm?url>
tree-sitter-wasms/out/tree-sitter-c_sharp.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-c_sharp.wasm?url>
tree-sitter-wasms/out/tree-sitter-ruby.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-ruby.wasm?url>
tree-sitter-wasms/out/tree-sitter-php.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-php.wasm?url>
vite<Library: vite>
_vitejs/plugin-react<Library: @vitejs/plugin-react>
vite-plugin-glsl<Library: vite-plugin-glsl>
vite-plugin-wasm<Library: vite-plugin-wasm>
vite-plugin-top-level-await<Library: vite-plugin-top-level-await>

%% Component Internal Functions
getSharedMaterial[Function: getSharedMaterial]
atlas[Function: atlas]
calculatedPosition[Function: calculatedPosition]
numericCacheKey[Function: numericCacheKey]
pathToSegments[Function: pathToSegments]
pathsData[Function: pathsData]
customRaycast[Function: customRaycast]
handleClick[Function: handleClick]
handlePointerOver[Function: handlePointerOver]
handlePointerOut[Function: handlePointerOut]
straightConnections[Function: straightConnections]
customRaycast_2[Function: customRaycast]
handleClick_2[Function: handleClick]
handlePointerOver_2[Function: handlePointerOver]
handlePointerOut_2[Function: handlePointerOut]
computeVisibleCells[Function: computeVisibleCells]
buildGeometry[Function: buildGeometry]
structuralKey[Function: structuralKey]
objects[Function: objects]
canViewSpace[Function: canViewSpace]
shouldRedirect[Function: shouldRedirect]
handleSpatialObjectChange[Function: handleSpatialObjectChange]
spatialManagerDebug[Function: spatialManagerDebug]
checkPositionJitterWithHistory[Function: checkPositionJitterWithHistory]
loadedCellsKey[Function: loadedCellsKey]
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
throttledUpdateVisibility[Function: throttledUpdateVisibility]
handleCameraUpdate[Function: handleCameraUpdate]
handleCameraSettle[Function: handleCameraSettle]
deviceInfo[Function: deviceInfo]
canvasSettings[Function: canvasSettings]
handleCanvasClick_2[Function: handleCanvasClick]
handleOpenSpace[Function: handleOpenSpace]
handleBackToLanding[Function: handleBackToLanding]
handleTryWithoutAccount[Function: handleTryWithoutAccount]
handlePopState[Function: handlePopState]
createDodecahedronGeometry[Function: createDodecahedronGeometry]
dodecahedronData[Function: dodecahedronData]
updateObjectAndStores[Function: updateObjectAndStores]
updateFaceProperty[Function: updateFaceProperty]
isIndicatorConnected[Function: isIndicatorConnected]
onClickOutside[Function: onClickOutside]
updateDatabase[Function: updateDatabase]
handleTransformToggle[Function: handleTransformToggle]
handleHeaderToggle[Function: handleHeaderToggle]
handleHeaderSubmit[Function: handleHeaderSubmit]
handleResizeToggle[Function: handleResizeToggle]
handleDrag[Function: handleDrag]
handleScale[Function: handleScale]
handleFaceClick_2[Function: handleFaceClick]
handleIndicatorClick[Function: handleIndicatorClick]
handleHeaderClick[Function: handleHeaderClick]
handleStyleChange[Function: handleStyleChange]
handleLineColorChange[Function: handleLineColorChange]
handleBackgroundClick[Function: handleBackgroundClick]
handleFaceTextSubmit[Function: handleFaceTextSubmit]
handleFaceTextButtonClick[Function: handleFaceTextButtonClick]
handleFaceTextClick[Function: handleFaceTextClick]
handleFaceTextStyleChange[Function: handleFaceTextStyleChange]
getUIPosition[Function: getUIPosition]
getHeaderPosition[Function: getHeaderPosition]
getFaceUIPosition[Function: getFaceUIPosition]
getFaceTextPosition[Function: getFaceTextPosition]
getFaceInfo[Function: getFaceInfo]
getFaceRotation[Function: getFaceRotation]
shouldShowFaceIndicator[Function: shouldShowFaceIndicator]
getHeaderInputPosition[Function: getHeaderInputPosition]
memoizedTarget[Function: memoizedTarget]
controlsRefCallback[Function: controlsRefCallback]
getDodecahedronColoredMaterial[Function: getDodecahedronColoredMaterial]
faceMaterial[Function: faceMaterial]
handleClick_3[Function: handleClick]
handleTextClick[Function: handleTextClick]
inverseScale[Function: inverseScale]
adjustedTextPosition[Function: adjustedTextPosition]
runReconcile[Function: runReconcile]
cubeData[Function: cubeData]
isIndicatorConnected_2[Function: isIndicatorConnected]
isIndicatorActive[Function: isIndicatorActive]
getUIPositions[Function: getUIPositions]
shouldShowIndicator[Function: shouldShowIndicator]
hasConnectedIndicators[Function: hasConnectedIndicators]
getFaceTextOffset[Function: getFaceTextOffset]
handleSceneClick[Function: handleSceneClick]
updateDatabase_2[Function: updateDatabase]
onClickOutside_2[Function: onClickOutside]
handleFaceClick_3[Function: handleFaceClick]
handleColoredFaceClick[Function: handleColoredFaceClick]
handleIndicatorClick_2[Function: handleIndicatorClick]
handleTransformToggle_2[Function: handleTransformToggle]
handleResizeToggle_2[Function: handleResizeToggle]
handleHeaderToggle_2[Function: handleHeaderToggle]
handleHeaderSubmit_2[Function: handleHeaderSubmit]
debouncedUpdate[Function: debouncedUpdate]
handleLineColorChange_2[Function: handleLineColorChange]
handleFaceColorChange[Function: handleFaceColorChange]
handleTextClick_2[Function: handleTextClick]
handleFaceTextClick_2[Function: handleFaceTextClick]
handleFaceTextSubmit_2[Function: handleFaceTextSubmit]
handleFaceTextStyleClick[Function: handleFaceTextStyleClick]
handleStyleChange_2[Function: handleStyleChange]
handleDrag_2[Function: handleDrag]
handleScale_2[Function: handleScale]
renderFaces[Function: renderFaces]
renderFaceTexts[Function: renderFaceTexts]
arraysEqual[Function: arraysEqual]
shallowObjEqual[Function: shallowObjEqual]
handleColorChange[Function: handleColorChange]
handleContainerClick[Function: handleContainerClick]
handleApplyColor[Function: handleApplyColor]
handleCancel[Function: handleCancel]
getTextParametricT[Function: getTextParametricT]
redistributeFaces[Function: redistributeFaces]
pathToLineSegments[Function: pathToLineSegments]
resolveEndpointPosition[Function: resolveEndpointPosition]
getLineWidth[Function: getLineWidth]
handleConnectionClick[Function: handleConnectionClick]
handleLineTextClick[Function: handleLineTextClick]
handleLineTextSubmit[Function: handleLineTextSubmit]
handleLineTextStyleChange[Function: handleLineTextStyleChange]
handleLineStyleChange[Function: handleLineStyleChange]
handleLineColorChange_3[Function: handleLineColorChange]
connectionData[Function: connectionData]
pathData[Function: pathData]
textPositionData[Function: textPositionData]
availableObjectIds[Function: availableObjectIds]
pathfindingObjects[Function: pathfindingObjects]
objectsPositionHash[Function: objectsPositionHash]
objectVisibleConnections[Function: objectVisibleConnections]
focusedConnections[Function: focusedConnections]
flowPathHighlightedConnections[Function: flowPathHighlightedConnections]
connectionsForCulling[Function: connectionsForCulling]
mountNextBatch[Function: mountNextBatch]
progressiveConnections[Function: progressiveConnections]
objectPositions[Function: objectPositions]
allStraightConnections[Function: allStraightConnections]
faceOverrides[Function: faceOverrides]
textLabels[Function: textLabels]
handleBatchedConnectionClick[Function: handleBatchedConnectionClick]
getColoredMaterial[Function: getColoredMaterial]
faceStateSelector[Function: faceStateSelector]
faceMaterial_2[Function: faceMaterial]
handleClick_4[Function: handleClick]
offsetMultiplier[Function: offsetMultiplier]
offsetPosition[Function: offsetPosition]
handlePointerDown[Function: handlePointerDown]
handlePointerUp[Function: handlePointerUp]
bands[Function: bands]
meshGeometry[Function: meshGeometry]
localDetail[Function: localDetail]
localBands[Function: localBands]
localMeshGeometry[Function: localMeshGeometry]
buildReactFlowNodes[Function: buildReactFlowNodes]
getDepth[Function: getDepth]
buildReactFlowEdges[Function: buildReactFlowEdges]
layerForType[Function: layerForType]
filterEdges[Function: filterEdges]
minimapNodeColor[Function: minimapNodeColor]
flowPathNames[Function: flowPathNames]
serialisedGraphData[Function: serialisedGraphData]
serialisedHierarchy[Function: serialisedHierarchy]
filteredEdges[Function: filteredEdges]
toggleLayer[Function: toggleLayer]
toggleLayerHandlers[Function: toggleLayerHandlers]
handleNodeClick[Function: handleNodeClick]
handleBackTo3D[Function: handleBackTo3D]
handleBorderStyleClick[Function: handleBorderStyleClick]
handleBorderColorClick[Function: handleBorderColorClick]
handleLineThicknessClick[Function: handleLineThicknessClick]
handleColorSelect[Function: handleColorSelect]
handleToolClick[Function: handleToolClick]
handleKeyDown[Function: handleKeyDown]
handleChange[Function: handleChange]
handleFocus[Function: handleFocus]
handleBlur[Function: handleBlur]
mediumCubes[Function: mediumCubes]
cubeIds[Function: cubeIds]
_ensureCubeWasmBuffers[Function: _ensureCubeWasmBuffers]
filteredCubes[Function: filteredCubes]
cubeIds_2[Function: cubeIds]
isCubeVisible[Function: isCubeVisible]
updateCubeEdges[Function: updateCubeEdges]
getIndicatorMaterial[Function: getIndicatorMaterial]
material[Function: material]
filteredCubes_2[Function: filteredCubes]
isCubeUnmodified[Function: isCubeUnmodified]
instancedCubes[Function: instancedCubes]
cubeIds_3[Function: cubeIds]
handleClick_5[Function: handleClick]
_ensureDodecaWasmBuffers[Function: _ensureDodecaWasmBuffers]
filteredDodecahedrons[Function: filteredDodecahedrons]
dodecahedronIds[Function: dodecahedronIds]
isDodecahedronVisible[Function: isDodecahedronVisible]
updateDodecahedronEdges[Function: updateDodecahedronEdges]
_ensureTetraWasmBuffers[Function: _ensureTetraWasmBuffers]
filteredTetrahedrons[Function: filteredTetrahedrons]
tetrahedronIds[Function: tetrahedronIds]
isTetrahedronVisible[Function: isTetrahedronVisible]
updateTetrahedronEdges[Function: updateTetrahedronEdges]
readLandmark[Function: readLandmark]
applyJoints[Function: applyJoints]
buildBonePoints[Function: buildBonePoints]
makeHandState[Function: makeHandState]
handleKeyDown_2[Function: handleKeyDown]
handleChange_2[Function: handleChange]
handleFocus_2[Function: handleFocus]
handleBlur_2[Function: handleBlur]
mediumDodecahedrons[Function: mediumDodecahedrons]
dodecaIds[Function: dodecaIds]
_buildTetraGeometry[Function: _buildTetraGeometry]
mediumTetrahedrons[Function: mediumTetrahedrons]
tetraIds[Function: tetraIds]
atlas_2[Function: atlas]
pageGroups[Function: pageGroups]
geometry[Function: geometry]
material_2[Function: material]
handleClick_6[Function: handleClick]
containersKey[Function: containersKey]
computeContainmentSync[Function: computeContainmentSync]
enqueueLODUpdates[Function: enqueueLODUpdates]
getFullStyle[Function: getFullStyle]
getBaseStyle[Function: getBaseStyle]
handleToolClick_2[Function: handleToolClick]
handleLineStyleClick[Function: handleLineStyleClick]
handleArrowClick[Function: handleArrowClick]
flatPoints[Function: flatPoints]
geometry_2[Function: geometry]
customRaycast_3[Function: customRaycast]
material_3[Function: material]
onClickStable[Function: onClickStable]
onDeleteStable[Function: onDeleteStable]
onTransformStartStable[Function: onTransformStartStable]
onTransformEndStable[Function: onTransformEndStable]
onMatrixChangedStable[Function: onMatrixChangedStable]
onMoveStable[Function: onMoveStable]
arraysEqual_2[Function: arraysEqual]
mountNextBatch_2[Function: mountNextBatch]
mountResume[Function: mountResume]
progressiveVisibleObjects[Function: progressiveVisibleObjects]
cubeObjects[Function: cubeObjects]
containerHeaders[Function: containerHeaders]
dodecahedronObjects[Function: dodecahedronObjects]
tetrahedronObjects[Function: tetrahedronObjects]
unmodifiedCubeIds[Function: unmodifiedCubeIds]
handleInstancedCubeClick[Function: handleInstancedCubeClick]
renderedObjects[Function: renderedObjects]
containers[Function: containers]
gridData[Function: gridData]
planeData[Function: planeData]
closeAllUIs[Function: closeAllUIs]
updateDatabase_3[Function: updateDatabase]
handleScale_3[Function: handleScale]
handleResizeEnd[Function: handleResizeEnd]
handleDrag_3[Function: handleDrag]
handleTransformStart[Function: handleTransformStart]
handleTransformEnd[Function: handleTransformEnd]
handleClick_7[Function: handleClick]
handleTextClick_3[Function: handleTextClick]
handleTextSubmit[Function: handleTextSubmit]
handleTextStyleChange[Function: handleTextStyleChange]
handleTextSpriteClick[Function: handleTextSpriteClick]
handleTransformToggle_3[Function: handleTransformToggle]
handleResizeToggle_3[Function: handleResizeToggle]
handleColorChange_2[Function: handleColorChange]
handleHeaderToggle_3[Function: handleHeaderToggle]
handleHeaderSubmit_3[Function: handleHeaderSubmit]
handleHeaderTextClick[Function: handleHeaderTextClick]
handleHeaderStyleChange[Function: handleHeaderStyleChange]
handleBorderToggle[Function: handleBorderToggle]
handleIndicatorClick_3[Function: handleIndicatorClick]
isIndicatorConnected_3[Function: isIndicatorConnected]
shouldShowIndicator_2[Function: shouldShowIndicator]
handleBroadcastStopped[Function: handleBroadcastStopped]
applyStreamScale[Function: applyStreamScale]
restoreStreamScale[Function: restoreStreamScale]
handleWebcamToggle[Function: handleWebcamToggle]
handleScreenShareToggle[Function: handleScreenShareToggle]
handlePinToggle[Function: handlePinToggle]
handleImageUpload[Function: handleImageUpload]
handleBroadcastStarted[Function: handleBroadcastStarted]
handleViewerCountChange[Function: handleViewerCountChange]
uiPositions[Function: uiPositions]
indicatorPosition[Function: indicatorPosition]
meshMaterial[Function: meshMaterial]
lineMaterialProps[Function: lineMaterialProps]
borderEdgePoints[Function: borderEdgePoints]
attemptPlay[Function: attemptPlay]
connectToBroadcast[Function: connectToBroadcast]
handleEyeClick[Function: handleEyeClick]
handleColorPick[Function: handleColorPick]
handleToolClick_3[Function: handleToolClick]
createLoaders[Function: createLoaders]
handleClick_8[Function: handleClick]
handlePointerDown_2[Function: handlePointerDown]
handlePointerUp_2[Function: handlePointerUp]
toggleGroup[Function: toggleGroup]
toggle[Function: toggle]
visibleRoots[Function: visibleRoots]
ancestorOf[Function: ancestorOf]
ancestorOf_2[Function: ancestorOf]
expandAll[Function: expandAll]
collapseAll[Function: collapseAll]
runConnectionUpdate[Function: runConnectionUpdate]
updateConnectionEndpoint[Function: updateConnectionEndpoint]
updateConnectionEndpoint_2[Function: updateConnectionEndpoint]
rebuildConnectionMap[Function: rebuildConnectionMap]
_createTriangleGeometry[Function: _createTriangleGeometry]
getFaceIndicatorProps[Function: getFaceIndicatorProps]
tetrahedronFaces[Function: tetrahedronFaces]
debouncedUpdate_2[Function: debouncedUpdate]
isIndicatorConnected_4[Function: isIndicatorConnected]
isIndicatorActive_2[Function: isIndicatorActive]
getUIPositions_2[Function: getUIPositions]
shouldShowIndicator_3[Function: shouldShowIndicator]
hasConnectedIndicators_2[Function: hasConnectedIndicators]
tetrahedronEdgePoints[Function: tetrahedronEdgePoints]
handleSceneClick_2[Function: handleSceneClick]
updateDatabase_4[Function: updateDatabase]
handleFaceClick_4[Function: handleFaceClick]
handleColoredFaceClick_2[Function: handleColoredFaceClick]
handleIndicatorClick_4[Function: handleIndicatorClick]
handleTransformToggle_4[Function: handleTransformToggle]
handleResizeToggle_4[Function: handleResizeToggle]
handleHeaderToggle_4[Function: handleHeaderToggle]
handleHeaderSubmit_4[Function: handleHeaderSubmit]
handleLineColorChange_4[Function: handleLineColorChange]
handleDrag_4[Function: handleDrag]
handleScale_4[Function: handleScale]
getFaceTextOffset_2[Function: getFaceTextOffset]
handleFaceTextStyleClick_2[Function: handleFaceTextStyleClick]
handleFaceTextStyleChange_2[Function: handleFaceTextStyleChange]
renderFaceTexts_2[Function: renderFaceTexts]
renderFaces_2[Function: renderFaces]
getInitials[Function: getInitials]
handleClick_9[Function: handleClick]
text[Function: text]
textStyle[Function: textStyle]
scale[Function: scale]
setOrbitControlsEnabled[Function: setOrbitControlsEnabled]
setText[Function: setText]
setTextStyle[Function: setTextStyle]
setScale[Function: setScale]
setIsEditing[Function: setIsEditing]
setIsActivelyEditing[Function: setIsActivelyEditing]
setIndicatorSelected[Function: setIndicatorSelected]
setContentHeight[Function: setContentHeight]
setShowTransform[Function: setShowTransform]
setShowResizeControls[Function: setShowResizeControls]
setBulletPointMode[Function: setBulletPointMode]
handleTransformToggle_5[Function: handleTransformToggle]
handleResizeToggle_5[Function: handleResizeToggle]
getIndicatorOffset[Function: getIndicatorOffset]
isIndicatorConnected_5[Function: isIndicatorConnected]
shouldShowIndicator_4[Function: shouldShowIndicator]
getIndicatorPositions[Function: getIndicatorPositions]
updateWorldMatrix[Function: updateWorldMatrix]
closeAllUIs_2[Function: closeAllUIs]
updateDatabase_5[Function: updateDatabase]
autoResizeTextAreaOnly[Function: autoResizeTextAreaOnly]
autoResizeTextArea[Function: autoResizeTextArea]
handleBlur_3[Function: handleBlur]
handleDivClick[Function: handleDivClick]
handleTextClick_4[Function: handleTextClick]
handleIndicatorClick_5[Function: handleIndicatorClick]
handleDrag_5[Function: handleDrag]
handleScale_5[Function: handleScale]
handleKeyDown_3[Function: handleKeyDown]
handleStyleChange_3[Function: handleStyleChange]
applyStyleToSelectionInternal[Function: applyStyleToSelectionInternal]
applyStyleToSelectionInternal_2[Function: applyStyleToSelectionInternal]
handleTextSelection[Function: handleTextSelection]
getTextAreaStyle[Function: getTextAreaStyle]
getContainerStyle[Function: getContainerStyle]
getEffectivePosition[Function: getEffectivePosition]
getTransformControlSize[Function: getTransformControlSize]
senderInitials[Function: senderInitials]
mergeMessages[Function: mergeMessages]
handleScroll[Function: handleScroll]
handleSend[Function: handleSend]
handleKeyDown_4[Function: handleKeyDown]
lerpVector[Function: lerpVector]
spriteId[Function: spriteId]
setIsDragging[Function: setIsDragging]
calculatedPosition_2[Function: calculatedPosition]
getFontSize[Function: getFontSize]
getTetrahedronColoredMaterial[Function: getTetrahedronColoredMaterial]
faceMaterial_3[Function: faceMaterial]
handleClick_10[Function: handleClick]
handleIndicatorClickLocal[Function: handleIndicatorClickLocal]
getFaceTextOffset_3[Function: getFaceTextOffset]
handleFaceTextStyleClick_3[Function: handleFaceTextStyleClick]
handleFaceTextStyleChange_3[Function: handleFaceTextStyleChange]
faceTextElement[Function: faceTextElement]
handleSizeChange[Function: handleSizeChange]
handleFontSizeInputChange[Function: handleFontSizeInputChange]
handleWheel[Function: handleWheel]
handleButtonClick[Function: handleButtonClick]
handleColorSelect_2[Function: handleColorSelect]
handleSelectChange[Function: handleSelectChange]
getUIScale[Function: getUIScale]
handleUIClick[Function: handleUIClick]
handleResizeToggle_6[Function: handleResizeToggle]
handleEyeClick_2[Function: handleEyeClick]
applyVideoTexture[Function: applyVideoTexture]
attemptPlay_2[Function: attemptPlay]
connectToBroadcast_2[Function: connectToBroadcast]
pipelineTasks[Function: pipelineTasks]
pipelineStatusCounts[Function: pipelineStatusCounts]
setIsRecording[Function: setIsRecording]
handleCellBoundariesToggle[Function: handleCellBoundariesToggle]
fetchAppJsxFromRepo[Function: fetchAppJsxFromRepo]
handleRescan[Function: handleRescan]
handleDownloadMarkdown[Function: handleDownloadMarkdown]
triggerDownload[Function: triggerDownload]
triggerDownload_2[Function: triggerDownload]
handleScreenClick[Function: handleScreenClick]
handleRuntimeScan[Function: handleRuntimeScan]
handleRecordClick[Function: handleRecordClick]
handler[Function: handler]
handleDeleteAllCells[Function: handleDeleteAllCells]
pollStatus[Function: pollStatus]
pollStatus_2[Function: pollStatus]
handleModelUpload[Function: handleModelUpload]
handleModelFileSelect[Function: handleModelFileSelect]
handleMarkdownUpload[Function: handleMarkdownUpload]
handleMarkdownFileSelect[Function: handleMarkdownFileSelect]
handleCsvUpload[Function: handleCsvUpload]
handleCsvFileSelect[Function: handleCsvFileSelect]
handleMenuToggle[Function: handleMenuToggle]
handleArrowClick_2[Function: handleArrowClick]
handleUnpinWebcam[Function: handleUnpinWebcam]
handleTemplateConfigChange[Function: handleTemplateConfigChange]
createTemplate[Function: createTemplate]
flowPathColor[Function: flowPathColor]
getEdgeStyle[Function: getEdgeStyle]
getMarkerEnd[Function: getMarkerEnd]
getSelectedStyle[Function: getSelectedStyle]
getUnselectedStyle[Function: getUnselectedStyle]
buildNodeStyles[Function: buildNodeStyles]
buildContainerStyles[Function: buildContainerStyles]
buildPrecomputedNode[Function: buildPrecomputedNode]
generateDodecahedronEdges[Function: generateDodecahedronEdges]
scheduleScrollUpdate[Function: scheduleScrollUpdate]
handleWheel_2[Function: handleWheel]
handleTouchStart[Function: handleTouchStart]
handleTouchMove[Function: handleTouchMove]
createUserDocument[Function: createUserDocument]
handleLogin_2[Function: handleLogin]
handleLogout[Function: handleLogout]
navigateToSpace[Function: navigateToSpace]
fetchUserSpaces[Function: fetchUserSpaces]
createNewSpace[Function: createNewSpace]
handleShareSpace[Function: handleShareSpace]
handleDeleteSpace[Function: handleDeleteSpace]
handleLeaveSpace[Function: handleLeaveSpace]
handleFirstCubeComplete[Function: handleFirstCubeComplete]
handleDodecahedronComplete[Function: handleDodecahedronComplete]
handleAcceptInvite[Function: handleAcceptInvite]
handleDeclineInvite[Function: handleDeclineInvite]
spaceTableProps[Function: spaceTableProps]
createSpaceProps[Function: createSpaceProps]
sharePopupProps[Function: sharePopupProps]
idx[Function: idx]
addEdge[Function: addEdge]
parsedContent[Function: parsedContent]
formattedTimestamp[Function: formattedTimestamp]
clamp01[Function: clamp01]
getSectionVisibility[Function: getSectionVisibility]
handleKeyPress[Function: handleKeyPress]
handleSubmit[Function: handleSubmit]
handleKeyCommand[Function: handleKeyCommand]
toggleInlineStyle[Function: toggleInlineStyle]
handleSave[Function: handleSave]
generateDodecahedronEdges_2[Function: generateDodecahedronEdges]
handleSpaceNameChange[Function: handleSpaceNameChange]
handleEmailChange[Function: handleEmailChange]
handleMemberSelect[Function: handleMemberSelect]
handleKeyPress_2[Function: handleKeyPress]
handleSubmit_2[Function: handleSubmit]
handleClickOutside[Function: handleClickOutside]
handleInputFocus[Function: handleInputFocus]
handleInputChange[Function: handleInputChange]
handleSelect[Function: handleSelect]
refresh[Function: refresh]
handleCreateOrg[Function: handleCreateOrg]
handleInvite[Function: handleInvite]
handleRemoveMember[Function: handleRemoveMember]
handleLeave[Function: handleLeave]
handleUpgradePlan[Function: handleUpgradePlan]
handleDeleteOrg[Function: handleDeleteOrg]
handleAcceptInvite_2[Function: handleAcceptInvite]
handleDeclineInvite_2[Function: handleDeclineInvite]
stringToColor[Function: stringToColor]
filteredMembers[Function: filteredMembers]
toggleMember[Function: toggleMember]
handleShare[Function: handleShare]
handleSpaceClick[Function: handleSpaceClick]
thStyles[Function: thStyles]
tdStyles[Function: tdStyles]
categoryRowStyles[Function: categoryRowStyles]
inviteBannerStyle[Function: inviteBannerStyle]

%% Component-Function Relationships
AtlasTextSprite -.-> getSharedMaterial : "getter function"
AtlasTextSprite -.-> atlas : "internal function"
AtlasTextSprite -.-> calculatedPosition : "calculation helper"
BatchedCurvedLines -.-> numericCacheKey : "internal function"
BatchedCurvedLines -.-> pathToSegments : "internal function"
BatchedCurvedLines -.-> pathsData : "internal function"
BatchedCurvedLines -.-> customRaycast : "internal function"
BatchedCurvedLines -.-> handleClick : "event handler"
BatchedCurvedLines -.-> handlePointerOver : "event handler"
BatchedCurvedLines -.-> handlePointerOut : "event handler"
BatchedConnectionLines -.-> straightConnections : "internal function"
BatchedConnectionLines -.-> customRaycast_2 : "internal function"
BatchedConnectionLines -.-> handleClick_2 : "event handler"
BatchedConnectionLines -.-> handlePointerOver_2 : "event handler"
BatchedConnectionLines -.-> handlePointerOut_2 : "event handler"
CellBoundaryRenderer -.-> computeVisibleCells : "calculation helper"
CellBoundaryRenderer -.-> buildGeometry : "internal function"
AnimatedConnectionLine -.-> structuralKey : "internal function"
App -.-> objects : "internal function"
App -.-> canViewSpace : "internal function"
App -.-> shouldRedirect : "boolean check"
App -.-> handleSpatialObjectChange : "event handler"
App -.-> spatialManagerDebug : "internal function"
App -.-> checkPositionJitterWithHistory : "boolean check"
App -.-> loadedCellsKey : "internal function"
App -.-> performInitialObjectFetch : "internal function"
App -.-> scheduleLoadingComplete : "internal function"
App -.-> handleObjectMatrixChanged : "event handler"
App -.-> disableOrbitControls : "boolean check"
App -.-> enableOrbitControls : "internal function"
App -.-> handleLogin : "event handler"
App -.-> handleObjectClick : "event handler"
App -.-> handleObjectMoveCallback : "event handler"
App -.-> handleObjectUpdateCallback : "event handler"
App -.-> handleFaceIndicatorClickCallback : "event handler"
App -.-> handleFaceClick : "event handler"
App -.-> handleCanvasClick : "event handler"
App -.-> updateVisibleObjects : "update helper"
App -.-> throttledUpdateVisibility : "update helper"
App -.-> handleCameraUpdate : "event handler"
App -.-> handleCameraSettle : "event handler"
App -.-> deviceInfo : "internal function"
App -.-> canvasSettings : "setter function"
BVHIntegration -.-> handleCanvasClick_2 : "event handler"
AppShell -.-> handleOpenSpace : "event handler"
AppShell -.-> handleBackToLanding : "event handler"
AppShell -.-> handleTryWithoutAccount : "event handler"
AppShell -.-> handlePopState : "event handler"
Sphere -.-> createDodecahedronGeometry : "internal function"
Sphere -.-> dodecahedronData : "internal function"
Sphere -.-> updateObjectAndStores : "update helper"
Sphere -.-> updateFaceProperty : "update helper"
Sphere -.-> isIndicatorConnected : "boolean check"
Sphere -.-> onClickOutside : "internal function"
Sphere -.-> updateDatabase : "update helper"
Sphere -.-> handleTransformToggle : "event handler"
Sphere -.-> handleHeaderToggle : "event handler"
Sphere -.-> handleHeaderSubmit : "event handler"
Sphere -.-> handleResizeToggle : "event handler"
Sphere -.-> handleDrag : "event handler"
Sphere -.-> handleScale : "event handler"
Sphere -.-> handleFaceClick_2 : "event handler"
Sphere -.-> handleIndicatorClick : "event handler"
Sphere -.-> handleHeaderClick : "event handler"
Sphere -.-> handleStyleChange : "event handler"
Sphere -.-> handleLineColorChange : "event handler"
Sphere -.-> handleBackgroundClick : "event handler"
Sphere -.-> handleFaceTextSubmit : "event handler"
Sphere -.-> handleFaceTextButtonClick : "event handler"
Sphere -.-> handleFaceTextClick : "event handler"
Sphere -.-> handleFaceTextStyleChange : "event handler"
Sphere -.-> getUIPosition : "getter function"
Sphere -.-> getHeaderPosition : "getter function"
Sphere -.-> getFaceUIPosition : "getter function"
Sphere -.-> getFaceTextPosition : "getter function"
Sphere -.-> getFaceInfo : "getter function"
Sphere -.-> getFaceRotation : "getter function"
Sphere -.-> shouldShowFaceIndicator : "boolean check"
Sphere -.-> getHeaderInputPosition : "getter function"
CustomCamera -.-> memoizedTarget : "getter function"
CustomCamera -.-> controlsRefCallback : "internal function"
DodecahedronFace -.-> getDodecahedronColoredMaterial : "getter function"
DodecahedronFace -.-> faceMaterial : "internal function"
DodecahedronFace -.-> handleClick_3 : "event handler"
DodecahedronFace -.-> handleTextClick : "event handler"
DodecahedronFace -.-> inverseScale : "internal function"
DodecahedronFace -.-> adjustedTextPosition : "internal function"
Cube -.-> runReconcile : "internal function"
Cube -.-> cubeData : "internal function"
Cube -.-> isIndicatorConnected_2 : "boolean check"
Cube -.-> isIndicatorActive : "boolean check"
Cube -.-> getUIPositions : "getter function"
Cube -.-> shouldShowIndicator : "boolean check"
Cube -.-> hasConnectedIndicators : "internal function"
Cube -.-> getFaceTextOffset : "getter function"
Cube -.-> handleSceneClick : "event handler"
Cube -.-> updateDatabase_2 : "update helper"
Cube -.-> onClickOutside_2 : "internal function"
Cube -.-> handleFaceClick_3 : "event handler"
Cube -.-> handleColoredFaceClick : "event handler"
Cube -.-> handleIndicatorClick_2 : "event handler"
Cube -.-> handleTransformToggle_2 : "event handler"
Cube -.-> handleResizeToggle_2 : "event handler"
Cube -.-> handleHeaderToggle_2 : "event handler"
Cube -.-> handleHeaderSubmit_2 : "event handler"
Cube -.-> debouncedUpdate : "update helper"
Cube -.-> handleLineColorChange_2 : "event handler"
Cube -.-> handleFaceColorChange : "event handler"
Cube -.-> handleTextClick_2 : "event handler"
Cube -.-> handleFaceTextClick_2 : "event handler"
Cube -.-> handleFaceTextSubmit_2 : "event handler"
Cube -.-> handleFaceTextStyleClick : "event handler"
Cube -.-> handleStyleChange_2 : "event handler"
Cube -.-> handleDrag_2 : "event handler"
Cube -.-> handleScale_2 : "event handler"
Cube -.-> renderFaces : "render helper"
Cube -.-> renderFaceTexts : "render helper"
Cube -.-> arraysEqual : "internal function"
Cube -.-> shallowObjEqual : "internal function"
ColorPicker -.-> handleColorChange : "event handler"
ColorPicker -.-> handleContainerClick : "event handler"
ColorPicker -.-> handleApplyColor : "event handler"
ColorPicker -.-> handleCancel : "event handler"
DistanceFilteredConnectionText -.-> getTextParametricT : "getter function"
DistanceFilteredConnectionText -.-> redistributeFaces : "boolean check"
DistanceFilteredConnectionText -.-> pathToLineSegments : "internal function"
DistanceFilteredConnectionText -.-> resolveEndpointPosition : "internal function"
DistanceFilteredConnectionText -.-> getLineWidth : "getter function"
DistanceFilteredConnectionText -.-> handleConnectionClick : "event handler"
DistanceFilteredConnectionText -.-> handleLineTextClick : "event handler"
DistanceFilteredConnectionText -.-> handleLineTextSubmit : "event handler"
DistanceFilteredConnectionText -.-> handleLineTextStyleChange : "event handler"
DistanceFilteredConnectionText -.-> handleLineStyleChange : "event handler"
DistanceFilteredConnectionText -.-> handleLineColorChange_3 : "event handler"
DistanceFilteredConnectionText -.-> connectionData : "internal function"
DistanceFilteredConnectionText -.-> pathData : "internal function"
DistanceFilteredConnectionText -.-> textPositionData : "internal function"
DistanceFilteredConnectionText -.-> availableObjectIds : "internal function"
DistanceFilteredConnectionText -.-> pathfindingObjects : "internal function"
DistanceFilteredConnectionText -.-> objectsPositionHash : "internal function"
DistanceFilteredConnectionText -.-> objectVisibleConnections : "boolean check"
DistanceFilteredConnectionText -.-> focusedConnections : "internal function"
DistanceFilteredConnectionText -.-> flowPathHighlightedConnections : "internal function"
DistanceFilteredConnectionText -.-> connectionsForCulling : "internal function"
DistanceFilteredConnectionText -.-> mountNextBatch : "internal function"
DistanceFilteredConnectionText -.-> progressiveConnections : "internal function"
DistanceFilteredConnectionText -.-> objectPositions : "internal function"
DistanceFilteredConnectionText -.-> allStraightConnections : "internal function"
DistanceFilteredConnectionText -.-> faceOverrides : "internal function"
DistanceFilteredConnectionText -.-> textLabels : "internal function"
DistanceFilteredConnectionText -.-> handleBatchedConnectionClick : "event handler"
CubeFace -.-> getColoredMaterial : "getter function"
CubeFace -.-> faceStateSelector : "internal function"
CubeFace -.-> faceMaterial_2 : "internal function"
CubeFace -.-> handleClick_4 : "event handler"
CubeFace -.-> offsetMultiplier : "setter function"
CubeFace -.-> offsetPosition : "setter function"
EarthGlobe -.-> handlePointerDown : "event handler"
EarthGlobe -.-> handlePointerUp : "event handler"
EarthGlobe -.-> bands : "internal function"
EarthGlobe -.-> meshGeometry : "internal function"
EarthGlobe -.-> localDetail : "internal function"
EarthGlobe -.-> localBands : "internal function"
EarthGlobe -.-> localMeshGeometry : "internal function"
DiagramOverlay2D -.-> buildReactFlowNodes : "internal function"
DiagramOverlay2D -.-> getDepth : "getter function"
DiagramOverlay2D -.-> buildReactFlowEdges : "internal function"
DiagramOverlay2D -.-> layerForType : "internal function"
DiagramOverlay2D -.-> filterEdges : "internal function"
DiagramOverlay2D -.-> minimapNodeColor : "internal function"
DiagramOverlay2D -.-> flowPathNames : "internal function"
DiagramOverlay2D -.-> serialisedGraphData : "boolean check"
DiagramOverlay2D -.-> serialisedHierarchy : "boolean check"
DiagramOverlay2D -.-> filteredEdges : "internal function"
DiagramOverlay2D -.-> toggleLayer : "internal function"
DiagramOverlay2D -.-> toggleLayerHandlers : "event handler"
DiagramOverlay2D -.-> handleNodeClick : "event handler"
DiagramOverlay2D -.-> handleBackTo3D : "event handler"
FaceUI -.-> handleBorderStyleClick : "event handler"
FaceUI -.-> handleBorderColorClick : "event handler"
FaceUI -.-> handleLineThicknessClick : "event handler"
FaceUI -.-> handleColorSelect : "event handler"
FaceUI -.-> handleToolClick : "event handler"
FaceTextInput -.-> handleKeyDown : "event handler"
FaceTextInput -.-> handleChange : "event handler"
FaceTextInput -.-> handleFocus : "event handler"
FaceTextInput -.-> handleBlur : "event handler"
GlobalCubeMediumLODRenderer -.-> mediumCubes : "internal function"
GlobalCubeMediumLODRenderer -.-> cubeIds : "internal function"
GlobalCubeEdgesRenderer -.-> _ensureCubeWasmBuffers : "internal function"
GlobalCubeEdgesRenderer -.-> filteredCubes : "internal function"
GlobalCubeEdgesRenderer -.-> cubeIds_2 : "internal function"
GlobalCubeEdgesRenderer -.-> isCubeVisible : "boolean check"
GlobalCubeEdgesRenderer -.-> updateCubeEdges : "update helper"
FaceIndicator -.-> getIndicatorMaterial : "getter function"
FaceIndicator -.-> material : "internal function"
GlobalCubeFaceRenderer -.-> filteredCubes_2 : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> isCubeUnmodified : "boolean check"
GlobalCubeFullLODInstancedRenderer -.-> instancedCubes : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> cubeIds_3 : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> handleClick_5 : "event handler"
GlobalDodecahedronEdgesRenderer -.-> _ensureDodecaWasmBuffers : "internal function"
GlobalDodecahedronEdgesRenderer -.-> filteredDodecahedrons : "internal function"
GlobalDodecahedronEdgesRenderer -.-> dodecahedronIds : "internal function"
GlobalDodecahedronEdgesRenderer -.-> isDodecahedronVisible : "boolean check"
GlobalDodecahedronEdgesRenderer -.-> updateDodecahedronEdges : "update helper"
GlobalTetrahedronEdgesRenderer -.-> _ensureTetraWasmBuffers : "internal function"
GlobalTetrahedronEdgesRenderer -.-> filteredTetrahedrons : "internal function"
GlobalTetrahedronEdgesRenderer -.-> tetrahedronIds : "internal function"
GlobalTetrahedronEdgesRenderer -.-> isTetrahedronVisible : "boolean check"
GlobalTetrahedronEdgesRenderer -.-> updateTetrahedronEdges : "update helper"
HandsRenderer -.-> readLandmark : "internal function"
HandsRenderer -.-> applyJoints : "internal function"
HandsRenderer -.-> buildBonePoints : "internal function"
HandsRenderer -.-> makeHandState : "internal function"
HeaderInput -.-> handleKeyDown_2 : "event handler"
HeaderInput -.-> handleChange_2 : "event handler"
HeaderInput -.-> handleFocus_2 : "event handler"
HeaderInput -.-> handleBlur_2 : "event handler"
GlobalDodecahedronMediumLODRenderer -.-> mediumDodecahedrons : "internal function"
GlobalDodecahedronMediumLODRenderer -.-> dodecaIds : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> _buildTetraGeometry : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> mediumTetrahedrons : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> tetraIds : "internal function"
InstancedAtlasText -.-> atlas_2 : "internal function"
InstancedAtlasText -.-> pageGroups : "internal function"
InstancedAtlasText -.-> geometry : "internal function"
InstancedAtlasText -.-> material_2 : "internal function"
InstancedAtlasText -.-> handleClick_6 : "event handler"
LODManager -.-> containersKey : "internal function"
LODManager -.-> computeContainmentSync : "calculation helper"
LODManager -.-> enqueueLODUpdates : "update helper"
LineUI -.-> getFullStyle : "getter function"
LineUI -.-> getBaseStyle : "getter function"
LineUI -.-> handleToolClick_2 : "event handler"
LineUI -.-> handleLineStyleClick : "event handler"
LineUI -.-> handleArrowClick : "event handler"
InstancedLine -.-> flatPoints : "internal function"
InstancedLine -.-> geometry_2 : "internal function"
InstancedLine -.-> customRaycast_3 : "internal function"
InstancedLine -.-> material_3 : "internal function"
ObjectRenderer -.-> onClickStable : "internal function"
ObjectRenderer -.-> onDeleteStable : "internal function"
ObjectRenderer -.-> onTransformStartStable : "internal function"
ObjectRenderer -.-> onTransformEndStable : "internal function"
ObjectRenderer -.-> onMatrixChangedStable : "internal function"
ObjectRenderer -.-> onMoveStable : "internal function"
ObjectRenderer -.-> arraysEqual_2 : "internal function"
ObjectsRenderer -.-> mountNextBatch_2 : "internal function"
ObjectsRenderer -.-> mountResume : "internal function"
ObjectsRenderer -.-> progressiveVisibleObjects : "boolean check"
ObjectsRenderer -.-> cubeObjects : "internal function"
ObjectsRenderer -.-> containerHeaders : "internal function"
ObjectsRenderer -.-> dodecahedronObjects : "internal function"
ObjectsRenderer -.-> tetrahedronObjects : "internal function"
ObjectsRenderer -.-> unmodifiedCubeIds : "internal function"
ObjectsRenderer -.-> handleInstancedCubeClick : "event handler"
ObjectsRenderer -.-> renderedObjects : "render helper"
RepoGrid -.-> containers : "internal function"
RepoGrid -.-> gridData : "internal function"
Plane -.-> planeData : "internal function"
Plane -.-> closeAllUIs : "boolean check"
Plane -.-> updateDatabase_3 : "update helper"
Plane -.-> handleScale_3 : "event handler"
Plane -.-> handleResizeEnd : "event handler"
Plane -.-> handleDrag_3 : "event handler"
Plane -.-> handleTransformStart : "event handler"
Plane -.-> handleTransformEnd : "event handler"
Plane -.-> handleClick_7 : "event handler"
Plane -.-> handleTextClick_3 : "event handler"
Plane -.-> handleTextSubmit : "event handler"
Plane -.-> handleTextStyleChange : "event handler"
Plane -.-> handleTextSpriteClick : "event handler"
Plane -.-> handleTransformToggle_3 : "event handler"
Plane -.-> handleResizeToggle_3 : "event handler"
Plane -.-> handleColorChange_2 : "event handler"
Plane -.-> handleHeaderToggle_3 : "event handler"
Plane -.-> handleHeaderSubmit_3 : "event handler"
Plane -.-> handleHeaderTextClick : "event handler"
Plane -.-> handleHeaderStyleChange : "event handler"
Plane -.-> handleBorderToggle : "event handler"
Plane -.-> handleIndicatorClick_3 : "event handler"
Plane -.-> isIndicatorConnected_3 : "boolean check"
Plane -.-> shouldShowIndicator_2 : "boolean check"
Plane -.-> handleBroadcastStopped : "event handler"
Plane -.-> applyStreamScale : "internal function"
Plane -.-> restoreStreamScale : "internal function"
Plane -.-> handleWebcamToggle : "event handler"
Plane -.-> handleScreenShareToggle : "event handler"
Plane -.-> handlePinToggle : "event handler"
Plane -.-> handleImageUpload : "event handler"
Plane -.-> handleBroadcastStarted : "event handler"
Plane -.-> handleViewerCountChange : "event handler"
Plane -.-> uiPositions : "internal function"
Plane -.-> indicatorPosition : "internal function"
Plane -.-> meshMaterial : "internal function"
Plane -.-> lineMaterialProps : "internal function"
Plane -.-> borderEdgePoints : "internal function"
ScreenShareStream -.-> attemptPlay : "internal function"
ScreenShareStream -.-> connectToBroadcast : "internal function"
ObjectUI -.-> handleEyeClick : "event handler"
ObjectUI -.-> handleColorPick : "event handler"
ObjectUI -.-> handleToolClick_3 : "event handler"
ModelObject -.-> createLoaders : "internal function"
ModelObject -.-> handleClick_8 : "event handler"
ModelObject -.-> handlePointerDown_2 : "event handler"
ModelObject -.-> handlePointerUp_2 : "event handler"
TreeRow -.-> toggleGroup : "internal function"
TreeRow -.-> markReachable : "internal function"
TreeRow -.-> toggle : "internal function"
TreeRow -.-> visibleRoots : "boolean check"
TreeRow -.-> ancestorOf : "internal function"
TreeRow -.-> ancestorOf_2 : "internal function"
TreeRow -.-> expandAll : "internal function"
TreeRow -.-> collapseAll : "internal function"
RealTimeConnectionUpdater -.-> runConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> updateConnectionEndpoint : "update helper"
RealTimeConnectionUpdater -.-> updateConnectionEndpoint_2 : "update helper"
RealTimeConnectionUpdater -.-> rebuildConnectionMap : "internal function"
Tetrahedron -.-> _createTriangleGeometry : "internal function"
Tetrahedron -.-> getFaceIndicatorProps : "getter function"
Tetrahedron -.-> tetrahedronFaces : "internal function"
Tetrahedron -.-> debouncedUpdate_2 : "update helper"
Tetrahedron -.-> isIndicatorConnected_4 : "boolean check"
Tetrahedron -.-> isIndicatorActive_2 : "boolean check"
Tetrahedron -.-> getUIPositions_2 : "getter function"
Tetrahedron -.-> shouldShowIndicator_3 : "boolean check"
Tetrahedron -.-> hasConnectedIndicators_2 : "internal function"
Tetrahedron -.-> tetrahedronEdgePoints : "internal function"
Tetrahedron -.-> handleSceneClick_2 : "event handler"
Tetrahedron -.-> updateDatabase_4 : "update helper"
Tetrahedron -.-> handleFaceClick_4 : "event handler"
Tetrahedron -.-> handleColoredFaceClick_2 : "event handler"
Tetrahedron -.-> handleIndicatorClick_4 : "event handler"
Tetrahedron -.-> handleTransformToggle_4 : "event handler"
Tetrahedron -.-> handleResizeToggle_4 : "event handler"
Tetrahedron -.-> handleHeaderToggle_4 : "event handler"
Tetrahedron -.-> handleHeaderSubmit_4 : "event handler"
Tetrahedron -.-> handleLineColorChange_4 : "event handler"
Tetrahedron -.-> handleDrag_4 : "event handler"
Tetrahedron -.-> handleScale_4 : "event handler"
Tetrahedron -.-> getFaceTextOffset_2 : "getter function"
Tetrahedron -.-> handleFaceTextStyleClick_2 : "event handler"
Tetrahedron -.-> handleFaceTextStyleChange_2 : "event handler"
Tetrahedron -.-> renderFaceTexts_2 : "render helper"
Tetrahedron -.-> renderFaces_2 : "render helper"
Avatar -.-> getInitials : "getter function"
Avatar -.-> handleClick_9 : "event handler"
TextObject -.-> text : "internal function"
TextObject -.-> textStyle : "internal function"
TextObject -.-> scale : "internal function"
TextObject -.-> setOrbitControlsEnabled : "setter function"
TextObject -.-> setText : "setter function"
TextObject -.-> setTextStyle : "setter function"
TextObject -.-> setScale : "setter function"
TextObject -.-> setIsEditing : "setter function"
TextObject -.-> setIsActivelyEditing : "setter function"
TextObject -.-> setIndicatorSelected : "setter function"
TextObject -.-> setContentHeight : "setter function"
TextObject -.-> setShowTransform : "setter function"
TextObject -.-> setShowResizeControls : "setter function"
TextObject -.-> setBulletPointMode : "setter function"
TextObject -.-> handleTransformToggle_5 : "event handler"
TextObject -.-> handleResizeToggle_5 : "event handler"
TextObject -.-> getIndicatorOffset : "getter function"
TextObject -.-> isIndicatorConnected_5 : "boolean check"
TextObject -.-> shouldShowIndicator_4 : "boolean check"
TextObject -.-> getIndicatorPositions : "getter function"
TextObject -.-> updateWorldMatrix : "update helper"
TextObject -.-> closeAllUIs_2 : "boolean check"
TextObject -.-> updateDatabase_5 : "update helper"
TextObject -.-> autoResizeTextAreaOnly : "internal function"
TextObject -.-> autoResizeTextArea : "internal function"
TextObject -.-> handleBlur_3 : "event handler"
TextObject -.-> handleDivClick : "event handler"
TextObject -.-> handleTextClick_4 : "event handler"
TextObject -.-> handleIndicatorClick_5 : "event handler"
TextObject -.-> handleDrag_5 : "event handler"
TextObject -.-> handleScale_5 : "event handler"
TextObject -.-> handleKeyDown_3 : "event handler"
TextObject -.-> handleStyleChange_3 : "event handler"
TextObject -.-> applyStyleToSelectionInternal : "internal function"
TextObject -.-> applyStyleToSelectionInternal_2 : "internal function"
TextObject -.-> handleTextSelection : "event handler"
TextObject -.-> getTextAreaStyle : "getter function"
TextObject -.-> getContainerStyle : "getter function"
TextObject -.-> getEffectivePosition : "getter function"
TextObject -.-> getTransformControlSize : "getter function"
SpaceChat -.-> getGuestId : "getter function"
SpaceChat -.-> senderInitials : "internal function"
SpaceChat -.-> mergeMessages : "internal function"
SpaceChat -.-> handleScroll : "event handler"
SpaceChat -.-> handleSend : "event handler"
SpaceChat -.-> handleKeyDown_4 : "event handler"
TextSprite -.-> lerpVector : "internal function"
TextSprite -.-> spriteId : "internal function"
TextSprite -.-> setIsDragging : "setter function"
TextSprite -.-> calculatedPosition_2 : "calculation helper"
TextSprite -.-> getFontSize : "getter function"
TetrahedronFace -.-> getTetrahedronColoredMaterial : "getter function"
TetrahedronFace -.-> faceMaterial_3 : "internal function"
TetrahedronFace -.-> handleClick_10 : "event handler"
TetrahedronFace -.-> handleIndicatorClickLocal : "event handler"
TetrahedronFace -.-> getFaceTextOffset_3 : "getter function"
TetrahedronFace -.-> handleFaceTextStyleClick_3 : "event handler"
TetrahedronFace -.-> handleFaceTextStyleChange_3 : "event handler"
TetrahedronFace -.-> faceTextElement : "internal function"
TextStyleUIContent -.-> handleSizeChange : "event handler"
TextStyleUIContent -.-> handleFontSizeInputChange : "event handler"
TextStyleUIContent -.-> handleWheel : "event handler"
TextStyleUIContent -.-> handleButtonClick : "event handler"
TextStyleUIContent -.-> handleColorSelect_2 : "event handler"
TextStyleUIContent -.-> handleSelectChange : "event handler"
TextStyleUIContent -.-> getUIScale : "getter function"
TextObjectUI -.-> handleUIClick : "event handler"
TextObjectUI -.-> handleResizeToggle_6 : "event handler"
TextObjectUI -.-> handleEyeClick_2 : "event handler"
WebcamStream -.-> applyVideoTexture : "internal function"
WebcamStream -.-> attemptPlay_2 : "internal function"
WebcamStream -.-> connectToBroadcast_2 : "internal function"
EarthSidebarSections -.-> pipelineTasks : "internal function"
EarthSidebarSections -.-> pipelineStatusCounts : "internal function"
EarthSidebarSections -.-> setIsRecording : "setter function"
EarthSidebarSections -.-> handleCellBoundariesToggle : "event handler"
EarthSidebarSections -.-> fetchRepositories : "internal function"
EarthSidebarSections -.-> fetchAppJsxFromRepo : "internal function"
EarthSidebarSections -.-> handleRescan : "event handler"
EarthSidebarSections -.-> handleDownloadMarkdown : "event handler"
EarthSidebarSections -.-> triggerDownload : "internal function"
EarthSidebarSections -.-> triggerDownload_2 : "internal function"
EarthSidebarSections -.-> handleScreenClick : "event handler"
EarthSidebarSections -.-> handleRuntimeScan : "event handler"
EarthSidebarSections -.-> handleRecordClick : "event handler"
EarthSidebarSections -.-> handler : "event handler"
EarthSidebarSections -.-> handleDeleteAllCells : "event handler"
EarthSidebarSections -.-> pollStatus : "internal function"
EarthSidebarSections -.-> pollStatus_2 : "internal function"
EarthSidebarSections -.-> handleModelUpload : "event handler"
EarthSidebarSections -.-> handleModelFileSelect : "event handler"
EarthSidebarSections -.-> handleMarkdownUpload : "event handler"
EarthSidebarSections -.-> handleMarkdownFileSelect : "event handler"
EarthSidebarSections -.-> handleCsvUpload : "event handler"
EarthSidebarSections -.-> handleCsvFileSelect : "event handler"
EarthSidebarSections -.-> handleMenuToggle : "event handler"
EarthSidebarSections -.-> handleArrowClick_2 : "event handler"
EarthSidebarSections -.-> handleUnpinWebcam : "event handler"
EarthSidebarSections -.-> handleTemplateConfigChange : "event handler"
EarthSidebarSections -.-> createTemplate : "internal function"
MerfolkEdge -.-> flowPathColor : "internal function"
MerfolkEdge -.-> getEdgeStyle : "getter function"
MerfolkEdge -.-> getMarkerEnd : "getter function"
MerfolkEdge -.-> getSelectedStyle : "getter function"
MerfolkEdge -.-> getUnselectedStyle : "getter function"
MerfolkNode -.-> buildNodeStyles : "internal function"
MerfolkNode -.-> buildContainerStyles : "internal function"
MerfolkNode -.-> buildPrecomputedNode : "calculation helper"
DodecahedronWireframe -.-> generateDodecahedronEdges : "internal function"
LandingApp -.-> scheduleScrollUpdate : "update helper"
LandingApp -.-> handleWheel_2 : "event handler"
LandingApp -.-> handleTouchStart : "event handler"
LandingApp -.-> handleTouchMove : "event handler"
LandingApp -.-> createUserDocument : "internal function"
LandingApp -.-> handleLogin_2 : "event handler"
LandingApp -.-> handleLogout : "event handler"
LandingApp -.-> navigateToSpace : "internal function"
LandingApp -.-> fetchUserSpaces : "internal function"
LandingApp -.-> createNewSpace : "internal function"
LandingApp -.-> handleShareSpace : "event handler"
LandingApp -.-> handleDeleteSpace : "event handler"
LandingApp -.-> handleLeaveSpace : "event handler"
LandingApp -.-> handleFirstCubeComplete : "event handler"
LandingApp -.-> handleDodecahedronComplete : "event handler"
LandingApp -.-> handleAcceptInvite : "event handler"
LandingApp -.-> handleDeclineInvite : "event handler"
LandingApp -.-> spaceTableProps : "internal function"
LandingApp -.-> createSpaceProps : "internal function"
LandingApp -.-> sharePopupProps : "internal function"
FakeGlowMaterial -.-> FakeGlowMaterial : "internal function"
PerspectiveGrid -.-> idx : "internal function"
PerspectiveGrid -.-> addEdge : "internal function"
UpdatesViewer -.-> parsedContent : "internal function"
UpdatesViewer -.-> formattedTimestamp : "internal function"
SectionEyebrow -.-> clamp01 : "internal function"
SectionEyebrow -.-> getSectionVisibility : "getter function"
CreateOrganizationPopup -.-> handleKeyPress : "event handler"
CreateOrganizationPopup -.-> handleSubmit : "event handler"
UpdatesEditor -.-> handleKeyCommand : "event handler"
UpdatesEditor -.-> toggleInlineStyle : "internal function"
UpdatesEditor -.-> handleSave : "event handler"
DodecahedronWireframe2 -.-> generateDodecahedronEdges_2 : "internal function"
CreateSpacePopup -.-> handleSpaceNameChange : "event handler"
CreateSpacePopup -.-> handleEmailChange : "event handler"
CreateSpacePopup -.-> handleMemberSelect : "event handler"
CreateSpacePopup -.-> handleKeyPress_2 : "event handler"
CreateSpacePopup -.-> handleSubmit_2 : "event handler"
OrgMemberDropdown -.-> handleClickOutside : "event handler"
OrgMemberDropdown -.-> handleInputFocus : "event handler"
OrgMemberDropdown -.-> handleInputChange : "event handler"
OrgMemberDropdown -.-> handleSelect : "event handler"
OrganizationManager -.-> refresh : "internal function"
OrganizationManager -.-> handleCreateOrg : "event handler"
OrganizationManager -.-> handleInvite : "event handler"
OrganizationManager -.-> handleRemoveMember : "event handler"
OrganizationManager -.-> handleLeave : "event handler"
OrganizationManager -.-> handleUpgradePlan : "event handler"
OrganizationManager -.-> handleDeleteOrg : "event handler"
OrganizationManager -.-> handleAcceptInvite_2 : "event handler"
OrganizationManager -.-> handleDeclineInvite_2 : "event handler"
ShareSpacePopup -.-> stringToColor : "internal function"
ShareSpacePopup -.-> filteredMembers : "internal function"
ShareSpacePopup -.-> toggleMember : "internal function"
ShareSpacePopup -.-> handleShare : "event handler"
SpacesTable -.-> handleSpaceClick : "event handler"
SpacesTable -.-> thStyles : "internal function"
SpacesTable -.-> tdStyles : "internal function"
SpacesTable -.-> categoryRowStyles : "internal function"
SpacesTable -.-> inviteBannerStyle : "internal function"

%% File Container Nodes
backend_index((Service: index))
useAuth_file[Hook: useAuth]
firebase[Function: firebase]
useAuthState_file[Hook: useAuthState]
useConnectionAnimationManager[Hook: useConnectionAnimationManager]
useCentralizedBroadcastManager_file[Hook: useCentralizedBroadcastManager]
useConnectionObjects_file[Hook: useConnectionObjects]
useGlobalClickHandler_file[Hook: useGlobalClickHandler]
useIndicators_file[Hook: useIndicators]
useDebouncedUpdate_file[Hook: useDebouncedUpdate]
useConnectionsRendererStore_file[Hook: useConnectionsRendererStore]
useSpaceManager_file[Hook: useSpaceManager]
useFrustumCulling[Hook: useFrustumCulling]
useConnections_file[Hook: useConnections]
useSpatialManager_file[Hook: useSpatialManager]
useObjects_file[Hook: useObjects]
useTextureUpdater_file[Hook: useTextureUpdater]
useTimeoutManager_file[Hook: useTimeoutManager]
sharedSpacesService[Function: sharedSpacesService]
useWindowSize_file[Hook: useWindowSize]
authService((Service: authService))
connectionsService((Service: connectionsService))
githubRepoService((Service: githubRepoService))
imageOps((Service: imageOps))
csvDiagramService((Service: csvDiagramService))
globalOptimizationCoordinator_file((Service: globalOptimizationCoordinator))
centralizedBroadcastManager_file((Service: centralizedBroadcastManager))
connectionPositionResolver((Service: connectionPositionResolver))
githubIssuesService((Service: githubIssuesService))
globalSubscriptionManager((Service: globalSubscriptionManager))
anchors((Service: anchors))
processMethods((Service: processMethods))
connectionMethods((Service: connectionMethods))
hierarchyMethods((Service: hierarchyMethods))
containerMethods((Service: containerMethods))
handTrackingService((Service: handTrackingService))
palmDecode((Service: palmDecode))
objectMethods((Service: objectMethods))
constants((Service: constants))
positionMethods((Service: positionMethods))
presenceService((Service: presenceService))
runtimeScanService((Service: runtimeScanService))
screenRecordingService((Service: screenRecordingService))
resourceCleanupService_file((Service: resourceCleanupService))
markdownDiagramService_file((Service: markdownDiagramService))
pipelineOrchestrator((Service: pipelineOrchestrator))
repoContainerService((Service: repoContainerService))
organizationService((Service: organizationService))
pipelineTaskService((Service: pipelineTaskService))
spatialObjectsService((Service: spatialObjectsService))
storageService((Service: storageService))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
webRservice((Service: webRservice))
spatialPartitioning((Service: spatialPartitioning))
unifiedCacheManager_file((Service: unifiedCacheManager))
spacesService((Service: spacesService))
shader_shaders[Function: shaders]
sharingService((Service: sharingService))
colorPickerStore[[Store: colorPickerStore]]
cubeStore[[Store: cubeStore]]
earthSettingsStore[[Store: earthSettingsStore]]
authStore[[Store: authStore]]
dodecahedronStore[[Store: dodecahedronStore]]
animatedConnectionLineStore[[Store: animatedConnectionLineStore]]
diagramStore[[Store: diagramStore]]
connectionStore[[Store: connectionStore]]
pipelineStore[[Store: pipelineStore]]
faceIndicatorStore[[Store: faceIndicatorStore]]
objectsStore[[Store: objectsStore]]
handTrackingStore[[Store: handTrackingStore]]
lodStore[[Store: lodStore]]
planeStore[[Store: planeStore]]
indicatorsStore[[Store: indicatorsStore]]
faceStore[[Store: faceStore]]
textInputStore[[Store: textInputStore]]
storeUtils[[Store: storeUtils]]
transformControlsStore[[Store: transformControlsStore]]
textObjectStore[[Store: textObjectStore]]
screenShareStore[[Store: screenShareStore]]
publicSpaceStore[[Store: publicSpaceStore]]
tetrahedronStore[[Store: tetrahedronStore]]
spatialManagerStore[[Store: spatialManagerStore]]
spaceManagerStore[[Store: spaceManagerStore]]
textAtlasStore[[Store: textAtlasStore]]
connectionUtils[Function: connectionUtils]
uiOverlayStore[[Store: uiOverlayStore]]
earthHeightmapLoader[Function: earthHeightmapLoader]
animationUtils[Function: animationUtils]
facePositionUtils[Function: facePositionUtils]
earthTerrainGenerator[Function: earthTerrainGenerator]
webcamStreamStore[[Store: webcamStreamStore]]
bvhRaycasting[Function: bvhRaycasting]
debugUtils[Function: debugUtils]
faceIndicatorUtils[Function: faceIndicatorUtils]
frameCounter_file[Function: frameCounter]
loadingState[Function: loadingState]
renderWorkScheduler[Function: renderWorkScheduler]
snappingUtils[Function: snappingUtils]
pathfindingUtils[Function: pathfindingUtils]
objectVirtualization[Function: objectVirtualization]
positionUtils[Function: positionUtils]
objectUpdateHandlers[Function: objectUpdateHandlers]
gpuResourceTracker[Function: gpuResourceTracker]
terrainTileCache[Function: terrainTileCache]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
worker_hoverchart_wasm[Function: hoverchart_wasm]
streamlinedSpatialIndex[Function: streamlinedSpatialIndex]
wasmKernels[Function: wasmKernels]
textureLoader[Function: textureLoader]
textAtlas[Function: textAtlas]
unifiedValidationUtils[Function: unifiedValidationUtils]
worker_markdownLayoutWorker[Function: markdownLayoutWorker]
worker_diagramLayoutWorker[Function: diagramLayoutWorker]
worker_handTrackingWorkerClient[Function: handTrackingWorkerClient]
worker_handTrackingWorker[Function: handTrackingWorker]
worker_markdownLayoutWorkerClient[Function: markdownLayoutWorkerClient]
worker_pathfindingWorkerClient[Function: pathfindingWorkerClient]
worker_diagramLayoutWorkerClient[Function: diagramLayoutWorkerClient]
worker_spatialIndexWorker[Function: spatialIndexWorker]
worker_lib_rs[Function: lib_rs]
worker_treeSitterScannerWorkerClient[Function: treeSitterScannerWorkerClient]
worker_treeSitterScannerWorker[Function: treeSitterScannerWorker]
worker_textAtlasWorkerClient[Function: textAtlasWorkerClient]
worker_spatialIndexWorkerClient[Function: spatialIndexWorkerClient]
worker_textAtlasWorker[Function: textAtlasWorker]

%% File-Function Relationships
backend_index -.-> createVerifyAuthTokenApp : "contains"
backend_index -.-> createBulkImportApp : "contains"
backend_index -.-> objectsByCellId : "contains"
backend_index -.-> connectionsByCellId : "contains"
backend_index -.-> params : "contains"
backend_index -.-> generateJobId : "contains"
backend_index -.-> toMillis : "contains"
backend_index -.-> deleteCellContents : "contains"
backend_index -.-> createBulkDeleteApp : "contains"
backend_index -.-> runBulkDeleteJob : "contains"
backend_index -.-> cellsToKeep : "contains"
backend_index -.-> validateRuntimeScanUrl : "contains"
backend_index -.-> sanitizeMerfolkId : "contains"
backend_index -.-> generateMerfolkFromRuntimeTrace : "contains"
backend_index -.-> EXCLUDED_PROFILER_NAMES : "contains"
backend_index -.-> BUNDLE_NOISE_NAMES : "contains"
backend_index -.-> REACT_DEVTOOLS_INJECTION : "contains"
backend_index -.-> getCompName : "contains"
backend_index -.-> walkFiber : "contains"
backend_index -.-> extractSourceMapUrl : "contains"
backend_index -.-> scanOriginalSource : "contains"
backend_index -.-> extractNamesFromSourceMap : "contains"
backend_index -.-> scanJsBundles : "contains"
backend_index -.-> bundleComponents : "contains"
backend_index -.-> bundleHooks : "contains"
backend_index -.-> bundleFunctions : "contains"
backend_index -.-> captureRuntimeTrace : "contains"
backend_index -.-> urlObj : "contains"
backend_index -.-> seen : "contains"
backend_index -.-> seenFns : "contains"
backend_index -.-> dedup : "contains"
backend_index -.-> deduplicateApiCalls : "contains"
backend_index -.-> buildConnections : "contains"
backend_index -.-> createScanWebsiteRuntimeApp : "contains"
backend_index -.-> sanitizeNodeId : "contains"
backend_index -.-> isPrivate : "contains"
backend_index -.-> isDunder : "contains"
backend_index -.-> resolveContainerType : "contains"
backend_index -.-> scanWithTreeSitter : "contains"
backend_index -.-> ensureContainer : "contains"
backend_index -.-> importedNames : "contains"
backend_index -.-> scanPythonWithTreeSitter : "contains"
selectAuth[Function: selectAuth]
useAuth_file -.-> selectAuth : "contains"
useAuth_file -.-> useAuth : "contains"
provider[Function: provider]
firebase -.-> provider : "contains"
selectAuthState[Function: selectAuthState]
useAuthState_file -.-> selectAuthState : "contains"
useAuthState_file -.-> useAuthState : "contains"
ConnectionAnimationManager[Function: ConnectionAnimationManager]
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "contains"
objectPositionEqual[Function: objectPositionEqual]
useConnectionObjects_file -.-> objectPositionEqual : "contains"
useConnectionObjects_file -.-> useConnectionObjects : "contains"
useConnectionObjects_file -.-> usePathfindingObjects : "contains"
useConnectionObjects_file -.-> useConnectionObjectPositions : "contains"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "contains"
handleGlobalClick[Function: handleGlobalClick]
useGlobalClickHandler_file -.-> handleGlobalClick : "contains"
useIndicators_file -.-> useIndicators : "contains"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "contains"
useDebouncedUpdate_file -.-> cleanup : "contains"
getConnectionStateSelector[Function: getConnectionStateSelector]
useConnectionsRendererStore_file -.-> getConnectionStateSelector : "contains"
cleanupStaleSelectors[Function: cleanupStaleSelectors]
useConnectionsRendererStore_file -.-> cleanupStaleSelectors : "contains"
actionsSelector[Function: actionsSelector]
useConnectionsRendererStore_file -.-> actionsSelector : "contains"
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "contains"
useConnectionsRendererStore_file -.-> useConnectionState : "contains"
selector[Function: selector]
useConnectionsRendererStore_file -.-> selector : "contains"
useConnectionsRendererStore_file -.-> useConnectionActions : "contains"
selectSpaceManagerState[Function: selectSpaceManagerState]
useSpaceManager_file -.-> selectSpaceManagerState : "contains"
useSpaceManager_file -.-> useSpaceManager : "contains"
isPointInFrustum[Function: isPointInFrustum]
useFrustumCulling -.-> isPointInFrustum : "contains"
isConnectionVisible[Function: isConnectionVisible]
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
useFrustumCulling -.-> objectPositions : "contains"
visibleConnections[Function: visibleConnections]
useFrustumCulling -.-> visibleConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
selectConnectionHookState[Function: selectConnectionHookState]
useConnections_file -.-> selectConnectionHookState : "contains"
useConnections_file -.-> useConnections : "contains"
spaceId[Function: spaceId]
useConnections_file -.-> spaceId : "contains"
useConnections_file -.-> userId : "contains"
stableLoadedCells[Function: stableLoadedCells]
useConnections_file -.-> stableLoadedCells : "contains"
connectionCallback[Function: connectionCallback]
useConnections_file -.-> connectionCallback : "contains"
enhancedConnectionCallback[Function: enhancedConnectionCallback]
useConnections_file -.-> enhancedConnectionCallback : "contains"
useConnections_file -.-> handleLineStyleChange : "contains"
useConnections_file -.-> handleLineColorChange : "contains"
useConnections_file -.-> handleConnectionClick : "contains"
useConnections_file -.-> handleLineTextClick : "contains"
useConnections_file -.-> handleLineTextSubmit : "contains"
useConnections_file -.-> handleLineTextStyleChange : "contains"
useSpatialManager_file -.-> useSpatialManager : "contains"
useSpatialManager_file -.-> loadedCellsKey : "contains"
memoizedLoadedCells[Function: memoizedLoadedCells]
useSpatialManager_file -.-> memoizedLoadedCells : "contains"
useSpatialManager_file -.-> cleanup : "contains"
setupCameraListeners[Function: setupCameraListeners]
useSpatialManager_file -.-> setupCameraListeners : "contains"
handleCameraMove[Function: handleCameraMove]
useSpatialManager_file -.-> handleCameraMove : "contains"
addObjectToSpatialSystemWrapper[Function: addObjectToSpatialSystemWrapper]
useSpatialManager_file -.-> addObjectToSpatialSystemWrapper : "contains"
moveObjectInSpatialSystemWrapper[Function: moveObjectInSpatialSystemWrapper]
useSpatialManager_file -.-> moveObjectInSpatialSystemWrapper : "contains"
loadCellWrapper[Function: loadCellWrapper]
useSpatialManager_file -.-> loadCellWrapper : "contains"
updateCameraPositionWrapper[Function: updateCameraPositionWrapper]
useSpatialManager_file -.-> updateCameraPositionWrapper : "contains"
selectObjectsHookState[Function: selectObjectsHookState]
useObjects_file -.-> selectObjectsHookState : "contains"
useObjects_file -.-> useObjects : "contains"
handleCreateObject[Function: handleCreateObject]
useObjects_file -.-> handleCreateObject : "contains"
handleObjectDelete[Function: handleObjectDelete]
useObjects_file -.-> handleObjectDelete : "contains"
registerTransformingObject[Function: registerTransformingObject]
useObjects_file -.-> registerTransformingObject : "contains"
useTextureUpdater_file -.-> useTextureUpdater : "contains"
updateTexture[Function: updateTexture]
useTextureUpdater_file -.-> updateTexture : "contains"
useTimeoutManager_file -.-> useTimeoutManager : "contains"
setNamedTimeout[Function: setNamedTimeout]
useTimeoutManager_file -.-> setNamedTimeout : "contains"
clearNamedTimeout[Function: clearNamedTimeout]
useTimeoutManager_file -.-> clearNamedTimeout : "contains"
clearAllTimeouts[Function: clearAllTimeouts]
useTimeoutManager_file -.-> clearAllTimeouts : "contains"
hasActiveTimeout[Function: hasActiveTimeout]
useTimeoutManager_file -.-> hasActiveTimeout : "contains"
getTimeoutId[Function: getTimeoutId]
useTimeoutManager_file -.-> getTimeoutId : "contains"
addSharedSpaceReference[Function: addSharedSpaceReference]
sharedSpacesService -.-> addSharedSpaceReference : "contains"
removeSharedSpaceReference[Function: removeSharedSpaceReference]
sharedSpacesService -.-> removeSharedSpaceReference : "contains"
getSharedSpacesForUser[Function: getSharedSpacesForUser]
sharedSpacesService -.-> getSharedSpacesForUser : "contains"
removeAllSharedReferences[Function: removeAllSharedReferences]
sharedSpacesService -.-> removeAllSharedReferences : "contains"
sharedSpacesService -.-> sharedSpacesCache : "contains"
sharedSpacesService -.-> sharedSpacesCacheSet : "contains"
sharedSpacesService -.-> isSharedSpace : "contains"
sharedSpacesService -.-> checkSpaceExists : "contains"
sharedSpacesService -.-> registerSharedSpaceFromUrl : "contains"
sharedSpacesService -.-> getSpaceOwner : "contains"
sharedSpacesService -.-> findSpaceOwner : "contains"
sharedSpacesService -.-> urlParams : "contains"
sharedSpacesService -.-> params : "contains"
useWindowSize_file -.-> useWindowSize : "contains"
handleResize[Function: handleResize]
useWindowSize_file -.-> handleResize : "contains"
authService -.-> signInUser : "contains"
authService -.-> completeRedirectSignIn : "contains"
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
githubRepoService -.-> getTreeSitterLanguage : "contains"
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
githubRepoService -.-> addVariableDecl : "contains"
githubRepoService -.-> trackRelativeSource : "contains"
githubRepoService -.-> importBindings : "contains"
githubRepoService -.-> traversePythonSource : "contains"
githubRepoService -.-> localNames : "contains"
githubRepoService -.-> traverseVueSource : "contains"
githubRepoService -.-> generateMerfolkFromRepository : "contains"
githubRepoService -.-> componentFunctions : "contains"
githubRepoService -.-> componentFuncDisplayNames : "contains"
githubRepoService -.-> funcIdCounters : "contains"
githubRepoService -.-> allocateFuncId : "contains"
githubRepoService -.-> componentRelationships : "contains"
githubRepoService -.-> componentToFile : "contains"
githubRepoService -.-> componentImportSources : "contains"
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
githubRepoService -.-> apiEndpoints : "contains"
githubRepoService -.-> dbModels : "contains"
githubRepoService -.-> dbModelUsers : "contains"
githubRepoService -.-> authGuards : "contains"
githubRepoService -.-> eventEmitters : "contains"
githubRepoService -.-> eventListeners : "contains"
githubRepoService -.-> errorBoundaries : "contains"
githubRepoService -.-> suspenseBoundaries : "contains"
githubRepoService -.-> sharedInterfaces : "contains"
githubRepoService -.-> interfaceUsages : "contains"
githubRepoService -.-> traversedBodies : "contains"
githubRepoService -.-> traverse : "contains"
githubRepoService -.-> isMiddlewareParams : "contains"
githubRepoService -.-> knownContainers : "contains"
githubRepoService -.-> componentsSetForResolve : "contains"
githubRepoService -.-> fileToComponent : "contains"
githubRepoService -.-> generateMerfolkMarkdown : "contains"
githubRepoService -.-> ENTRY_POINT_COMPONENT_NAMES : "contains"
githubRepoService -.-> isValidComponentName : "contains"
githubRepoService -.-> storesSet : "contains"
githubRepoService -.-> servicesSet : "contains"
githubRepoService -.-> classesSet : "contains"
githubRepoService -.-> constantsSet : "contains"
githubRepoService -.-> variablesSet : "contains"
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
githubRepoService -.-> allEventNames : "contains"
githubRepoService -.-> ifaceOnlyContainers : "contains"
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
imageOps -.-> imageDataToTensor : "contains"
imageOps -.-> letterboxToImageData : "contains"
imageOps -.-> extractRotatedRoi : "contains"
imageOps -.-> roiToImage : "contains"
csvDiagramService -.-> parseCsv : "contains"
csvDiagramService -.-> splitCsvLine : "contains"
csvDiagramService -.-> isNumericColumn : "contains"
csvDiagramService -.-> parseNumeric : "contains"
csvDiagramService -.-> detectColumns : "contains"
csvDiagramService -.-> filterAggregateRows : "contains"
csvDiagramService -.-> buildGroups : "contains"
csvDiagramService -.-> groups : "contains"
csvDiagramService -.-> layoutGroup : "contains"
csvDiagramService -.-> computeBounds : "contains"
csvDiagramService -.-> getCameraBasePosition : "contains"
csvDiagramService -.-> processCsvFile : "contains"
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
centralizedBroadcastManager_file -.-> dummyUnsubscribe : "contains"
centralizedBroadcastManager_file -.-> centralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> subscribePlaneToBroadcasts : "contains"
centralizedBroadcastManager_file -.-> getBroadcastManagerDebugInfo : "contains"
centralizedBroadcastManager_file -.-> cleanupBroadcastManager : "contains"
connectionPositionResolver -.-> resolveConnectionPositions : "contains"
connectionPositionResolver -.-> resolveConnectionEndpoint : "contains"
connectionPositionResolver -.-> connectionNeedsPositionResolution : "contains"
connectionPositionResolver -.-> positionsEqual : "contains"
githubIssuesService -.-> enc : "contains"
githubIssuesService -.-> githubFetch : "contains"
githubIssuesService -.-> createIssue : "contains"
githubIssuesService -.-> assignCopilotToIssue : "contains"
githubIssuesService -.-> getIssue : "contains"
githubIssuesService -.-> findPullRequestForIssue : "contains"
githubIssuesService -.-> approvePullRequest : "contains"
githubIssuesService -.-> mergePullRequest : "contains"
githubIssuesService -.-> getPullRequest : "contains"
githubIssuesService -.-> getRepoInfo : "contains"
githubIssuesService -.-> getBranchRef : "contains"
githubIssuesService -.-> createBranchRef : "contains"
githubIssuesService -.-> deleteBranchRef : "contains"
githubIssuesService -.-> getFileContents : "contains"
githubIssuesService -.-> createFileOnBranch : "contains"
githubIssuesService -.-> createPullRequest : "contains"
githubIssuesService -.-> addComment : "contains"
githubIssuesService -.-> enableAutoMerge : "contains"
githubIssuesService -.-> revertCommit : "contains"
globalSubscriptionManager -.-> globalSubscriptions : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> decrementSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
globalSubscriptionManager -.-> periodicCleanup : "contains"
anchors -.-> getAnchors : "contains"
processMethods -.-> allNodes : "contains"
processMethods -.-> allConnections : "contains"
processMethods -.-> nodeToObjectIdMap : "contains"
processMethods -.-> reader : "contains"
connectionMethods -.-> connectionTags : "contains"
connectionMethods -.-> addTag : "contains"
connectionMethods -.-> existingConnectionPairs : "contains"
connectionMethods -.-> getFaceForObject : "contains"
connectionMethods -.-> computeFaceWorldPosition : "contains"
connectionMethods -.-> calculateDodecahedronFaceCenter : "contains"
connectionMethods -.-> connectionsByCell : "contains"
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
hierarchyMethods -.-> isCubeChild : "contains"
hierarchyMethods -.-> isContainerType : "contains"
containerMethods -.-> hierarchyComponents : "contains"
containerMethods -.-> markHierarchyReachable : "contains"
containerMethods -.-> groupedByType : "contains"
containerMethods -.-> createContainerForGroup : "contains"
containerMethods -.-> existingGroupTypes : "contains"
containerMethods -.-> reachableFromRootModules : "contains"
containerMethods -.-> markReachable : "contains"
containerMethods -.-> componentsWithChildContainers : "contains"
containerMethods -.-> nodesInChildContainers : "contains"
containerMethods -.-> markDescendantsInChildContainers : "contains"
containerMethods -.-> includableTypes : "contains"
containerMethods -.-> nodesWithContainers : "contains"
containerMethods -.-> visited : "contains"
containerMethods -.-> adjustNodeAndDescendants : "contains"
containerMethods -.-> containerDimensions : "contains"
containerMethods -.-> containerEligibleTypes : "contains"
containerMethods -.-> existingParentNodeIds : "contains"
handTrackingService -.-> ensureWorker : "contains"
handTrackingService -.-> openCamera : "contains"
handTrackingService -.-> onLoaded : "contains"
handTrackingService -.-> onError : "contains"
handTrackingService -.-> cleanup : "contains"
handTrackingService -.-> runOnce : "contains"
handTrackingService -.-> scheduleNext : "contains"
handTrackingService -.-> onFrame : "contains"
handTrackingService -.-> onVisibilityChange : "contains"
handTrackingService -.-> teardownCamera : "contains"
handTrackingService -.-> startHandTracking : "contains"
handTrackingService -.-> stopHandTracking : "contains"
palmDecode -.-> sigmoid : "contains"
palmDecode -.-> decodePalmDetections : "contains"
palmDecode -.-> kps : "contains"
palmDecode -.-> iou : "contains"
palmDecode -.-> detectionToRoi : "contains"
objectMethods -.-> processedNodes : "contains"
objectMethods -.-> existingNodeIdMap : "contains"
objectMethods -.-> calculateHeaderStyle : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
positionMethods -.-> moveComponentTree : "contains"
positionMethods -.-> getComponentChildren : "contains"
positionMethods -.-> checkOverlap : "contains"
positionMethods -.-> containersByLevel : "contains"
positionMethods -.-> collectAllDescendants : "contains"
positionMethods -.-> allDescendants : "contains"
positionMethods -.-> resolveNodeMove : "contains"
positionMethods -.-> reachableFromRootModules : "contains"
positionMethods -.-> markReachable : "contains"
positionMethods -.-> componentsWithChildContainers : "contains"
positionMethods -.-> nodesInChildContainers : "contains"
positionMethods -.-> markDescendantsInChildContainers : "contains"
positionMethods -.-> includableTypes : "contains"
positionMethods -.-> groupedByType : "contains"
positionMethods -.-> calculateNodeScaleFromChildren : "contains"
positionMethods -.-> calculateGroupSpacing : "contains"
positionMethods -.-> calculateGroupBounds : "contains"
positionMethods -.-> positionGroup : "contains"
presenceService -.-> setUserPresence : "contains"
presenceService -.-> getGuestId : "contains"
presenceService -.-> setGuestPresence : "contains"
presenceService -.-> subscribeToSpacePresence : "contains"
runtimeScanService -.-> validateScanUrl : "contains"
runtimeScanService -.-> generateMerfolkFromRuntimeTrace : "contains"
runtimeScanService -.-> sanitizeId : "contains"
runtimeScanService -.-> scanWebsiteAndGenerateDiagram : "contains"
runtimeScanService -.-> markdownBlob : "contains"
runtimeScanService -.-> markdownFile : "contains"
runtimeScanService -.-> simulateProgress : "contains"
screenRecordingService -.-> rawBlob : "contains"
screenRecordingService -.-> screenRecorder : "contains"
resourceCleanupService_file -.-> _disposedWeakSet : "contains"
resourceCleanupService_file -.-> resourceCleanupService : "contains"
markdownDiagramService_file -.-> markdownDiagramService : "contains"
pipelineOrchestrator -.-> getGithubToken : "contains"
pipelineOrchestrator -.-> processTask : "contains"
pipelineOrchestrator -.-> pollPR : "contains"
pipelineOrchestrator -.-> startPipeline : "contains"
pipelineOrchestrator -.-> getLatestTasks : "contains"
pipelineOrchestrator -.-> processed : "contains"
pipelineOrchestrator -.-> checkResume : "contains"
pipelineOrchestrator -.-> pausePipeline : "contains"
pipelineOrchestrator -.-> resumePipeline : "contains"
pipelineOrchestrator -.-> reconcilePendingTasks : "contains"
pipelineOrchestrator -.-> repoSlugsToReposition : "contains"
pipelineOrchestrator -.-> stopPipeline : "contains"
repoContainerService -.-> generateId : "contains"
repoContainerService -.-> getCellId : "contains"
repoContainerService -.-> computeGridLayout : "contains"
repoContainerService -.-> computeContainerScale : "contains"
repoContainerService -.-> getGridCellPosition : "contains"
repoContainerService -.-> repositionAllTasks : "contains"
repoContainerService -.-> dividerIds : "contains"
repoContainerService -.-> activeIds : "contains"
repoContainerService -.-> mergedIds : "contains"
repoContainerService -.-> newCreatedIds : "contains"
repoContainerService -.-> findRepoContainer : "contains"
repoContainerService -.-> getAllRepoContainers : "contains"
repoContainerService -.-> assignRepoSlugToOrphanTasks : "contains"
repoContainerService -.-> orphanIds : "contains"
repoContainerService -.-> countRepoContainers : "contains"
repoContainerService -.-> createRepoContainer : "contains"
repoContainerService -.-> repositionIncomingTasks : "contains"
repoContainerService -.-> unpositionedIds : "contains"
repoContainerService -.-> renumberMap : "contains"
repoContainerService -.-> rewriteHeader : "contains"
repoContainerService -.-> createTaskObjects : "contains"
repoContainerService -.-> clearRepoTasks : "contains"
repoContainerService -.-> taskIds : "contains"
repoContainerService -.-> updatedById : "contains"
repoContainerService -.-> toggleTaskExpansion : "contains"
organizationService -.-> createOrganization : "contains"
organizationService -.-> getUserOrganizations : "contains"
organizationService -.-> getOrganizationById : "contains"
organizationService -.-> getOrganizationMembers : "contains"
organizationService -.-> getMemberCount : "contains"
organizationService -.-> isOrganizationAdmin : "contains"
organizationService -.-> inviteUserToOrganization : "contains"
organizationService -.-> getPendingInvitesForUser : "contains"
organizationService -.-> acceptInvite : "contains"
organizationService -.-> declineInvite : "contains"
organizationService -.-> removeMemberFromOrganization : "contains"
organizationService -.-> leaveOrganization : "contains"
organizationService -.-> updateOrganizationPlan : "contains"
organizationService -.-> deleteOrganization : "contains"
pipelineTaskService -.-> getStatusColor : "contains"
pipelineTaskService -.-> getStatusLabel : "contains"
pipelineTaskService -.-> isTaskObject : "contains"
pipelineTaskService -.-> getPipelineTasks : "contains"
pipelineTaskService -.-> getNextQueuedTask : "contains"
pipelineTaskService -.-> getNextActionableTask : "contains"
pipelineTaskService -.-> getPipelineTasksForRepo : "contains"
pipelineTaskService -.-> getRepoSlugsFromTasks : "contains"
pipelineTaskService -.-> slugs : "contains"
pipelineTaskService -.-> updateTaskStatus : "contains"
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
spatialObjectsService -.-> cleanupSpatialObjectSubscriptions : "contains"
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
storageService -.-> getStorageInstance : "contains"
storageService -.-> ALLOWED_IMAGE_TYPES : "contains"
storageService -.-> uploadFileGeneric : "contains"
storageService -.-> uploadImageToStorage : "contains"
storageService -.-> uploadModelToStorage : "contains"
storageService -.-> uploadMarkdownToStorage : "contains"
storageService -.-> blob : "contains"
streamlinedSpatialPartitioning -.-> getStreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> initializeStreamlinedSpatialPartitioning : "contains"
streamlinedSpatialPartitioning -.-> benchmarkStreamlinedSystem : "contains"
streamlinedSpatialPartitioning -.-> manager : "contains"
webRservice -.-> activeStreams : "contains"
webRservice -.-> getRTCConfiguration : "contains"
webRservice -.-> initWebRTC : "contains"
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
unifiedCacheManager_file -.-> cacheStats : "contains"
unifiedCacheManager_file -.-> unifiedCache : "contains"
unifiedCacheManager_file -.-> unifiedCacheManager : "contains"
spacesService -.-> getSpaceById : "contains"
spacesService -.-> createSpace : "contains"
spacesService -.-> getOrCreateDefaultSpace : "contains"
spacesService -.-> migrateToDefaultSpace : "contains"
spacesService -.-> getUserSpaces : "contains"
spacesService -.-> deleteSpace : "contains"
spacesService -.-> hasSpaceAccess : "contains"
spacesService -.-> getPublicSpaceMetadata : "contains"
line_frag_glsl[Function: line_frag_glsl]
shader_shaders -.-> line_frag_glsl : "contains"
line_vert_glsl[Function: line_vert_glsl]
shader_shaders -.-> line_vert_glsl : "contains"
sharingService -.-> generateSharingUrl : "contains"
sharingService -.-> sharingUrl : "contains"
sharingService -.-> getSharedSpaceInfo : "contains"
colorPickerStore -.-> useColorPickerStore : "contains"
getCubeSelector[Function: getCubeSelector]
cubeStore -.-> getCubeSelector : "contains"
getCubeFaceColorSelector[Function: getCubeFaceColorSelector]
cubeStore -.-> getCubeFaceColorSelector : "contains"
getCubeSelectedFaceSelector[Function: getCubeSelectedFaceSelector]
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
getCubeFaceStateSelector[Function: getCubeFaceStateSelector]
cubeStore -.-> getCubeFaceStateSelector : "contains"
cubeStore -.-> useCubeStore : "contains"
earthSettingsStore -.-> useEarthSettingsStore : "contains"
authStore -.-> useAuthStore : "contains"
monitorConnection[Function: monitorConnection]
authStore -.-> monitorConnection : "contains"
connectionHandler[Function: connectionHandler]
authStore -.-> connectionHandler : "contains"
handleUrlAuthLocal[Function: handleUrlAuthLocal]
authStore -.-> handleUrlAuthLocal : "contains"
initAuth[Function: initAuth]
authStore -.-> initAuth : "contains"
dodecahedronStore -.-> useDodecahedronStore : "contains"
animatedConnectionLineStore -.-> useAnimatedConnectionLineStore : "contains"
diagramStore -.-> useDiagramStore : "contains"
_buildConnectionsByObjectId[Function: _buildConnectionsByObjectId]
connectionStore -.-> _buildConnectionsByObjectId : "contains"
connectionStore -.-> useConnectionStore : "contains"
getCellCoords[Function: getCellCoords]
connectionStore -.-> getCellCoords : "contains"
getCellIdFromCoords[Function: getCellIdFromCoords]
connectionStore -.-> getCellIdFromCoords : "contains"
pipelineStore -.-> usePipelineStore : "contains"
faceIndicatorStore -.-> useFaceIndicatorStore : "contains"
objectsStore -.-> useObjectsStore : "contains"
numericHash[Function: numericHash]
objectsStore -.-> numericHash : "contains"
stringHash[Function: stringHash]
objectsStore -.-> stringHash : "contains"
handTrackingStore -.-> useHandTrackingStore : "contains"
calculateLODLevel[Function: calculateLODLevel]
lodStore -.-> calculateLODLevel : "contains"
calculateParentLODLevel[Function: calculateParentLODLevel]
lodStore -.-> calculateParentLODLevel : "contains"
lodStore -.-> useLODStore : "contains"
planeStore -.-> usePlaneStore : "contains"
indicatorsStore -.-> useIndicatorsStore : "contains"
faceStore -.-> useFaceStore : "contains"
textInputStore -.-> useTextInputStore : "contains"
useStoreInitialization[Function: useStoreInitialization]
storeUtils -.-> useStoreInitialization : "contains"
useCubeSelectors[Function: useCubeSelectors]
storeUtils -.-> useCubeSelectors : "contains"
useCubeActions[Function: useCubeActions]
storeUtils -.-> useCubeActions : "contains"
usePlaneSelectors[Function: usePlaneSelectors]
storeUtils -.-> usePlaneSelectors : "contains"
usePlaneActions[Function: usePlaneActions]
storeUtils -.-> usePlaneActions : "contains"
useGlobalStoreUtils[Function: useGlobalStoreUtils]
storeUtils -.-> useGlobalStoreUtils : "contains"
clearAllSelections[Function: clearAllSelections]
storeUtils -.-> clearAllSelections : "contains"
resetAllStores[Function: resetAllStores]
storeUtils -.-> resetAllStores : "contains"
transformControlsStore -.-> useTransformControlsStore : "contains"
textObjectStore -.-> useTextObjectStore : "contains"
screenShareStore -.-> useScreenShareStore : "contains"
publicSpaceStore -.-> usePublicSpaceStore : "contains"
tetrahedronStore -.-> useTetrahedronStore : "contains"
spatialManagerStore -.-> useSpatialManagerStore : "contains"
spaceManagerStore -.-> useSpaceManagerStore : "contains"
textAtlasStore -.-> useTextAtlasStore : "contains"
validateConnection[Function: validateConnection]
connectionUtils -.-> validateConnection : "contains"
getIndicatorId[Function: getIndicatorId]
connectionUtils -.-> getIndicatorId : "contains"
getConnectionKey[Function: getConnectionKey]
connectionUtils -.-> getConnectionKey : "contains"
prepareTextObjectIndicator[Function: prepareTextObjectIndicator]
connectionUtils -.-> prepareTextObjectIndicator : "contains"
objectsAreConnectedInStore[Function: objectsAreConnectedInStore]
connectionUtils -.-> objectsAreConnectedInStore : "contains"
getConnectionsForObject[Function: getConnectionsForObject]
connectionUtils -.-> getConnectionsForObject : "contains"
createConnectionInStore[Function: createConnectionInStore]
connectionUtils -.-> createConnectionInStore : "contains"
updateConnectionPositionsInStore[Function: updateConnectionPositionsInStore]
connectionUtils -.-> updateConnectionPositionsInStore : "contains"
removeConnectionsForObject[Function: removeConnectionsForObject]
connectionUtils -.-> removeConnectionsForObject : "contains"
isInConnectionCreationMode[Function: isInConnectionCreationMode]
connectionUtils -.-> isInConnectionCreationMode : "contains"
startConnectionCreation[Function: startConnectionCreation]
connectionUtils -.-> startConnectionCreation : "contains"
completeConnectionCreation[Function: completeConnectionCreation]
connectionUtils -.-> completeConnectionCreation : "contains"
cancelConnectionCreation[Function: cancelConnectionCreation]
connectionUtils -.-> cancelConnectionCreation : "contains"
uiOverlayStore -.-> useUIOverlayStore : "contains"
setCellBoundariesVisible[Function: setCellBoundariesVisible]
uiOverlayStore -.-> setCellBoundariesVisible : "contains"
loadEarthHeightmap[Function: loadEarthHeightmap]
earthHeightmapLoader -.-> loadEarthHeightmap : "contains"
img[Function: img]
earthHeightmapLoader -.-> img : "contains"
animatedMaterials[Function: animatedMaterials]
animationUtils -.-> animatedMaterials : "contains"
registerMaterial[Function: registerMaterial]
animationUtils -.-> registerMaterial : "contains"
unregisterMaterial[Function: unregisterMaterial]
animationUtils -.-> unregisterMaterial : "contains"
setAnimationSpeed[Function: setAnimationSpeed]
animationUtils -.-> setAnimationSpeed : "contains"
startAnimationLoop[Function: startAnimationLoop]
animationUtils -.-> startAnimationLoop : "contains"
animate[Function: animate]
animationUtils -.-> animate : "contains"
stopAnimationLoop[Function: stopAnimationLoop]
animationUtils -.-> stopAnimationLoop : "contains"
initAnimationSystem[Function: initAnimationSystem]
animationUtils -.-> initAnimationSystem : "contains"
_avg3[Function: _avg3]
facePositionUtils -.-> _avg3 : "contains"
calculateFacePosition[Function: calculateFacePosition]
facePositionUtils -.-> calculateFacePosition : "contains"
setHeightmapData[Function: setHeightmapData]
earthTerrainGenerator -.-> setHeightmapData : "contains"
samplePixel[Function: samplePixel]
earthTerrainGenerator -.-> samplePixel : "contains"
pixelToElevation[Function: pixelToElevation]
earthTerrainGenerator -.-> pixelToElevation : "contains"
getElevationFromHeightmap[Function: getElevationFromHeightmap]
earthTerrainGenerator -.-> getElevationFromHeightmap : "contains"
getElevationFromModel[Function: getElevationFromModel]
earthTerrainGenerator -.-> getElevationFromModel : "contains"
getElevation[Function: getElevation]
earthTerrainGenerator -.-> getElevation : "contains"
getColorForElevation[Function: getColorForElevation]
earthTerrainGenerator -.-> getColorForElevation : "contains"
generateGlobeGeometry[Function: generateGlobeGeometry]
earthTerrainGenerator -.-> generateGlobeGeometry : "contains"
positions[Function: positions]
earthTerrainGenerator -.-> positions : "contains"
elevations[Function: elevations]
earthTerrainGenerator -.-> elevations : "contains"
colorGroups[Function: colorGroups]
earthTerrainGenerator -.-> colorGroups : "contains"
addLine[Function: addLine]
earthTerrainGenerator -.-> addLine : "contains"
posAt[Function: posAt]
earthTerrainGenerator -.-> posAt : "contains"
parsedColorCache[Function: parsedColorCache]
earthTerrainGenerator -.-> parsedColorCache : "contains"
getParsedScheme[Function: getParsedScheme]
earthTerrainGenerator -.-> getParsedScheme : "contains"
getColorRGB[Function: getColorRGB]
earthTerrainGenerator -.-> getColorRGB : "contains"
generateGlobeMesh[Function: generateGlobeMesh]
earthTerrainGenerator -.-> generateGlobeMesh : "contains"
colors[Function: colors]
earthTerrainGenerator -.-> colors : "contains"
indices[Function: indices]
earthTerrainGenerator -.-> indices : "contains"
generateLocalGlobeGeometry[Function: generateLocalGlobeGeometry]
earthTerrainGenerator -.-> generateLocalGlobeGeometry : "contains"
generateLocalGlobeMesh[Function: generateLocalGlobeMesh]
earthTerrainGenerator -.-> generateLocalGlobeMesh : "contains"
webcamStreamStore -.-> useWebcamStreamStore : "contains"
leftChild[Function: leftChild]
bvhRaycasting -.-> leftChild : "contains"
rightChild[Function: rightChild]
bvhRaycasting -.-> rightChild : "contains"
initBVHRaycasting[Function: initBVHRaycasting]
bvhRaycasting -.-> initBVHRaycasting : "contains"
getBVH[Function: getBVH]
bvhRaycasting -.-> getBVH : "contains"
updateBVHObjects[Function: updateBVHObjects]
bvhRaycasting -.-> updateBVHObjects : "contains"
bvhIntersectObjects[Function: bvhIntersectObjects]
bvhRaycasting -.-> bvhIntersectObjects : "contains"
getBVHStats[Function: getBVHStats]
bvhRaycasting -.-> getBVHStats : "contains"
updateLODLevels[Function: updateLODLevels]
bvhRaycasting -.-> updateLODLevels : "contains"
registerObjectRelationships[Function: registerObjectRelationships]
bvhRaycasting -.-> registerObjectRelationships : "contains"
logAnimation[Function: logAnimation]
debugUtils -.-> logAnimation : "contains"
forceAnimateConnection[Function: forceAnimateConnection]
debugUtils -.-> forceAnimateConnection : "contains"
shouldAnimateConnection[Function: shouldAnimateConnection]
debugUtils -.-> shouldAnimateConnection : "contains"
recordFrameTime[Function: recordFrameTime]
debugUtils -.-> recordFrameTime : "contains"
recordStateUpdate[Function: recordStateUpdate]
debugUtils -.-> recordStateUpdate : "contains"
getPerfStats[Function: getPerfStats]
debugUtils -.-> getPerfStats : "contains"
resetPerfStats[Function: resetPerfStats]
debugUtils -.-> resetPerfStats : "contains"
handleFaceIndicatorClick[Function: handleFaceIndicatorClick]
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
getIdFromIndicator[Function: getIdFromIndicator]
faceIndicatorUtils -.-> getIdFromIndicator : "contains"
frameCounter[Function: frameCounter]
frameCounter_file -.-> frameCounter : "contains"
getIsInitialLoading[Function: getIsInitialLoading]
loadingState -.-> getIsInitialLoading : "contains"
setIsInitialLoading[Function: setIsInitialLoading]
loadingState -.-> setIsInitialLoading : "contains"
_frameTimeTracker[Function: _frameTimeTracker]
renderWorkScheduler -.-> _frameTimeTracker : "contains"
_resetForNextFrame[Function: _resetForNextFrame]
renderWorkScheduler -.-> _resetForNextFrame : "contains"
acquireBudget[Function: acquireBudget]
renderWorkScheduler -.-> acquireBudget : "contains"
setFrameBudget[Function: setFrameBudget]
renderWorkScheduler -.-> setFrameBudget : "contains"
getFrameBudget[Function: getFrameBudget]
renderWorkScheduler -.-> getFrameBudget : "contains"
notifyCameraMove[Function: notifyCameraMove]
renderWorkScheduler -.-> notifyCameraMove : "contains"
isCameraMoving[Function: isCameraMoving]
renderWorkScheduler -.-> isCameraMoving : "contains"
isCameraMovingRapidly[Function: isCameraMovingRapidly]
renderWorkScheduler -.-> isCameraMovingRapidly : "contains"
isFrameBudgetExhausted[Function: isFrameBudgetExhausted]
renderWorkScheduler -.-> isFrameBudgetExhausted : "contains"
getSmoothedFrameTime[Function: getSmoothedFrameTime]
renderWorkScheduler -.-> getSmoothedFrameTime : "contains"
calculateAxisSnap[Function: calculateAxisSnap]
snappingUtils -.-> calculateAxisSnap : "contains"
distanceToAxis[Function: distanceToAxis]
snappingUtils -.-> distanceToAxis : "contains"
projectPointOntoAxis[Function: projectPointOntoAxis]
snappingUtils -.-> projectPointOntoAxis : "contains"
intersectionCache[Function: intersectionCache]
pathfindingUtils -.-> intersectionCache : "contains"
pathCache[Function: pathCache]
pathfindingUtils -.-> pathCache : "contains"
objectPositionCache[Function: objectPositionCache]
pathfindingUtils -.-> objectPositionCache : "contains"
precomputedResults[Function: precomputedResults]
pathfindingUtils -.-> precomputedResults : "contains"
invalidatePathfindingCaches[Function: invalidatePathfindingCaches]
pathfindingUtils -.-> invalidatePathfindingCaches : "contains"
checkObjectMovement[Function: checkObjectMovement]
pathfindingUtils -.-> checkObjectMovement : "contains"
cleanCaches[Function: cleanCaches]
pathfindingUtils -.-> cleanCaches : "contains"
roundForCache[Function: roundForCache]
pathfindingUtils -.-> roundForCache : "contains"
lineIntersectsBoundingBox[Function: lineIntersectsBoundingBox]
pathfindingUtils -.-> lineIntersectsBoundingBox : "contains"
generateCacheKey[Function: generateCacheKey]
pathfindingUtils -.-> generateCacheKey : "contains"
havePositionsChanged[Function: havePositionsChanged]
pathfindingUtils -.-> havePositionsChanged : "contains"
checkLineIntersection[Function: checkLineIntersection]
pathfindingUtils -.-> checkLineIntersection : "contains"
d[Function: d]
pathfindingUtils -.-> d : "contains"
generateCurvedPath[Function: generateCurvedPath]
pathfindingUtils -.-> generateCurvedPath : "contains"
checkCurveIntersections[Function: checkCurveIntersections]
pathfindingUtils -.-> checkCurveIntersections : "contains"
generateMultiSegmentPath[Function: generateMultiSegmentPath]
pathfindingUtils -.-> generateMultiSegmentPath : "contains"
precomputeCacheKey[Function: precomputeCacheKey]
pathfindingUtils -.-> precomputeCacheKey : "contains"
getPrecomputedResult[Function: getPrecomputedResult]
pathfindingUtils -.-> getPrecomputedResult : "contains"
computeConnectionPath[Function: computeConnectionPath]
pathfindingUtils -.-> computeConnectionPath : "contains"
precomputePathsBatch[Function: precomputePathsBatch]
pathfindingUtils -.-> precomputePathsBatch : "contains"
requestsById[Function: requestsById]
pathfindingUtils -.-> requestsById : "contains"
objectVirtualizer[Function: objectVirtualizer]
objectVirtualization -.-> objectVirtualizer : "contains"
calculateMidpoint[Function: calculateMidpoint]
positionUtils -.-> calculateMidpoint : "contains"
calculateMidpointVector[Function: calculateMidpointVector]
positionUtils -.-> calculateMidpointVector : "contains"
lerp[Function: lerp]
positionUtils -.-> lerp : "contains"
checkPositionJitter[Function: checkPositionJitter]
positionUtils -.-> checkPositionJitter : "contains"
handleObjectMove[Function: handleObjectMove]
objectUpdateHandlers -.-> handleObjectMove : "contains"
handleObjectUpdate[Function: handleObjectUpdate]
objectUpdateHandlers -.-> handleObjectUpdate : "contains"
gpuTracker[Function: gpuTracker]
gpuResourceTracker -.-> gpuTracker : "contains"
terrainTileCache -.-> cache : "contains"
pending[Function: pending]
terrainTileCache -.-> pending : "contains"
setOnTilesLoaded[Function: setOnTilesLoaded]
terrainTileCache -.-> setOnTilesLoaded : "contains"
tileKey[Function: tileKey]
terrainTileCache -.-> tileKey : "contains"
latLonToTile[Function: latLonToTile]
terrainTileCache -.-> latLonToTile : "contains"
tileBounds[Function: tileBounds]
terrainTileCache -.-> tileBounds : "contains"
fetchAndDecode[Function: fetchAndDecode]
terrainTileCache -.-> fetchAndDecode : "contains"
canvas[Function: canvas]
terrainTileCache -.-> canvas : "contains"
terrainTileCache -.-> elevations : "contains"
drainQueue[Function: drainQueue]
terrainTileCache -.-> drainQueue : "contains"
enqueueTile[Function: enqueueTile]
terrainTileCache -.-> enqueueTile : "contains"
prefetchArea[Function: prefetchArea]
terrainTileCache -.-> prefetchArea : "contains"
getCachedElevation[Function: getCachedElevation]
terrainTileCache -.-> getCachedElevation : "contains"
getCacheSize[Function: getCacheSize]
terrainTileCache -.-> getCacheSize : "contains"
throttle[Function: throttle]
unifiedPerformanceUtils -.-> throttle : "contains"
debounce[Function: debounce]
unifiedPerformanceUtils -.-> debounce : "contains"
unifiedPerformanceUtils -.-> later : "contains"
measurePerformance[Function: measurePerformance]
unifiedPerformanceUtils -.-> measurePerformance : "contains"
scheduleWork[Function: scheduleWork]
unifiedPerformanceUtils -.-> scheduleWork : "contains"
memoize[Function: memoize]
unifiedPerformanceUtils -.-> memoize : "contains"
unifiedPerformanceUtils -.-> cache : "contains"
createCacheKey[Function: createCacheKey]
unifiedPerformanceUtils -.-> createCacheKey : "contains"
unifiedPerformanceUtils -.-> memoized : "contains"
trackLCP[Function: trackLCP]
unifiedPerformanceUtils -.-> trackLCP : "contains"
observer[Function: observer]
unifiedPerformanceUtils -.-> observer : "contains"
compute_lod_updates[Function: compute_lod_updates]
worker_hoverchart_wasm -.-> compute_lod_updates : "contains"
fill_edge_buffers[Function: fill_edge_buffers]
worker_hoverchart_wasm -.-> fill_edge_buffers : "contains"
frustum_cull_connections[Function: frustum_cull_connections]
worker_hoverchart_wasm -.-> frustum_cull_connections : "contains"
get_scratch_color_view[Function: get_scratch_color_view]
worker_hoverchart_wasm -.-> get_scratch_color_view : "contains"
get_scratch_end_view[Function: get_scratch_end_view]
worker_hoverchart_wasm -.-> get_scratch_end_view : "contains"
get_scratch_start_view[Function: get_scratch_start_view]
worker_hoverchart_wasm -.-> get_scratch_start_view : "contains"
__wbg_get_imports[Function: __wbg_get_imports]
worker_hoverchart_wasm -.-> __wbg_get_imports : "contains"
getArrayF32FromWasm0[Function: getArrayF32FromWasm0]
worker_hoverchart_wasm -.-> getArrayF32FromWasm0 : "contains"
getArrayU32FromWasm0[Function: getArrayU32FromWasm0]
worker_hoverchart_wasm -.-> getArrayU32FromWasm0 : "contains"
getArrayU8FromWasm0[Function: getArrayU8FromWasm0]
worker_hoverchart_wasm -.-> getArrayU8FromWasm0 : "contains"
getFloat32ArrayMemory0[Function: getFloat32ArrayMemory0]
worker_hoverchart_wasm -.-> getFloat32ArrayMemory0 : "contains"
getStringFromWasm0[Function: getStringFromWasm0]
worker_hoverchart_wasm -.-> getStringFromWasm0 : "contains"
getUint32ArrayMemory0[Function: getUint32ArrayMemory0]
worker_hoverchart_wasm -.-> getUint32ArrayMemory0 : "contains"
getUint8ArrayMemory0[Function: getUint8ArrayMemory0]
worker_hoverchart_wasm -.-> getUint8ArrayMemory0 : "contains"
passArray8ToWasm0[Function: passArray8ToWasm0]
worker_hoverchart_wasm -.-> passArray8ToWasm0 : "contains"
passArrayF32ToWasm0[Function: passArrayF32ToWasm0]
worker_hoverchart_wasm -.-> passArrayF32ToWasm0 : "contains"
decodeText[Function: decodeText]
worker_hoverchart_wasm -.-> decodeText : "contains"
__wbg_finalize_init[Function: __wbg_finalize_init]
worker_hoverchart_wasm -.-> __wbg_finalize_init : "contains"
__wbg_load[Function: __wbg_load]
worker_hoverchart_wasm -.-> __wbg_load : "contains"
expectedResponseType[Function: expectedResponseType]
worker_hoverchart_wasm -.-> expectedResponseType : "contains"
initSync[Function: initSync]
worker_hoverchart_wasm -.-> initSync : "contains"
__wbg_init[Function: __wbg_init]
worker_hoverchart_wasm -.-> __wbg_init : "contains"
seenObjects[Function: seenObjects]
streamlinedSpatialIndex -.-> seenObjects : "contains"
createStreamlinedSpatialIndex[Function: createStreamlinedSpatialIndex]
streamlinedSpatialIndex -.-> createStreamlinedSpatialIndex : "contains"
benchmarkStreamlined[Function: benchmarkStreamlined]
streamlinedSpatialIndex -.-> benchmarkStreamlined : "contains"
position[Function: position]
streamlinedSpatialIndex -.-> position : "contains"
center[Function: center]
streamlinedSpatialIndex -.-> center : "contains"
initWasmKernels[Function: initWasmKernels]
wasmKernels -.-> initWasmKernels : "contains"
isWasmReady[Function: isWasmReady]
wasmKernels -.-> isWasmReady : "contains"
fillEdgeBuffers[Function: fillEdgeBuffers]
wasmKernels -.-> fillEdgeBuffers : "contains"
getScratchStartView[Function: getScratchStartView]
wasmKernels -.-> getScratchStartView : "contains"
getScratchEndView[Function: getScratchEndView]
wasmKernels -.-> getScratchEndView : "contains"
getScratchColorView[Function: getScratchColorView]
wasmKernels -.-> getScratchColorView : "contains"
computeLodUpdates[Function: computeLodUpdates]
wasmKernels -.-> computeLodUpdates : "contains"
frustumCullConnections[Function: frustumCullConnections]
wasmKernels -.-> frustumCullConnections : "contains"
loadTextureFromFirebaseUrl[Function: loadTextureFromFirebaseUrl]
textureLoader -.-> loadTextureFromFirebaseUrl : "contains"
url[Function: url]
textureLoader -.-> url : "contains"
textureLoader -.-> img : "contains"
loadTextureFromBlob[Function: loadTextureFromBlob]
textureLoader -.-> loadTextureFromBlob : "contains"
page[Function: page]
textAtlas -.-> page : "contains"
isOffscreenCanvasTextSupported[Function: isOffscreenCanvasTextSupported]
textAtlas -.-> isOffscreenCanvasTextSupported : "contains"
c[Function: c]
textAtlas -.-> c : "contains"
textAtlas -.-> seen : "contains"
_switchToSyncAtlas[Function: _switchToSyncAtlas]
textAtlas -.-> _switchToSyncAtlas : "contains"
getGlobalTextAtlas[Function: getGlobalTextAtlas]
textAtlas -.-> getGlobalTextAtlas : "contains"
resetGlobalTextAtlas[Function: resetGlobalTextAtlas]
textAtlas -.-> resetGlobalTextAtlas : "contains"
createAtlasTextMesh[Function: createAtlasTextMesh]
textAtlas -.-> createAtlasTextMesh : "contains"
cleanObject[Function: cleanObject]
unifiedValidationUtils -.-> cleanObject : "contains"
validateRequiredProperties[Function: validateRequiredProperties]
unifiedValidationUtils -.-> validateRequiredProperties : "contains"
validateObjectSchema[Function: validateObjectSchema]
unifiedValidationUtils -.-> validateObjectSchema : "contains"
isValidPosition[Function: isValidPosition]
unifiedValidationUtils -.-> isValidPosition : "contains"
validatePosition[Function: validatePosition]
unifiedValidationUtils -.-> validatePosition : "contains"
validatePositionBounds[Function: validatePositionBounds]
unifiedValidationUtils -.-> validatePositionBounds : "contains"
unifiedValidationUtils -.-> validateConnection : "contains"
validateConnectionData[Function: validateConnectionData]
unifiedValidationUtils -.-> validateConnectionData : "contains"
unifiedValidationUtils -.-> getIndicatorId : "contains"
validateIndicator[Function: validateIndicator]
unifiedValidationUtils -.-> validateIndicator : "contains"
validateFile[Function: validateFile]
unifiedValidationUtils -.-> validateFile : "contains"
validateObjectId[Function: validateObjectId]
unifiedValidationUtils -.-> validateObjectId : "contains"
validateSpaceId[Function: validateSpaceId]
unifiedValidationUtils -.-> validateSpaceId : "contains"
validateUserId[Function: validateUserId]
unifiedValidationUtils -.-> validateUserId : "contains"
validateUrl[Function: validateUrl]
unifiedValidationUtils -.-> validateUrl : "contains"
unifiedValidationUtils -.-> urlObj : "contains"
validateEmail[Function: validateEmail]
unifiedValidationUtils -.-> validateEmail : "contains"
validateArray[Function: validateArray]
unifiedValidationUtils -.-> validateArray : "contains"
validateMultiple[Function: validateMultiple]
unifiedValidationUtils -.-> validateMultiple : "contains"
parseFlowPaths[Function: parseFlowPaths]
worker_markdownLayoutWorker -.-> parseFlowPaths : "contains"
worker_markdownLayoutWorker -.-> addTag : "contains"
stripFlowPathSyntax[Function: stripFlowPathSyntax]
worker_markdownLayoutWorker -.-> stripFlowPathSyntax : "contains"
computeHeaderStyle[Function: computeHeaderStyle]
worker_markdownLayoutWorker -.-> computeHeaderStyle : "contains"
estimateNodeSize[Function: estimateNodeSize]
worker_diagramLayoutWorker -.-> estimateNodeSize : "contains"
isHierarchyConnection[Function: isHierarchyConnection]
worker_diagramLayoutWorker -.-> isHierarchyConnection : "contains"
filterConnections[Function: filterConnections]
worker_diagramLayoutWorker -.-> filterConnections : "contains"
layoutNodes[Function: layoutNodes]
worker_diagramLayoutWorker -.-> layoutNodes : "contains"
computeSize[Function: computeSize]
worker_diagramLayoutWorker -.-> computeSize : "contains"
computeSubtreeWidth[Function: computeSubtreeWidth]
worker_diagramLayoutWorker -.-> computeSubtreeWidth : "contains"
positionTree[Function: positionTree]
worker_diagramLayoutWorker -.-> positionTree : "contains"
positionContained[Function: positionContained]
worker_diagramLayoutWorker -.-> positionContained : "contains"
layoutEdges[Function: layoutEdges]
worker_diagramLayoutWorker -.-> layoutEdges : "contains"
getHandTrackingWorker[Function: getHandTrackingWorker]
worker_handTrackingWorkerClient -.-> getHandTrackingWorker : "contains"
terminateHandTrackingWorker[Function: terminateHandTrackingWorker]
worker_handTrackingWorkerClient -.-> terminateHandTrackingWorker : "contains"
ensureCanvases[Function: ensureCanvases]
worker_handTrackingWorker -.-> ensureCanvases : "contains"
init[Function: init]
worker_handTrackingWorker -.-> init : "contains"
worker_handTrackingWorker -.-> sigmoid : "contains"
dedupeByRoi[Function: dedupeByRoi]
worker_handTrackingWorker -.-> dedupeByRoi : "contains"
roiFromLandmarks[Function: roiFromLandmarks]
worker_handTrackingWorker -.-> roiFromLandmarks : "contains"
runPalmDetection[Function: runPalmDetection]
worker_handTrackingWorker -.-> runPalmDetection : "contains"
runLandmarks[Function: runLandmarks]
worker_handTrackingWorker -.-> runLandmarks : "contains"
detect[Function: detect]
worker_handTrackingWorker -.-> detect : "contains"
dispose[Function: dispose]
worker_handTrackingWorker -.-> dispose : "contains"
getMarkdownLayoutWorker[Function: getMarkdownLayoutWorker]
worker_markdownLayoutWorkerClient -.-> getMarkdownLayoutWorker : "contains"
terminateMarkdownLayoutWorker[Function: terminateMarkdownLayoutWorker]
worker_markdownLayoutWorkerClient -.-> terminateMarkdownLayoutWorker : "contains"
getPathfindingWorker[Function: getPathfindingWorker]
worker_pathfindingWorkerClient -.-> getPathfindingWorker : "contains"
terminatePathfindingWorker[Function: terminatePathfindingWorker]
worker_pathfindingWorkerClient -.-> terminatePathfindingWorker : "contains"
getDiagramLayoutWorker[Function: getDiagramLayoutWorker]
worker_diagramLayoutWorkerClient -.-> getDiagramLayoutWorker : "contains"
terminateDiagramLayoutWorker[Function: terminateDiagramLayoutWorker]
worker_diagramLayoutWorkerClient -.-> terminateDiagramLayoutWorker : "contains"
initWasm[Function: initWasm]
worker_spatialIndexWorker -.-> initWasm : "contains"
_rebuildFlatBuffers[Function: _rebuildFlatBuffers]
worker_spatialIndexWorker -.-> _rebuildFlatBuffers : "contains"
childLOD[Function: childLOD]
worker_spatialIndexWorker -.-> childLOD : "contains"
parentLOD[Function: parentLOD]
worker_spatialIndexWorker -.-> parentLOD : "contains"
worker_spatialIndexWorker -.-> isPointInFrustum : "contains"
worker_lib_rs -.-> fill_edge_buffers : "contains"
worker_lib_rs -.-> get_scratch_start_view : "contains"
worker_lib_rs -.-> get_scratch_end_view : "contains"
worker_lib_rs -.-> get_scratch_color_view : "contains"
worker_lib_rs -.-> compute_lod_updates : "contains"
worker_lib_rs -.-> frustum_cull_connections : "contains"
point_in_frustum[Function: point_in_frustum]
worker_lib_rs -.-> point_in_frustum : "contains"
getTreeSitterScannerWorker[Function: getTreeSitterScannerWorker]
worker_treeSitterScannerWorkerClient -.-> getTreeSitterScannerWorker : "contains"
terminateTreeSitterScannerWorker[Function: terminateTreeSitterScannerWorker]
worker_treeSitterScannerWorkerClient -.-> terminateTreeSitterScannerWorker : "contains"
ensureInit[Function: ensureInit]
worker_treeSitterScannerWorker -.-> ensureInit : "contains"
getLanguage[Function: getLanguage]
worker_treeSitterScannerWorker -.-> getLanguage : "contains"
getQuery[Function: getQuery]
worker_treeSitterScannerWorker -.-> getQuery : "contains"
getParser[Function: getParser]
worker_treeSitterScannerWorker -.-> getParser : "contains"
stripPathQuotes[Function: stripPathQuotes]
worker_treeSitterScannerWorker -.-> stripPathQuotes : "contains"
collectDottedSegments[Function: collectDottedSegments]
worker_treeSitterScannerWorker -.-> collectDottedSegments : "contains"
summariseQueryMatches[Function: summariseQueryMatches]
worker_treeSitterScannerWorker -.-> summariseQueryMatches : "contains"
getTextAtlasWorker[Function: getTextAtlasWorker]
worker_textAtlasWorkerClient -.-> getTextAtlasWorker : "contains"
terminateTextAtlasWorker[Function: terminateTextAtlasWorker]
worker_textAtlasWorkerClient -.-> terminateTextAtlasWorker : "contains"
getSpatialIndexWorker[Function: getSpatialIndexWorker]
worker_spatialIndexWorkerClient -.-> getSpatialIndexWorker : "contains"
terminateSpatialIndexWorker[Function: terminateSpatialIndexWorker]
worker_spatialIndexWorkerClient -.-> terminateSpatialIndexWorker : "contains"
getKey[Function: getKey]
worker_textAtlasWorker -.-> getKey : "contains"
addPage[Function: addPage]
worker_textAtlasWorker -.-> addPage : "contains"

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
App --> EarthGlobe : "uses"
App --> ObjectsRenderer : "objects, visibleObjectIds, selectedId..."
App --> RepoGrid : "uses"
App --> CellBoundaryRenderer : "visible"
App --> HandsRenderer : "renders"
App --> DiagramOverlay2D : "uses"
App --> UIOverlay : "onCreateObject, onToggleIndicators, user..."
App --> UIOverlay : "uses"
UIOverlay --> EarthSidebarSections : "receives"
App --> ConnectionsRenderer : "connections"
ConnectionsRenderer --> DistanceFilteredConnectionText : "receives"
AppShell --> LandingApp : "onOpenSpace, onTryWithoutAccount"
AppShell --> App : "uses"
Sphere --> SnapLineIndicator : "points, axis, visible"
Sphere --> DodecahedronFace : "dodecahedronId, faceIndex, faceGeometry..."
Sphere --> InstancedLine : "points, color, lineWidth"
Sphere --> ObjectUI : "position, onTransformToggle, onHeaderToggle..."
Sphere --> FaceUI : "position, onColorChange, face..."
Sphere --> HeaderInput : "position, onTextSubmit, inputId..."
Sphere --> AtlasTextSprite : "text, position, followTarget..."
Sphere --> TextStyleUI : "position, followTarget, onStyleChange..."
Sphere --> GlobalDodecahedronEdgesRenderer : "renders"
Sphere --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
DodecahedronFace --> FaceIndicator : "position, rotation, onClick..."
DodecahedronFace --> AtlasTextSprite : "text, position, onClick..."
DodecahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
Cube --> CubeFace : "cubeId, faceName, faceData..."
Cube --> FaceUI : "position, normal, onColorChange..."
Cube --> FaceTextInput : "position, onTextSubmit, inputId"
Cube --> AtlasTextSprite : "text, position, onClick..."
Cube --> TextStyleUI : "position, onStyleChange, onClose..."
Cube --> SnapLineIndicator : "points, axis, visible"
Cube --> InstancedLine : "points, color, lineWidth"
Cube --> HeaderInput : "position, onTextSubmit, inputId..."
Cube --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
Cube --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
Cube --> GlobalCubeEdgesRenderer : "renders"
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
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
CubeFace --> FaceIndicator : "position, rotation, onClick..."
EarthGlobe --> InstancedLine : "points, color, lineWidth..."
DistanceFilteredTextLabels --> InstancedAtlasText : "labels, maxDistance, onLabelClick..."
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
DiagramOverlay2D --> ContainerNode : "uses"
ContainerNode --> MerfolkNode : "receives"
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
EdgeMarkerDefs --> MerfolkEdge : "receives"
FaceUI --> ColorPicker : "onColorSelect, onClose"
HandsRenderer --> InstancedLine : "points, color, lineWidth..."
InstancedAtlasText --> InstancedAtlasText : "atlas, texture, items..."
InstancedAtlasText --> PageInstancedMesh : "receives"
LineUI --> ColorPicker : "onColorSelect, onClose"
ObjectRenderer --> Cube : "selected, onClick, onUpdate..."
ObjectRenderer --> Tetrahedron : "selected, onClick, onUpdate..."
ObjectRenderer --> Sphere : "selected, onClick, showAllIndicators..."
ObjectRenderer --> Plane : "position, scale, selected..."
ObjectRenderer --> TextObject : "position, selected, onClick..."
ObjectRenderer --> ModelObject : "obj, isSelected, onClick..."
ObjectRenderer --> GlobalCubeFullLODInstancedRenderer : "renders"
ObjectsRenderer --> ObjectRenderer : "obj, selectedId, handleObjectClick..."
ObjectsRenderer --> GlobalCubeEdgesRenderer : "cubes, defaultLineWidth"
ObjectsRenderer --> GlobalCubeFaceRenderer : "cubes"
ObjectsRenderer --> GlobalCubeMediumLODRenderer : "cubes"
ObjectsRenderer --> GlobalCubeFullLODInstancedRenderer : "cubes, onInstanceClick"
ObjectsRenderer --> GlobalDodecahedronEdgesRenderer : "dodecahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalDodecahedronMediumLODRenderer : "dodecahedrons"
ObjectsRenderer --> GlobalTetrahedronEdgesRenderer : "tetrahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalTetrahedronMediumLODRenderer : "tetrahedrons"
ObjectsRenderer --> AtlasTextSprite : "text, position, billboard..."
RepoGrid --> RepoGrid : "...data"
RepoGrid --> RepoGridLines : "receives"
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
Plane --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
ObjectUI --> ColorPicker : "pickerId, onColorSelect, onClose"
TreeRow --> TreeRow : "nodeId, nodes, parentChildMap..."
TreeRow --> GroupedView : "allNodes, hierarchy, filter..."
Tetrahedron --> AtlasTextSprite : "text, position, onClick..."
Tetrahedron --> TextStyleUI : "position, onStyleChange, onClose..."
Tetrahedron --> TetrahedronFace : "faceName, faceData, selected..."
Tetrahedron --> SnapLineIndicator : "points, axis, visible"
Tetrahedron --> InstancedLine : "points, color, lineWidth"
Tetrahedron --> HeaderInput : "position, onTextSubmit, inputId..."
Tetrahedron --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
Tetrahedron --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
Tetrahedron --> GlobalTetrahedronEdgesRenderer : "renders"
Avatar --> HandTrackingToggle : "uses"
Avatar --> Avatar : "user"
SnapLineIndicator --> InstancedLine : "points, color, lineWidth"
TextStyleUIContainer --> TextStyleUI : "onStyleChange"
TextStyleUI --> TextStyleUIContent : "receives"
TextObject --> SnapLineIndicator : "points, axis, visible"
TextObject --> FaceIndicator : "position, rotation, onClick..."
TextObject --> TextObjectUI : "textStyle, onStyleChange, onDelete..."
TetrahedronFace --> AtlasTextSprite : "text, position, followTarget..."
TetrahedronFace --> TextStyleUI : "position, onStyleChange, onClose..."
TetrahedronFace --> FaceUI : "position, normal, onColorChange..."
TetrahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
TetrahedronFace --> FaceIndicator : "position, rotation, onClick..."
TetrahedronFace --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> ColorPicker : "pickerId, onColorSelect, onClose"
TextStyleUIContent --> TextStyleUIContent : "onStyleChange, distance, onClose"
TextObjectUI --> TextStyleUI : "uiType, textStyle, onStyleChange..."
TextStyleUI --> TextStyleUIContent : "receives"
TextObjectUI --> ColorPicker : "onColorSelect, onClose"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> SpacePresenceAvatars : "spaceId, currentCell, inline"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> RepoAnalysisOverlay : "open, onClose, repoName"
EarthSidebarSections --> EarthSidebarSections : "uses"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> SpaceChat : "spaceId, user, isOpen..."
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> SpacePresenceAvatars : "uses"
SpacePresenceAvatars --> Avatar : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> RepoAnalysisOverlay : "uses"
RepoAnalysisOverlay --> TreeRow : "receives"
LandingApp --> CreateSpacePopup : "...createSpaceProps"
LandingApp --> UpgradePrompt : "show, onClose, currentTier"
LandingApp --> ShareSpacePopup : "...sharePopupProps"
LandingApp --> OrganizationManager : "user, show, onClose"
LandingApp --> OrderHeader : "windowSize"
LandingApp --> CustomCamera : "scrollProgressRef"
LandingApp --> PerspectiveGrid : "uses"
LandingApp --> SpacesTable : "...spaceTableProps"
LandingApp --> UserLoginSection : "user, windowSize, onLogin..."
LandingApp --> WelcomeOverlay : "windowSize, onLogin, onTryWithoutAccount"
LandingApp --> LandingScrollContent : "scrollProgress, isMobile, onLogin..."
LandingApp --> CubeOutline : "uses"
LandingApp --> DodecahedronWireframe : "uses"
LandingApp --> DodecahedronWireframe2 : "uses"
LandingApp --> LandingScrollContent : "uses"
LandingScrollContent --> SectionEyebrow : "receives"
SectionEyebrow --> SectionEyebrow : "uses"
SectionEyebrow --> Bullet : "uses"
SectionEyebrow --> DiagramContent : "isMobile"
SectionEyebrow --> FeaturesContent : "isMobile"
SectionEyebrow --> AudienceContent : "isMobile"
SectionEyebrow --> CtaContent : "isMobile, onLogin, onTryWithoutAccount"
SectionEyebrow --> ContentPanel : "isMobile"
UpdatesContainer --> UpdatesViewer : "content, timestamp"
CreateSpacePopup --> OrgMemberDropdown : "members, selectedUserId, onSelect..."
main --> AppShell : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> InstancedLine : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> BatchedConnectionLines : "connections"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> BatchedCurvedLines : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AtlasTextSprite : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> DistanceFilteredTextLabels : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> LineUI : "displays UI"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> HeaderInput : "displays UI"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AnimatedConnectionLine : "connections"
ConnectionsRenderer --> InstancedLine : "uses"
ConnectionsRenderer --> BatchedConnectionLines : "connections"
ConnectionsRenderer --> BatchedCurvedLines : "uses"
ConnectionsRenderer --> AtlasTextSprite : "uses"
ConnectionsRenderer --> DistanceFilteredTextLabels : "uses"
ConnectionsRenderer --> LineUI : "displays UI"
ConnectionsRenderer --> HeaderInput : "displays UI"
ConnectionsRenderer --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
ConnectionsRenderer --> AnimatedConnectionLine : "connections"
GlobalCubeMediumLODRenderer --> GlobalCubeEdgesRenderer : "renders"
GlobalCubeFaceRenderer --> GlobalCubeEdgesRenderer : "renders"
GlobalCubeFullLODInstancedRenderer --> GlobalCubeEdgesRenderer : "renders"
GlobalDodecahedronMediumLODRenderer --> GlobalDodecahedronEdgesRenderer : "renders"
GlobalTetrahedronMediumLODRenderer --> GlobalTetrahedronEdgesRenderer : "renders"
TextStyleUI --> ColorPicker : "displays UI"
UIOverlay --> SpacePresenceAvatars : "uses"
SpacePresenceAvatars --> Avatar : "receives"
UIOverlay --> SpaceChat : "uses"
UIOverlay --> RepoAnalysisOverlay : "uses"
RepoAnalysisOverlay --> TreeRow : "receives"

%% Component Dependencies
AtlasTextSprite --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
BatchedCurvedLines --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
AnimatedConnectionLine --> animatedConnectionLineStore : "uses store"
animatedConnectionLineStore --> useAnimatedConnectionLineStore : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
App --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
App --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
App --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
App --> planeStore : "uses store"
planeStore --> usePlaneStore : "receives"
App --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
App --> tetrahedronStore : "uses store"
tetrahedronStore --> useTetrahedronStore : "receives"
App --> dodecahedronStore : "uses store"
dodecahedronStore --> useDodecahedronStore : "receives"
App --> spatialManagerStore : "uses store"
spatialManagerStore --> useSpatialManagerStore : "receives"
App --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
App --> authService : "uses service"
authService --> signInUser : "receives"
App --> repoContainerService : "uses service"
repoContainerService --> toggleTaskExpansion : "receives"
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
Sphere --> dodecahedronStore : "uses store"
dodecahedronStore --> useDodecahedronStore : "receives"
Sphere --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Sphere --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Sphere --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Sphere --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
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
DodecahedronFace --> dodecahedronStore : "uses store"
dodecahedronStore --> useDodecahedronStore : "receives"
Cube --> faceIndicatorStore : "uses store"
faceIndicatorStore --> useFaceIndicatorStore : "receives"
Cube --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
Cube --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Cube --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Cube --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Cube --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
Cube --> pipelineStore : "uses store"
pipelineStore --> usePipelineStore : "receives"
Cube --> spaceManagerStore : "uses store"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> startPipeline : "receives"
Cube --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> stopPipeline : "receives"
Cube --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> pipelineTaskService : "uses service"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineTaskService : "uses service"
pipelineTaskService --> getPipelineTasks : "receives"
Cube --> repoContainerService : "uses service"
repoContainerService --> clearRepoTasks : "receives"
Cube --> repoContainerService : "uses service"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
Cube --> repoContainerService : "uses service"
repoContainerService --> repositionIncomingTasks : "receives"
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
ColorPicker --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
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
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
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
ConnectionsRenderer --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
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
CubeFace --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
EarthGlobe --> earthSettingsStore : "uses store"
earthSettingsStore --> useEarthSettingsStore : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> generateGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> setHeightmapData : "receives"
EarthGlobe --> earthHeightmapLoader : "uses utility"
earthHeightmapLoader --> loadEarthHeightmap : "receives"
EarthGlobe --> terrainTileCache : "uses utility"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> terrainTileCache : "uses utility"
terrainTileCache --> setOnTilesLoaded : "receives"
DiagramOverlay2D --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
DiagramOverlay2D --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
FaceUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
FaceUI --> faceStore : "uses store"
faceStore --> useFaceStore : "receives"
FrameloopController --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
FaceTextInput --> textInputStore : "uses store"
textInputStore --> useTextInputStore : "receives"
GlobalCubeMediumLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
FrameTicker --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
GlobalCubeEdgesRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> initWasmKernels : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchStartView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchEndView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchColorView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> isWasmReady : "receives"
FaceIndicator --> faceIndicatorStore : "uses store"
faceIndicatorStore --> useFaceIndicatorStore : "receives"
GlobalCubeFaceRenderer --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
GlobalCubeFaceRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalCubeFullLODInstancedRenderer --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
GlobalCubeFullLODInstancedRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalDodecahedronEdgesRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> initWasmKernels : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchStartView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchEndView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchColorView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> isWasmReady : "receives"
GlobalTetrahedronEdgesRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> initWasmKernels : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchStartView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchEndView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchColorView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> isWasmReady : "receives"
HandsRenderer --> handTrackingStore : "uses store"
handTrackingStore --> useHandTrackingStore : "receives"
HeaderInput --> textInputStore : "uses store"
textInputStore --> useTextInputStore : "receives"
GlobalDodecahedronMediumLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalTetrahedronMediumLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
InstancedAtlasText --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
LODManager --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
LODManager --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
LineUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
LineUI --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
ObjectsRenderer --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
ObjectsRenderer --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
RepoGrid --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RepoGrid --> repoContainerService : "uses service"
repoContainerService --> computeGridLayout : "receives"
RepoGridLines --> RepoGrid : "calls out"
RepoGrid --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RepoGridLines --> RepoGrid : "calls out"
RepoGrid --> repoContainerService : "uses service"
repoContainerService --> computeGridLayout : "receives"
Plane --> planeStore : "uses store"
planeStore --> usePlaneStore : "receives"
Plane --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Plane --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Plane --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Plane --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
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
ScreenShareStream --> screenShareStore : "uses store"
screenShareStore --> useScreenShareStore : "receives"
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
ObjectUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
TreeRow --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
TreeRow --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
GroupedView --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
GroupedView --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RepoAnalysisOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
RepoAnalysisOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RealTimeConnectionUpdater --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
RealTimeConnectionUpdater --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RealTimeConnectionUpdater --> spatialManagerStore : "uses store"
spatialManagerStore --> useSpatialManagerStore : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
Tetrahedron --> faceIndicatorStore : "uses store"
faceIndicatorStore --> useFaceIndicatorStore : "receives"
Tetrahedron --> tetrahedronStore : "uses store"
tetrahedronStore --> useTetrahedronStore : "receives"
Tetrahedron --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Tetrahedron --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Tetrahedron --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Tetrahedron --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingStore : "uses store"
handTrackingStore --> useHandTrackingStore : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingStore : "uses store"
handTrackingStore --> useHandTrackingStore : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
SpacePresenceAvatars --> handTrackingStore : "uses store"
handTrackingStore --> useHandTrackingStore : "receives"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
TextObject --> textObjectStore : "uses store"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
TextObject --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
TextObject --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
TextObject --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusColor : "receives"
TextObject --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusLabel : "receives"
TextObject --> pipelineTaskService : "uses service"
pipelineTaskService --> isTaskObject : "receives"
TextObject --> repoContainerService : "uses service"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> githubIssuesService : "uses service"
githubIssuesService --> revertCommit : "receives"
TextObject --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
TextObject --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextObject --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
TextSprite --> textObjectStore : "uses store"
textObjectStore --> useTextObjectStore : "receives"
TextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
TetrahedronFace --> tetrahedronStore : "uses store"
tetrahedronStore --> useTetrahedronStore : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
TextStyleUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
TextObjectUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
WebcamStream --> webcamStreamStore : "uses store"
webcamStreamStore --> useWebcamStreamStore : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
WebcamStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : "uses store"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> earthSettingsStore : "uses store"
earthSettingsStore --> useEarthSettingsStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : "uses store"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "uses service"
storageService --> uploadModelToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "uses service"
storageService --> uploadMarkdownToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : "uses service"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : "uses service"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> csvDiagramService : "uses service"
csvDiagramService --> processCsvFile : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> handleGithubCallback : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> isGithubAuthenticated : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> rescanRepositoryForChanges : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "uses service"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "uses service"
runtimeScanService --> validateScanUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusColor : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusLabel : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> startPipeline : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> pausePipeline : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> resumePipeline : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> stopPipeline : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> createRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> repositionIncomingTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> findRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
UIOverlay --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
UIOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
UIOverlay --> spatialManagerStore : "uses store"
spatialManagerStore --> useSpatialManagerStore : "receives"
UIOverlay --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
UIOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
UIOverlay --> earthSettingsStore : "uses store"
earthSettingsStore --> useEarthSettingsStore : "receives"
UIOverlay --> pipelineStore : "uses store"
pipelineStore --> usePipelineStore : "receives"
UIOverlay --> storageService : "uses service"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> storageService : "uses service"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> screenRecordingService : "uses service"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> markdownDiagramService_file : "uses service"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> csvDiagramService : "uses service"
csvDiagramService --> processCsvFile : "receives"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
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
UIOverlay --> runtimeScanService : "uses service"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
UIOverlay --> runtimeScanService : "uses service"
runtimeScanService --> validateScanUrl : "receives"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getPipelineTasks : "receives"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusColor : "receives"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusLabel : "receives"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> startPipeline : "receives"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> pausePipeline : "receives"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> resumePipeline : "receives"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> stopPipeline : "receives"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> createRepoContainer : "receives"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> repositionIncomingTasks : "receives"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> findRepoContainer : "receives"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
useAuth_file --> useAuth_file : "calls out"
useAuth_file --> authStore : "uses store"
authStore --> useAuthStore : "receives"
useAuthState_file --> useAuthState_file : "calls out"
useAuthState_file --> authStore : "uses store"
authStore --> useAuthStore : "receives"
useIndicators_file --> useIndicators_file : "calls out"
useIndicators_file --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
useSpaceManager_file --> useSpaceManager_file : "calls out"
useSpaceManager_file --> spaceManagerStore : "uses store"
spaceManagerStore --> useSpaceManagerStore : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "uses service"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> loadingState : "uses utility"
loadingState --> getIsInitialLoading : "receives"
useObjects_file --> useObjects_file : "calls out"
useObjects_file --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
useObjects_file --> useObjects_file : "calls out"
useObjects_file --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> declineInvite : "receives"
LandingApp --> useWindowSize_file : "uses hook"
useWindowSize_file --> useWindowSize_file : "receives"
LandingApp --> useWindowSize_file : "uses hook"
useWindowSize_file --> useWindowSize_file : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> createOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> getUserOrganizations : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> getOrganizationMembers : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> inviteUserToOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> acceptInvite : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> declineInvite : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> removeMemberFromOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> leaveOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> updateOrganizationPlan : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> deleteOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> getPendingInvitesForUser : "receives"

%% Function Call Relationships
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
App --> presenceService : "calls setGuestPresence"
presenceService --> setGuestPresence : "receives"
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
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
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
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
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> planeStore : ".getState()"
planeStore --> usePlaneStore : "receives"
App --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
App --> tetrahedronStore : ".getState()"
tetrahedronStore --> useTetrahedronStore : "receives"
App --> dodecahedronStore : ".getState()"
dodecahedronStore --> useDodecahedronStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> planeStore : ".getState()"
planeStore --> usePlaneStore : "receives"
App --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
App --> tetrahedronStore : ".getState()"
tetrahedronStore --> useTetrahedronStore : "receives"
App --> dodecahedronStore : ".getState()"
dodecahedronStore --> useDodecahedronStore : "receives"
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
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> spaceManagerStore : ".getState()"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> spaceManagerStore : ".getState()"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> pipelineOrchestrator : "calls stopPipeline"
pipelineOrchestrator --> stopPipeline : "receives"
Cube --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
Cube --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
Cube --> spaceManagerStore : ".getState()"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
Cube --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
Cube --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
Cube --> pipelineOrchestrator : "calls startPipeline"
pipelineOrchestrator --> startPipeline : "receives"
Cube --> spaceManagerStore : ".getState()"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> repoContainerService : "calls clearRepoTasks"
repoContainerService --> clearRepoTasks : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
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
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
EarthGlobe --> earthHeightmapLoader : "calls loadEarthHeightmap"
earthHeightmapLoader --> loadEarthHeightmap : "receives"
EarthGlobe --> earthTerrainGenerator : "calls setHeightmapData"
earthTerrainGenerator --> setHeightmapData : "receives"
EarthGlobe --> terrainTileCache : "calls setOnTilesLoaded"
terrainTileCache --> setOnTilesLoaded : "receives"
EarthGlobe --> terrainTileCache : "calls setOnTilesLoaded"
terrainTileCache --> setOnTilesLoaded : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeGeometry"
earthTerrainGenerator --> generateGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeGeometry"
earthTerrainGenerator --> generateGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeMesh"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeMesh"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeGeometry"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeGeometry"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeMesh"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeMesh"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
DiagramOverlay2D --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
DiagramOverlay2D --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
DiagramOverlay2D --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
DiagramOverlay2D --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
FaceTextInput --> textInputStore : ".getState()"
textInputStore --> useTextInputStore : "receives"
FrameTicker --> frameCounter_file : ".tick()"
frameCounter_file --> frameCounter : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
GlobalCubeFaceRenderer --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
HeaderInput --> textInputStore : ".getState()"
textInputStore --> useTextInputStore : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
LODManager --> lodStore : ".getState()"
lodStore --> useLODStore : "receives"
LODManager --> lodStore : ".getState()"
lodStore --> useLODStore : "receives"
LODManager --> lodStore : ".getState()"
lodStore --> useLODStore : "receives"
LODManager --> lodStore : ".getState()"
lodStore --> useLODStore : "receives"
LODManager --> lodStore : ".getState()"
lodStore --> useLODStore : "receives"
LODManager --> lodStore : ".getState()"
lodStore --> useLODStore : "receives"
LODManager --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "calls getSmoothedFrameTime"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
ObjectsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
RepoGrid --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
RepoGrid --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
Plane --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
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
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
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
RealTimeConnectionUpdater --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
RealTimeConnectionUpdater --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
RealTimeConnectionUpdater --> connectionStore : ".subscribe()"
connectionStore --> useConnectionStore : "receives"
RealTimeConnectionUpdater --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
RealTimeConnectionUpdater --> objectsStore : ".subscribe()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls stopHandTracking"
handTrackingService --> stopHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls startHandTracking"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls stopHandTracking"
handTrackingService --> stopHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls startHandTracking"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "calls subscribeToSpacePresence"
presenceService --> subscribeToSpacePresence : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> pipelineTaskService : "calls getStatusColor"
pipelineTaskService --> getStatusColor : "receives"
TextObject --> pipelineTaskService : "calls getStatusLabel"
pipelineTaskService --> getStatusLabel : "receives"
TextObject --> githubIssuesService : "calls revertCommit"
githubIssuesService --> revertCommit : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
TextSprite --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
TetrahedronFace --> tetrahedronStore : ".getState()"
tetrahedronStore --> useTetrahedronStore : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls findRepoContainer"
repoContainerService --> findRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".hydrateStoreFromMarkdown()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls validateScanUrl"
runtimeScanService --> validateScanUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls scanWebsiteAndGenerateDiagram"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls validateScanUrl"
runtimeScanService --> validateScanUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls scanWebsiteAndGenerateDiagram"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls handleGithubCallback"
githubRepoService --> handleGithubCallback : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> csvDiagramService : "calls processCsvFile"
csvDiagramService --> processCsvFile : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> csvDiagramService : "calls processCsvFile"
csvDiagramService --> processCsvFile : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls createRepoContainer"
repoContainerService --> createRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
OrganizationManager --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
OrganizationManager --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
OrganizationManager --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
OrganizationManager --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
OrganizationManager --> organizationService : "calls createOrganization"
organizationService --> createOrganization : "receives"
OrganizationManager --> organizationService : "calls createOrganization"
organizationService --> createOrganization : "receives"
OrganizationManager --> organizationService : "calls inviteUserToOrganization"
organizationService --> inviteUserToOrganization : "receives"
OrganizationManager --> organizationService : "calls inviteUserToOrganization"
organizationService --> inviteUserToOrganization : "receives"
OrganizationManager --> organizationService : "calls removeMemberFromOrganization"
organizationService --> removeMemberFromOrganization : "receives"
OrganizationManager --> organizationService : "calls removeMemberFromOrganization"
organizationService --> removeMemberFromOrganization : "receives"
OrganizationManager --> organizationService : "calls leaveOrganization"
organizationService --> leaveOrganization : "receives"
OrganizationManager --> organizationService : "calls leaveOrganization"
organizationService --> leaveOrganization : "receives"
OrganizationManager --> organizationService : "calls updateOrganizationPlan"
organizationService --> updateOrganizationPlan : "receives"
OrganizationManager --> organizationService : "calls updateOrganizationPlan"
organizationService --> updateOrganizationPlan : "receives"
OrganizationManager --> organizationService : "calls deleteOrganization"
organizationService --> deleteOrganization : "receives"
OrganizationManager --> organizationService : "calls deleteOrganization"
organizationService --> deleteOrganization : "receives"
OrganizationManager --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
OrganizationManager --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
OrganizationManager --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
OrganizationManager --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"

%% Store Usage Details
Sphere --> objectsStore : "isInitialLoading"
objectsStore --> useObjectsStore : "receives"
Cube --> objectsStore : "isInitialLoading"
objectsStore --> useObjectsStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : "selectConnectionWithFlowPath"
connectionStore --> useConnectionStore : "receives"
LODManager --> lodStore : "batchSetLODLevels, batchRegisterParentChild, batchRegisterParents, batchSetFaceTextVisible..."
lodStore --> useLODStore : "receives"
Tetrahedron --> objectsStore : "isInitialLoading"
objectsStore --> useObjectsStore : "receives"
TextObject --> textObjectStore : "updateTextObjectProperty()"
textObjectStore --> useTextObjectStore : "receives"
TetrahedronFace --> tetrahedronStore : "updateTetrahedronFaceColor(), updateTetrahedronFaceText(), setTetrahedronShowFaceTextInput(), setTetrahedronSelectedFace()..."
tetrahedronStore --> useTetrahedronStore : "receives"

%% API Endpoints
POST_/verify_token[Endpoint: POST /verify-token]
POST_/[Endpoint: POST /]
GET_/job/:jobId[Endpoint: GET /job/:jobId]

%% API Containment
backend_index -.-> POST_/verify_token : "contains"
backend_index -.-> POST_/ : "contains"
backend_index -.-> GET_/job/:jobId : "contains"

%% API Handler Chains

%% Database Models
users_model[[Store: users]]
publicSpaces_model[[Store: publicSpaces]]
spaces_model[[Store: spaces]]
devUpdates_model[[Store: devUpdates]]
organizations_model[[Store: organizations]]
orgInvites_model[[Store: orgInvites]]
sharedSpaces_model[[Store: sharedSpaces]]

%% Model Access
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> users_model : "reads"
LandingApp --> users_model : "reads"
LandingApp --> publicSpaces_model : "reads"
LandingApp --> spaces_model : "reads"
UpdatesEditor --> devUpdates_model : "reads"
UpdatesContainer --> devUpdates_model : "reads"
sharedSpacesService --> users_model : "reads"
sharedSpacesService --> spaces_model : "reads"
sharedSpacesService --> sharedSpaces_model : "reads"
sharedSpacesService --> publicSpaces_model : "reads"
connectionsService --> users_model : "reads"
organizationService --> users_model : "reads"
organizationService --> organizations_model : "reads"
organizationService --> orgInvites_model : "reads"
pipelineTaskService --> users_model : "reads"
spatialObjectsService --> users_model : "reads"
webRservice --> users_model : "reads"
spatialPartitioning --> users_model : "reads"
spacesService --> users_model : "reads"
spacesService --> publicSpaces_model : "reads"
sharingService --> users_model : "reads"
sharingService --> sharedSpaces_model : "reads"
connectionStore --> users_model : "reads"
spaceManagerStore --> users_model : "reads"
spaceManagerStore --> spaces_model : "reads"

%% Auth Guards
onAuthStateChanged[Guard: onAuthStateChanged]

%% Auth Flows
LandingApp --> signOut : "auth check"
LandingApp --> signOut : "auth check"

%% Events
Network_requestWillBeSent_event((Service: Network_requestWillBeSent))
change_event((Service: change))
click_event((Service: click))
mousedown_event((Service: mousedown))
pointerdown_event((Service: pointerdown))
popstate_event((Service: popstate))
ended_event((Service: ended))
error_event((Service: error))
canplay_event((Service: canplay))
onValue_event((Service: onValue))
loadedmetadata_event((Service: loadedmetadata))
screenRecordingStopped_event((Service: screenRecordingStopped))
wheel_event((Service: wheel))
touchstart_event((Service: touchstart))
touchmove_event((Service: touchmove))
onSnapshot_event((Service: onSnapshot))
resize_event((Service: resize))
beforeunload_event((Service: beforeunload))
unhandledrejection_event((Service: unhandledrejection))
visibilitychange_event((Service: visibilitychange))
state_changed_event((Service: state_changed))
value_event((Service: value))

%% Event Flows
change_event --> App : "listened by"
change_event --> useSpatialManager : "listened by"
click_event --> BVHIntegration : "listened by"
mousedown_event --> BVHIntegration : "listened by"
mousedown_event --> OrgMemberDropdown : "listened by"
pointerdown_event --> BVHIntegration : "listened by"
popstate_event --> AppShell : "listened by"
ended_event --> ScreenShareStream : "listened by"
ended_event --> screenRecordingService : "listened by"
error_event --> ScreenShareStream : "listened by"
error_event --> WebcamStream : "listened by"
error_event --> globalOptimizationCoordinator : "listened by"
error_event --> handTrackingService : "listened by"
canplay_event --> ScreenShareStream : "listened by"
canplay_event --> WebcamStream : "listened by"
onValue_event --> SpaceChat : "listened by"
onValue_event --> presenceService : "listened by"
loadedmetadata_event --> WebcamStream : "listened by"
loadedmetadata_event --> handTrackingService : "listened by"
screenRecordingStopped_event --> EarthSidebarSections : "listened by"
wheel_event --> LandingApp : "listened by"
touchstart_event --> LandingApp : "listened by"
touchmove_event --> LandingApp : "listened by"
onSnapshot_event --> UpdatesContainer : "listened by"
onSnapshot_event --> connectionsService : "listened by"
onSnapshot_event --> spatialObjectsService : "listened by"
onSnapshot_event --> webRservice : "listened by"
onSnapshot_event --> spatialPartitioning : "listened by"
resize_event --> useWindowSize : "listened by"
beforeunload_event --> globalOptimizationCoordinator : "listened by"
beforeunload_event --> globalSubscriptionManager : "listened by"
unhandledrejection_event --> globalOptimizationCoordinator : "listened by"
visibilitychange_event --> handTrackingService : "listened by"
state_changed_event --> storageService : "listened by"
value_event --> authStore : "listened by"

%% Error Boundaries
Suspense_AppShell[Boundary: Suspense]

%% Error Containment
Suspense_AppShell -.-> AppShell : "suspends"
```
