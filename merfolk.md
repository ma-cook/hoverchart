```merfolk
%% hoverchart Repository Analysis

%% Components
App{Component: App}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
AtlasTextSprite{Component: AtlasTextSprite}
StaticBillboardMesh{Component: StaticBillboardMesh}
DynamicBillboardMesh{Component: DynamicBillboardMesh}
BatchedConnectionLines{Component: BatchedConnectionLines}
BatchedCurvedLines{Component: BatchedCurvedLines}
BVHIntegration{Component: BVHIntegration}
CellBoundaryRenderer{Component: CellBoundaryRenderer}
ColorPicker{Component: ColorPicker}
DistanceFilteredConnectionText{Component: DistanceFilteredConnectionText}
Connection{Component: Connection}
ConnectionsRenderer{Component: ConnectionsRenderer}
Cube{Component: Cube}
CubeFace{Component: CubeFace}
CustomCamera{Component: CustomCamera}
MerfolkEdge{Component: MerfolkEdge}
EdgeMarkerDefs{Component: EdgeMarkerDefs}
MerfolkNode{Component: MerfolkNode}
ContainerNode{Component: ContainerNode}
DiagramOverlay2D{Component: DiagramOverlay2D}
DistanceFilteredTextLabels{Component: DistanceFilteredTextLabels}
Sphere{Component: Sphere}
DodecahedronFace{Component: DodecahedronFace}
EarthGlobe{Component: EarthGlobe}
FaceIndicator{Component: FaceIndicator}
FaceTextInput{Component: FaceTextInput}
FaceUI{Component: FaceUI}
FrameloopController{Component: FrameloopController}
FrameTicker{Component: FrameTicker}
GlobalCubeEdgesRenderer{Component: GlobalCubeEdgesRenderer}
GlobalCubeFaceRenderer{Component: GlobalCubeFaceRenderer}
GlobalCubeFullLODInstancedRenderer{Component: GlobalCubeFullLODInstancedRenderer}
GlobalCubeMediumLODRenderer{Component: GlobalCubeMediumLODRenderer}
GlobalDodecahedronEdgesRenderer{Component: GlobalDodecahedronEdgesRenderer}
GlobalDodecahedronMediumLODRenderer{Component: GlobalDodecahedronMediumLODRenderer}
GlobalTetrahedronEdgesRenderer{Component: GlobalTetrahedronEdgesRenderer}
GlobalTetrahedronMediumLODRenderer{Component: GlobalTetrahedronMediumLODRenderer}
HandsRenderer{Component: HandsRenderer}
HeaderInput{Component: HeaderInput}
InstancedAtlasText{Component: InstancedAtlasText}
PageInstancedMesh{Component: PageInstancedMesh}
InstancedLine{Component: InstancedLine}
LineUI{Component: LineUI}
LODManager{Component: LODManager}
ModelObject{Component: ModelObject}
ObjectRenderer{Component: ObjectRenderer}
ObjectsRenderer{Component: ObjectsRenderer}
ObjectUI{Component: ObjectUI}
Plane{Component: Plane}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
TreeRow{Component: TreeRow}
GroupedView{Component: GroupedView}
RepoAnalysisOverlay{Component: RepoAnalysisOverlay}
RepoGrid_file{Component: RepoGrid}
RepoGridLines{Component: RepoGridLines}
ScreenShareStream{Component: ScreenShareStream}
SnapLineIndicator{Component: SnapLineIndicator}
SpaceChat{Component: SpaceChat}
Avatar{Component: Avatar}
HandTrackingToggle{Component: HandTrackingToggle}
SpacePresenceAvatars{Component: SpacePresenceAvatars}
Tetrahedron{Component: Tetrahedron}
TetrahedronFace{Component: TetrahedronFace}
TextObject{Component: TextObject}
TextObjectUI{Component: TextObjectUI}
TextSprite{Component: TextSprite}
TextStyleUIContent{Component: TextStyleUIContent}
TextStyleUI{Component: TextStyleUI}
TextStyleUIContainer{Component: TextStyleUIContainer}
EarthSidebarSections{Component: EarthSidebarSections}
UIOverlay{Component: UIOverlay}
WebcamStream{Component: WebcamStream}
CreateOrganizationPopup{Component: CreateOrganizationPopup}
CreateSpacePopup{Component: CreateSpacePopup}
DodecahedronWireframe2{Component: DodecahedronWireframe2}
SectionEyebrow{Component: SectionEyebrow}
Bullet{Component: Bullet}
ContentPanel{Component: ContentPanel}
DiagramContent{Component: DiagramContent}
FeaturesContent{Component: FeaturesContent}
AudienceContent{Component: AudienceContent}
CtaContent{Component: CtaContent}
LandingScrollContent_file{Component: LandingScrollContent}
OrganizationManager{Component: OrganizationManager}
OrgMemberDropdown{Component: OrgMemberDropdown}
ShareSpacePopup{Component: ShareSpacePopup}
SpacesTable{Component: SpacesTable}
UpgradePrompt{Component: UpgradePrompt}
UserLoginSection{Component: UserLoginSection}
WelcomeOverlay{Component: WelcomeOverlay}
CubeOutline{Component: CubeOutline}
DodecahedronWireframe{Component: DodecahedronWireframe}
FakeGlowMaterial{Component: FakeGlowMaterial}
LandingApp{Component: LandingApp}
Loader{Component: Loader}
OrderHeader{Component: OrderHeader}
PerspectiveGrid_file{Component: PerspectiveGrid}
UpdatesContainer{Component: UpdatesContainer}
UpdatesEditor{Component: UpdatesEditor}
UpdatesViewer{Component: UpdatesViewer}
UserForm{Component: UserForm}
Model{Component: Model}

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
ConnectionsRenderer -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
EdgeMarkerDefs -.-> MerfolkEdge : "internal"
ContainerNode -.-> MerfolkNode : "internal"
InstancedAtlasText -.-> PageInstancedMesh : "internal"
RepoAnalysisOverlay -.-> TreeRow : "internal"
RepoAnalysisOverlay -.-> GroupedView : "internal"
RepoGrid_file -.-> RepoGridLines : "internal"
SpacePresenceAvatars -.-> Avatar : "internal"
SpacePresenceAvatars -.-> HandTrackingToggle : "internal"
TextStyleUI -.-> TextStyleUIContent : "internal"
UIOverlay -.-> EarthSidebarSections : "internal"
LandingScrollContent_file -.-> SectionEyebrow : "internal"
LandingScrollContent_file -.-> Bullet : "internal"
LandingScrollContent_file -.-> ContentPanel : "internal"
LandingScrollContent_file -.-> DiagramContent : "internal"
LandingScrollContent_file -.-> FeaturesContent : "internal"
LandingScrollContent_file -.-> AudienceContent : "internal"
LandingScrollContent_file -.-> CtaContent : "internal"

%% Functions
createVerifyAuthTokenApp[Function: createVerifyAuthTokenApp]
verifyAuthToken[Function: verifyAuthToken]
createBulkImportApp[Function: createBulkImportApp]
bulkImport[Function: bulkImport]
fetchGithubToken[Function: fetchGithubToken]
generateJobId[Function: generateJobId]
toMillis[Function: toMillis]
deleteCellContents[Function: deleteCellContents]
createBulkDeleteApp[Function: createBulkDeleteApp]
bulkDelete[Function: bulkDelete]
runBulkDeleteJob[Function: runBulkDeleteJob]
bulkDeleteWorker[Function: bulkDeleteWorker]
validateRuntimeScanUrl[Function: validateRuntimeScanUrl]
sanitizeMerfolkId[Function: sanitizeMerfolkId]
generateMerfolkFromRuntimeTrace[Function: generateMerfolkFromRuntimeTrace]
extractSourceMapUrl[Function: extractSourceMapUrl]
scanOriginalSource[Function: scanOriginalSource]
extractNamesFromSourceMap[Function: extractNamesFromSourceMap]
scanJsBundles[Function: scanJsBundles]
captureRuntimeTrace[Function: captureRuntimeTrace]
deduplicateApiCalls[Function: deduplicateApiCalls]
buildConnections[Function: buildConnections]
createScanWebsiteRuntimeApp[Function: createScanWebsiteRuntimeApp]
scanWebsiteRuntime[Function: scanWebsiteRuntime]
REACT_DEVTOOLS_INJECTION[Function: REACT_DEVTOOLS_INJECTION]
getCompName[Function: getCompName]
walkFiber[Function: walkFiber]
dedup[Function: dedup]
fetchBuffer[Function: fetchBuffer]
decodeTile[Function: decodeTile]
downloadTiles[Function: downloadTiles]
latLonToMercatorPixel[Function: latLonToMercatorPixel]
sampleElevation[Function: sampleElevation]
generateHeightmap[Function: generateHeightmap]
main[Function: main]
worker[Function: worker]
isCubeChild[Function: isCubeChild]
isContainerType[Function: isContainerType]
wouldCreateCycle[Function: wouldCreateCycle]
dfs[Function: dfs]
addRel[Function: addRel]
positionNode[Function: positionNode]
AppShell[Function: AppShell]
handleOpenSpace[Function: handleOpenSpace]
handleBackToLanding[Function: handleBackToLanding]
handleTryWithoutAccount[Function: handleTryWithoutAccount]
handlePopState[Function: handlePopState]
compute_lod_updates[Function: compute_lod_updates]
fill_edge_buffers[Function: fill_edge_buffers]
frustum_cull_connections[Function: frustum_cull_connections]
get_scratch_color_view[Function: get_scratch_color_view]
get_scratch_end_view[Function: get_scratch_end_view]
get_scratch_start_view[Function: get_scratch_start_view]
initSync[Function: initSync]
__wbg_get_imports[Function: __wbg_get_imports]
getArrayF32FromWasm0[Function: getArrayF32FromWasm0]
getArrayU32FromWasm0[Function: getArrayU32FromWasm0]
getArrayU8FromWasm0[Function: getArrayU8FromWasm0]
getFloat32ArrayMemory0[Function: getFloat32ArrayMemory0]
getStringFromWasm0[Function: getStringFromWasm0]
getUint32ArrayMemory0[Function: getUint32ArrayMemory0]
getUint8ArrayMemory0[Function: getUint8ArrayMemory0]
passArray8ToWasm0[Function: passArray8ToWasm0]
passArrayF32ToWasm0[Function: passArrayF32ToWasm0]
decodeText[Function: decodeText]
__wbg_finalize_init[Function: __wbg_finalize_init]
__wbg_load[Function: __wbg_load]
__wbg_init[Function: __wbg_init]
expectedResponseType[Function: expectedResponseType]
estimateNodeSize[Function: estimateNodeSize]
isHierarchyConnection[Function: isHierarchyConnection]
filterConnections[Function: filterConnections]
layoutNodes[Function: layoutNodes]
layoutEdges[Function: layoutEdges]
computeSize[Function: computeSize]
computeSubtreeWidth[Function: computeSubtreeWidth]
positionTree[Function: positionTree]
positionContained[Function: positionContained]
getDiagramLayoutWorker[Function: getDiagramLayoutWorker]
terminateDiagramLayoutWorker[Function: terminateDiagramLayoutWorker]
ensureCanvases[Function: ensureCanvases]
init[Function: init]
sigmoid[Function: sigmoid]
dedupeByRoi[Function: dedupeByRoi]
roiFromLandmarks[Function: roiFromLandmarks]
runPalmDetection[Function: runPalmDetection]
runLandmarks[Function: runLandmarks]
detect[Function: detect]
dispose[Function: dispose]
getHandTrackingWorker[Function: getHandTrackingWorker]
terminateHandTrackingWorker[Function: terminateHandTrackingWorker]
parseFlowPaths[Function: parseFlowPaths]
stripFlowPathSyntax[Function: stripFlowPathSyntax]
computeHeaderStyle[Function: computeHeaderStyle]
getMarkdownLayoutWorker[Function: getMarkdownLayoutWorker]
terminateMarkdownLayoutWorker[Function: terminateMarkdownLayoutWorker]
getPathfindingWorker[Function: getPathfindingWorker]
terminatePathfindingWorker[Function: terminatePathfindingWorker]
initWasm[Function: initWasm]
_rebuildFlatBuffers[Function: _rebuildFlatBuffers]
childLOD[Function: childLOD]
parentLOD[Function: parentLOD]
isPointInFrustum[Function: isPointInFrustum]
getSpatialIndexWorker[Function: getSpatialIndexWorker]
terminateSpatialIndexWorker[Function: terminateSpatialIndexWorker]
getKey[Function: getKey]
addPage[Function: addPage]
getTextAtlasWorker[Function: getTextAtlasWorker]
terminateTextAtlasWorker[Function: terminateTextAtlasWorker]
ensureInit[Function: ensureInit]
getLanguage[Function: getLanguage]
getQuery[Function: getQuery]
getParser[Function: getParser]
collectDottedSegments[Function: collectDottedSegments]
summariseQueryMatches[Function: summariseQueryMatches]
stripPathQuotes[Function: stripPathQuotes]
getTreeSitterScannerWorker[Function: getTreeSitterScannerWorker]
terminateTreeSitterScannerWorker[Function: terminateTreeSitterScannerWorker]

%% Hooks
useAuth[Function: useAuth]
useAuthState[Function: useAuthState]
useCentralizedBroadcastManager[Function: useCentralizedBroadcastManager]
useAnimatedLine[Function: useAnimatedLine]
useAnimationStats[Function: useAnimationStats]
useConnectionObjects[Function: useConnectionObjects]
usePathfindingObjects[Function: usePathfindingObjects]
useConnectionObjectPositions[Function: useConnectionObjectPositions]
useConnections[Function: useConnections]
userId[Function: userId]
useConnectionsRendererStore[Function: useConnectionsRendererStore]
useConnectionState[Function: useConnectionState]
useConnectionActions[Function: useConnectionActions]
useDebouncedUpdate[Function: useDebouncedUpdate]
useFrustumCulledConnections[Function: useFrustumCulledConnections]
useDynamicFrustumCulling[Function: useDynamicFrustumCulling]
useGlobalClickHandler[Function: useGlobalClickHandler]
useIndicators[Function: useIndicators]
useObjects[Function: useObjects]
useSpaceManager[Function: useSpaceManager]
useSpatialManager[Function: useSpatialManager]
useTextureUpdater[Function: useTextureUpdater]
useTimeoutManager[Function: useTimeoutManager]
useWindowSize[Function: useWindowSize]

%% Internal Hooks (same name as parent)
useAuth_file -.-> useAuth : "internal hook"
useAuthState_file -.-> useAuthState : "internal hook"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "internal hook"
useConnectionObjects_file -.-> useConnectionObjects : "internal hook"
useConnections_file -.-> useConnections : "internal hook"
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "internal hook"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "internal hook"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "internal hook"
useIndicators_file -.-> useIndicators : "internal hook"
useObjects_file -.-> useObjects : "internal hook"
useSpaceManager_file -.-> useSpaceManager : "internal hook"
useSpatialManager_file -.-> useSpatialManager : "internal hook"
useTextureUpdater_file -.-> useTextureUpdater : "internal hook"
useTimeoutManager_file -.-> useTimeoutManager : "internal hook"
useWindowSize_file -.-> useWindowSize : "internal hook"

%% Services
objectsByCellId[Function: objectsByCellId]
connectionsByCellId[Function: connectionsByCellId]
params[Function: params]
cellsToKeep[Function: cellsToKeep]
EXCLUDED_PROFILER_NAMES[Function: EXCLUDED_PROFILER_NAMES]
BUNDLE_NOISE_NAMES[Function: BUNDLE_NOISE_NAMES]
bundleComponents[Function: bundleComponents]
bundleHooks[Function: bundleHooks]
bundleFunctions[Function: bundleFunctions]
urlObj[Function: urlObj]
seen[Function: seen]
seenFns[Function: seenFns]
signInUser[Function: signInUser]
completeRedirectSignIn[Function: completeRedirectSignIn]
handlePostLoginRedirect[Function: handlePostLoginRedirect]
signOut[Function: signOut]
handleRedirectResult[Function: handleRedirectResult]
observeAuthState[Function: observeAuthState]
validateAuthToken[Function: validateAuthToken]
handleUrlAuth[Function: handleUrlAuth]
subscribePlaneToBroadcasts[Function: subscribePlaneToBroadcasts]
getBroadcastManagerDebugInfo[Function: getBroadcastManagerDebugInfo]
cleanupBroadcastManager[Function: cleanupBroadcastManager]
dummyUnsubscribe[Function: dummyUnsubscribe]
centralizedBroadcastManager[Function: centralizedBroadcastManager]
resolveConnectionPositions[Function: resolveConnectionPositions]
connectionNeedsPositionResolution[Function: connectionNeedsPositionResolution]
resolveConnectionEndpoint[Function: resolveConnectionEndpoint]
positionsEqual[Function: positionsEqual]
pauseConnectionListeners[Function: pauseConnectionListeners]
resumeConnectionListeners[Function: resumeConnectionListeners]
addConnectionStateListener[Function: addConnectionStateListener]
enableConnectionNetwork[Function: enableConnectionNetwork]
disableConnectionNetwork[Function: disableConnectionNetwork]
getConnectionNetworkState[Function: getConnectionNetworkState]
saveConnection[Function: saveConnection]
subscribeToConnections[Function: subscribeToConnections]
deleteConnection[Function: deleteConnection]
deleteConnectionEnhanced[Function: deleteConnectionEnhanced]
connectionListeners[Function: connectionListeners]
globalActiveListeners[Function: globalActiveListeners]
notifyConnectionListeners[Function: notifyConnectionListeners]
connectionCache[Function: connectionCache]
clearConnectionCache[Function: clearConnectionCache]
connectionDataChanged[Function: connectionDataChanged]
serializeConnection[Function: serializeConnection]
subscribeToCellConnections[Function: subscribeToCellConnections]
unsubscribeFunctions[Function: unsubscribeFunctions]
activeSubscriptionCells[Function: activeSubscriptionCells]
startCellSubscriptions[Function: startCellSubscriptions]
parseCsv[Function: parseCsv]
splitCsvLine[Function: splitCsvLine]
isNumericColumn[Function: isNumericColumn]
parseNumeric[Function: parseNumeric]
detectColumns[Function: detectColumns]
filterAggregateRows[Function: filterAggregateRows]
buildGroups[Function: buildGroups]
layoutGroup[Function: layoutGroup]
computeBounds[Function: computeBounds]
getCameraBasePosition[Function: getCameraBasePosition]
processCsvFile[Function: processCsvFile]
groups[Function: groups]
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
exchangeGithubCode[Function: exchangeGithubCode]
fetchRepositories[Function: fetchRepositories]
fetchFileContent[Function: fetchFileContent]
fetchLatestCommitSha[Function: fetchLatestCommitSha]
fetchChangedFiles[Function: fetchChangedFiles]
fetchRepositoryStructure[Function: fetchRepositoryStructure]
generateMerfolkFromRepository[Function: generateMerfolkFromRepository]
getGithubToken[Function: getGithubToken]
setGithubToken[Function: setGithubToken]
isGithubAuthenticated[Function: isGithubAuthenticated]
getGithubOAuthUrl[Function: getGithubOAuthUrl]
handleGithubCallback[Function: handleGithubCallback]
scanRepositoryAndGenerateDiagram[Function: scanRepositoryAndGenerateDiagram]
mergeMerfolkMarkdown[Function: mergeMerfolkMarkdown]
rescanRepositoryForChanges[Function: rescanRepositoryForChanges]
getTreeSitterLanguage[Function: getTreeSitterLanguage]
getFileTypeFromPath[Function: getFileTypeFromPath]
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
authGuards[Function: authGuards]
eventEmitters[Function: eventEmitters]
eventListeners[Function: eventListeners]
errorBoundaries[Function: errorBoundaries]
suspenseBoundaries[Function: suspenseBoundaries]
sharedInterfaces[Function: sharedInterfaces]
interfaceUsages[Function: interfaceUsages]
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
currentParams[Function: currentParams]
restoredParams[Function: restoredParams]
newUrl[Function: newUrl]
successParams[Function: successParams]
failParams[Function: failParams]
markdownBlob[Function: markdownBlob]
markdownFile[Function: markdownFile]
extractMerfolkNodeIds[Function: extractMerfolkNodeIds]
filterNewMerfolkNodes[Function: filterNewMerfolkNodes]
extractContent[Function: extractContent]
initializeOptimizationCoordinator[Function: initializeOptimizationCoordinator]
getOptimizationStatus[Function: getOptimizationStatus]
consolidateSystem[Function: consolidateSystem]
cleanupOptimizationCoordinator[Function: cleanupOptimizationCoordinator]
spatialManager[Function: spatialManager]
unifiedCache[Function: unifiedCache]
cacheStats[Function: cacheStats]
later[Function: later]
cache[Function: cache]
memoized[Function: memoized]
session[Function: session]
globalOptimizationCoordinator[Function: globalOptimizationCoordinator]
getOrCreateSubscription[Function: getOrCreateSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
globalSubscriptions[Function: globalSubscriptions]
decrementSubscription[Function: decrementSubscription]
periodicCleanup[Function: periodicCleanup]
getAnchors[Function: getAnchors]
imageDataToTensor[Function: imageDataToTensor]
letterboxToImageData[Function: letterboxToImageData]
extractRotatedRoi[Function: extractRotatedRoi]
roiToImage[Function: roiToImage]
decodePalmDetections[Function: decodePalmDetections]
iou[Function: iou]
detectionToRoi[Function: detectionToRoi]
kps[Function: kps]
ensureWorker[Function: ensureWorker]
openCamera[Function: openCamera]
runOnce[Function: runOnce]
scheduleNext[Function: scheduleNext]
onFrame[Function: onFrame]
onVisibilityChange[Function: onVisibilityChange]
teardownCamera[Function: teardownCamera]
startHandTracking[Function: startHandTracking]
stopHandTracking[Function: stopHandTracking]
onLoaded[Function: onLoaded]
onError[Function: onError]
connectionTags[Function: connectionTags]
addTag[Function: addTag]
existingConnectionPairs[Function: existingConnectionPairs]
getFaceForObject[Function: getFaceForObject]
computeFaceWorldPosition[Function: computeFaceWorldPosition]
calculateDodecahedronFaceCenter[Function: calculateDodecahedronFaceCenter]
connectionsByCell[Function: connectionsByCell]
getGroupDisplayName[Function: getGroupDisplayName]
getGroupColor[Function: getGroupColor]
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
parentChildMap[Function: parentChildMap]
childParentMap[Function: childParentMap]
rootNodes[Function: rootNodes]
internalComponentChildren[Function: internalComponentChildren]
componentConnectionTypes[Function: componentConnectionTypes]
warnedCycles[Function: warnedCycles]
addParentChildRelation[Function: addParentChildRelation]
processedNodes[Function: processedNodes]
existingNodeIdMap[Function: existingNodeIdMap]
calculateHeaderStyle[Function: calculateHeaderStyle]
moveComponentTree[Function: moveComponentTree]
getComponentChildren[Function: getComponentChildren]
checkOverlap[Function: checkOverlap]
containersByLevel[Function: containersByLevel]
resolveNodeMove[Function: resolveNodeMove]
calculateNodeScaleFromChildren[Function: calculateNodeScaleFromChildren]
calculateGroupSpacing[Function: calculateGroupSpacing]
calculateGroupBounds[Function: calculateGroupBounds]
positionGroup[Function: positionGroup]
cameraDirection[Function: cameraDirection]
allNodes[Function: allNodes]
allConnections[Function: allConnections]
nodeToObjectIdMap[Function: nodeToObjectIdMap]
reader[Function: reader]
markdownDiagramService[Function: markdownDiagramService]
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
processTask[Function: processTask]
startPipeline[Function: startPipeline]
pausePipeline[Function: pausePipeline]
resumePipeline[Function: resumePipeline]
reconcilePendingTasks[Function: reconcilePendingTasks]
stopPipeline[Function: stopPipeline]
pollPR[Function: pollPR]
getLatestTasks[Function: getLatestTasks]
processed[Function: processed]
checkResume[Function: checkResume]
repoSlugsToReposition[Function: repoSlugsToReposition]
getStatusColor[Function: getStatusColor]
getStatusLabel[Function: getStatusLabel]
isTaskObject[Function: isTaskObject]
getPipelineTasks[Function: getPipelineTasks]
getNextQueuedTask[Function: getNextQueuedTask]
getNextActionableTask[Function: getNextActionableTask]
getPipelineTasksForRepo[Function: getPipelineTasksForRepo]
getRepoSlugsFromTasks[Function: getRepoSlugsFromTasks]
updateTaskStatus[Function: updateTaskStatus]
slugs[Function: slugs]
setUserPresence[Function: setUserPresence]
setGuestPresence[Function: setGuestPresence]
subscribeToSpacePresence[Function: subscribeToSpacePresence]
generateId[Function: generateId]
getCellId[Function: getCellId]
computeGridLayout[Function: computeGridLayout]
computeContainerScale[Function: computeContainerScale]
getGridCellPosition[Function: getGridCellPosition]
repositionAllTasks[Function: repositionAllTasks]
findRepoContainer[Function: findRepoContainer]
getAllRepoContainers[Function: getAllRepoContainers]
assignRepoSlugToOrphanTasks[Function: assignRepoSlugToOrphanTasks]
countRepoContainers[Function: countRepoContainers]
createRepoContainer[Function: createRepoContainer]
repositionIncomingTasks[Function: repositionIncomingTasks]
createTaskObjects[Function: createTaskObjects]
clearRepoTasks[Function: clearRepoTasks]
toggleTaskExpansion[Function: toggleTaskExpansion]
dividerIds[Function: dividerIds]
activeIds[Function: activeIds]
mergedIds[Function: mergedIds]
newCreatedIds[Function: newCreatedIds]
orphanIds[Function: orphanIds]
unpositionedIds[Function: unpositionedIds]
renumberMap[Function: renumberMap]
rewriteHeader[Function: rewriteHeader]
taskIds[Function: taskIds]
updatedById[Function: updatedById]
resourceCleanupService[Function: resourceCleanupService]
_disposedWeakSet[Function: _disposedWeakSet]
validateScanUrl[Function: validateScanUrl]
scanWebsiteAndGenerateDiagram[Function: scanWebsiteAndGenerateDiagram]
sanitizeId[Function: sanitizeId]
simulateProgress[Function: simulateProgress]
screenRecorder[Function: screenRecorder]
rawBlob[Function: rawBlob]
sharedSpacesCacheSet[Function: sharedSpacesCacheSet]
isSharedSpace[Function: isSharedSpace]
checkSpaceExists[Function: checkSpaceExists]
registerSharedSpaceFromUrl[Function: registerSharedSpaceFromUrl]
getSpaceOwner[Function: getSpaceOwner]
findSpaceOwner[Function: findSpaceOwner]
sharedSpacesCache[Function: sharedSpacesCache]
urlParams[Function: urlParams]
generateSharingUrl[Function: generateSharingUrl]
getSharedSpaceInfo[Function: getSharedSpaceInfo]
sharingUrl[Function: sharingUrl]
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
cancelPendingSave[Function: cancelPendingSave]
enqueueSave[Function: enqueueSave]
flushSaveBatch[Function: flushSaveBatch]
clearAllObjectCaches[Function: clearAllObjectCaches]
saveObjectToCell[Function: saveObjectToCell]
deleteObjectFromSpatialCell[Function: deleteObjectFromSpatialCell]
updateObjectInSpatialCell[Function: updateObjectInSpatialCell]
cleanupSpatialObjectSubscriptions[Function: cleanupSpatialObjectSubscriptions]
subscribeToSpatialObjects[Function: subscribeToSpatialObjects]
updateCellSubscriptions[Function: updateCellSubscriptions]
moveObjectBetweenCells[Function: moveObjectBetweenCells]
loadObjectsFromCells[Function: loadObjectsFromCells]
saveObject[Function: saveObject]
deleteObject[Function: deleteObject]
updateObject[Function: updateObject]
subscribeToObjects[Function: subscribeToObjects]
getObjectDeletionStatus[Function: getObjectDeletionStatus]
clearObjectDeletionBlacklist[Function: clearObjectDeletionBlacklist]
deletingObjects[Function: deletingObjects]
pendingSaves[Function: pendingSaves]
saves[Function: saves]
removeObjectFromCaches[Function: removeObjectFromCaches]
VOLATILE_KEYS[Function: VOLATILE_KEYS]
computeNonPositionFingerprint[Function: computeNonPositionFingerprint]
clearCellCache[Function: clearCellCache]
objectSubscriptionsByCell[Function: objectSubscriptionsByCell]
localSubscriptionKeys[Function: localSubscriptionKeys]
getCellCoordinates[Function: getCellCoordinates]
getCellCoordinatesWithHysteresis[Function: getCellCoordinatesWithHysteresis]
parseCellId[Function: parseCellId]
getCellBounds[Function: getCellBounds]
createCell[Function: createCell]
createCellsBatch[Function: createCellsBatch]
cellExists[Function: cellExists]
cellExistsBulk[Function: cellExistsBulk]
getCell[Function: getCell]
addObjectToCell[Function: addObjectToCell]
removeObjectFromCell[Function: removeObjectFromCell]
getLoadedCells[Function: getLoadedCells]
getObjectsFromCells[Function: getObjectsFromCells]
updateObjectInCell[Function: updateObjectInCell]
deleteObjectFromCell[Function: deleteObjectFromCell]
subscribeToCells[Function: subscribeToCells]
getOccupiedCells[Function: getOccupiedCells]
getCellDistance[Function: getCellDistance]
getCellsToUnload[Function: getCellsToUnload]
addConnectionToCells[Function: addConnectionToCells]
bulkSaveConnectionsToCell[Function: bulkSaveConnectionsToCell]
addConnectionToCell[Function: addConnectionToCell]
removeConnectionFromAllCells[Function: removeConnectionFromAllCells]
removeConnectionFromCells[Function: removeConnectionFromCells]
removeConnectionFromCell[Function: removeConnectionFromCell]
getConnectionsFromCells[Function: getConnectionsFromCells]
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
cellExistenceCache[Function: cellExistenceCache]
cleanupCache[Function: cleanupCache]
createCellsBatchOptimized[Function: createCellsBatchOptimized]
cellCallbacks[Function: cellCallbacks]
normalizePosition[Function: normalizePosition]
seenConnectionIds[Function: seenConnectionIds]
uploadImageToStorage[Function: uploadImageToStorage]
uploadModelToStorage[Function: uploadModelToStorage]
uploadMarkdownToStorage[Function: uploadMarkdownToStorage]
getStorageInstance[Function: getStorageInstance]
ALLOWED_IMAGE_TYPES[Function: ALLOWED_IMAGE_TYPES]
uploadFileGeneric[Function: uploadFileGeneric]
blob[Function: blob]
getStreamlinedSpatialManager[Function: getStreamlinedSpatialManager]
initializeStreamlinedSpatialPartitioning[Function: initializeStreamlinedSpatialPartitioning]
benchmarkStreamlinedSystem[Function: benchmarkStreamlinedSystem]
manager[Function: manager]
resolveContainerType[Function: resolveContainerType]
scanWithTreeSitter[Function: scanWithTreeSitter]
scanPythonWithTreeSitter[Function: scanPythonWithTreeSitter]
isPrivate[Function: isPrivate]
isDunder[Function: isDunder]
importedNames[Function: importedNames]
unifiedCacheManager[Function: unifiedCacheManager]
initWebRTC[Function: initWebRTC]
startBroadcasting[Function: startBroadcasting]
joinBroadcast[Function: joinBroadcast]
isPlaneBeingBroadcast[Function: isPlaneBeingBroadcast]
findAvailableBroadcasts[Function: findAvailableBroadcasts]
cleanupWebRTC[Function: cleanupWebRTC]
registerUserPresence[Function: registerUserPresence]
subscribeToUsersInSpace[Function: subscribeToUsersInSpace]
activeStreams[Function: activeStreams]
getRTCConfiguration[Function: getRTCConfiguration]
peerConnection[Function: peerConnection]
broadcastSession[Function: broadcastSession]
activeUsers[Function: activeUsers]
fiveMinutesAgo[Function: fiveMinutesAgo]

%% Stores
useAnimatedConnectionLineStore[[Store: useAnimatedConnectionLineStore]]
useAuthStore[[Store: useAuthStore]]
useColorPickerStore[[Store: useColorPickerStore]]
useConnectionStore[[Store: useConnectionStore]]
useCubeStore[[Store: useCubeStore]]
useDiagramStore[[Store: useDiagramStore]]
useDodecahedronStore[[Store: useDodecahedronStore]]
useEarthSettingsStore[[Store: useEarthSettingsStore]]
useFaceIndicatorStore[[Store: useFaceIndicatorStore]]
useFaceStore[[Store: useFaceStore]]
useHandTrackingStore[[Store: useHandTrackingStore]]
useIndicatorsStore[[Store: useIndicatorsStore]]
useLODStore[[Store: useLODStore]]
useObjectsStore[[Store: useObjectsStore]]
usePipelineStore[[Store: usePipelineStore]]
usePlaneStore[[Store: usePlaneStore]]
usePublicSpaceStore[[Store: usePublicSpaceStore]]
useScreenShareStore[[Store: useScreenShareStore]]
useSpaceManagerStore[[Store: useSpaceManagerStore]]
useSpatialManagerStore[[Store: useSpatialManagerStore]]
useTetrahedronStore[[Store: useTetrahedronStore]]
useTextAtlasStore[[Store: useTextAtlasStore]]
useTextInputStore[[Store: useTextInputStore]]
useTextObjectStore[[Store: useTextObjectStore]]
useTransformControlsStore[[Store: useTransformControlsStore]]
useUIOverlayStore[[Store: useUIOverlayStore]]
useWebcamStreamStore[[Store: useWebcamStreamStore]]

%% Utilities
getSharedMaterial[Function: getSharedMaterial]
numericCacheKey[Function: numericCacheKey]
pathToSegments[Function: pathToSegments]
computeVisibleCells[Function: computeVisibleCells]
getTextParametricT[Function: getTextParametricT]
redistributeFaces[Function: redistributeFaces]
pathToLineSegments[Function: pathToLineSegments]
resolveEndpointPosition[Function: resolveEndpointPosition]
handlePointerOver[Function: handlePointerOver]
handlePointerOut[Function: handlePointerOut]
arraysEqual[Function: arraysEqual]
shallowObjEqual[Function: shallowObjEqual]
getColoredMaterial[Function: getColoredMaterial]
getFaceIndicatorProps[Function: getFaceIndicatorProps]
calculateFaceWorldPosition[Function: calculateFaceWorldPosition]
flowPathColor[Function: flowPathColor]
getEdgeStyle[Function: getEdgeStyle]
getMarkerEnd[Function: getMarkerEnd]
getSelectedStyle[Function: getSelectedStyle]
getUnselectedStyle[Function: getUnselectedStyle]
MerfolkEdgeMemo[Function: MerfolkEdgeMemo]
buildNodeStyles[Function: buildNodeStyles]
buildContainerStyles[Function: buildContainerStyles]
buildPrecomputedNode[Function: buildPrecomputedNode]
MerfolkNodeMemo[Function: MerfolkNodeMemo]
ContainerNodeMemo[Function: ContainerNodeMemo]
buildReactFlowNodes[Function: buildReactFlowNodes]
buildReactFlowEdges[Function: buildReactFlowEdges]
layerForType[Function: layerForType]
filterEdges[Function: filterEdges]
minimapNodeColor[Function: minimapNodeColor]
getDepth[Function: getDepth]
createDodecahedronGeometry[Function: createDodecahedronGeometry]
getDodecahedronColoredMaterial[Function: getDodecahedronColoredMaterial]
getIndicatorMaterial[Function: getIndicatorMaterial]
_ensureCubeWasmBuffers[Function: _ensureCubeWasmBuffers]
cubeTransformMap[Function: cubeTransformMap]
isCubeUnmodified[Function: isCubeUnmodified]
_ensureDodecaWasmBuffers[Function: _ensureDodecaWasmBuffers]
dodecahedronTransformMap[Function: dodecahedronTransformMap]
_ensureTetraWasmBuffers[Function: _ensureTetraWasmBuffers]
tetrahedronTransformMap[Function: tetrahedronTransformMap]
_buildTetraGeometry[Function: _buildTetraGeometry]
readLandmark[Function: readLandmark]
applyJoints[Function: applyJoints]
buildBonePoints[Function: buildBonePoints]
makeHandState[Function: makeHandState]
createLoaders[Function: createLoaders]
RepoGrid[Function: RepoGrid]
getGuestId[Function: getGuestId]
senderInitials[Function: senderInitials]
mergeMessages[Function: mergeMessages]
getInitials[Function: getInitials]
_createTriangleGeometry[Function: _createTriangleGeometry]
getTetrahedronColoredMaterial[Function: getTetrahedronColoredMaterial]
lerpVector[Function: lerpVector]
applyVideoTexture[Function: applyVideoTexture]
selectAuth[Function: selectAuth]
selectAuthState[Function: selectAuthState]
ConnectionAnimationManager[Function: ConnectionAnimationManager]
objectPositionEqual[Function: objectPositionEqual]
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
cleanup[Function: cleanup]
isConnectionVisible[Function: isConnectionVisible]
objectPositions[Function: objectPositions]
visibleConnections[Function: visibleConnections]
handleGlobalClick[Function: handleGlobalClick]
selectObjectsHookState[Function: selectObjectsHookState]
handleCreateObject[Function: handleCreateObject]
handleObjectDelete[Function: handleObjectDelete]
registerTransformingObject[Function: registerTransformingObject]
selectSpaceManagerState[Function: selectSpaceManagerState]
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
clamp01[Function: clamp01]
getSectionVisibility[Function: getSectionVisibility]
LandingScrollContent[Function: LandingScrollContent]
stringToColor[Function: stringToColor]
handleResize[Function: handleResize]
PerspectiveGrid[Function: PerspectiveGrid]
addSharedSpaceReference[Function: addSharedSpaceReference]
removeSharedSpaceReference[Function: removeSharedSpaceReference]
getSharedSpacesForUser[Function: getSharedSpacesForUser]
removeAllSharedReferences[Function: removeAllSharedReferences]
nodeIds[Function: nodeIds]
visited[Function: visited]
recursionStack[Function: recursionStack]
node[Function: node]
connection[Function: connection]
nodeMap[Function: nodeMap]
nodesWithCustomPositions[Function: nodesWithCustomPositions]
layers[Function: layers]
componentGroups[Function: componentGroups]
line_frag_glsl[Function: line_frag_glsl]
line_vert_glsl[Function: line_vert_glsl]
monitorConnection[Function: monitorConnection]
connectionHandler[Function: connectionHandler]
handleUrlAuthLocal[Function: handleUrlAuthLocal]
initAuth[Function: initAuth]
_buildConnectionsByObjectId[Function: _buildConnectionsByObjectId]
getCellCoords[Function: getCellCoords]
getCellIdFromCoords[Function: getCellIdFromCoords]
getCubeSelector[Function: getCubeSelector]
getCubeFaceColorSelector[Function: getCubeFaceColorSelector]
getCubeSelectedFaceSelector[Function: getCubeSelectedFaceSelector]
getCubeFaceStateSelector[Function: getCubeFaceStateSelector]
calculateLODLevel[Function: calculateLODLevel]
calculateParentLODLevel[Function: calculateParentLODLevel]
numericHash[Function: numericHash]
stringHash[Function: stringHash]
useStoreInitialization[Function: useStoreInitialization]
useCubeSelectors[Function: useCubeSelectors]
useCubeActions[Function: useCubeActions]
usePlaneSelectors[Function: usePlaneSelectors]
usePlaneActions[Function: usePlaneActions]
useGlobalStoreUtils[Function: useGlobalStoreUtils]
clearAllSelections[Function: clearAllSelections]
resetAllStores[Function: resetAllStores]
setCellBoundariesVisible[Function: setCellBoundariesVisible]
registerMaterial[Function: registerMaterial]
unregisterMaterial[Function: unregisterMaterial]
setAnimationSpeed[Function: setAnimationSpeed]
initAnimationSystem[Function: initAnimationSystem]
animatedMaterials[Function: animatedMaterials]
startAnimationLoop[Function: startAnimationLoop]
animate[Function: animate]
stopAnimationLoop[Function: stopAnimationLoop]
initBVHRaycasting[Function: initBVHRaycasting]
getBVH[Function: getBVH]
updateBVHObjects[Function: updateBVHObjects]
bvhIntersectObjects[Function: bvhIntersectObjects]
getBVHStats[Function: getBVHStats]
updateLODLevels[Function: updateLODLevels]
registerObjectRelationships[Function: registerObjectRelationships]
_tempBox3[Function: _tempBox3]
_tempVec3A[Function: _tempVec3A]
_tempVec3B[Function: _tempVec3B]
_tempVec3C[Function: _tempVec3C]
_tempVec3D[Function: _tempVec3D]
_tempSize[Function: _tempSize]
_tempCenter[Function: _tempCenter]
_tempMin[Function: _tempMin]
_tempMax[Function: _tempMax]
_lodCameraPos[Function: _lodCameraPos]
_lodObjectPos[Function: _lodObjectPos]
_segmentDir[Function: _segmentDir]
_rayToStart[Function: _rayToStart]
_pointOnRay[Function: _pointOnRay]
_pointOnSegment[Function: _pointOnSegment]
_intersectionPoint[Function: _intersectionPoint]
_cameraPos[Function: _cameraPos]
leftChild[Function: leftChild]
rightChild[Function: rightChild]
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
worldPos[Function: worldPos]
offsetVec[Function: offsetVec]
indicatorPos[Function: indicatorPos]
logAnimation[Function: logAnimation]
forceAnimateConnection[Function: forceAnimateConnection]
shouldAnimateConnection[Function: shouldAnimateConnection]
recordFrameTime[Function: recordFrameTime]
recordStateUpdate[Function: recordStateUpdate]
getPerfStats[Function: getPerfStats]
resetPerfStats[Function: resetPerfStats]
loadEarthHeightmap[Function: loadEarthHeightmap]
img[Function: img]
setHeightmapData[Function: setHeightmapData]
samplePixel[Function: samplePixel]
pixelToElevation[Function: pixelToElevation]
getElevationFromHeightmap[Function: getElevationFromHeightmap]
getElevationFromModel[Function: getElevationFromModel]
getElevation[Function: getElevation]
getColorForElevation[Function: getColorForElevation]
generateGlobeGeometry[Function: generateGlobeGeometry]
getParsedScheme[Function: getParsedScheme]
getColorRGB[Function: getColorRGB]
generateGlobeMesh[Function: generateGlobeMesh]
generateLocalGlobeGeometry[Function: generateLocalGlobeGeometry]
generateLocalGlobeMesh[Function: generateLocalGlobeMesh]
positions[Function: positions]
elevations[Function: elevations]
colorGroups[Function: colorGroups]
addLine[Function: addLine]
posAt[Function: posAt]
parsedColorCache[Function: parsedColorCache]
colors[Function: colors]
indices[Function: indices]
handleFaceIndicatorClick[Function: handleFaceIndicatorClick]
getIdFromIndicator[Function: getIdFromIndicator]
calculateFacePosition[Function: calculateFacePosition]
tempWorldPos[Function: tempWorldPos]
tempWorldScale[Function: tempWorldScale]
tempOffsetVec[Function: tempOffsetVec]
tempMatrix[Function: tempMatrix]
_avg3[Function: _avg3]
gpuTracker[Function: gpuTracker]
getIsInitialLoading[Function: getIsInitialLoading]
setIsInitialLoading[Function: setIsInitialLoading]
handleObjectMove[Function: handleObjectMove]
handleObjectUpdate[Function: handleObjectUpdate]
objectVirtualizer[Function: objectVirtualizer]
_tempVec[Function: _tempVec]
_sphereCenter[Function: _sphereCenter]
_tempSphere[Function: _tempSphere]
invalidatePathfindingCaches[Function: invalidatePathfindingCaches]
checkObjectMovement[Function: checkObjectMovement]
cleanCaches[Function: cleanCaches]
roundForCache[Function: roundForCache]
lineIntersectsBoundingBox[Function: lineIntersectsBoundingBox]
generateCacheKey[Function: generateCacheKey]
havePositionsChanged[Function: havePositionsChanged]
checkLineIntersection[Function: checkLineIntersection]
generateCurvedPath[Function: generateCurvedPath]
checkCurveIntersections[Function: checkCurveIntersections]
generateMultiSegmentPath[Function: generateMultiSegmentPath]
precomputeCacheKey[Function: precomputeCacheKey]
getPrecomputedResult[Function: getPrecomputedResult]
computeConnectionPath[Function: computeConnectionPath]
precomputePathsBatch[Function: precomputePathsBatch]
intersectionCache[Function: intersectionCache]
pathCache[Function: pathCache]
objectPositionCache[Function: objectPositionCache]
_tempDir[Function: _tempDir]
_tempResult[Function: _tempResult]
_tempBoxCenter[Function: _tempBoxCenter]
_tempClosest[Function: _tempClosest]
_tempLineToCenter[Function: _tempLineToCenter]
_tempBoxRadiusVec[Function: _tempBoxRadiusVec]
_tempCurveStart[Function: _tempCurveStart]
_tempCurveEnd[Function: _tempCurveEnd]
_tempCurveDir[Function: _tempCurveDir]
_tempRay[Function: _tempRay]
_tempIntersectTarget[Function: _tempIntersectTarget]
precomputedResults[Function: precomputedResults]
d[Function: d]
cliLineStart[Function: cliLineStart]
cliLineEnd[Function: cliLineEnd]
ray[Function: ray]
center[Function: center]
bbox[Function: bbox]
startVec[Function: startVec]
endVec[Function: endVec]
line[Function: line]
hitPoint[Function: hitPoint]
centerPoint[Function: centerPoint]
curve[Function: curve]
requestsById[Function: requestsById]
calculateMidpoint[Function: calculateMidpoint]
calculateMidpointVector[Function: calculateMidpointVector]
lerp[Function: lerp]
checkPositionJitter[Function: checkPositionJitter]
tempVec1[Function: tempVec1]
tempVec2[Function: tempVec2]
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
calculateAxisSnap[Function: calculateAxisSnap]
distanceToAxis[Function: distanceToAxis]
projectPointOntoAxis[Function: projectPointOntoAxis]
tempCurrentPos[Function: tempCurrentPos]
tempObjPos[Function: tempObjPos]
tempAxisDir[Function: tempAxisDir]
tempToPoint[Function: tempToPoint]
tempProjection[Function: tempProjection]
tempPerpendicular[Function: tempPerpendicular]
tempProjectedPoint[Function: tempProjectedPoint]
createStreamlinedSpatialIndex[Function: createStreamlinedSpatialIndex]
benchmarkStreamlined[Function: benchmarkStreamlined]
seenObjects[Function: seenObjects]
position[Function: position]
setOnTilesLoaded[Function: setOnTilesLoaded]
tileKey[Function: tileKey]
latLonToTile[Function: latLonToTile]
tileBounds[Function: tileBounds]
fetchAndDecode[Function: fetchAndDecode]
drainQueue[Function: drainQueue]
enqueueTile[Function: enqueueTile]
prefetchArea[Function: prefetchArea]
getCachedElevation[Function: getCachedElevation]
getCacheSize[Function: getCacheSize]
pending[Function: pending]
canvas[Function: canvas]
isOffscreenCanvasTextSupported[Function: isOffscreenCanvasTextSupported]
_switchToSyncAtlas[Function: _switchToSyncAtlas]
getGlobalTextAtlas[Function: getGlobalTextAtlas]
resetGlobalTextAtlas[Function: resetGlobalTextAtlas]
createAtlasTextMesh[Function: createAtlasTextMesh]
page[Function: page]
c[Function: c]
tex[Function: tex]
geometry[Function: geometry]
material[Function: material]
mesh[Function: mesh]
loadTextureFromFirebaseUrl[Function: loadTextureFromFirebaseUrl]
loadTextureFromBlob[Function: loadTextureFromBlob]
url[Function: url]
texture[Function: texture]
throttle[Function: throttle]
debounce[Function: debounce]
measurePerformance[Function: measurePerformance]
scheduleWork[Function: scheduleWork]
memoize[Function: memoize]
trackLCP[Function: trackLCP]
createCacheKey[Function: createCacheKey]
observer[Function: observer]
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
validateEmail[Function: validateEmail]
validateArray[Function: validateArray]
validateMultiple[Function: validateMultiple]
initWasmKernels[Function: initWasmKernels]
isWasmReady[Function: isWasmReady]
fillEdgeBuffers[Function: fillEdgeBuffers]
getScratchStartView[Function: getScratchStartView]
getScratchEndView[Function: getScratchEndView]
getScratchColorView[Function: getScratchColorView]
computeLodUpdates[Function: computeLodUpdates]
frustumCullConnections[Function: frustumCullConnections]

%% Classes
SpatialHash[[Class: SpatialHash]]
AST3DGenerator[[Class: AST3DGenerator]]
Graph[[Class: Graph]]
Node[[Class: Node]]
ASTBuilder[[Class: ASTBuilder]]
MermaidParser[[Class: MermaidParser]]
MarkdownProcessor[[Class: MarkdownProcessor]]
CentralizedBroadcastManager[[Class: CentralizedBroadcastManager]]
GlobalOptimizationCoordinator[[Class: GlobalOptimizationCoordinator]]
MarkdownDiagramService[[Class: MarkdownDiagramService]]
ResourceCleanupService[[Class: ResourceCleanupService]]
ScreenRecordingService[[Class: ScreenRecordingService]]
StreamlinedSpatialManager[[Class: StreamlinedSpatialManager]]
UnifiedCacheManager[[Class: UnifiedCacheManager]]
BroadcastSession[[Class: BroadcastSession]]
BVHNode[[Class: BVHNode]]
BVHAcceleratedRaycaster[[Class: BVHAcceleratedRaycaster]]
FrameCounter[[Class: FrameCounter]]
GPUResourceTracker[[Class: GPUResourceTracker]]
ObjectVirtualizer[[Class: ObjectVirtualizer]]
Point3D[[Class: Point3D]]
BoundingBox[[Class: BoundingBox]]
OptimizedSpatialGrid[[Class: OptimizedSpatialGrid]]
TextAtlas[[Class: TextAtlas]]
MultiPageTextAtlas[[Class: MultiPageTextAtlas]]
WorkerMultiPageTextAtlas[[Class: WorkerMultiPageTextAtlas]]
LayoutEngine[[Class: LayoutEngine]]
AtlasPage[[Class: AtlasPage]]

%% Constants
MAX_EVENT_HANDLERS[Constant: MAX_EVENT_HANDLERS]
MAX_API_CALLS[Constant: MAX_API_CALLS]
ALLOWED_ORIGINS[Constant: ALLOWED_ORIGINS]
ZOOM[Constant: ZOOM]
TILE_SIZE[Constant: TILE_SIZE]
TILES_PER_SIDE[Constant: TILES_PER_SIDE]
MOSAIC_SIZE[Constant: MOSAIC_SIZE]
TARGET_WIDTH[Constant: TARGET_WIDTH]
TARGET_HEIGHT[Constant: TARGET_HEIGHT]
CONCURRENT[Constant: CONCURRENT]
BASE_URL[Constant: BASE_URL]
DEG2RAD[Constant: DEG2RAD]
types[Constant: types]
graph[Constant: graph]
NODE_TYPE_COMPONENT[Constant: NODE_TYPE_COMPONENT]
NODE_TYPE_FUNCTION[Constant: NODE_TYPE_FUNCTION]
NODE_TYPE_HOOK[Constant: NODE_TYPE_HOOK]
NODE_TYPE_SERVICE[Constant: NODE_TYPE_SERVICE]
NODE_TYPE_STORE[Constant: NODE_TYPE_STORE]
NODE_TYPE_LIBRARY[Constant: NODE_TYPE_LIBRARY]
NODE_TYPE_MODULE[Constant: NODE_TYPE_MODULE]
NODE_TYPE_CLASS[Constant: NODE_TYPE_CLASS]
NODE_TYPE_INTERFACE[Constant: NODE_TYPE_INTERFACE]
NODE_TYPE_VARIABLE[Constant: NODE_TYPE_VARIABLE]
NODE_TYPE_CONSTANT[Constant: NODE_TYPE_CONSTANT]
NODE_TYPE_DATAPATH[Constant: NODE_TYPE_DATAPATH]
ungroupedComponents[Constant: ungroupedComponents]
unpositioned[Constant: unpositioned]
unposByType[Constant: unposByType]
shim[Constant: shim]
inFile[Constant: inFile]
outFile[Constant: outFile]
FIXTURES[Constant: FIXTURES]
expectAtLeast[Constant: expectAtLeast]
tmp[Constant: tmp]
fixture[Constant: fixture]
result[Constant: result]
THROTTLE_FACE_TEXT[Constant: THROTTLE_FACE_TEXT]
THROTTLE_HEADER_TEXT[Constant: THROTTLE_HEADER_TEXT]
THROTTLE_CONNECTION_TEXT[Constant: THROTTLE_CONNECTION_TEXT]
THROTTLE_STANDARD[Constant: THROTTLE_STANDARD]
LINE_COLOR[Constant: LINE_COLOR]
UPDATE_INTERVAL[Constant: UPDATE_INTERVAL]
CUBE_FACE_NAMES[Constant: CUBE_FACE_NAMES]
TETRA_FACE_NAMES[Constant: TETRA_FACE_NAMES]
EMPTY_CONNECTIONS[Constant: EMPTY_CONNECTIONS]
DEFAULT_COLOR[Constant: DEFAULT_COLOR]
DEFAULT_TEXT_STYLE[Constant: DEFAULT_TEXT_STYLE]
DEFAULT_FACE_TEXT_STYLES[Constant: DEFAULT_FACE_TEXT_STYLES]
CUBE_SIZE[Constant: CUBE_SIZE]
cubeEdges[Constant: cubeEdges]
FACE_SIZE[Constant: FACE_SIZE]
SELECTED_OPACITY[Constant: SELECTED_OPACITY]
materialCache[Constant: materialCache]
faceMaterialProps[Constant: faceMaterialProps]
faces[Constant: faces]
FLOW_PATH_COLORS[Constant: FLOW_PATH_COLORS]
EDGE_STYLES[Constant: EDGE_STYLES]
DEFAULT_EDGE_STYLE[Constant: DEFAULT_EDGE_STYLE]
MARKER_ARROW[Constant: MARKER_ARROW]
MARKER_INHERIT[Constant: MARKER_INHERIT]
LABEL_CSS_CLASS[Constant: LABEL_CSS_CLASS]
customEdgeTypes[Constant: customEdgeTypes]
TYPE_STYLES[Constant: TYPE_STYLES]
DEFAULT_STYLE[Constant: DEFAULT_STYLE]
HIDDEN_HANDLE_STYLE[Constant: HIDDEN_HANDLE_STYLE]
BOX_SHADOW_SELECTED[Constant: BOX_SHADOW_SELECTED]
BOX_SHADOW_DEFAULT[Constant: BOX_SHADOW_DEFAULT]
PRECOMPUTED_NODE[Constant: PRECOMPUTED_NODE]
PRECOMPUTED_CONTAINER[Constant: PRECOMPUTED_CONTAINER]
customNodeTypes[Constant: customNodeTypes]
LAYER_DEFS[Constant: LAYER_DEFS]
DEFAULT_LAYERS[Constant: DEFAULT_LAYERS]
MINIMAP_COLORS[Constant: MINIMAP_COLORS]
LEGEND_SWATCH_STYLES[Constant: LEGEND_SWATCH_STYLES]
PRO_OPTIONS[Constant: PRO_OPTIONS]
OVERLAY_STYLE[Constant: OVERLAY_STYLE]
LOADING_OVERLAY_STYLE[Constant: LOADING_OVERLAY_STYLE]
ERROR_STYLE[Constant: ERROR_STYLE]
NO_DATA_OVERLAY_STYLE[Constant: NO_DATA_OVERLAY_STYLE]
MINIMAP_STYLE[Constant: MINIMAP_STYLE]
SELECTED_NODE_STYLE[Constant: SELECTED_NODE_STYLE]
DIVIDER_STYLE[Constant: DIVIDER_STYLE]
SECTION_HEADER_STYLE[Constant: SECTION_HEADER_STYLE]
CHECKBOX_STYLE[Constant: CHECKBOX_STYLE]
LEGEND_PANEL_STYLE[Constant: LEGEND_PANEL_STYLE]
LEGEND_ITEM_STYLE[Constant: LEGEND_ITEM_STYLE]
LEGEND_TEXT_STYLE[Constant: LEGEND_TEXT_STYLE]
panelStyle[Constant: panelStyle]
backButtonStyle[Constant: backButtonStyle]
filterLabelStyle[Constant: filterLabelStyle]
selectStyle[Constant: selectStyle]
dodecahedronFaceMaterialCache[Constant: dodecahedronFaceMaterialCache]
GLOBE_CENTER[Constant: GLOBE_CENTER]
CLICK_MAX_MS[Constant: CLICK_MAX_MS]
CLICK_MAX_PX[Constant: CLICK_MAX_PX]
FLY_LERP_SPEED[Constant: FLY_LERP_SPEED]
FLY_ALTITUDE[Constant: FLY_ALTITUDE]
FLY_LATERAL[Constant: FLY_LATERAL]
LOD_STEPS[Constant: LOD_STEPS]
MESH_LOD_OFFSET[Constant: MESH_LOD_OFFSET]
LOCAL_DETAIL[Constant: LOCAL_DETAIL]
CAM_QUANT_DEG[Constant: CAM_QUANT_DEG]
DEBUG[Constant: DEBUG]
indicatorMaterialCache[Constant: indicatorMaterialCache]
FRUSTUM_CULLING_THRESHOLD[Constant: FRUSTUM_CULLING_THRESHOLD]
BASE_CUBE_EDGES[Constant: BASE_CUBE_EDGES]
EDGES_PER_CUBE[Constant: EDGES_PER_CUBE]
NORMAL_OFFSET[Constant: NORMAL_OFFSET]
CUBE_FACES[Constant: CUBE_FACES]
FACE_QUATERNIONS[Constant: FACE_QUATERNIONS]
PHI[Constant: PHI]
DODECA_SCALE[Constant: DODECA_SCALE]
DODECA_EDGES[Constant: DODECA_EDGES]
EDGES_PER_DODECAHEDRON[Constant: EDGES_PER_DODECAHEDRON]
TETRAHEDRON_SIZE[Constant: TETRAHEDRON_SIZE]
TETRA_VERTICES[Constant: TETRA_VERTICES]
TETRA_EDGES[Constant: TETRA_EDGES]
EDGES_PER_TETRAHEDRON[Constant: EDGES_PER_TETRAHEDRON]
HAND_DISTANCE[Constant: HAND_DISTANCE]
HAND_WORLD_SCALE[Constant: HAND_WORLD_SCALE]
JOINT_CUBE_SIZE[Constant: JOINT_CUBE_SIZE]
BONE_LINE_WIDTH[Constant: BONE_LINE_WIDTH]
MAX_JOINTS_PER_HAND[Constant: MAX_JOINTS_PER_HAND]
FLOATS_PER_HAND[Constant: FLOATS_PER_HAND]
REFERENCE_HAND_DIAG[Constant: REFERENCE_HAND_DIAG]
INVERSE_SCALE_GAMMA[Constant: INVERSE_SCALE_GAMMA]
INVERSE_DEPTH_GAIN[Constant: INVERSE_DEPTH_GAIN]
MIN_GROUP_SCALE[Constant: MIN_GROUP_SCALE]
MAX_GROUP_SCALE[Constant: MAX_GROUP_SCALE]
SMOOTHING_RATE[Constant: SMOOTHING_RATE]
SETTLED_EPSILON[Constant: SETTLED_EPSILON]
LEFT_COLOR[Constant: LEFT_COLOR]
RIGHT_COLOR[Constant: RIGHT_COLOR]
HAND_CONNECTIONS[Constant: HAND_CONNECTIONS]
NUM_BONES[Constant: NUM_BONES]
VERTEX_SHADER[Constant: VERTEX_SHADER]
FRAGMENT_SHADER[Constant: FRAGMENT_SHADER]
LOD_UPDATE_INTERVAL[Constant: LOD_UPDATE_INTERVAL]
CAMERA_MOVE_THRESHOLD[Constant: CAMERA_MOVE_THRESHOLD]
CAMERA_MOVE_THRESHOLD_SQ[Constant: CAMERA_MOVE_THRESHOLD_SQ]
LOD_UPGRADE_BUDGET_PER_FRAME[Constant: LOD_UPGRADE_BUDGET_PER_FRAME]
FRAME_TIME_THROTTLE_MS[Constant: FRAME_TIME_THROTTLE_MS]
TRANSFORM_CONTROLS_CONFIG[Constant: TRANSFORM_CONTROLS_CONFIG]
MOUNT_BUDGET[Constant: MOUNT_BUDGET]
MOUNT_BUDGET_MOVING[Constant: MOUNT_BUDGET_MOVING]
PROGRESSIVE_THRESHOLD[Constant: PROGRESSIVE_THRESHOLD]
TYPE_LABELS[Constant: TYPE_LABELS]
TYPE_ORDER[Constant: TYPE_ORDER]
TYPE_ICON[Constant: TYPE_ICON]
GROUP_DISPLAY_NAMES[Constant: GROUP_DISPLAY_NAMES]
GROUP_ORDER[Constant: GROUP_ORDER]
ROOT_ENTRY_NAMES[Constant: ROOT_ENTRY_NAMES]
GRID_OPACITY[Constant: GRID_OPACITY]
GRID_CELL_PADDING[Constant: GRID_CELL_PADDING]
INITIAL_LOAD[Constant: INITIAL_LOAD]
PAGE_SIZE[Constant: PAGE_SIZE]
tetrahedronVertices[Constant: tetrahedronVertices]
SHARED_TETRAHEDRON_FACES[Constant: SHARED_TETRAHEDRON_FACES]
DEFAULT_OPACITY[Constant: DEFAULT_OPACITY]
tetrahedronFaceMaterialCache[Constant: tetrahedronFaceMaterialCache]
PRESET_LOCATIONS[Constant: PRESET_LOCATIONS]
WEBCAM_CONSTRAINTS[Constant: WEBCAM_CONSTRAINTS]
firebaseConfig[Constant: firebaseConfig]
isValidFirebaseConfig[Constant: isValidFirebaseConfig]
CLEANUP_INTERVAL[Constant: CLEANUP_INTERVAL]
DEFAULT_EXCLUDE_SELECTORS[Constant: DEFAULT_EXCLUDE_SELECTORS]
BRAND[Constant: BRAND]
BRAND_DARK[Constant: BRAND_DARK]
INK[Constant: INK]
AUDIENCE_CARDS[Constant: AUDIENCE_CARDS]
FEATURE_GROUPS[Constant: FEATURE_GROUPS]
FONT_FAMILY[Constant: FONT_FAMILY]
PLAN_LABELS[Constant: PLAN_LABELS]
btnBase[Constant: btnBase]
btnPrimary[Constant: btnPrimary]
btnSecondary[Constant: btnSecondary]
btnDanger[Constant: btnDanger]
TABLE_STYLES[Constant: TABLE_STYLES]
LINK_STYLES[Constant: LINK_STYLES]
BTN_STYLES[Constant: BTN_STYLES]
SHARE_BTN_STYLES[Constant: SHARE_BTN_STYLES]
TRASH_BTN_STYLES[Constant: TRASH_BTN_STYLES]
LEAVE_BTN_STYLES[Constant: LEAVE_BTN_STYLES]
INVITE_BANNER_BASE[Constant: INVITE_BANNER_BASE]
INVITE_TEXT_STYLES[Constant: INVITE_TEXT_STYLES]
INVITE_BTN_ROW[Constant: INVITE_BTN_ROW]
ACCEPT_BTN_STYLES[Constant: ACCEPT_BTN_STYLES]
NO_SPACES_TEXT[Constant: NO_SPACES_TEXT]
TIER_LIMITS[Constant: TIER_LIMITS]
HERO_BULLETS[Constant: HERO_BULLETS]
CELL[Constant: CELL]
NX[Constant: NX]
NY[Constant: NY]
NZ[Constant: NZ]
X_MIN[Constant: X_MIN]
Y_MIN[Constant: Y_MIN]
Z_NEAR[Constant: Z_NEAR]
FADE_LEFT[Constant: FADE_LEFT]
FADE_RIGHT[Constant: FADE_RIGHT]
FADE_BOTTOM[Constant: FADE_BOTTOM]
FADE_FAR[Constant: FADE_FAR]
DEFAULT_CONFIG[Constant: DEFAULT_CONFIG]
MIN_SCALE[Constant: MIN_SCALE]
MAX_SCALE[Constant: MAX_SCALE]
CONTAINER_PADDING[Constant: CONTAINER_PADDING]
MAX_COLUMNS[Constant: MAX_COLUMNS]
GITHUB_API[Constant: GITHUB_API]
GITHUB_API_BASE[Constant: GITHUB_API_BASE]
TREE_SITTER_EXTENSIONS[Constant: TREE_SITTER_EXTENSIONS]
MAX_SUBSCRIPTION_AGE[Constant: MAX_SUBSCRIPTION_AGE]
SUBSCRIPTION_TYPES[Constant: SUBSCRIPTION_TYPES]
subscriptionMetrics[Constant: subscriptionMetrics]
generateSubscriptionKey[Constant: generateSubscriptionKey]
NUM_LAYERS[Constant: NUM_LAYERS]
STRIDES[Constant: STRIDES]
INPUT_SIZE[Constant: INPUT_SIZE]
ANCHOR_OFFSET[Constant: ANCHOR_OFFSET]
ANCHOR_COUNT[Constant: ANCHOR_COUNT]
MODEL_SIZE[Constant: MODEL_SIZE]
PIXELS[Constant: PIXELS]
MODEL_INPUT_SIZE[Constant: MODEL_INPUT_SIZE]
RAW_SCALE[Constant: RAW_SCALE]
NUM_KEYPOINTS[Constant: NUM_KEYPOINTS]
COORDS_PER_ANCHOR[Constant: COORDS_PER_ANCHOR]
SCORE_CLIPPING_THRESH[Constant: SCORE_CLIPPING_THRESH]
MIN_SCORE_THRESH[Constant: MIN_SCORE_THRESH]
MIN_SUPPRESSION_IOU[Constant: MIN_SUPPRESSION_IOU]
KP1[Constant: KP1]
KP2[Constant: KP2]
DY[Constant: DY]
DSCALE[Constant: DSCALE]
THETA0[Constant: THETA0]
CAMERA_WIDTH[Constant: CAMERA_WIDTH]
CAMERA_HEIGHT[Constant: CAMERA_HEIGHT]
ORT_VERSION[Constant: ORT_VERSION]
ORT_WASM_BASE[Constant: ORT_WASM_BASE]
HAND_DETECTOR_URL[Constant: HAND_DETECTOR_URL]
HAND_DETECTOR_DATA_URL[Constant: HAND_DETECTOR_DATA_URL]
HAND_LANDMARK_URL[Constant: HAND_LANDMARK_URL]
HAND_LANDMARK_DATA_URL[Constant: HAND_LANDMARK_DATA_URL]
connectionMethods[Constant: connectionMethods]
NODE_TYPE_UTILITY[Constant: NODE_TYPE_UTILITY]
NODE_TYPE_HANDLER[Constant: NODE_TYPE_HANDLER]
NODE_TYPE_CONTROL[Constant: NODE_TYPE_CONTROL]
NODE_TYPE_STATE[Constant: NODE_TYPE_STATE]
NODE_TYPE_DATA[Constant: NODE_TYPE_DATA]
OBJECT_TYPE_CUBE[Constant: OBJECT_TYPE_CUBE]
OBJECT_TYPE_DODECAHEDRON[Constant: OBJECT_TYPE_DODECAHEDRON]
OBJECT_TYPE_TETRAHEDRON[Constant: OBJECT_TYPE_TETRAHEDRON]
UI_COMPONENTS[Constant: UI_COMPONENTS]
MAX_RECURSION_DEPTH[Constant: MAX_RECURSION_DEPTH]
BASE_DODECAHEDRON_SIZE[Constant: BASE_DODECAHEDRON_SIZE]
BASE_DODECAHEDRON_RADIUS[Constant: BASE_DODECAHEDRON_RADIUS]
DEFAULT_CAMERA_DISTANCE[Constant: DEFAULT_CAMERA_DISTANCE]
SPACING_BETWEEN_COMPONENTS[Constant: SPACING_BETWEEN_COMPONENTS]
DEFAULT_CUBE_SIZE[Constant: DEFAULT_CUBE_SIZE]
DEFAULT_SPHERE_SIZE[Constant: DEFAULT_SPHERE_SIZE]
DEFAULT_CONTAINER_SIZE[Constant: DEFAULT_CONTAINER_SIZE]
MIN_SCALE_FACTOR[Constant: MIN_SCALE_FACTOR]
DESIRED_GAP[Constant: DESIRED_GAP]
GROUP_CONTAINER_COLORS[Constant: GROUP_CONTAINER_COLORS]
containerMethods[Constant: containerMethods]
hierarchyMethods[Constant: hierarchyMethods]
objectMethods[Constant: objectMethods]
positionMethods[Constant: positionMethods]
processMethods[Constant: processMethods]
scaleMethods[Constant: scaleMethods]
PLAN_LIMITS[Constant: PLAN_LIMITS]
POLL_INTERVAL_MS[Constant: POLL_INTERVAL_MS]
TASK_STATUS[Constant: TASK_STATUS]
STATUS_COLORS[Constant: STATUS_COLORS]
STATUS_LABELS[Constant: STATUS_LABELS]
CONTAINER_BASE_SCALE[Constant: CONTAINER_BASE_SCALE]
REPO_OFFSET_X[Constant: REPO_OFFSET_X]
COLLAPSED_TASK_SCALE[Constant: COLLAPSED_TASK_SCALE]
EXPANDED_TASK_SCALE[Constant: EXPANDED_TASK_SCALE]
TASK_FONT_SIZE[Constant: TASK_FONT_SIZE]
ARCHIVED_TASK_COLOR[Constant: ARCHIVED_TASK_COLOR]
GRID_COLS[Constant: GRID_COLS]
GRID_DEFAULT_ROWS[Constant: GRID_DEFAULT_ROWS]
SHARED_SPACES_CACHE_MAX[Constant: SHARED_SPACES_CACHE_MAX]
BATCH_FLUSH_DELAY[Constant: BATCH_FLUSH_DELAY]
CELL_SIZE[Constant: CELL_SIZE]
CELL_NEIGHBOR_RADIUS[Constant: CELL_NEIGHBOR_RADIUS]
CELL_UNLOAD_DISTANCE[Constant: CELL_UNLOAD_DISTANCE]
CELL_BOUNDARY_HYSTERESIS[Constant: CELL_BOUNDARY_HYSTERESIS]
CACHE_DURATION[Constant: CACHE_DURATION]
MAX_CACHE_SIZE[Constant: MAX_CACHE_SIZE]
MOVE_TIMEOUT[Constant: MOVE_TIMEOUT]
MAX_IMAGE_SIZE[Constant: MAX_IMAGE_SIZE]
MAX_MODEL_SIZE[Constant: MAX_MODEL_SIZE]
STDLIB_DENY[Constant: STDLIB_DENY]
CACHE_CONFIG[Constant: CACHE_CONFIG]
memoizationCache[Constant: memoizationCache]
DEFAULT_STATE[Constant: DEFAULT_STATE]
LOD_THRESHOLDS[Constant: LOD_THRESHOLDS]
LOD_THRESHOLDS_SQ[Constant: LOD_THRESHOLDS_SQ]
LOD_THRESHOLDS_PARENT[Constant: LOD_THRESHOLDS_PARENT]
LOD_THRESHOLDS_PARENT_SQ[Constant: LOD_THRESHOLDS_PARENT_SQ]
LOD_LEVELS[Constant: LOD_LEVELS]
FACE_TEXT_DISTANCE[Constant: FACE_TEXT_DISTANCE]
FACE_TEXT_DISTANCE_SQ[Constant: FACE_TEXT_DISTANCE_SQ]
DEFAULT_SCREEN_SHARE[Constant: DEFAULT_SCREEN_SHARE]
ANIMATION_DEBUG[Constant: ANIMATION_DEBUG]
perfMetrics[Constant: perfMetrics]
LAND_BLOBS[Constant: LAND_BLOBS]
MOUNTAIN_BLOBS[Constant: MOUNTAIN_BLOBS]
LAND_THRESHOLD[Constant: LAND_THRESHOLD]
SIGMOID_SHARPNESS[Constant: SIGMOID_SHARPNESS]
SEA_LEVEL_PIXEL[Constant: SEA_LEVEL_PIXEL]
MAX_HEIGHT_M[Constant: MAX_HEIGHT_M]
MAX_DEPTH_M[Constant: MAX_DEPTH_M]
COLOR_SCHEMES[Constant: COLOR_SCHEMES]
DEG_TO_RAD[Constant: DEG_TO_RAD]
NUMERIC_FACE_RE[Constant: NUMERIC_FACE_RE]
_PHI[Constant: _PHI]
_DODECA_SCALE[Constant: _DODECA_SCALE]
_DODECA_VERTICES[Constant: _DODECA_VERTICES]
_DODECA_FACES[Constant: _DODECA_FACES]
_TETRA_SIZE[Constant: _TETRA_SIZE]
_TETRA_VERTICES[Constant: _TETRA_VERTICES]
_TETRA_FACE_CENTERS[Constant: _TETRA_FACE_CENTERS]
_NUMERIC_TO_CUBE_FACE[Constant: _NUMERIC_TO_CUBE_FACE]
WARN_GEOMETRIES[Constant: WARN_GEOMETRIES]
WARN_MATERIALS[Constant: WARN_MATERIALS]
WARN_TEXTURES[Constant: WARN_TEXTURES]
CACHE_LIFETIME[Constant: CACHE_LIFETIME]
POSITION_PRECISION[Constant: POSITION_PRECISION]
CLEAN_PROBABILITY[Constant: CLEAN_PROBABILITY]
FRAME_TIME_BUDGET_MS[Constant: FRAME_TIME_BUDGET_MS]
BAD_FRAME_THRESHOLD[Constant: BAD_FRAME_THRESHOLD]
MOVE_COUNT_WINDOW_MS[Constant: MOVE_COUNT_WINDOW_MS]
MOVE_SETTLE_MS[Constant: MOVE_SETTLE_MS]
SNAP_THRESHOLD[Constant: SNAP_THRESHOLD]
tempPoint[Constant: tempPoint]
tempBounds[Constant: tempBounds]
MAX_CACHE_TILES[Constant: MAX_CACHE_TILES]
CONCURRENT_FETCHES[Constant: CONCURRENT_FETCHES]
queue[Constant: queue]
PAGE_MAX_SIZE[Constant: PAGE_MAX_SIZE]
MAX_PAGES[Constant: MAX_PAGES]
ValidationUtils[Constant: ValidationUtils]
MAX_SAFARI_DECODE_BYTES[Constant: MAX_SAFARI_DECODE_BYTES]
memory[Constant: memory]
__wbindgen_externrefs[Constant: __wbindgen_externrefs]
__wbindgen_malloc[Constant: __wbindgen_malloc]
__wbindgen_free[Constant: __wbindgen_free]
__wbindgen_start[Constant: __wbindgen_start]
BASE_NODE_WIDTH[Constant: BASE_NODE_WIDTH]
BASE_NODE_HEIGHT[Constant: BASE_NODE_HEIGHT]
CHAR_WIDTH[Constant: CHAR_WIDTH]
MIN_NODE_WIDTH[Constant: MIN_NODE_WIDTH]
MAX_NODE_WIDTH[Constant: MAX_NODE_WIDTH]
LAYER_SPACING[Constant: LAYER_SPACING]
NODE_SPACING[Constant: NODE_SPACING]
CONTAINER_PAD_TOP[Constant: CONTAINER_PAD_TOP]
CONTAINER_PAD[Constant: CONTAINER_PAD]
CONN_CONTROLFLOW[Constant: CONN_CONTROLFLOW]
CONN_DOTTED[Constant: CONN_DOTTED]
CONN_DATAFLOW[Constant: CONN_DATAFLOW]
workerApi[Constant: workerApi]
HAND_PRESENCE_THRESHOLD[Constant: HAND_PRESENCE_THRESHOLD]
TRACKED_HAND_KEEP_THRESHOLD[Constant: TRACKED_HAND_KEEP_THRESHOLD]
MAX_HANDS[Constant: MAX_HANDS]
ROI_DEDUP_CENTER_FRAC[Constant: ROI_DEDUP_CENTER_FRAC]
TRACKING_CONFIDENCE_THRESHOLD[Constant: TRACKING_CONFIDENCE_THRESHOLD]
KP_WRIST[Constant: KP_WRIST]
KP_MIDDLE_MCP[Constant: KP_MIDDLE_MCP]
ROI_THETA0[Constant: ROI_THETA0]
ROI_DSCALE[Constant: ROI_DSCALE]
ROI_DY[Constant: ROI_DY]
LOD_CHILD_FULL_SQ[Constant: LOD_CHILD_FULL_SQ]
LOD_CHILD_MEDIUM_SQ[Constant: LOD_CHILD_MEDIUM_SQ]
LOD_PARENT_FULL_SQ[Constant: LOD_PARENT_FULL_SQ]
LOD_PARENT_MEDIUM_SQ[Constant: LOD_PARENT_MEDIUM_SQ]
PADDING[Constant: PADDING]
pages[Constant: pages]
PYTHON_QUERY[Constant: PYTHON_QUERY]
JAVASCRIPT_QUERY[Constant: JAVASCRIPT_QUERY]
TYPESCRIPT_QUERY[Constant: TYPESCRIPT_QUERY]
GO_QUERY[Constant: GO_QUERY]
RUST_QUERY[Constant: RUST_QUERY]
JAVA_QUERY[Constant: JAVA_QUERY]
C_QUERY[Constant: C_QUERY]
CPP_QUERY[Constant: CPP_QUERY]
CSHARP_QUERY[Constant: CSHARP_QUERY]
RUBY_QUERY[Constant: RUBY_QUERY]
PHP_QUERY[Constant: PHP_QUERY]
LANGUAGES[Constant: LANGUAGES]

%% Variables
engine[Variable: engine]
totalNodes[Variable: totalNodes]
totalConn[Variable: totalConn]
errors[Variable: errors]
warnings[Variable: warnings]
allOk[Variable: allOk]
isNetworkEnabled[Variable: isNetworkEnabled]
listenersArePaused[Variable: listenersArePaused]
cachedAnchors[Variable: cachedAnchors]
stream[Variable: stream]
video[Variable: video]
rafHandle[Variable: rafHandle]
rvfcHandle[Variable: rvfcHandle]
frameCounter[Variable: frameCounter]
fpsTimer[Variable: fpsTimer]
running[Variable: running]
paused[Variable: paused]
inferring[Variable: inferring]
visibilityHandler[Variable: visibilityHandler]
workerProxy[Variable: workerProxy]
workerInitPromise[Variable: workerInitPromise]
batchFlushTimer[Variable: batchFlushTimer]
_storageInstance[Variable: _storageInstance]
globalStreamlinedManager[Variable: globalStreamlinedManager]
_pendingSetObjectsTimer[Variable: _pendingSetObjectsTimer]
isAnimating[Variable: isAnimating]
lastTimestamp[Variable: lastTimestamp]
animationSpeed[Variable: animationSpeed]
animationFrame[Variable: animationFrame]
globalBVH[Variable: globalBVH]
lastLODUpdateTime[Variable: lastLODUpdateTime]
heightmapData[Variable: heightmapData]
isInitialLoading[Variable: isInitialLoading]
_workerBusy[Variable: _workerBusy]
_frameBudget[Variable: _frameBudget]
_frameUsed[Variable: _frameUsed]
_resetScheduled[Variable: _resetScheduled]
_prevFrameTs[Variable: _prevFrameTs]
_smoothFrameTime[Variable: _smoothFrameTime]
_consecutiveBadFrames[Variable: _consecutiveBadFrames]
_moveCount[Variable: _moveCount]
_moveCountResetTime[Variable: _moveCountResetTime]
_frameTrackingRunning[Variable: _frameTrackingRunning]
_lastMoveTs[Variable: _lastMoveTs]
activeFetches[Variable: activeFetches]
_onTilesLoaded[Variable: _onTilesLoaded]
_loadedCount[Variable: _loadedCount]
globalAtlas[Variable: globalAtlas]
_offscreenCanvasSupported[Variable: _offscreenCanvasSupported]
_wasm[Variable: _wasm]
_initPromise[Variable: _initPromise]
_ready[Variable: _ready]
cachedFloat32ArrayMemory0[Variable: cachedFloat32ArrayMemory0]
cachedUint32ArrayMemory0[Variable: cachedUint32ArrayMemory0]
cachedUint8ArrayMemory0[Variable: cachedUint8ArrayMemory0]
numBytesDecoded[Variable: numBytesDecoded]
WASM_VECTOR_LEN[Variable: WASM_VECTOR_LEN]
wasmModule[Variable: wasmModule]
wasm[Variable: wasm]
_proxy[Variable: _proxy]
_worker[Variable: _worker]
ort[Variable: ort]
handDetectorSession[Variable: handDetectorSession]
handLandmarkSession[Variable: handLandmarkSession]
executionProvidersUsed[Variable: executionProvidersUsed]
letterboxCanvas[Variable: letterboxCanvas]
letterboxCtx[Variable: letterboxCtx]
roiCanvas[Variable: roiCanvas]
roiCtx[Variable: roiCtx]
prevHandsState[Variable: prevHandsState]
pooledPalmBuffer[Variable: pooledPalmBuffer]
pooledLandmarkBuffer[Variable: pooledLandmarkBuffer]
_wasmMod[Variable: _wasmMod]
objectIdList[Variable: objectIdList]
maxGPUTextureSize[Variable: maxGPUTextureSize]
instance[Variable: instance]

%% Interfaces
ConnectionPoint[[Interface: ConnectionPoint]]
ParsedNode[[Interface: ParsedNode]]
ParsedConnection[[Interface: ParsedConnection]]
ParsedFlowPath[[Interface: ParsedFlowPath]]
ParsedGraph[[Interface: ParsedGraph]]
VisualProperties[[Interface: VisualProperties]]
ASTNode[[Interface: ASTNode]]
ASTConnection[[Interface: ASTConnection]]
FlowPath[[Interface: FlowPath]]
AST3DGraph[[Interface: AST3DGraph]]
ASTConfig[[Interface: ASTConfig]]
Config[[Interface: Config]]
Position3D[[Interface: Position3D]]
Rotation3D[[Interface: Rotation3D]]
Scale3D[[Interface: Scale3D]]
Transform3D[[Interface: Transform3D]]
Face[[Interface: Face]]
AST3DBlock[[Interface: AST3DBlock]]
ProcessedDiagram[[Interface: ProcessedDiagram]]
InitInput[[Interface: InitInput]]
InitOutput[[Interface: InitOutput]]
SyncInitInput[[Interface: SyncInitInput]]

%% External Libraries
@eslint/js<Library: @eslint/js>
globals<Library: globals>
eslint-plugin-react<Library: eslint-plugin-react>
eslint-plugin-react-hooks<Library: eslint-plugin-react-hooks>
eslint-plugin-react-refresh<Library: eslint-plugin-react-refresh>
firebase-admin/app<Library: firebase-admin/app>
firebase-admin/auth<Library: firebase-admin/auth>
firebase-admin/firestore<Library: firebase-admin/firestore>
firebase-functions/v2/https<Library: firebase-functions/v2/https>
firebase-functions/v2/firestore<Library: firebase-functions/v2/firestore>
firebase-functions/params<Library: firebase-functions/params>
puppeteer-core<Library: puppeteer-core>
@sparticuz/chromium<Library: @sparticuz/chromium>
express<Library: express>
cors<Library: cors>
dotenv<Library: dotenv>
fs<Library: fs>
esbuild<Library: esbuild>
os<Library: os>
path<Library: path>
module<Library: module>
react<Library: react>
@react-three/fiber<Library: @react-three/fiber>
@react-three/postprocessing<Library: @react-three/postprocessing>
@react-three/drei/core/Stats<Library: @react-three/drei/core/Stats>
lodash/isEqual<Library: lodash/isEqual>
@react-three/drei<Library: @react-three/drei>
three<Library: three>
react-colorful<Library: react-colorful>
zustand/shallow<Library: zustand/shallow>
@xyflow/react<Library: @xyflow/react>
@xyflow/react/dist/style.css<Library: @xyflow/react/dist/style.css>
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
@babel/parser<Library: @babel/parser>
comlink<Library: comlink>
fix-webm-duration<Library: fix-webm-duration>
uuid<Library: uuid>
zustand/traditional<Library: zustand/traditional>
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
@vitejs/plugin-react<Library: @vitejs/plugin-react>
vite-plugin-glsl<Library: vite-plugin-glsl>
vite-plugin-wasm<Library: vite-plugin-wasm>
vite-plugin-top-level-await<Library: vite-plugin-top-level-await>

%% Component Internal Functions
appObjects[Function: appObjects]
appCanViewSpace[Function: appCanViewSpace]
appShouldRedirect[Function: appShouldRedirect]
appHandleSpatialObjectChange[Function: appHandleSpatialObjectChange]
appSpatialManagerDebug[Function: appSpatialManagerDebug]
appCheckPositionJitterWithHistory[Function: appCheckPositionJitterWithHistory]
appLoadedCellsKey[Function: appLoadedCellsKey]
appHandleObjectMatrixChanged[Function: appHandleObjectMatrixChanged]
appDisableOrbitControls[Function: appDisableOrbitControls]
appEnableOrbitControls[Function: appEnableOrbitControls]
appHandleLogin[Function: appHandleLogin]
appHandleObjectClick[Function: appHandleObjectClick]
appHandleObjectMoveCallback[Function: appHandleObjectMoveCallback]
appHandleObjectUpdateCallback[Function: appHandleObjectUpdateCallback]
appHandleFaceIndicatorClickCallback[Function: appHandleFaceIndicatorClickCallback]
appHandleFaceClick[Function: appHandleFaceClick]
appHandleCanvasClick[Function: appHandleCanvasClick]
appUpdateVisibleObjects[Function: appUpdateVisibleObjects]
appThrottledUpdateVisibility[Function: appThrottledUpdateVisibility]
appDeviceInfo[Function: appDeviceInfo]
appCanvasSettings[Function: appCanvasSettings]
appPerformInitialObjectFetch[Function: appPerformInitialObjectFetch]
appScheduleLoadingComplete[Function: appScheduleLoadingComplete]
appHandleCameraUpdate[Function: appHandleCameraUpdate]
appHandleCameraSettle[Function: appHandleCameraSettle]
animatedconnectionlineStructuralKey[Function: animatedconnectionlineStructuralKey]
atlastextspriteAtlas[Function: atlastextspriteAtlas]
atlastextspriteCalculatedPosition[Function: atlastextspriteCalculatedPosition]
batchedconnectionlinesStraightConnections[Function: batchedconnectionlinesStraightConnections]
batchedconnectionlinesCustomRaycast[Function: batchedconnectionlinesCustomRaycast]
batchedconnectionlinesHandleClick[Function: batchedconnectionlinesHandleClick]
batchedconnectionlinesHandlePointerOver[Function: batchedconnectionlinesHandlePointerOver]
batchedconnectionlinesHandlePointerOut[Function: batchedconnectionlinesHandlePointerOut]
batchedcurvedlinesPathsData[Function: batchedcurvedlinesPathsData]
batchedcurvedlinesCustomRaycast[Function: batchedcurvedlinesCustomRaycast]
batchedcurvedlinesHandleClick[Function: batchedcurvedlinesHandleClick]
batchedcurvedlinesHandlePointerOver[Function: batchedcurvedlinesHandlePointerOver]
batchedcurvedlinesHandlePointerOut[Function: batchedcurvedlinesHandlePointerOut]
bvhintegrationHandleCanvasClick[Function: bvhintegrationHandleCanvasClick]
cellboundaryrendererBuildGeometry[Function: cellboundaryrendererBuildGeometry]
colorpickerHandleColorChange[Function: colorpickerHandleColorChange]
colorpickerHandleContainerClick[Function: colorpickerHandleContainerClick]
colorpickerHandleApplyColor[Function: colorpickerHandleApplyColor]
colorpickerHandleCancel[Function: colorpickerHandleCancel]
connectionGetLineWidth[Function: connectionGetLineWidth]
connectionHandleConnectionClick[Function: connectionHandleConnectionClick]
connectionHandleLineTextClick[Function: connectionHandleLineTextClick]
connectionHandleLineTextSubmit[Function: connectionHandleLineTextSubmit]
connectionHandleLineTextStyleChange[Function: connectionHandleLineTextStyleChange]
connectionHandleLineStyleChange[Function: connectionHandleLineStyleChange]
connectionHandleLineColorChange[Function: connectionHandleLineColorChange]
connectionConnectionData[Function: connectionConnectionData]
connectionPathData[Function: connectionPathData]
connectionTextPositionData[Function: connectionTextPositionData]
connectionsrendererAvailableObjectIds[Function: connectionsrendererAvailableObjectIds]
connectionsrendererPathfindingObjects[Function: connectionsrendererPathfindingObjects]
connectionsrendererObjectsPositionHash[Function: connectionsrendererObjectsPositionHash]
connectionsrendererObjectVisibleConnections[Function: connectionsrendererObjectVisibleConnections]
connectionsrendererFocusedConnections[Function: connectionsrendererFocusedConnections]
connectionsrendererFlowPathHighlightedConnections[Function: connectionsrendererFlowPathHighlightedConnections]
connectionsrendererConnectionsForCulling[Function: connectionsrendererConnectionsForCulling]
connectionsrendererProgressiveConnections[Function: connectionsrendererProgressiveConnections]
connectionsrendererObjectPositions[Function: connectionsrendererObjectPositions]
connectionsrendererAllStraightConnections[Function: connectionsrendererAllStraightConnections]
connectionsrendererFaceOverrides[Function: connectionsrendererFaceOverrides]
connectionsrendererTextLabels[Function: connectionsrendererTextLabels]
connectionsrendererHandleBatchedConnectionClick[Function: connectionsrendererHandleBatchedConnectionClick]
connectionsrendererMountNextBatch[Function: connectionsrendererMountNextBatch]
cubeCubeData[Function: cubeCubeData]
cubeIsIndicatorConnected[Function: cubeIsIndicatorConnected]
cubeIsIndicatorActive[Function: cubeIsIndicatorActive]
cubeGetUIPositions[Function: cubeGetUIPositions]
cubeShouldShowIndicator[Function: cubeShouldShowIndicator]
cubeHasConnectedIndicators[Function: cubeHasConnectedIndicators]
cubeGetFaceTextOffset[Function: cubeGetFaceTextOffset]
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
cubeHandleDrag[Function: cubeHandleDrag]
cubeHandleScale[Function: cubeHandleScale]
cubeRenderFaces[Function: cubeRenderFaces]
cubeRenderFaceTexts[Function: cubeRenderFaceTexts]
cubeRunReconcile[Function: cubeRunReconcile]
cubefaceFaceStateSelector[Function: cubefaceFaceStateSelector]
cubefaceFaceMaterial[Function: cubefaceFaceMaterial]
cubefaceHandleClick[Function: cubefaceHandleClick]
cubefaceOffsetMultiplier[Function: cubefaceOffsetMultiplier]
cubefaceOffsetPosition[Function: cubefaceOffsetPosition]
customcameraMemoizedTarget[Function: customcameraMemoizedTarget]
customcameraControlsRefCallback[Function: customcameraControlsRefCallback]
diagramoverlay2dFlowPathNames[Function: diagramoverlay2dFlowPathNames]
diagramoverlay2dSerialisedGraphData[Function: diagramoverlay2dSerialisedGraphData]
diagramoverlay2dSerialisedHierarchy[Function: diagramoverlay2dSerialisedHierarchy]
diagramoverlay2dFilteredEdges[Function: diagramoverlay2dFilteredEdges]
diagramoverlay2dToggleLayer[Function: diagramoverlay2dToggleLayer]
diagramoverlay2dToggleLayerHandlers[Function: diagramoverlay2dToggleLayerHandlers]
diagramoverlay2dHandleNodeClick[Function: diagramoverlay2dHandleNodeClick]
diagramoverlay2dHandleBackTo3D[Function: diagramoverlay2dHandleBackTo3D]
sphereDodecahedronData[Function: sphereDodecahedronData]
sphereUpdateObjectAndStores[Function: sphereUpdateObjectAndStores]
sphereUpdateFaceProperty[Function: sphereUpdateFaceProperty]
sphereIsIndicatorConnected[Function: sphereIsIndicatorConnected]
sphereOnClickOutside[Function: sphereOnClickOutside]
sphereUpdateDatabase[Function: sphereUpdateDatabase]
sphereHandleTransformToggle[Function: sphereHandleTransformToggle]
sphereHandleHeaderToggle[Function: sphereHandleHeaderToggle]
sphereHandleHeaderSubmit[Function: sphereHandleHeaderSubmit]
sphereHandleResizeToggle[Function: sphereHandleResizeToggle]
sphereHandleDrag[Function: sphereHandleDrag]
sphereHandleScale[Function: sphereHandleScale]
sphereHandleFaceClick[Function: sphereHandleFaceClick]
sphereHandleIndicatorClick[Function: sphereHandleIndicatorClick]
sphereHandleHeaderClick[Function: sphereHandleHeaderClick]
sphereHandleStyleChange[Function: sphereHandleStyleChange]
sphereHandleLineColorChange[Function: sphereHandleLineColorChange]
sphereHandleBackgroundClick[Function: sphereHandleBackgroundClick]
sphereHandleFaceTextSubmit[Function: sphereHandleFaceTextSubmit]
sphereHandleFaceTextButtonClick[Function: sphereHandleFaceTextButtonClick]
sphereHandleFaceTextClick[Function: sphereHandleFaceTextClick]
sphereHandleFaceTextStyleChange[Function: sphereHandleFaceTextStyleChange]
sphereGetUIPosition[Function: sphereGetUIPosition]
sphereGetHeaderPosition[Function: sphereGetHeaderPosition]
sphereGetFaceUIPosition[Function: sphereGetFaceUIPosition]
sphereGetFaceTextPosition[Function: sphereGetFaceTextPosition]
sphereGetFaceInfo[Function: sphereGetFaceInfo]
sphereGetFaceRotation[Function: sphereGetFaceRotation]
sphereShouldShowFaceIndicator[Function: sphereShouldShowFaceIndicator]
sphereGetHeaderInputPosition[Function: sphereGetHeaderInputPosition]
dodecahedronfaceFaceMaterial[Function: dodecahedronfaceFaceMaterial]
dodecahedronfaceHandleClick[Function: dodecahedronfaceHandleClick]
dodecahedronfaceHandleTextClick[Function: dodecahedronfaceHandleTextClick]
dodecahedronfaceInverseScale[Function: dodecahedronfaceInverseScale]
dodecahedronfaceAdjustedTextPosition[Function: dodecahedronfaceAdjustedTextPosition]
earthglobeHandlePointerDown[Function: earthglobeHandlePointerDown]
earthglobeHandlePointerUp[Function: earthglobeHandlePointerUp]
earthglobeBands[Function: earthglobeBands]
earthglobeMeshGeometry[Function: earthglobeMeshGeometry]
earthglobeLocalDetail[Function: earthglobeLocalDetail]
earthglobeLocalBands[Function: earthglobeLocalBands]
earthglobeLocalMeshGeometry[Function: earthglobeLocalMeshGeometry]
faceindicatorMaterial[Function: faceindicatorMaterial]
facetextinputHandleKeyDown[Function: facetextinputHandleKeyDown]
facetextinputHandleChange[Function: facetextinputHandleChange]
facetextinputHandleFocus[Function: facetextinputHandleFocus]
facetextinputHandleBlur[Function: facetextinputHandleBlur]
faceuiHandleBorderStyleClick[Function: faceuiHandleBorderStyleClick]
faceuiHandleBorderColorClick[Function: faceuiHandleBorderColorClick]
faceuiHandleLineThicknessClick[Function: faceuiHandleLineThicknessClick]
faceuiHandleColorSelect[Function: faceuiHandleColorSelect]
faceuiHandleToolClick[Function: faceuiHandleToolClick]
globalcubeedgesrendererFilteredCubes[Function: globalcubeedgesrendererFilteredCubes]
globalcubeedgesrendererCubeIds[Function: globalcubeedgesrendererCubeIds]
globalcubeedgesrendererIsCubeVisible[Function: globalcubeedgesrendererIsCubeVisible]
globalcubeedgesrendererUpdateCubeEdges[Function: globalcubeedgesrendererUpdateCubeEdges]
globalcubefacerendererFilteredCubes[Function: globalcubefacerendererFilteredCubes]
globalcubefulllodinstancedrendererInstancedCubes[Function: globalcubefulllodinstancedrendererInstancedCubes]
globalcubefulllodinstancedrendererCubeIds[Function: globalcubefulllodinstancedrendererCubeIds]
globalcubefulllodinstancedrendererHandleClick[Function: globalcubefulllodinstancedrendererHandleClick]
globalcubemediumlodrendererMediumCubes[Function: globalcubemediumlodrendererMediumCubes]
globalcubemediumlodrendererCubeIds[Function: globalcubemediumlodrendererCubeIds]
globaldodecahedronedgesrendererFilteredDodecahedrons[Function: globaldodecahedronedgesrendererFilteredDodecahedrons]
globaldodecahedronedgesrendererDodecahedronIds[Function: globaldodecahedronedgesrendererDodecahedronIds]
globaldodecahedronedgesrendererIsDodecahedronVisible[Function: globaldodecahedronedgesrendererIsDodecahedronVisible]
globaldodecahedronedgesrendererUpdateDodecahedronEdges[Function: globaldodecahedronedgesrendererUpdateDodecahedronEdges]
globaldodecahedronmediumlodrendererMediumDodecahedrons[Function: globaldodecahedronmediumlodrendererMediumDodecahedrons]
globaldodecahedronmediumlodrendererDodecaIds[Function: globaldodecahedronmediumlodrendererDodecaIds]
globaltetrahedronedgesrendererFilteredTetrahedrons[Function: globaltetrahedronedgesrendererFilteredTetrahedrons]
globaltetrahedronedgesrendererTetrahedronIds[Function: globaltetrahedronedgesrendererTetrahedronIds]
globaltetrahedronedgesrendererIsTetrahedronVisible[Function: globaltetrahedronedgesrendererIsTetrahedronVisible]
globaltetrahedronedgesrendererUpdateTetrahedronEdges[Function: globaltetrahedronedgesrendererUpdateTetrahedronEdges]
globaltetrahedronmediumlodrendererMediumTetrahedrons[Function: globaltetrahedronmediumlodrendererMediumTetrahedrons]
globaltetrahedronmediumlodrendererTetraIds[Function: globaltetrahedronmediumlodrendererTetraIds]
headerinputHandleKeyDown[Function: headerinputHandleKeyDown]
headerinputHandleChange[Function: headerinputHandleChange]
headerinputHandleFocus[Function: headerinputHandleFocus]
headerinputHandleBlur[Function: headerinputHandleBlur]
instancedatlastextAtlas[Function: instancedatlastextAtlas]
instancedatlastextPageGroups[Function: instancedatlastextPageGroups]
pageinstancedmeshGeometry[Function: pageinstancedmeshGeometry]
pageinstancedmeshMaterial[Function: pageinstancedmeshMaterial]
pageinstancedmeshHandleClick[Function: pageinstancedmeshHandleClick]
instancedlineFlatPoints[Function: instancedlineFlatPoints]
instancedlineGeometry[Function: instancedlineGeometry]
instancedlineCustomRaycast[Function: instancedlineCustomRaycast]
instancedlineMaterial[Function: instancedlineMaterial]
lineuiGetFullStyle[Function: lineuiGetFullStyle]
lineuiGetBaseStyle[Function: lineuiGetBaseStyle]
lineuiHandleToolClick[Function: lineuiHandleToolClick]
lineuiHandleLineStyleClick[Function: lineuiHandleLineStyleClick]
lineuiHandleArrowClick[Function: lineuiHandleArrowClick]
lodmanagerContainersKey[Function: lodmanagerContainersKey]
lodmanagerComputeContainmentSync[Function: lodmanagerComputeContainmentSync]
lodmanagerEnqueueLODUpdates[Function: lodmanagerEnqueueLODUpdates]
modelobjectHandleClick[Function: modelobjectHandleClick]
modelobjectHandlePointerDown[Function: modelobjectHandlePointerDown]
modelobjectHandlePointerUp[Function: modelobjectHandlePointerUp]
objectrendererOnClickStable[Function: objectrendererOnClickStable]
objectrendererOnDeleteStable[Function: objectrendererOnDeleteStable]
objectrendererOnTransformStartStable[Function: objectrendererOnTransformStartStable]
objectrendererOnTransformEndStable[Function: objectrendererOnTransformEndStable]
objectrendererOnMatrixChangedStable[Function: objectrendererOnMatrixChangedStable]
objectrendererOnMoveStable[Function: objectrendererOnMoveStable]
objectsrendererProgressiveVisibleObjects[Function: objectsrendererProgressiveVisibleObjects]
objectsrendererCubeObjects[Function: objectsrendererCubeObjects]
objectsrendererContainerHeaders[Function: objectsrendererContainerHeaders]
objectsrendererDodecahedronObjects[Function: objectsrendererDodecahedronObjects]
objectsrendererTetrahedronObjects[Function: objectsrendererTetrahedronObjects]
objectsrendererUnmodifiedCubeIds[Function: objectsrendererUnmodifiedCubeIds]
objectsrendererHandleInstancedCubeClick[Function: objectsrendererHandleInstancedCubeClick]
objectsrendererRenderedObjects[Function: objectsrendererRenderedObjects]
objectsrendererMountNextBatch[Function: objectsrendererMountNextBatch]
objectsrendererMountResume[Function: objectsrendererMountResume]
objectuiHandleEyeClick[Function: objectuiHandleEyeClick]
objectuiHandleColorPick[Function: objectuiHandleColorPick]
objectuiHandleToolClick[Function: objectuiHandleToolClick]
planePlaneData[Function: planePlaneData]
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
planeApplyStreamScale[Function: planeApplyStreamScale]
planeRestoreStreamScale[Function: planeRestoreStreamScale]
planeHandleWebcamToggle[Function: planeHandleWebcamToggle]
planeHandleScreenShareToggle[Function: planeHandleScreenShareToggle]
planeHandlePinToggle[Function: planeHandlePinToggle]
planeHandleImageUpload[Function: planeHandleImageUpload]
planeHandleBroadcastStarted[Function: planeHandleBroadcastStarted]
planeHandleViewerCountChange[Function: planeHandleViewerCountChange]
planeUiPositions[Function: planeUiPositions]
planeIndicatorPosition[Function: planeIndicatorPosition]
planeMeshMaterial[Function: planeMeshMaterial]
planeLineMaterialProps[Function: planeLineMaterialProps]
planeBorderEdgePoints[Function: planeBorderEdgePoints]
realtimeconnectionupdaterRunConnectionUpdate[Function: realtimeconnectionupdaterRunConnectionUpdate]
realtimeconnectionupdaterRebuildConnectionMap[Function: realtimeconnectionupdaterRebuildConnectionMap]
realtimeconnectionupdaterUpdateConnectionEndpoint[Function: realtimeconnectionupdaterUpdateConnectionEndpoint]
groupedviewToggleGroup[Function: groupedviewToggleGroup]
groupedviewMarkReachable[Function: groupedviewMarkReachable]
repoanalysisoverlayToggle[Function: repoanalysisoverlayToggle]
repoanalysisoverlayVisibleRoots[Function: repoanalysisoverlayVisibleRoots]
repoanalysisoverlayExpandAll[Function: repoanalysisoverlayExpandAll]
repoanalysisoverlayCollapseAll[Function: repoanalysisoverlayCollapseAll]
repoanalysisoverlayAncestorOf[Function: repoanalysisoverlayAncestorOf]
repogridContainers[Function: repogridContainers]
repogridGridData[Function: repogridGridData]
screensharestreamAttemptPlay[Function: screensharestreamAttemptPlay]
screensharestreamConnectToBroadcast[Function: screensharestreamConnectToBroadcast]
spacechatHandleScroll[Function: spacechatHandleScroll]
spacechatHandleSend[Function: spacechatHandleSend]
spacechatHandleKeyDown[Function: spacechatHandleKeyDown]
handtrackingtoggleHandleClick[Function: handtrackingtoggleHandleClick]
tetrahedronTetrahedronFaces[Function: tetrahedronTetrahedronFaces]
tetrahedronPosition[Function: tetrahedronPosition]
tetrahedronScale[Function: tetrahedronScale]
tetrahedronTextStyle[Function: tetrahedronTextStyle]
tetrahedronFaceColors[Function: tetrahedronFaceColors]
tetrahedronFaceTexts[Function: tetrahedronFaceTexts]
tetrahedronFaceTextStyles[Function: tetrahedronFaceTextStyles]
tetrahedronDebouncedUpdate[Function: tetrahedronDebouncedUpdate]
tetrahedronIsIndicatorConnected[Function: tetrahedronIsIndicatorConnected]
tetrahedronIsIndicatorActive[Function: tetrahedronIsIndicatorActive]
tetrahedronGetUIPositions[Function: tetrahedronGetUIPositions]
tetrahedronShouldShowIndicator[Function: tetrahedronShouldShowIndicator]
tetrahedronHasConnectedIndicators[Function: tetrahedronHasConnectedIndicators]
tetrahedronTetrahedronEdgePoints[Function: tetrahedronTetrahedronEdgePoints]
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
tetrahedronHandleDrag[Function: tetrahedronHandleDrag]
tetrahedronHandleScale[Function: tetrahedronHandleScale]
tetrahedronGetFaceTextOffset[Function: tetrahedronGetFaceTextOffset]
tetrahedronHandleFaceTextStyleClick[Function: tetrahedronHandleFaceTextStyleClick]
tetrahedronHandleFaceTextStyleChange[Function: tetrahedronHandleFaceTextStyleChange]
tetrahedronRenderFaceTexts[Function: tetrahedronRenderFaceTexts]
tetrahedronRenderFaces[Function: tetrahedronRenderFaces]
tetrahedronfaceFaceMaterial[Function: tetrahedronfaceFaceMaterial]
tetrahedronfaceHandleClick[Function: tetrahedronfaceHandleClick]
tetrahedronfaceHandleIndicatorClickLocal[Function: tetrahedronfaceHandleIndicatorClickLocal]
tetrahedronfaceGetFaceTextOffset[Function: tetrahedronfaceGetFaceTextOffset]
tetrahedronfaceHandleFaceTextStyleClick[Function: tetrahedronfaceHandleFaceTextStyleClick]
tetrahedronfaceHandleFaceTextStyleChange[Function: tetrahedronfaceHandleFaceTextStyleChange]
tetrahedronfaceFaceTextElement[Function: tetrahedronfaceFaceTextElement]
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
textobjectHandleTransformToggle[Function: textobjectHandleTransformToggle]
textobjectHandleResizeToggle[Function: textobjectHandleResizeToggle]
textobjectGetIndicatorOffset[Function: textobjectGetIndicatorOffset]
textobjectIsIndicatorConnected[Function: textobjectIsIndicatorConnected]
textobjectShouldShowIndicator[Function: textobjectShouldShowIndicator]
textobjectGetIndicatorPositions[Function: textobjectGetIndicatorPositions]
textobjectUpdateWorldMatrix[Function: textobjectUpdateWorldMatrix]
textobjectCloseAllUIs[Function: textobjectCloseAllUIs]
textobjectUpdateDatabase[Function: textobjectUpdateDatabase]
textobjectAutoResizeTextAreaOnly[Function: textobjectAutoResizeTextAreaOnly]
textobjectAutoResizeTextArea[Function: textobjectAutoResizeTextArea]
textobjectHandleBlur[Function: textobjectHandleBlur]
textobjectHandleDivClick[Function: textobjectHandleDivClick]
textobjectHandleTextClick[Function: textobjectHandleTextClick]
textobjectHandleIndicatorClick[Function: textobjectHandleIndicatorClick]
textobjectHandleDrag[Function: textobjectHandleDrag]
textobjectHandleScale[Function: textobjectHandleScale]
textobjectHandleKeyDown[Function: textobjectHandleKeyDown]
textobjectHandleStyleChange[Function: textobjectHandleStyleChange]
textobjectHandleTextSelection[Function: textobjectHandleTextSelection]
textobjectGetTextAreaStyle[Function: textobjectGetTextAreaStyle]
textobjectGetContainerStyle[Function: textobjectGetContainerStyle]
textobjectGetEffectivePosition[Function: textobjectGetEffectivePosition]
textobjectApplyStyleToSelectionInternal[Function: textobjectApplyStyleToSelectionInternal]
textobjectGetTransformControlSize[Function: textobjectGetTransformControlSize]
textobjectuiHandleUIClick[Function: textobjectuiHandleUIClick]
textobjectuiHandleResizeToggle[Function: textobjectuiHandleResizeToggle]
textobjectuiHandleEyeClick[Function: textobjectuiHandleEyeClick]
textspriteSpriteId[Function: textspriteSpriteId]
textspriteSetIsDragging[Function: textspriteSetIsDragging]
textspriteCalculatedPosition[Function: textspriteCalculatedPosition]
textspriteGetFontSize[Function: textspriteGetFontSize]
textstyleuicontentHandleSizeChange[Function: textstyleuicontentHandleSizeChange]
textstyleuicontentHandleFontSizeInputChange[Function: textstyleuicontentHandleFontSizeInputChange]
textstyleuicontentHandleWheel[Function: textstyleuicontentHandleWheel]
textstyleuicontentHandleButtonClick[Function: textstyleuicontentHandleButtonClick]
textstyleuicontentHandleColorSelect[Function: textstyleuicontentHandleColorSelect]
textstyleuicontentHandleSelectChange[Function: textstyleuicontentHandleSelectChange]
textstyleuicontentGetUIScale[Function: textstyleuicontentGetUIScale]
uioverlayPipelineTasks[Function: uioverlayPipelineTasks]
uioverlayPipelineStatusCounts[Function: uioverlayPipelineStatusCounts]
uioverlaySetIsRecording[Function: uioverlaySetIsRecording]
uioverlayHandleCellBoundariesToggle[Function: uioverlayHandleCellBoundariesToggle]
uioverlayFetchRepositories[Function: uioverlayFetchRepositories]
uioverlayFetchAppJsxFromRepo[Function: uioverlayFetchAppJsxFromRepo]
uioverlayHandleRescan[Function: uioverlayHandleRescan]
uioverlayHandleDownloadMarkdown[Function: uioverlayHandleDownloadMarkdown]
uioverlayHandleScreenClick[Function: uioverlayHandleScreenClick]
uioverlayHandleRuntimeScan[Function: uioverlayHandleRuntimeScan]
uioverlayHandleRecordClick[Function: uioverlayHandleRecordClick]
uioverlayHandleDeleteAllCells[Function: uioverlayHandleDeleteAllCells]
uioverlayHandleModelUpload[Function: uioverlayHandleModelUpload]
uioverlayHandleModelFileSelect[Function: uioverlayHandleModelFileSelect]
uioverlayHandleMarkdownUpload[Function: uioverlayHandleMarkdownUpload]
uioverlayHandleMarkdownFileSelect[Function: uioverlayHandleMarkdownFileSelect]
uioverlayHandleCsvUpload[Function: uioverlayHandleCsvUpload]
uioverlayHandleCsvFileSelect[Function: uioverlayHandleCsvFileSelect]
uioverlayHandleMenuToggle[Function: uioverlayHandleMenuToggle]
uioverlayHandleArrowClick[Function: uioverlayHandleArrowClick]
uioverlayHandleUnpinWebcam[Function: uioverlayHandleUnpinWebcam]
uioverlayHandleTemplateConfigChange[Function: uioverlayHandleTemplateConfigChange]
uioverlayCreateTemplate[Function: uioverlayCreateTemplate]
uioverlayTriggerDownload[Function: uioverlayTriggerDownload]
uioverlayHandler[Function: uioverlayHandler]
uioverlayPollStatus[Function: uioverlayPollStatus]
webcamstreamAttemptPlay[Function: webcamstreamAttemptPlay]
webcamstreamConnectToBroadcast[Function: webcamstreamConnectToBroadcast]
createorganizationpopupHandleKeyPress[Function: createorganizationpopupHandleKeyPress]
createorganizationpopupHandleSubmit[Function: createorganizationpopupHandleSubmit]
createspacepopupHandleSpaceNameChange[Function: createspacepopupHandleSpaceNameChange]
createspacepopupHandleEmailChange[Function: createspacepopupHandleEmailChange]
createspacepopupHandleMemberSelect[Function: createspacepopupHandleMemberSelect]
createspacepopupHandleKeyPress[Function: createspacepopupHandleKeyPress]
createspacepopupHandleSubmit[Function: createspacepopupHandleSubmit]
dodecahedronwireframe2GenerateDodecahedronEdges[Function: dodecahedronwireframe2GenerateDodecahedronEdges]
organizationmanagerRefresh[Function: organizationmanagerRefresh]
organizationmanagerHandleCreateOrg[Function: organizationmanagerHandleCreateOrg]
organizationmanagerHandleInvite[Function: organizationmanagerHandleInvite]
organizationmanagerHandleRemoveMember[Function: organizationmanagerHandleRemoveMember]
organizationmanagerHandleLeave[Function: organizationmanagerHandleLeave]
organizationmanagerHandleUpgradePlan[Function: organizationmanagerHandleUpgradePlan]
organizationmanagerHandleDeleteOrg[Function: organizationmanagerHandleDeleteOrg]
organizationmanagerHandleAcceptInvite[Function: organizationmanagerHandleAcceptInvite]
organizationmanagerHandleDeclineInvite[Function: organizationmanagerHandleDeclineInvite]
orgmemberdropdownHandleInputFocus[Function: orgmemberdropdownHandleInputFocus]
orgmemberdropdownHandleInputChange[Function: orgmemberdropdownHandleInputChange]
orgmemberdropdownHandleSelect[Function: orgmemberdropdownHandleSelect]
orgmemberdropdownHandleClickOutside[Function: orgmemberdropdownHandleClickOutside]
sharespacepopupFilteredMembers[Function: sharespacepopupFilteredMembers]
sharespacepopupToggleMember[Function: sharespacepopupToggleMember]
sharespacepopupHandleShare[Function: sharespacepopupHandleShare]
spacestableHandleSpaceClick[Function: spacestableHandleSpaceClick]
spacestableThStyles[Function: spacestableThStyles]
spacestableTdStyles[Function: spacestableTdStyles]
spacestableCategoryRowStyles[Function: spacestableCategoryRowStyles]
spacestableInviteBannerStyle[Function: spacestableInviteBannerStyle]
dodecahedronwireframeGenerateDodecahedronEdges[Function: dodecahedronwireframeGenerateDodecahedronEdges]
fakeglowmaterialFakeGlowMaterial[Function: fakeglowmaterialFakeGlowMaterial]
landingappScheduleScrollUpdate[Function: landingappScheduleScrollUpdate]
landingappCreateUserDocument[Function: landingappCreateUserDocument]
landingappHandleLogin[Function: landingappHandleLogin]
landingappHandleLogout[Function: landingappHandleLogout]
landingappNavigateToSpace[Function: landingappNavigateToSpace]
landingappFetchUserSpaces[Function: landingappFetchUserSpaces]
landingappCreateNewSpace[Function: landingappCreateNewSpace]
landingappHandleShareSpace[Function: landingappHandleShareSpace]
landingappHandleDeleteSpace[Function: landingappHandleDeleteSpace]
landingappHandleLeaveSpace[Function: landingappHandleLeaveSpace]
landingappHandleFirstCubeComplete[Function: landingappHandleFirstCubeComplete]
landingappHandleDodecahedronComplete[Function: landingappHandleDodecahedronComplete]
landingappHandleAcceptInvite[Function: landingappHandleAcceptInvite]
landingappHandleDeclineInvite[Function: landingappHandleDeclineInvite]
landingappSpaceTableProps[Function: landingappSpaceTableProps]
landingappCreateSpaceProps[Function: landingappCreateSpaceProps]
landingappSharePopupProps[Function: landingappSharePopupProps]
landingappHandleWheel[Function: landingappHandleWheel]
landingappHandleTouchStart[Function: landingappHandleTouchStart]
landingappHandleTouchMove[Function: landingappHandleTouchMove]
perspectivegridIdx[Function: perspectivegridIdx]
perspectivegridAddEdge[Function: perspectivegridAddEdge]
updateseditorHandleKeyCommand[Function: updateseditorHandleKeyCommand]
updateseditorToggleInlineStyle[Function: updateseditorToggleInlineStyle]
updateseditorHandleSave[Function: updateseditorHandleSave]
updatesviewerParsedContent[Function: updatesviewerParsedContent]
updatesviewerFormattedTimestamp[Function: updatesviewerFormattedTimestamp]

%% Component-Function Relationships
App -.-> appObjects : "internal function"
App -.-> appCanViewSpace : "internal function"
App -.-> appShouldRedirect : "boolean check"
App -.-> appHandleSpatialObjectChange : "event handler"
App -.-> appSpatialManagerDebug : "internal function"
App -.-> appCheckPositionJitterWithHistory : "boolean check"
App -.-> appLoadedCellsKey : "internal function"
App -.-> appHandleObjectMatrixChanged : "event handler"
App -.-> appDisableOrbitControls : "boolean check"
App -.-> appEnableOrbitControls : "internal function"
App -.-> appHandleLogin : "event handler"
App -.-> appHandleObjectClick : "event handler"
App -.-> appHandleObjectMoveCallback : "event handler"
App -.-> appHandleObjectUpdateCallback : "event handler"
App -.-> appHandleFaceIndicatorClickCallback : "event handler"
App -.-> appHandleFaceClick : "event handler"
App -.-> appHandleCanvasClick : "event handler"
App -.-> appUpdateVisibleObjects : "update helper"
App -.-> appThrottledUpdateVisibility : "update helper"
App -.-> appDeviceInfo : "internal function"
App -.-> appCanvasSettings : "setter function"
App -.-> appPerformInitialObjectFetch : "internal function"
App -.-> appScheduleLoadingComplete : "internal function"
App -.-> appHandleCameraUpdate : "event handler"
App -.-> appHandleCameraSettle : "event handler"
AnimatedConnectionLine -.-> animatedconnectionlineStructuralKey : "internal function"
AtlasTextSprite -.-> atlastextspriteAtlas : "internal function"
AtlasTextSprite -.-> atlastextspriteCalculatedPosition : "calculation helper"
BatchedConnectionLines -.-> batchedconnectionlinesStraightConnections : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesCustomRaycast : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesHandleClick : "event handler"
BatchedConnectionLines -.-> batchedconnectionlinesHandlePointerOver : "event handler"
BatchedConnectionLines -.-> batchedconnectionlinesHandlePointerOut : "event handler"
BatchedCurvedLines -.-> batchedcurvedlinesPathsData : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesCustomRaycast : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesHandleClick : "event handler"
BatchedCurvedLines -.-> batchedcurvedlinesHandlePointerOver : "event handler"
BatchedCurvedLines -.-> batchedcurvedlinesHandlePointerOut : "event handler"
BVHIntegration -.-> bvhintegrationHandleCanvasClick : "event handler"
CellBoundaryRenderer -.-> cellboundaryrendererBuildGeometry : "render helper"
ColorPicker -.-> colorpickerHandleColorChange : "event handler"
ColorPicker -.-> colorpickerHandleContainerClick : "event handler"
ColorPicker -.-> colorpickerHandleApplyColor : "event handler"
ColorPicker -.-> colorpickerHandleCancel : "event handler"
Connection -.-> connectionGetLineWidth : "getter function"
Connection -.-> connectionHandleConnectionClick : "event handler"
Connection -.-> connectionHandleLineTextClick : "event handler"
Connection -.-> connectionHandleLineTextSubmit : "event handler"
Connection -.-> connectionHandleLineTextStyleChange : "event handler"
Connection -.-> connectionHandleLineStyleChange : "event handler"
Connection -.-> connectionHandleLineColorChange : "event handler"
Connection -.-> connectionConnectionData : "internal function"
Connection -.-> connectionPathData : "internal function"
Connection -.-> connectionTextPositionData : "internal function"
ConnectionsRenderer -.-> connectionsrendererAvailableObjectIds : "render helper"
ConnectionsRenderer -.-> connectionsrendererPathfindingObjects : "render helper"
ConnectionsRenderer -.-> connectionsrendererObjectsPositionHash : "render helper"
ConnectionsRenderer -.-> connectionsrendererObjectVisibleConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererFocusedConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererFlowPathHighlightedConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererConnectionsForCulling : "render helper"
ConnectionsRenderer -.-> connectionsrendererProgressiveConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererObjectPositions : "render helper"
ConnectionsRenderer -.-> connectionsrendererAllStraightConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererFaceOverrides : "render helper"
ConnectionsRenderer -.-> connectionsrendererTextLabels : "render helper"
ConnectionsRenderer -.-> connectionsrendererHandleBatchedConnectionClick : "event handler"
ConnectionsRenderer -.-> connectionsrendererMountNextBatch : "render helper"
Cube -.-> cubeCubeData : "internal function"
Cube -.-> cubeIsIndicatorConnected : "boolean check"
Cube -.-> cubeIsIndicatorActive : "boolean check"
Cube -.-> cubeGetUIPositions : "getter function"
Cube -.-> cubeShouldShowIndicator : "boolean check"
Cube -.-> cubeHasConnectedIndicators : "internal function"
Cube -.-> cubeGetFaceTextOffset : "getter function"
Cube -.-> cubeHandleSceneClick : "event handler"
Cube -.-> cubeUpdateDatabase : "update helper"
Cube -.-> cubeOnClickOutside : "internal function"
Cube -.-> cubeHandleFaceClick : "event handler"
Cube -.-> cubeHandleColoredFaceClick : "event handler"
Cube -.-> cubeHandleIndicatorClick : "event handler"
Cube -.-> cubeHandleTransformToggle : "event handler"
Cube -.-> cubeHandleResizeToggle : "event handler"
Cube -.-> cubeHandleHeaderToggle : "event handler"
Cube -.-> cubeHandleHeaderSubmit : "event handler"
Cube -.-> cubeDebouncedUpdate : "update helper"
Cube -.-> cubeHandleLineColorChange : "event handler"
Cube -.-> cubeHandleFaceColorChange : "event handler"
Cube -.-> cubeHandleTextClick : "event handler"
Cube -.-> cubeHandleFaceTextClick : "event handler"
Cube -.-> cubeHandleFaceTextSubmit : "event handler"
Cube -.-> cubeHandleFaceTextStyleClick : "event handler"
Cube -.-> cubeHandleStyleChange : "event handler"
Cube -.-> cubeHandleDrag : "event handler"
Cube -.-> cubeHandleScale : "event handler"
Cube -.-> cubeRenderFaces : "render helper"
Cube -.-> cubeRenderFaceTexts : "render helper"
Cube -.-> cubeRunReconcile : "internal function"
CubeFace -.-> cubefaceFaceStateSelector : "internal function"
CubeFace -.-> cubefaceFaceMaterial : "internal function"
CubeFace -.-> cubefaceHandleClick : "event handler"
CubeFace -.-> cubefaceOffsetMultiplier : "setter function"
CubeFace -.-> cubefaceOffsetPosition : "setter function"
CustomCamera -.-> customcameraMemoizedTarget : "getter function"
CustomCamera -.-> customcameraControlsRefCallback : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dFlowPathNames : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedGraphData : "boolean check"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedHierarchy : "boolean check"
DiagramOverlay2D -.-> diagramoverlay2dFilteredEdges : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayer : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayerHandlers : "event handler"
DiagramOverlay2D -.-> diagramoverlay2dHandleNodeClick : "event handler"
DiagramOverlay2D -.-> diagramoverlay2dHandleBackTo3D : "event handler"
Sphere -.-> sphereDodecahedronData : "internal function"
Sphere -.-> sphereUpdateObjectAndStores : "update helper"
Sphere -.-> sphereUpdateFaceProperty : "update helper"
Sphere -.-> sphereIsIndicatorConnected : "boolean check"
Sphere -.-> sphereOnClickOutside : "internal function"
Sphere -.-> sphereUpdateDatabase : "update helper"
Sphere -.-> sphereHandleTransformToggle : "event handler"
Sphere -.-> sphereHandleHeaderToggle : "event handler"
Sphere -.-> sphereHandleHeaderSubmit : "event handler"
Sphere -.-> sphereHandleResizeToggle : "event handler"
Sphere -.-> sphereHandleDrag : "event handler"
Sphere -.-> sphereHandleScale : "event handler"
Sphere -.-> sphereHandleFaceClick : "event handler"
Sphere -.-> sphereHandleIndicatorClick : "event handler"
Sphere -.-> sphereHandleHeaderClick : "event handler"
Sphere -.-> sphereHandleStyleChange : "event handler"
Sphere -.-> sphereHandleLineColorChange : "event handler"
Sphere -.-> sphereHandleBackgroundClick : "event handler"
Sphere -.-> sphereHandleFaceTextSubmit : "event handler"
Sphere -.-> sphereHandleFaceTextButtonClick : "event handler"
Sphere -.-> sphereHandleFaceTextClick : "event handler"
Sphere -.-> sphereHandleFaceTextStyleChange : "event handler"
Sphere -.-> sphereGetUIPosition : "getter function"
Sphere -.-> sphereGetHeaderPosition : "getter function"
Sphere -.-> sphereGetFaceUIPosition : "getter function"
Sphere -.-> sphereGetFaceTextPosition : "getter function"
Sphere -.-> sphereGetFaceInfo : "getter function"
Sphere -.-> sphereGetFaceRotation : "getter function"
Sphere -.-> sphereShouldShowFaceIndicator : "boolean check"
Sphere -.-> sphereGetHeaderInputPosition : "getter function"
DodecahedronFace -.-> dodecahedronfaceFaceMaterial : "internal function"
DodecahedronFace -.-> dodecahedronfaceHandleClick : "event handler"
DodecahedronFace -.-> dodecahedronfaceHandleTextClick : "event handler"
DodecahedronFace -.-> dodecahedronfaceInverseScale : "internal function"
DodecahedronFace -.-> dodecahedronfaceAdjustedTextPosition : "internal function"
EarthGlobe -.-> earthglobeHandlePointerDown : "event handler"
EarthGlobe -.-> earthglobeHandlePointerUp : "event handler"
EarthGlobe -.-> earthglobeBands : "internal function"
EarthGlobe -.-> earthglobeMeshGeometry : "internal function"
EarthGlobe -.-> earthglobeLocalDetail : "internal function"
EarthGlobe -.-> earthglobeLocalBands : "internal function"
EarthGlobe -.-> earthglobeLocalMeshGeometry : "internal function"
FaceIndicator -.-> faceindicatorMaterial : "internal function"
FaceTextInput -.-> facetextinputHandleKeyDown : "event handler"
FaceTextInput -.-> facetextinputHandleChange : "event handler"
FaceTextInput -.-> facetextinputHandleFocus : "event handler"
FaceTextInput -.-> facetextinputHandleBlur : "event handler"
FaceUI -.-> faceuiHandleBorderStyleClick : "event handler"
FaceUI -.-> faceuiHandleBorderColorClick : "event handler"
FaceUI -.-> faceuiHandleLineThicknessClick : "event handler"
FaceUI -.-> faceuiHandleColorSelect : "event handler"
FaceUI -.-> faceuiHandleToolClick : "event handler"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererFilteredCubes : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererCubeIds : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererIsCubeVisible : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererUpdateCubeEdges : "render helper"
GlobalCubeFaceRenderer -.-> globalcubefacerendererFilteredCubes : "render helper"
GlobalCubeFullLODInstancedRenderer -.-> globalcubefulllodinstancedrendererInstancedCubes : "render helper"
GlobalCubeFullLODInstancedRenderer -.-> globalcubefulllodinstancedrendererCubeIds : "render helper"
GlobalCubeFullLODInstancedRenderer -.-> globalcubefulllodinstancedrendererHandleClick : "event handler"
GlobalCubeMediumLODRenderer -.-> globalcubemediumlodrendererMediumCubes : "render helper"
GlobalCubeMediumLODRenderer -.-> globalcubemediumlodrendererCubeIds : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererFilteredDodecahedrons : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererDodecahedronIds : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererIsDodecahedronVisible : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererUpdateDodecahedronEdges : "render helper"
GlobalDodecahedronMediumLODRenderer -.-> globaldodecahedronmediumlodrendererMediumDodecahedrons : "render helper"
GlobalDodecahedronMediumLODRenderer -.-> globaldodecahedronmediumlodrendererDodecaIds : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererFilteredTetrahedrons : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererTetrahedronIds : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererIsTetrahedronVisible : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererUpdateTetrahedronEdges : "render helper"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrendererMediumTetrahedrons : "render helper"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrendererTetraIds : "render helper"
HeaderInput -.-> headerinputHandleKeyDown : "event handler"
HeaderInput -.-> headerinputHandleChange : "event handler"
HeaderInput -.-> headerinputHandleFocus : "event handler"
HeaderInput -.-> headerinputHandleBlur : "event handler"
InstancedAtlasText -.-> instancedatlastextAtlas : "internal function"
InstancedAtlasText -.-> instancedatlastextPageGroups : "internal function"
PageInstancedMesh -.-> pageinstancedmeshGeometry : "internal function"
PageInstancedMesh -.-> pageinstancedmeshMaterial : "internal function"
PageInstancedMesh -.-> pageinstancedmeshHandleClick : "event handler"
InstancedLine -.-> instancedlineFlatPoints : "internal function"
InstancedLine -.-> instancedlineGeometry : "internal function"
InstancedLine -.-> instancedlineCustomRaycast : "internal function"
InstancedLine -.-> instancedlineMaterial : "internal function"
LineUI -.-> lineuiGetFullStyle : "getter function"
LineUI -.-> lineuiGetBaseStyle : "getter function"
LineUI -.-> lineuiHandleToolClick : "event handler"
LineUI -.-> lineuiHandleLineStyleClick : "event handler"
LineUI -.-> lineuiHandleArrowClick : "event handler"
LODManager -.-> lodmanagerContainersKey : "internal function"
LODManager -.-> lodmanagerComputeContainmentSync : "calculation helper"
LODManager -.-> lodmanagerEnqueueLODUpdates : "update helper"
ModelObject -.-> modelobjectHandleClick : "event handler"
ModelObject -.-> modelobjectHandlePointerDown : "event handler"
ModelObject -.-> modelobjectHandlePointerUp : "event handler"
ObjectRenderer -.-> objectrendererOnClickStable : "render helper"
ObjectRenderer -.-> objectrendererOnDeleteStable : "render helper"
ObjectRenderer -.-> objectrendererOnTransformStartStable : "render helper"
ObjectRenderer -.-> objectrendererOnTransformEndStable : "render helper"
ObjectRenderer -.-> objectrendererOnMatrixChangedStable : "render helper"
ObjectRenderer -.-> objectrendererOnMoveStable : "render helper"
ObjectsRenderer -.-> objectsrendererProgressiveVisibleObjects : "render helper"
ObjectsRenderer -.-> objectsrendererCubeObjects : "render helper"
ObjectsRenderer -.-> objectsrendererContainerHeaders : "render helper"
ObjectsRenderer -.-> objectsrendererDodecahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererTetrahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererUnmodifiedCubeIds : "render helper"
ObjectsRenderer -.-> objectsrendererHandleInstancedCubeClick : "event handler"
ObjectsRenderer -.-> objectsrendererRenderedObjects : "render helper"
ObjectsRenderer -.-> objectsrendererMountNextBatch : "render helper"
ObjectsRenderer -.-> objectsrendererMountResume : "render helper"
ObjectUI -.-> objectuiHandleEyeClick : "event handler"
ObjectUI -.-> objectuiHandleColorPick : "event handler"
ObjectUI -.-> objectuiHandleToolClick : "event handler"
Plane -.-> planePlaneData : "internal function"
Plane -.-> planeCloseAllUIs : "boolean check"
Plane -.-> planeUpdateDatabase : "update helper"
Plane -.-> planeHandleScale : "event handler"
Plane -.-> planeHandleResizeEnd : "event handler"
Plane -.-> planeHandleDrag : "event handler"
Plane -.-> planeHandleTransformStart : "event handler"
Plane -.-> planeHandleTransformEnd : "event handler"
Plane -.-> planeHandleClick : "event handler"
Plane -.-> planeHandleTextClick : "event handler"
Plane -.-> planeHandleTextSubmit : "event handler"
Plane -.-> planeHandleTextStyleChange : "event handler"
Plane -.-> planeHandleTextSpriteClick : "event handler"
Plane -.-> planeHandleTransformToggle : "event handler"
Plane -.-> planeHandleResizeToggle : "event handler"
Plane -.-> planeHandleColorChange : "event handler"
Plane -.-> planeHandleHeaderToggle : "event handler"
Plane -.-> planeHandleHeaderSubmit : "event handler"
Plane -.-> planeHandleHeaderTextClick : "event handler"
Plane -.-> planeHandleHeaderStyleChange : "event handler"
Plane -.-> planeHandleBorderToggle : "event handler"
Plane -.-> planeHandleIndicatorClick : "event handler"
Plane -.-> planeIsIndicatorConnected : "boolean check"
Plane -.-> planeShouldShowIndicator : "boolean check"
Plane -.-> planeHandleBroadcastStopped : "event handler"
Plane -.-> planeApplyStreamScale : "internal function"
Plane -.-> planeRestoreStreamScale : "internal function"
Plane -.-> planeHandleWebcamToggle : "event handler"
Plane -.-> planeHandleScreenShareToggle : "event handler"
Plane -.-> planeHandlePinToggle : "event handler"
Plane -.-> planeHandleImageUpload : "event handler"
Plane -.-> planeHandleBroadcastStarted : "event handler"
Plane -.-> planeHandleViewerCountChange : "event handler"
Plane -.-> planeUiPositions : "internal function"
Plane -.-> planeIndicatorPosition : "internal function"
Plane -.-> planeMeshMaterial : "internal function"
Plane -.-> planeLineMaterialProps : "internal function"
Plane -.-> planeBorderEdgePoints : "internal function"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRunConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRebuildConnectionMap : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterUpdateConnectionEndpoint : "update helper"
GroupedView -.-> groupedviewToggleGroup : "internal function"
GroupedView -.-> groupedviewMarkReachable : "internal function"
RepoAnalysisOverlay -.-> repoanalysisoverlayToggle : "boolean check"
RepoAnalysisOverlay -.-> repoanalysisoverlayVisibleRoots : "boolean check"
RepoAnalysisOverlay -.-> repoanalysisoverlayExpandAll : "boolean check"
RepoAnalysisOverlay -.-> repoanalysisoverlayCollapseAll : "boolean check"
RepoAnalysisOverlay -.-> repoanalysisoverlayAncestorOf : "boolean check"
RepoGrid_file -.-> repogridContainers : "internal function"
RepoGrid_file -.-> repogridGridData : "internal function"
ScreenShareStream -.-> screensharestreamAttemptPlay : "internal function"
ScreenShareStream -.-> screensharestreamConnectToBroadcast : "internal function"
SpaceChat -.-> spacechatHandleScroll : "event handler"
SpaceChat -.-> spacechatHandleSend : "event handler"
SpaceChat -.-> spacechatHandleKeyDown : "event handler"
HandTrackingToggle -.-> handtrackingtoggleHandleClick : "event handler"
Tetrahedron -.-> tetrahedronTetrahedronFaces : "internal function"
Tetrahedron -.-> tetrahedronPosition : "internal function"
Tetrahedron -.-> tetrahedronScale : "internal function"
Tetrahedron -.-> tetrahedronTextStyle : "internal function"
Tetrahedron -.-> tetrahedronFaceColors : "internal function"
Tetrahedron -.-> tetrahedronFaceTexts : "internal function"
Tetrahedron -.-> tetrahedronFaceTextStyles : "internal function"
Tetrahedron -.-> tetrahedronDebouncedUpdate : "update helper"
Tetrahedron -.-> tetrahedronIsIndicatorConnected : "boolean check"
Tetrahedron -.-> tetrahedronIsIndicatorActive : "boolean check"
Tetrahedron -.-> tetrahedronGetUIPositions : "getter function"
Tetrahedron -.-> tetrahedronShouldShowIndicator : "boolean check"
Tetrahedron -.-> tetrahedronHasConnectedIndicators : "internal function"
Tetrahedron -.-> tetrahedronTetrahedronEdgePoints : "internal function"
Tetrahedron -.-> tetrahedronHandleSceneClick : "event handler"
Tetrahedron -.-> tetrahedronUpdateDatabase : "update helper"
Tetrahedron -.-> tetrahedronHandleFaceClick : "event handler"
Tetrahedron -.-> tetrahedronHandleColoredFaceClick : "event handler"
Tetrahedron -.-> tetrahedronHandleIndicatorClick : "event handler"
Tetrahedron -.-> tetrahedronHandleTransformToggle : "event handler"
Tetrahedron -.-> tetrahedronHandleResizeToggle : "event handler"
Tetrahedron -.-> tetrahedronHandleHeaderToggle : "event handler"
Tetrahedron -.-> tetrahedronHandleHeaderSubmit : "event handler"
Tetrahedron -.-> tetrahedronHandleLineColorChange : "event handler"
Tetrahedron -.-> tetrahedronHandleDrag : "event handler"
Tetrahedron -.-> tetrahedronHandleScale : "event handler"
Tetrahedron -.-> tetrahedronGetFaceTextOffset : "getter function"
Tetrahedron -.-> tetrahedronHandleFaceTextStyleClick : "event handler"
Tetrahedron -.-> tetrahedronHandleFaceTextStyleChange : "event handler"
Tetrahedron -.-> tetrahedronRenderFaceTexts : "render helper"
Tetrahedron -.-> tetrahedronRenderFaces : "render helper"
TetrahedronFace -.-> tetrahedronfaceFaceMaterial : "internal function"
TetrahedronFace -.-> tetrahedronfaceHandleClick : "event handler"
TetrahedronFace -.-> tetrahedronfaceHandleIndicatorClickLocal : "event handler"
TetrahedronFace -.-> tetrahedronfaceGetFaceTextOffset : "getter function"
TetrahedronFace -.-> tetrahedronfaceHandleFaceTextStyleClick : "event handler"
TetrahedronFace -.-> tetrahedronfaceHandleFaceTextStyleChange : "event handler"
TetrahedronFace -.-> tetrahedronfaceFaceTextElement : "internal function"
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
TextObject -.-> textobjectHandleTransformToggle : "event handler"
TextObject -.-> textobjectHandleResizeToggle : "event handler"
TextObject -.-> textobjectGetIndicatorOffset : "getter function"
TextObject -.-> textobjectIsIndicatorConnected : "boolean check"
TextObject -.-> textobjectShouldShowIndicator : "boolean check"
TextObject -.-> textobjectGetIndicatorPositions : "getter function"
TextObject -.-> textobjectUpdateWorldMatrix : "update helper"
TextObject -.-> textobjectCloseAllUIs : "boolean check"
TextObject -.-> textobjectUpdateDatabase : "update helper"
TextObject -.-> textobjectAutoResizeTextAreaOnly : "internal function"
TextObject -.-> textobjectAutoResizeTextArea : "internal function"
TextObject -.-> textobjectHandleBlur : "event handler"
TextObject -.-> textobjectHandleDivClick : "event handler"
TextObject -.-> textobjectHandleTextClick : "event handler"
TextObject -.-> textobjectHandleIndicatorClick : "event handler"
TextObject -.-> textobjectHandleDrag : "event handler"
TextObject -.-> textobjectHandleScale : "event handler"
TextObject -.-> textobjectHandleKeyDown : "event handler"
TextObject -.-> textobjectHandleStyleChange : "event handler"
TextObject -.-> textobjectHandleTextSelection : "event handler"
TextObject -.-> textobjectGetTextAreaStyle : "getter function"
TextObject -.-> textobjectGetContainerStyle : "getter function"
TextObject -.-> textobjectGetEffectivePosition : "getter function"
TextObject -.-> textobjectApplyStyleToSelectionInternal : "internal function"
TextObject -.-> textobjectGetTransformControlSize : "getter function"
TextObjectUI -.-> textobjectuiHandleUIClick : "event handler"
TextObjectUI -.-> textobjectuiHandleResizeToggle : "event handler"
TextObjectUI -.-> textobjectuiHandleEyeClick : "event handler"
TextSprite -.-> textspriteSpriteId : "internal function"
TextSprite -.-> textspriteSetIsDragging : "setter function"
TextSprite -.-> textspriteCalculatedPosition : "calculation helper"
TextSprite -.-> textspriteGetFontSize : "getter function"
TextStyleUIContent -.-> textstyleuicontentHandleSizeChange : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleFontSizeInputChange : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleWheel : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleButtonClick : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleColorSelect : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleSelectChange : "event handler"
TextStyleUIContent -.-> textstyleuicontentGetUIScale : "getter function"
UIOverlay -.-> uioverlayPipelineTasks : "internal function"
UIOverlay -.-> uioverlayPipelineStatusCounts : "internal function"
UIOverlay -.-> uioverlaySetIsRecording : "setter function"
UIOverlay -.-> uioverlayHandleCellBoundariesToggle : "event handler"
UIOverlay -.-> uioverlayFetchRepositories : "internal function"
UIOverlay -.-> uioverlayFetchAppJsxFromRepo : "internal function"
UIOverlay -.-> uioverlayHandleRescan : "event handler"
UIOverlay -.-> uioverlayHandleDownloadMarkdown : "event handler"
UIOverlay -.-> uioverlayHandleScreenClick : "event handler"
UIOverlay -.-> uioverlayHandleRuntimeScan : "event handler"
UIOverlay -.-> uioverlayHandleRecordClick : "event handler"
UIOverlay -.-> uioverlayHandleDeleteAllCells : "event handler"
UIOverlay -.-> uioverlayHandleModelUpload : "event handler"
UIOverlay -.-> uioverlayHandleModelFileSelect : "event handler"
UIOverlay -.-> uioverlayHandleMarkdownUpload : "event handler"
UIOverlay -.-> uioverlayHandleMarkdownFileSelect : "event handler"
UIOverlay -.-> uioverlayHandleCsvUpload : "event handler"
UIOverlay -.-> uioverlayHandleCsvFileSelect : "event handler"
UIOverlay -.-> uioverlayHandleMenuToggle : "event handler"
UIOverlay -.-> uioverlayHandleArrowClick : "event handler"
UIOverlay -.-> uioverlayHandleUnpinWebcam : "event handler"
UIOverlay -.-> uioverlayHandleTemplateConfigChange : "event handler"
UIOverlay -.-> uioverlayCreateTemplate : "internal function"
UIOverlay -.-> uioverlayTriggerDownload : "internal function"
UIOverlay -.-> uioverlayHandler : "event handler"
UIOverlay -.-> uioverlayPollStatus : "internal function"
WebcamStream -.-> webcamstreamAttemptPlay : "internal function"
WebcamStream -.-> webcamstreamConnectToBroadcast : "internal function"
CreateOrganizationPopup -.-> createorganizationpopupHandleKeyPress : "event handler"
CreateOrganizationPopup -.-> createorganizationpopupHandleSubmit : "event handler"
CreateSpacePopup -.-> createspacepopupHandleSpaceNameChange : "event handler"
CreateSpacePopup -.-> createspacepopupHandleEmailChange : "event handler"
CreateSpacePopup -.-> createspacepopupHandleMemberSelect : "event handler"
CreateSpacePopup -.-> createspacepopupHandleKeyPress : "event handler"
CreateSpacePopup -.-> createspacepopupHandleSubmit : "event handler"
DodecahedronWireframe2 -.-> dodecahedronwireframe2GenerateDodecahedronEdges : "internal function"
OrganizationManager -.-> organizationmanagerRefresh : "internal function"
OrganizationManager -.-> organizationmanagerHandleCreateOrg : "event handler"
OrganizationManager -.-> organizationmanagerHandleInvite : "event handler"
OrganizationManager -.-> organizationmanagerHandleRemoveMember : "event handler"
OrganizationManager -.-> organizationmanagerHandleLeave : "event handler"
OrganizationManager -.-> organizationmanagerHandleUpgradePlan : "event handler"
OrganizationManager -.-> organizationmanagerHandleDeleteOrg : "event handler"
OrganizationManager -.-> organizationmanagerHandleAcceptInvite : "event handler"
OrganizationManager -.-> organizationmanagerHandleDeclineInvite : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleInputFocus : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleInputChange : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleSelect : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleClickOutside : "event handler"
ShareSpacePopup -.-> sharespacepopupFilteredMembers : "internal function"
ShareSpacePopup -.-> sharespacepopupToggleMember : "internal function"
ShareSpacePopup -.-> sharespacepopupHandleShare : "event handler"
SpacesTable -.-> spacestableHandleSpaceClick : "event handler"
SpacesTable -.-> spacestableThStyles : "internal function"
SpacesTable -.-> spacestableTdStyles : "internal function"
SpacesTable -.-> spacestableCategoryRowStyles : "internal function"
SpacesTable -.-> spacestableInviteBannerStyle : "internal function"
DodecahedronWireframe -.-> dodecahedronwireframeGenerateDodecahedronEdges : "internal function"
FakeGlowMaterial -.-> fakeglowmaterialFakeGlowMaterial : "internal function"
LandingApp -.-> landingappScheduleScrollUpdate : "update helper"
LandingApp -.-> landingappCreateUserDocument : "internal function"
LandingApp -.-> landingappHandleLogin : "event handler"
LandingApp -.-> landingappHandleLogout : "event handler"
LandingApp -.-> landingappNavigateToSpace : "internal function"
LandingApp -.-> landingappFetchUserSpaces : "internal function"
LandingApp -.-> landingappCreateNewSpace : "internal function"
LandingApp -.-> landingappHandleShareSpace : "event handler"
LandingApp -.-> landingappHandleDeleteSpace : "event handler"
LandingApp -.-> landingappHandleLeaveSpace : "event handler"
LandingApp -.-> landingappHandleFirstCubeComplete : "event handler"
LandingApp -.-> landingappHandleDodecahedronComplete : "event handler"
LandingApp -.-> landingappHandleAcceptInvite : "event handler"
LandingApp -.-> landingappHandleDeclineInvite : "event handler"
LandingApp -.-> landingappSpaceTableProps : "internal function"
LandingApp -.-> landingappCreateSpaceProps : "internal function"
LandingApp -.-> landingappSharePopupProps : "internal function"
LandingApp -.-> landingappHandleWheel : "event handler"
LandingApp -.-> landingappHandleTouchStart : "event handler"
LandingApp -.-> landingappHandleTouchMove : "event handler"
PerspectiveGrid_file -.-> perspectivegridIdx : "internal function"
PerspectiveGrid_file -.-> perspectivegridAddEdge : "internal function"
UpdatesEditor -.-> updateseditorHandleKeyCommand : "event handler"
UpdatesEditor -.-> updateseditorToggleInlineStyle : "update helper"
UpdatesEditor -.-> updateseditorHandleSave : "event handler"
UpdatesViewer -.-> updatesviewerParsedContent : "update helper"
UpdatesViewer -.-> updatesviewerFormattedTimestamp : "update helper"

%% File Container Nodes
backend_index((Service: index))
generateHeightmap_file[Function: generateHeightmap]
test_pipeline[Function: test_pipeline]
AppShell_file[Function: AppShell]
useAuth_file[Hook: useAuth]
useAuthState_file[Hook: useAuthState]
useCentralizedBroadcastManager_file[Hook: useCentralizedBroadcastManager]
useConnectionAnimationManager[Hook: useConnectionAnimationManager]
useConnectionObjects_file[Hook: useConnectionObjects]
useConnections_file[Hook: useConnections]
useConnectionsRendererStore_file[Hook: useConnectionsRendererStore]
useDebouncedUpdate_file[Hook: useDebouncedUpdate]
useFrustumCulling[Hook: useFrustumCulling]
useGlobalClickHandler_file[Hook: useGlobalClickHandler]
useIndicators_file[Hook: useIndicators]
useObjects_file[Hook: useObjects]
useSpaceManager_file[Hook: useSpaceManager]
useSpatialManager_file[Hook: useSpatialManager]
useTextureUpdater_file[Hook: useTextureUpdater]
useTimeoutManager_file[Hook: useTimeoutManager]
_3d_generator[Function: _3d_generator]
connection_file((Service: connection))
graph_file((Service: graph))
node_file((Service: node))
ast_builder[Function: ast_builder]
mermaid_parser[Function: mermaid_parser]
markdown_processor[Function: markdown_processor]
authService((Service: authService))
centralizedBroadcastManager_file((Service: centralizedBroadcastManager))
connectionPositionResolver((Service: connectionPositionResolver))
connectionsService((Service: connectionsService))
csvDiagramService((Service: csvDiagramService))
githubIssuesService((Service: githubIssuesService))
githubRepoService((Service: githubRepoService))
globalOptimizationCoordinator_file((Service: globalOptimizationCoordinator))
globalSubscriptionManager((Service: globalSubscriptionManager))
anchors((Service: anchors))
imageOps((Service: imageOps))
palmDecode((Service: palmDecode))
handTrackingService((Service: handTrackingService))
constants((Service: constants))
markdownDiagramService_file((Service: markdownDiagramService))
organizationService((Service: organizationService))
pipelineOrchestrator((Service: pipelineOrchestrator))
pipelineTaskService((Service: pipelineTaskService))
presenceService((Service: presenceService))
repoContainerService((Service: repoContainerService))
resourceCleanupService_file((Service: resourceCleanupService))
runtimeScanService((Service: runtimeScanService))
screenRecordingService((Service: screenRecordingService))
sharedSpacesService((Service: sharedSpacesService))
sharingService((Service: sharingService))
spacesService((Service: spacesService))
spatialObjectsService((Service: spatialObjectsService))
spatialPartitioning((Service: spatialPartitioning))
storageService((Service: storageService))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
index((Service: index))
unifiedCacheManager_file((Service: unifiedCacheManager))
webRservice((Service: webRservice))
shader_shaders[Function: shaders]
authStore[[Store: authStore]]
connectionStore[[Store: connectionStore]]
cubeStore[[Store: cubeStore]]
lodStore[[Store: lodStore]]
objectsStore[[Store: objectsStore]]
storeUtils[[Store: storeUtils]]
uiOverlayStore[[Store: uiOverlayStore]]
animationUtils[Function: animationUtils]
bvhRaycasting[Function: bvhRaycasting]
connectionUtils[Function: connectionUtils]
debugUtils[Function: debugUtils]
earthHeightmapLoader[Function: earthHeightmapLoader]
earthTerrainGenerator[Function: earthTerrainGenerator]
faceIndicatorUtils[Function: faceIndicatorUtils]
facePositionUtils[Function: facePositionUtils]
frameCounter_file[Function: frameCounter]
gpuResourceTracker[Function: gpuResourceTracker]
loadingState[Function: loadingState]
objectUpdateHandlers[Function: objectUpdateHandlers]
objectVirtualization[Function: objectVirtualization]
pathfindingUtils[Function: pathfindingUtils]
positionUtils[Function: positionUtils]
renderWorkScheduler[Function: renderWorkScheduler]
snappingUtils[Function: snappingUtils]
streamlinedSpatialIndex[Function: streamlinedSpatialIndex]
terrainTileCache[Function: terrainTileCache]
textAtlas[Function: textAtlas]
textureLoader[Function: textureLoader]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
unifiedValidationUtils[Function: unifiedValidationUtils]
wasmKernels[Function: wasmKernels]
hoverchart_wasm_d[Function: hoverchart_wasm_d]
hoverchart_wasm[Function: hoverchart_wasm]
worker_diagramLayoutWorker[Function: diagramLayoutWorker]
worker_diagramLayoutWorkerClient[Function: diagramLayoutWorkerClient]
worker_handTrackingWorker[Function: handTrackingWorker]
worker_handTrackingWorkerClient[Function: handTrackingWorkerClient]
worker_markdownLayoutWorker[Function: markdownLayoutWorker]
worker_markdownLayoutWorkerClient[Function: markdownLayoutWorkerClient]
worker_pathfindingWorkerClient[Function: pathfindingWorkerClient]
worker_spatialIndexWorker[Function: spatialIndexWorker]
worker_spatialIndexWorkerClient[Function: spatialIndexWorkerClient]
worker_textAtlasWorker[Function: textAtlasWorker]
worker_textAtlasWorkerClient[Function: textAtlasWorkerClient]
worker_treeSitterScannerWorker[Function: treeSitterScannerWorker]
worker_treeSitterScannerWorkerClient[Function: treeSitterScannerWorkerClient]

%% File-Function Relationships
backend_index -.-> createVerifyAuthTokenApp : "contains"
backend_index -.-> verifyAuthToken : "contains"
backend_index -.-> createBulkImportApp : "contains"
backend_index -.-> bulkImport : "contains"
backend_index -.-> fetchGithubToken : "contains"
backend_index -.-> generateJobId : "contains"
backend_index -.-> toMillis : "contains"
backend_index -.-> deleteCellContents : "contains"
backend_index -.-> createBulkDeleteApp : "contains"
backend_index -.-> bulkDelete : "contains"
backend_index -.-> runBulkDeleteJob : "contains"
backend_index -.-> bulkDeleteWorker : "contains"
backend_index -.-> validateRuntimeScanUrl : "contains"
backend_index -.-> sanitizeMerfolkId : "contains"
backend_index -.-> generateMerfolkFromRuntimeTrace : "contains"
backend_index -.-> extractSourceMapUrl : "contains"
backend_index -.-> scanOriginalSource : "contains"
backend_index -.-> extractNamesFromSourceMap : "contains"
backend_index -.-> scanJsBundles : "contains"
backend_index -.-> captureRuntimeTrace : "contains"
backend_index -.-> deduplicateApiCalls : "contains"
backend_index -.-> buildConnections : "contains"
backend_index -.-> createScanWebsiteRuntimeApp : "contains"
backend_index -.-> scanWebsiteRuntime : "contains"
backend_index -.-> objectsByCellId : "contains"
backend_index -.-> connectionsByCellId : "contains"
backend_index -.-> params : "contains"
backend_index -.-> cellsToKeep : "contains"
backend_index -.-> EXCLUDED_PROFILER_NAMES : "contains"
backend_index -.-> BUNDLE_NOISE_NAMES : "contains"
backend_index -.-> REACT_DEVTOOLS_INJECTION : "contains"
backend_index -.-> getCompName : "contains"
backend_index -.-> walkFiber : "contains"
backend_index -.-> bundleComponents : "contains"
backend_index -.-> bundleHooks : "contains"
backend_index -.-> bundleFunctions : "contains"
backend_index -.-> urlObj : "contains"
backend_index -.-> seen : "contains"
backend_index -.-> seenFns : "contains"
backend_index -.-> dedup : "contains"
generateHeightmap_file -.-> fetchBuffer : "contains"
generateHeightmap_file -.-> decodeTile : "contains"
generateHeightmap_file -.-> downloadTiles : "contains"
generateHeightmap_file -.-> latLonToMercatorPixel : "contains"
generateHeightmap_file -.-> sampleElevation : "contains"
generateHeightmap_file -.-> generateHeightmap : "contains"
generateHeightmap_file -.-> main : "contains"
generateHeightmap_file -.-> worker : "contains"
test_pipeline -.-> isCubeChild : "contains"
test_pipeline -.-> isContainerType : "contains"
test_pipeline -.-> wouldCreateCycle : "contains"
test_pipeline -.-> dfs : "contains"
test_pipeline -.-> addRel : "contains"
test_pipeline -.-> positionNode : "contains"
AppShell_file -.-> AppShell : "contains"
AppShell_file -.-> handleOpenSpace : "contains"
AppShell_file -.-> handleBackToLanding : "contains"
AppShell_file -.-> handleTryWithoutAccount : "contains"
AppShell_file -.-> handlePopState : "contains"
useAuth_file -.-> useAuth : "contains"
useAuth_file -.-> selectAuth : "contains"
useAuthState_file -.-> useAuthState : "contains"
useAuthState_file -.-> selectAuthState : "contains"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "contains"
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
useConnectionObjects_file -.-> useConnectionObjects : "contains"
useConnectionObjects_file -.-> usePathfindingObjects : "contains"
useConnectionObjects_file -.-> useConnectionObjectPositions : "contains"
useConnectionObjects_file -.-> objectPositionEqual : "contains"
useConnections_file -.-> useConnections : "contains"
useConnections_file -.-> selectConnectionHookState : "contains"
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
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "contains"
useConnectionsRendererStore_file -.-> useConnectionState : "contains"
useConnectionsRendererStore_file -.-> useConnectionActions : "contains"
useConnectionsRendererStore_file -.-> getConnectionStateSelector : "contains"
useConnectionsRendererStore_file -.-> cleanupStaleSelectors : "contains"
useConnectionsRendererStore_file -.-> actionsSelector : "contains"
useConnectionsRendererStore_file -.-> selector : "contains"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "contains"
useDebouncedUpdate_file -.-> cleanup : "contains"
useFrustumCulling -.-> isPointInFrustum : "contains"
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> SpatialHash : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
useFrustumCulling -.-> objectPositions : "contains"
useFrustumCulling -.-> visibleConnections : "contains"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "contains"
useGlobalClickHandler_file -.-> handleGlobalClick : "contains"
useIndicators_file -.-> useIndicators : "contains"
useObjects_file -.-> useObjects : "contains"
useObjects_file -.-> selectObjectsHookState : "contains"
useObjects_file -.-> handleCreateObject : "contains"
useObjects_file -.-> handleObjectDelete : "contains"
useObjects_file -.-> registerTransformingObject : "contains"
useSpaceManager_file -.-> useSpaceManager : "contains"
useSpaceManager_file -.-> selectSpaceManagerState : "contains"
useSpatialManager_file -.-> useSpatialManager : "contains"
useSpatialManager_file -.-> loadedCellsKey : "contains"
useSpatialManager_file -.-> memoizedLoadedCells : "contains"
useSpatialManager_file -.-> setupCameraListeners : "contains"
useSpatialManager_file -.-> handleCameraMove : "contains"
useSpatialManager_file -.-> addObjectToSpatialSystemWrapper : "contains"
useSpatialManager_file -.-> moveObjectInSpatialSystemWrapper : "contains"
useSpatialManager_file -.-> loadCellWrapper : "contains"
useSpatialManager_file -.-> updateCameraPositionWrapper : "contains"
useTextureUpdater_file -.-> useTextureUpdater : "contains"
useTextureUpdater_file -.-> updateTexture : "contains"
useTimeoutManager_file -.-> useTimeoutManager : "contains"
useTimeoutManager_file -.-> setNamedTimeout : "contains"
useTimeoutManager_file -.-> clearNamedTimeout : "contains"
useTimeoutManager_file -.-> clearAllTimeouts : "contains"
useTimeoutManager_file -.-> hasActiveTimeout : "contains"
useTimeoutManager_file -.-> getTimeoutId : "contains"
_3d_generator -.-> AST3DGenerator : "contains"
_3d_generator -.-> nodeIds : "contains"
connection_file -.-> Connection : "contains"
graph_file -.-> Graph : "contains"
graph_file -.-> visited : "contains"
graph_file -.-> recursionStack : "contains"
graph_file -.-> graph : "contains"
graph_file -.-> node : "contains"
graph_file -.-> connection : "contains"
node_file -.-> Node : "contains"
ast_builder -.-> ASTBuilder : "contains"
ast_builder -.-> nodeMap : "contains"
ast_builder -.-> nodesWithCustomPositions : "contains"
ast_builder -.-> layers : "contains"
ast_builder -.-> componentGroups : "contains"
mermaid_parser -.-> MermaidParser : "contains"
markdown_processor -.-> MarkdownProcessor : "contains"
authService -.-> signInUser : "contains"
authService -.-> completeRedirectSignIn : "contains"
authService -.-> handlePostLoginRedirect : "contains"
authService -.-> signOut : "contains"
authService -.-> handleRedirectResult : "contains"
authService -.-> observeAuthState : "contains"
authService -.-> validateAuthToken : "contains"
authService -.-> handleUrlAuth : "contains"
centralizedBroadcastManager_file -.-> CentralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> subscribePlaneToBroadcasts : "contains"
centralizedBroadcastManager_file -.-> getBroadcastManagerDebugInfo : "contains"
centralizedBroadcastManager_file -.-> cleanupBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> dummyUnsubscribe : "contains"
centralizedBroadcastManager_file -.-> centralizedBroadcastManager : "contains"
connectionPositionResolver -.-> resolveConnectionPositions : "contains"
connectionPositionResolver -.-> connectionNeedsPositionResolution : "contains"
connectionPositionResolver -.-> resolveConnectionEndpoint : "contains"
connectionPositionResolver -.-> positionsEqual : "contains"
connectionsService -.-> pauseConnectionListeners : "contains"
connectionsService -.-> resumeConnectionListeners : "contains"
connectionsService -.-> addConnectionStateListener : "contains"
connectionsService -.-> enableConnectionNetwork : "contains"
connectionsService -.-> disableConnectionNetwork : "contains"
connectionsService -.-> getConnectionNetworkState : "contains"
connectionsService -.-> saveConnection : "contains"
connectionsService -.-> subscribeToConnections : "contains"
connectionsService -.-> deleteConnection : "contains"
connectionsService -.-> deleteConnectionEnhanced : "contains"
connectionsService -.-> connectionListeners : "contains"
connectionsService -.-> globalActiveListeners : "contains"
connectionsService -.-> notifyConnectionListeners : "contains"
connectionsService -.-> connectionCache : "contains"
connectionsService -.-> clearConnectionCache : "contains"
connectionsService -.-> connectionDataChanged : "contains"
connectionsService -.-> serializeConnection : "contains"
connectionsService -.-> subscribeToCellConnections : "contains"
connectionsService -.-> unsubscribeFunctions : "contains"
connectionsService -.-> activeSubscriptionCells : "contains"
connectionsService -.-> startCellSubscriptions : "contains"
csvDiagramService -.-> parseCsv : "contains"
csvDiagramService -.-> splitCsvLine : "contains"
csvDiagramService -.-> isNumericColumn : "contains"
csvDiagramService -.-> parseNumeric : "contains"
csvDiagramService -.-> detectColumns : "contains"
csvDiagramService -.-> filterAggregateRows : "contains"
csvDiagramService -.-> buildGroups : "contains"
csvDiagramService -.-> layoutGroup : "contains"
csvDiagramService -.-> computeBounds : "contains"
csvDiagramService -.-> getCameraBasePosition : "contains"
csvDiagramService -.-> processCsvFile : "contains"
csvDiagramService -.-> groups : "contains"
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
githubRepoService -.-> exchangeGithubCode : "contains"
githubRepoService -.-> fetchRepositories : "contains"
githubRepoService -.-> fetchFileContent : "contains"
githubRepoService -.-> fetchLatestCommitSha : "contains"
githubRepoService -.-> fetchChangedFiles : "contains"
githubRepoService -.-> fetchRepositoryStructure : "contains"
githubRepoService -.-> generateMerfolkFromRepository : "contains"
githubRepoService -.-> getGithubToken : "contains"
githubRepoService -.-> setGithubToken : "contains"
githubRepoService -.-> isGithubAuthenticated : "contains"
githubRepoService -.-> getGithubOAuthUrl : "contains"
githubRepoService -.-> handleGithubCallback : "contains"
githubRepoService -.-> scanRepositoryAndGenerateDiagram : "contains"
githubRepoService -.-> mergeMerfolkMarkdown : "contains"
githubRepoService -.-> rescanRepositoryForChanges : "contains"
githubRepoService -.-> getTreeSitterLanguage : "contains"
githubRepoService -.-> getFileTypeFromPath : "contains"
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
githubRepoService -.-> authGuards : "contains"
githubRepoService -.-> eventEmitters : "contains"
githubRepoService -.-> eventListeners : "contains"
githubRepoService -.-> errorBoundaries : "contains"
githubRepoService -.-> suspenseBoundaries : "contains"
githubRepoService -.-> sharedInterfaces : "contains"
githubRepoService -.-> interfaceUsages : "contains"
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
githubRepoService -.-> currentParams : "contains"
githubRepoService -.-> restoredParams : "contains"
githubRepoService -.-> newUrl : "contains"
githubRepoService -.-> successParams : "contains"
githubRepoService -.-> failParams : "contains"
githubRepoService -.-> markdownBlob : "contains"
githubRepoService -.-> markdownFile : "contains"
githubRepoService -.-> extractMerfolkNodeIds : "contains"
githubRepoService -.-> filterNewMerfolkNodes : "contains"
githubRepoService -.-> extractContent : "contains"
globalOptimizationCoordinator_file -.-> GlobalOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> initializeOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> getOptimizationStatus : "contains"
globalOptimizationCoordinator_file -.-> consolidateSystem : "contains"
globalOptimizationCoordinator_file -.-> cleanupOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> spatialManager : "contains"
globalOptimizationCoordinator_file -.-> unifiedCache : "contains"
globalOptimizationCoordinator_file -.-> cacheStats : "contains"
globalOptimizationCoordinator_file -.-> later : "contains"
globalOptimizationCoordinator_file -.-> cache : "contains"
globalOptimizationCoordinator_file -.-> memoized : "contains"
globalOptimizationCoordinator_file -.-> session : "contains"
globalOptimizationCoordinator_file -.-> globalOptimizationCoordinator : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
globalSubscriptionManager -.-> globalSubscriptions : "contains"
globalSubscriptionManager -.-> decrementSubscription : "contains"
globalSubscriptionManager -.-> periodicCleanup : "contains"
anchors -.-> getAnchors : "contains"
imageOps -.-> imageDataToTensor : "contains"
imageOps -.-> letterboxToImageData : "contains"
imageOps -.-> extractRotatedRoi : "contains"
imageOps -.-> roiToImage : "contains"
palmDecode -.-> sigmoid : "contains"
palmDecode -.-> decodePalmDetections : "contains"
palmDecode -.-> iou : "contains"
palmDecode -.-> detectionToRoi : "contains"
palmDecode -.-> kps : "contains"
handTrackingService -.-> ensureWorker : "contains"
handTrackingService -.-> openCamera : "contains"
handTrackingService -.-> runOnce : "contains"
handTrackingService -.-> scheduleNext : "contains"
handTrackingService -.-> onFrame : "contains"
handTrackingService -.-> onVisibilityChange : "contains"
handTrackingService -.-> teardownCamera : "contains"
handTrackingService -.-> startHandTracking : "contains"
handTrackingService -.-> stopHandTracking : "contains"
handTrackingService -.-> onLoaded : "contains"
handTrackingService -.-> onError : "contains"
connectionMethods -.-> connectionTags : "contains"
connectionMethods -.-> addTag : "contains"
connectionMethods -.-> existingConnectionPairs : "contains"
connectionMethods -.-> getFaceForObject : "contains"
connectionMethods -.-> computeFaceWorldPosition : "contains"
connectionMethods -.-> calculateDodecahedronFaceCenter : "contains"
connectionMethods -.-> connectionsByCell : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
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
containerMethods -.-> adjustNodeAndDescendants : "contains"
containerMethods -.-> containerDimensions : "contains"
containerMethods -.-> containerEligibleTypes : "contains"
containerMethods -.-> existingParentNodeIds : "contains"
hierarchyMethods -.-> parentChildMap : "contains"
hierarchyMethods -.-> childParentMap : "contains"
hierarchyMethods -.-> rootNodes : "contains"
hierarchyMethods -.-> internalComponentChildren : "contains"
hierarchyMethods -.-> componentConnectionTypes : "contains"
hierarchyMethods -.-> warnedCycles : "contains"
hierarchyMethods -.-> addParentChildRelation : "contains"
objectMethods -.-> processedNodes : "contains"
objectMethods -.-> existingNodeIdMap : "contains"
objectMethods -.-> calculateHeaderStyle : "contains"
positionMethods -.-> moveComponentTree : "contains"
positionMethods -.-> getComponentChildren : "contains"
positionMethods -.-> checkOverlap : "contains"
positionMethods -.-> containersByLevel : "contains"
positionMethods -.-> resolveNodeMove : "contains"
positionMethods -.-> calculateNodeScaleFromChildren : "contains"
positionMethods -.-> calculateGroupSpacing : "contains"
positionMethods -.-> calculateGroupBounds : "contains"
positionMethods -.-> positionGroup : "contains"
processMethods -.-> cameraDirection : "contains"
processMethods -.-> allNodes : "contains"
processMethods -.-> allConnections : "contains"
processMethods -.-> nodeToObjectIdMap : "contains"
processMethods -.-> reader : "contains"
markdownDiagramService_file -.-> MarkdownDiagramService : "contains"
markdownDiagramService_file -.-> markdownDiagramService : "contains"
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
pipelineOrchestrator -.-> getGithubToken : "contains"
pipelineOrchestrator -.-> processTask : "contains"
pipelineOrchestrator -.-> startPipeline : "contains"
pipelineOrchestrator -.-> pausePipeline : "contains"
pipelineOrchestrator -.-> resumePipeline : "contains"
pipelineOrchestrator -.-> reconcilePendingTasks : "contains"
pipelineOrchestrator -.-> stopPipeline : "contains"
pipelineOrchestrator -.-> pollPR : "contains"
pipelineOrchestrator -.-> getLatestTasks : "contains"
pipelineOrchestrator -.-> processed : "contains"
pipelineOrchestrator -.-> checkResume : "contains"
pipelineOrchestrator -.-> repoSlugsToReposition : "contains"
pipelineTaskService -.-> getStatusColor : "contains"
pipelineTaskService -.-> getStatusLabel : "contains"
pipelineTaskService -.-> isTaskObject : "contains"
pipelineTaskService -.-> getPipelineTasks : "contains"
pipelineTaskService -.-> getNextQueuedTask : "contains"
pipelineTaskService -.-> getNextActionableTask : "contains"
pipelineTaskService -.-> getPipelineTasksForRepo : "contains"
pipelineTaskService -.-> getRepoSlugsFromTasks : "contains"
pipelineTaskService -.-> updateTaskStatus : "contains"
pipelineTaskService -.-> slugs : "contains"
presenceService -.-> setUserPresence : "contains"
presenceService -.-> setGuestPresence : "contains"
presenceService -.-> subscribeToSpacePresence : "contains"
repoContainerService -.-> generateId : "contains"
repoContainerService -.-> getCellId : "contains"
repoContainerService -.-> computeGridLayout : "contains"
repoContainerService -.-> computeContainerScale : "contains"
repoContainerService -.-> getGridCellPosition : "contains"
repoContainerService -.-> repositionAllTasks : "contains"
repoContainerService -.-> findRepoContainer : "contains"
repoContainerService -.-> getAllRepoContainers : "contains"
repoContainerService -.-> assignRepoSlugToOrphanTasks : "contains"
repoContainerService -.-> countRepoContainers : "contains"
repoContainerService -.-> createRepoContainer : "contains"
repoContainerService -.-> repositionIncomingTasks : "contains"
repoContainerService -.-> createTaskObjects : "contains"
repoContainerService -.-> clearRepoTasks : "contains"
repoContainerService -.-> toggleTaskExpansion : "contains"
repoContainerService -.-> dividerIds : "contains"
repoContainerService -.-> activeIds : "contains"
repoContainerService -.-> mergedIds : "contains"
repoContainerService -.-> newCreatedIds : "contains"
repoContainerService -.-> orphanIds : "contains"
repoContainerService -.-> unpositionedIds : "contains"
repoContainerService -.-> renumberMap : "contains"
repoContainerService -.-> rewriteHeader : "contains"
repoContainerService -.-> taskIds : "contains"
repoContainerService -.-> updatedById : "contains"
resourceCleanupService_file -.-> ResourceCleanupService : "contains"
resourceCleanupService_file -.-> resourceCleanupService : "contains"
resourceCleanupService_file -.-> _disposedWeakSet : "contains"
runtimeScanService -.-> validateScanUrl : "contains"
runtimeScanService -.-> generateMerfolkFromRuntimeTrace : "contains"
runtimeScanService -.-> scanWebsiteAndGenerateDiagram : "contains"
runtimeScanService -.-> sanitizeId : "contains"
runtimeScanService -.-> simulateProgress : "contains"
screenRecordingService -.-> ScreenRecordingService : "contains"
screenRecordingService -.-> screenRecorder : "contains"
screenRecordingService -.-> rawBlob : "contains"
sharedSpacesService -.-> sharedSpacesCacheSet : "contains"
sharedSpacesService -.-> isSharedSpace : "contains"
sharedSpacesService -.-> checkSpaceExists : "contains"
sharedSpacesService -.-> registerSharedSpaceFromUrl : "contains"
sharedSpacesService -.-> getSpaceOwner : "contains"
sharedSpacesService -.-> findSpaceOwner : "contains"
sharedSpacesService -.-> sharedSpacesCache : "contains"
sharedSpacesService -.-> urlParams : "contains"
sharingService -.-> generateSharingUrl : "contains"
sharingService -.-> getSharedSpaceInfo : "contains"
sharingService -.-> sharingUrl : "contains"
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
spatialObjectsService -.-> cancelPendingSave : "contains"
spatialObjectsService -.-> enqueueSave : "contains"
spatialObjectsService -.-> flushSaveBatch : "contains"
spatialObjectsService -.-> clearAllObjectCaches : "contains"
spatialObjectsService -.-> saveObjectToCell : "contains"
spatialObjectsService -.-> deleteObjectFromSpatialCell : "contains"
spatialObjectsService -.-> updateObjectInSpatialCell : "contains"
spatialObjectsService -.-> cleanupSpatialObjectSubscriptions : "contains"
spatialObjectsService -.-> subscribeToSpatialObjects : "contains"
spatialObjectsService -.-> updateCellSubscriptions : "contains"
spatialObjectsService -.-> moveObjectBetweenCells : "contains"
spatialObjectsService -.-> loadObjectsFromCells : "contains"
spatialObjectsService -.-> saveObject : "contains"
spatialObjectsService -.-> deleteObject : "contains"
spatialObjectsService -.-> updateObject : "contains"
spatialObjectsService -.-> subscribeToObjects : "contains"
spatialObjectsService -.-> getObjectDeletionStatus : "contains"
spatialObjectsService -.-> clearObjectDeletionBlacklist : "contains"
spatialObjectsService -.-> deletingObjects : "contains"
spatialObjectsService -.-> pendingSaves : "contains"
spatialObjectsService -.-> saves : "contains"
spatialObjectsService -.-> removeObjectFromCaches : "contains"
spatialObjectsService -.-> VOLATILE_KEYS : "contains"
spatialObjectsService -.-> computeNonPositionFingerprint : "contains"
spatialObjectsService -.-> clearCellCache : "contains"
spatialObjectsService -.-> objectSubscriptionsByCell : "contains"
spatialObjectsService -.-> localSubscriptionKeys : "contains"
spatialPartitioning -.-> getCellCoordinates : "contains"
spatialPartitioning -.-> getCellCoordinatesWithHysteresis : "contains"
spatialPartitioning -.-> getCellId : "contains"
spatialPartitioning -.-> parseCellId : "contains"
spatialPartitioning -.-> getCellBounds : "contains"
spatialPartitioning -.-> createCell : "contains"
spatialPartitioning -.-> createCellsBatch : "contains"
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
spatialPartitioning -.-> subscribeToCells : "contains"
spatialPartitioning -.-> getOccupiedCells : "contains"
spatialPartitioning -.-> getCellDistance : "contains"
spatialPartitioning -.-> getCellsToUnload : "contains"
spatialPartitioning -.-> addConnectionToCells : "contains"
spatialPartitioning -.-> bulkSaveConnectionsToCell : "contains"
spatialPartitioning -.-> addConnectionToCell : "contains"
spatialPartitioning -.-> removeConnectionFromAllCells : "contains"
spatialPartitioning -.-> removeConnectionFromCells : "contains"
spatialPartitioning -.-> removeConnectionFromCell : "contains"
spatialPartitioning -.-> getConnectionsFromCells : "contains"
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
spatialPartitioning -.-> cellExistenceCache : "contains"
spatialPartitioning -.-> cleanupCache : "contains"
spatialPartitioning -.-> createCellsBatchOptimized : "contains"
spatialPartitioning -.-> cellCallbacks : "contains"
spatialPartitioning -.-> normalizePosition : "contains"
spatialPartitioning -.-> seenConnectionIds : "contains"
storageService -.-> uploadImageToStorage : "contains"
storageService -.-> uploadModelToStorage : "contains"
storageService -.-> uploadMarkdownToStorage : "contains"
storageService -.-> getStorageInstance : "contains"
storageService -.-> ALLOWED_IMAGE_TYPES : "contains"
storageService -.-> uploadFileGeneric : "contains"
storageService -.-> blob : "contains"
streamlinedSpatialPartitioning -.-> StreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> getStreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> initializeStreamlinedSpatialPartitioning : "contains"
streamlinedSpatialPartitioning -.-> benchmarkStreamlinedSystem : "contains"
streamlinedSpatialPartitioning -.-> manager : "contains"
index -.-> resolveContainerType : "contains"
index -.-> scanWithTreeSitter : "contains"
index -.-> scanPythonWithTreeSitter : "contains"
index -.-> isPrivate : "contains"
index -.-> isDunder : "contains"
index -.-> importedNames : "contains"
unifiedCacheManager_file -.-> UnifiedCacheManager : "contains"
unifiedCacheManager_file -.-> unifiedCacheManager : "contains"
webRservice -.-> initWebRTC : "contains"
webRservice -.-> BroadcastSession : "contains"
webRservice -.-> startBroadcasting : "contains"
webRservice -.-> joinBroadcast : "contains"
webRservice -.-> isPlaneBeingBroadcast : "contains"
webRservice -.-> findAvailableBroadcasts : "contains"
webRservice -.-> cleanupWebRTC : "contains"
webRservice -.-> registerUserPresence : "contains"
webRservice -.-> subscribeToUsersInSpace : "contains"
webRservice -.-> activeStreams : "contains"
webRservice -.-> getRTCConfiguration : "contains"
webRservice -.-> peerConnection : "contains"
webRservice -.-> broadcastSession : "contains"
webRservice -.-> activeUsers : "contains"
webRservice -.-> fiveMinutesAgo : "contains"
shader_shaders -.-> line_frag_glsl : "contains"
shader_shaders -.-> line_vert_glsl : "contains"
authStore -.-> monitorConnection : "contains"
authStore -.-> connectionHandler : "contains"
authStore -.-> handleUrlAuthLocal : "contains"
authStore -.-> initAuth : "contains"
connectionStore -.-> _buildConnectionsByObjectId : "contains"
connectionStore -.-> getCellCoords : "contains"
connectionStore -.-> getCellIdFromCoords : "contains"
cubeStore -.-> getCubeSelector : "contains"
cubeStore -.-> getCubeFaceColorSelector : "contains"
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
cubeStore -.-> getCubeFaceStateSelector : "contains"
lodStore -.-> calculateLODLevel : "contains"
lodStore -.-> calculateParentLODLevel : "contains"
objectsStore -.-> numericHash : "contains"
objectsStore -.-> stringHash : "contains"
storeUtils -.-> useStoreInitialization : "contains"
storeUtils -.-> useCubeSelectors : "contains"
storeUtils -.-> useCubeActions : "contains"
storeUtils -.-> usePlaneSelectors : "contains"
storeUtils -.-> usePlaneActions : "contains"
storeUtils -.-> useGlobalStoreUtils : "contains"
storeUtils -.-> clearAllSelections : "contains"
storeUtils -.-> resetAllStores : "contains"
uiOverlayStore -.-> setCellBoundariesVisible : "contains"
animationUtils -.-> registerMaterial : "contains"
animationUtils -.-> unregisterMaterial : "contains"
animationUtils -.-> setAnimationSpeed : "contains"
animationUtils -.-> initAnimationSystem : "contains"
animationUtils -.-> animatedMaterials : "contains"
animationUtils -.-> startAnimationLoop : "contains"
animationUtils -.-> animate : "contains"
animationUtils -.-> stopAnimationLoop : "contains"
bvhRaycasting -.-> BVHNode : "contains"
bvhRaycasting -.-> BVHAcceleratedRaycaster : "contains"
bvhRaycasting -.-> initBVHRaycasting : "contains"
bvhRaycasting -.-> getBVH : "contains"
bvhRaycasting -.-> updateBVHObjects : "contains"
bvhRaycasting -.-> bvhIntersectObjects : "contains"
bvhRaycasting -.-> getBVHStats : "contains"
bvhRaycasting -.-> updateLODLevels : "contains"
bvhRaycasting -.-> registerObjectRelationships : "contains"
bvhRaycasting -.-> _tempBox3 : "contains"
bvhRaycasting -.-> _tempVec3A : "contains"
bvhRaycasting -.-> _tempVec3B : "contains"
bvhRaycasting -.-> _tempVec3C : "contains"
bvhRaycasting -.-> _tempVec3D : "contains"
bvhRaycasting -.-> _tempSize : "contains"
bvhRaycasting -.-> _tempCenter : "contains"
bvhRaycasting -.-> _tempMin : "contains"
bvhRaycasting -.-> _tempMax : "contains"
bvhRaycasting -.-> _lodCameraPos : "contains"
bvhRaycasting -.-> _lodObjectPos : "contains"
bvhRaycasting -.-> _segmentDir : "contains"
bvhRaycasting -.-> _rayToStart : "contains"
bvhRaycasting -.-> _pointOnRay : "contains"
bvhRaycasting -.-> _pointOnSegment : "contains"
bvhRaycasting -.-> _intersectionPoint : "contains"
bvhRaycasting -.-> _cameraPos : "contains"
bvhRaycasting -.-> leftChild : "contains"
bvhRaycasting -.-> rightChild : "contains"
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
connectionUtils -.-> worldPos : "contains"
connectionUtils -.-> offsetVec : "contains"
connectionUtils -.-> indicatorPos : "contains"
debugUtils -.-> logAnimation : "contains"
debugUtils -.-> forceAnimateConnection : "contains"
debugUtils -.-> shouldAnimateConnection : "contains"
debugUtils -.-> recordFrameTime : "contains"
debugUtils -.-> recordStateUpdate : "contains"
debugUtils -.-> getPerfStats : "contains"
debugUtils -.-> resetPerfStats : "contains"
earthHeightmapLoader -.-> loadEarthHeightmap : "contains"
earthHeightmapLoader -.-> img : "contains"
earthTerrainGenerator -.-> setHeightmapData : "contains"
earthTerrainGenerator -.-> samplePixel : "contains"
earthTerrainGenerator -.-> pixelToElevation : "contains"
earthTerrainGenerator -.-> getElevationFromHeightmap : "contains"
earthTerrainGenerator -.-> getElevationFromModel : "contains"
earthTerrainGenerator -.-> getElevation : "contains"
earthTerrainGenerator -.-> getColorForElevation : "contains"
earthTerrainGenerator -.-> generateGlobeGeometry : "contains"
earthTerrainGenerator -.-> getParsedScheme : "contains"
earthTerrainGenerator -.-> getColorRGB : "contains"
earthTerrainGenerator -.-> generateGlobeMesh : "contains"
earthTerrainGenerator -.-> generateLocalGlobeGeometry : "contains"
earthTerrainGenerator -.-> generateLocalGlobeMesh : "contains"
earthTerrainGenerator -.-> positions : "contains"
earthTerrainGenerator -.-> elevations : "contains"
earthTerrainGenerator -.-> colorGroups : "contains"
earthTerrainGenerator -.-> addLine : "contains"
earthTerrainGenerator -.-> posAt : "contains"
earthTerrainGenerator -.-> parsedColorCache : "contains"
earthTerrainGenerator -.-> colors : "contains"
earthTerrainGenerator -.-> indices : "contains"
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
faceIndicatorUtils -.-> getIdFromIndicator : "contains"
facePositionUtils -.-> calculateFacePosition : "contains"
facePositionUtils -.-> tempWorldPos : "contains"
facePositionUtils -.-> tempWorldScale : "contains"
facePositionUtils -.-> tempOffsetVec : "contains"
facePositionUtils -.-> tempMatrix : "contains"
facePositionUtils -.-> _avg3 : "contains"
frameCounter_file -.-> FrameCounter : "contains"
frameCounter_file -.-> frameCounter : "contains"
gpuResourceTracker -.-> GPUResourceTracker : "contains"
gpuResourceTracker -.-> gpuTracker : "contains"
loadingState -.-> getIsInitialLoading : "contains"
loadingState -.-> setIsInitialLoading : "contains"
objectUpdateHandlers -.-> handleObjectMove : "contains"
objectUpdateHandlers -.-> handleObjectUpdate : "contains"
objectVirtualization -.-> ObjectVirtualizer : "contains"
objectVirtualization -.-> objectVirtualizer : "contains"
objectVirtualization -.-> _tempVec : "contains"
objectVirtualization -.-> _sphereCenter : "contains"
objectVirtualization -.-> _tempSphere : "contains"
pathfindingUtils -.-> invalidatePathfindingCaches : "contains"
pathfindingUtils -.-> checkObjectMovement : "contains"
pathfindingUtils -.-> cleanCaches : "contains"
pathfindingUtils -.-> roundForCache : "contains"
pathfindingUtils -.-> lineIntersectsBoundingBox : "contains"
pathfindingUtils -.-> generateCacheKey : "contains"
pathfindingUtils -.-> havePositionsChanged : "contains"
pathfindingUtils -.-> checkLineIntersection : "contains"
pathfindingUtils -.-> generateCurvedPath : "contains"
pathfindingUtils -.-> checkCurveIntersections : "contains"
pathfindingUtils -.-> generateMultiSegmentPath : "contains"
pathfindingUtils -.-> precomputeCacheKey : "contains"
pathfindingUtils -.-> getPrecomputedResult : "contains"
pathfindingUtils -.-> computeConnectionPath : "contains"
pathfindingUtils -.-> precomputePathsBatch : "contains"
pathfindingUtils -.-> intersectionCache : "contains"
pathfindingUtils -.-> pathCache : "contains"
pathfindingUtils -.-> objectPositionCache : "contains"
pathfindingUtils -.-> _tempDir : "contains"
pathfindingUtils -.-> _tempResult : "contains"
pathfindingUtils -.-> _tempBoxCenter : "contains"
pathfindingUtils -.-> _tempClosest : "contains"
pathfindingUtils -.-> _tempLineToCenter : "contains"
pathfindingUtils -.-> _tempBoxRadiusVec : "contains"
pathfindingUtils -.-> _tempCurveStart : "contains"
pathfindingUtils -.-> _tempCurveEnd : "contains"
pathfindingUtils -.-> _tempCurveDir : "contains"
pathfindingUtils -.-> _tempRay : "contains"
pathfindingUtils -.-> _tempIntersectTarget : "contains"
pathfindingUtils -.-> precomputedResults : "contains"
pathfindingUtils -.-> d : "contains"
pathfindingUtils -.-> cliLineStart : "contains"
pathfindingUtils -.-> cliLineEnd : "contains"
pathfindingUtils -.-> ray : "contains"
pathfindingUtils -.-> center : "contains"
pathfindingUtils -.-> bbox : "contains"
pathfindingUtils -.-> startVec : "contains"
pathfindingUtils -.-> endVec : "contains"
pathfindingUtils -.-> line : "contains"
pathfindingUtils -.-> hitPoint : "contains"
pathfindingUtils -.-> centerPoint : "contains"
pathfindingUtils -.-> curve : "contains"
pathfindingUtils -.-> requestsById : "contains"
positionUtils -.-> calculateMidpoint : "contains"
positionUtils -.-> calculateMidpointVector : "contains"
positionUtils -.-> lerp : "contains"
positionUtils -.-> checkPositionJitter : "contains"
positionUtils -.-> tempVec1 : "contains"
positionUtils -.-> tempVec2 : "contains"
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
snappingUtils -.-> calculateAxisSnap : "contains"
snappingUtils -.-> distanceToAxis : "contains"
snappingUtils -.-> projectPointOntoAxis : "contains"
snappingUtils -.-> tempCurrentPos : "contains"
snappingUtils -.-> tempObjPos : "contains"
snappingUtils -.-> tempAxisDir : "contains"
snappingUtils -.-> tempToPoint : "contains"
snappingUtils -.-> tempProjection : "contains"
snappingUtils -.-> tempPerpendicular : "contains"
snappingUtils -.-> tempProjectedPoint : "contains"
streamlinedSpatialIndex -.-> Point3D : "contains"
streamlinedSpatialIndex -.-> BoundingBox : "contains"
streamlinedSpatialIndex -.-> OptimizedSpatialGrid : "contains"
streamlinedSpatialIndex -.-> createStreamlinedSpatialIndex : "contains"
streamlinedSpatialIndex -.-> benchmarkStreamlined : "contains"
streamlinedSpatialIndex -.-> seenObjects : "contains"
streamlinedSpatialIndex -.-> position : "contains"
terrainTileCache -.-> setOnTilesLoaded : "contains"
terrainTileCache -.-> tileKey : "contains"
terrainTileCache -.-> latLonToTile : "contains"
terrainTileCache -.-> tileBounds : "contains"
terrainTileCache -.-> fetchAndDecode : "contains"
terrainTileCache -.-> drainQueue : "contains"
terrainTileCache -.-> enqueueTile : "contains"
terrainTileCache -.-> prefetchArea : "contains"
terrainTileCache -.-> getCachedElevation : "contains"
terrainTileCache -.-> getCacheSize : "contains"
terrainTileCache -.-> pending : "contains"
terrainTileCache -.-> canvas : "contains"
textAtlas -.-> TextAtlas : "contains"
textAtlas -.-> MultiPageTextAtlas : "contains"
textAtlas -.-> isOffscreenCanvasTextSupported : "contains"
textAtlas -.-> WorkerMultiPageTextAtlas : "contains"
textAtlas -.-> _switchToSyncAtlas : "contains"
textAtlas -.-> getGlobalTextAtlas : "contains"
textAtlas -.-> resetGlobalTextAtlas : "contains"
textAtlas -.-> createAtlasTextMesh : "contains"
textAtlas -.-> page : "contains"
textAtlas -.-> c : "contains"
textAtlas -.-> tex : "contains"
textAtlas -.-> geometry : "contains"
textAtlas -.-> material : "contains"
textAtlas -.-> mesh : "contains"
textureLoader -.-> loadTextureFromFirebaseUrl : "contains"
textureLoader -.-> loadTextureFromBlob : "contains"
textureLoader -.-> url : "contains"
textureLoader -.-> texture : "contains"
unifiedPerformanceUtils -.-> throttle : "contains"
unifiedPerformanceUtils -.-> debounce : "contains"
unifiedPerformanceUtils -.-> measurePerformance : "contains"
unifiedPerformanceUtils -.-> scheduleWork : "contains"
unifiedPerformanceUtils -.-> memoize : "contains"
unifiedPerformanceUtils -.-> trackLCP : "contains"
unifiedPerformanceUtils -.-> createCacheKey : "contains"
unifiedPerformanceUtils -.-> observer : "contains"
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
unifiedValidationUtils -.-> validateEmail : "contains"
unifiedValidationUtils -.-> validateArray : "contains"
unifiedValidationUtils -.-> validateMultiple : "contains"
wasmKernels -.-> initWasmKernels : "contains"
wasmKernels -.-> isWasmReady : "contains"
wasmKernels -.-> fillEdgeBuffers : "contains"
wasmKernels -.-> getScratchStartView : "contains"
wasmKernels -.-> getScratchEndView : "contains"
wasmKernels -.-> getScratchColorView : "contains"
wasmKernels -.-> computeLodUpdates : "contains"
wasmKernels -.-> frustumCullConnections : "contains"
hoverchart_wasm_d -.-> compute_lod_updates : "contains"
hoverchart_wasm_d -.-> fill_edge_buffers : "contains"
hoverchart_wasm_d -.-> frustum_cull_connections : "contains"
hoverchart_wasm_d -.-> get_scratch_color_view : "contains"
hoverchart_wasm_d -.-> get_scratch_end_view : "contains"
hoverchart_wasm_d -.-> get_scratch_start_view : "contains"
hoverchart_wasm_d -.-> initSync : "contains"
hoverchart_wasm -.-> compute_lod_updates : "contains"
hoverchart_wasm -.-> fill_edge_buffers : "contains"
hoverchart_wasm -.-> frustum_cull_connections : "contains"
hoverchart_wasm -.-> get_scratch_color_view : "contains"
hoverchart_wasm -.-> get_scratch_end_view : "contains"
hoverchart_wasm -.-> get_scratch_start_view : "contains"
hoverchart_wasm -.-> __wbg_get_imports : "contains"
hoverchart_wasm -.-> getArrayF32FromWasm0 : "contains"
hoverchart_wasm -.-> getArrayU32FromWasm0 : "contains"
hoverchart_wasm -.-> getArrayU8FromWasm0 : "contains"
hoverchart_wasm -.-> getFloat32ArrayMemory0 : "contains"
hoverchart_wasm -.-> getStringFromWasm0 : "contains"
hoverchart_wasm -.-> getUint32ArrayMemory0 : "contains"
hoverchart_wasm -.-> getUint8ArrayMemory0 : "contains"
hoverchart_wasm -.-> passArray8ToWasm0 : "contains"
hoverchart_wasm -.-> passArrayF32ToWasm0 : "contains"
hoverchart_wasm -.-> decodeText : "contains"
hoverchart_wasm -.-> __wbg_finalize_init : "contains"
hoverchart_wasm -.-> __wbg_load : "contains"
hoverchart_wasm -.-> initSync : "contains"
hoverchart_wasm -.-> __wbg_init : "contains"
hoverchart_wasm -.-> expectedResponseType : "contains"
worker_diagramLayoutWorker -.-> estimateNodeSize : "contains"
worker_diagramLayoutWorker -.-> isHierarchyConnection : "contains"
worker_diagramLayoutWorker -.-> filterConnections : "contains"
worker_diagramLayoutWorker -.-> layoutNodes : "contains"
worker_diagramLayoutWorker -.-> layoutEdges : "contains"
worker_diagramLayoutWorker -.-> computeSize : "contains"
worker_diagramLayoutWorker -.-> computeSubtreeWidth : "contains"
worker_diagramLayoutWorker -.-> positionTree : "contains"
worker_diagramLayoutWorker -.-> positionContained : "contains"
worker_diagramLayoutWorkerClient -.-> getDiagramLayoutWorker : "contains"
worker_diagramLayoutWorkerClient -.-> terminateDiagramLayoutWorker : "contains"
worker_handTrackingWorker -.-> ensureCanvases : "contains"
worker_handTrackingWorker -.-> init : "contains"
worker_handTrackingWorker -.-> sigmoid : "contains"
worker_handTrackingWorker -.-> dedupeByRoi : "contains"
worker_handTrackingWorker -.-> roiFromLandmarks : "contains"
worker_handTrackingWorker -.-> runPalmDetection : "contains"
worker_handTrackingWorker -.-> runLandmarks : "contains"
worker_handTrackingWorker -.-> detect : "contains"
worker_handTrackingWorker -.-> dispose : "contains"
worker_handTrackingWorkerClient -.-> getHandTrackingWorker : "contains"
worker_handTrackingWorkerClient -.-> terminateHandTrackingWorker : "contains"
worker_markdownLayoutWorker -.-> LayoutEngine : "contains"
worker_markdownLayoutWorker -.-> parseFlowPaths : "contains"
worker_markdownLayoutWorker -.-> stripFlowPathSyntax : "contains"
worker_markdownLayoutWorker -.-> computeHeaderStyle : "contains"
worker_markdownLayoutWorkerClient -.-> getMarkdownLayoutWorker : "contains"
worker_markdownLayoutWorkerClient -.-> terminateMarkdownLayoutWorker : "contains"
worker_pathfindingWorkerClient -.-> getPathfindingWorker : "contains"
worker_pathfindingWorkerClient -.-> terminatePathfindingWorker : "contains"
worker_spatialIndexWorker -.-> initWasm : "contains"
worker_spatialIndexWorker -.-> _rebuildFlatBuffers : "contains"
worker_spatialIndexWorker -.-> childLOD : "contains"
worker_spatialIndexWorker -.-> parentLOD : "contains"
worker_spatialIndexWorker -.-> isPointInFrustum : "contains"
worker_spatialIndexWorkerClient -.-> getSpatialIndexWorker : "contains"
worker_spatialIndexWorkerClient -.-> terminateSpatialIndexWorker : "contains"
worker_textAtlasWorker -.-> getKey : "contains"
worker_textAtlasWorker -.-> AtlasPage : "contains"
worker_textAtlasWorker -.-> addPage : "contains"
worker_textAtlasWorkerClient -.-> getTextAtlasWorker : "contains"
worker_textAtlasWorkerClient -.-> terminateTextAtlasWorker : "contains"
worker_treeSitterScannerWorker -.-> ensureInit : "contains"
worker_treeSitterScannerWorker -.-> getLanguage : "contains"
worker_treeSitterScannerWorker -.-> getQuery : "contains"
worker_treeSitterScannerWorker -.-> getParser : "contains"
worker_treeSitterScannerWorker -.-> collectDottedSegments : "contains"
worker_treeSitterScannerWorker -.-> summariseQueryMatches : "contains"
worker_treeSitterScannerWorker -.-> stripPathQuotes : "contains"
worker_treeSitterScannerWorkerClient -.-> getTreeSitterScannerWorker : "contains"
worker_treeSitterScannerWorkerClient -.-> terminateTreeSitterScannerWorker : "contains"

%% Component Relationships
App --> FrameTicker : "uses"
App --> FrameloopController : "uses"
App --> LODManager : "enabled"
App --> CustomCamera : "ref"
App --> RealTimeConnectionUpdater : "connections"
App --> ConnectionsRenderer : "objects, allObjectsForPathfinding, visibleObjectIds..."
App --> EarthGlobe : "uses"
App --> ObjectsRenderer : "objects, visibleObjectIds, selectedId..."
App --> RepoGrid_file : "uses"
App --> CellBoundaryRenderer : "visible"
App --> HandsRenderer : "renders"
App --> DiagramOverlay2D : "uses"
App --> UIOverlay : "onCreateObject, onToggleIndicators, user..."
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, geometry..."
AtlasTextSprite --> StaticBillboardMesh : "receives"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, calculatedPosition..."
AtlasTextSprite --> DynamicBillboardMesh : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> InstancedLine : "key, points, color..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AnimatedConnectionLine : "key, points, connectionId..."
Connection --> DistanceFilteredConnectionText : "position, maxDistance"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AtlasTextSprite : "key, text, position..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> HeaderInput : "position, onTextSubmit, inputId..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> TextStyleUI : "position, onStyleChange, onClose..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> LineUI : "position, onColorChange, onToggleDashed..."
ConnectionsRenderer --> BatchedConnectionLines : "connections, objectPositions, selectedConnectionId..."
ConnectionsRenderer --> BatchedCurvedLines : "connections, objectPositions, pathfindingObjects..."
ConnectionsRenderer --> DistanceFilteredTextLabels : "labels, maxDistance, onLabelClick"
ConnectionsRenderer --> ConnectionsRenderer : "key, connection, allObjectsForPathfinding..."
ConnectionsRenderer --> Connection : "receives"
Cube --> CubeFace : "cubeId, faceName, faceData..."
Cube --> FaceUI : "position, normal, onColorChange..."
Cube --> FaceTextInput : "position, onTextSubmit, inputId"
Cube --> AtlasTextSprite : "text, position, onClick..."
Cube --> TextStyleUI : "position, onStyleChange, onClose..."
Cube --> SnapLineIndicator : "points, axis, visible"
Cube --> InstancedLine : "points, color, lineWidth"
Cube --> HeaderInput : "position, onTextSubmit, inputId..."
Cube --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
CubeFace --> FaceIndicator : "position, rotation, onClick..."
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
DistanceFilteredTextLabels --> InstancedAtlasText : "labels, maxDistance, onLabelClick..."
Sphere --> SnapLineIndicator : "points, axis, visible"
Sphere --> DodecahedronFace : "key, dodecahedronId, faceIndex..."
Sphere --> InstancedLine : "points, color, lineWidth"
Sphere --> ObjectUI : "position, onTransformToggle, onHeaderToggle..."
Sphere --> FaceUI : "position, onColorChange, face..."
Sphere --> HeaderInput : "position, onTextSubmit, inputId..."
Sphere --> AtlasTextSprite : "key, text, position..."
Sphere --> TextStyleUI : "position, followTarget, onStyleChange..."
DodecahedronFace --> FaceIndicator : "id, position, rotation..."
DodecahedronFace --> AtlasTextSprite : "text, position, style..."
DodecahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
EarthGlobe --> InstancedLine : "key, points, color..."
FaceUI --> ColorPicker : "onColorSelect, onClose"
HandsRenderer --> InstancedLine : "points, color, lineWidth..."
InstancedAtlasText --> InstancedAtlasText : "key, atlas, texture..."
InstancedAtlasText --> PageInstancedMesh : "receives"
LineUI --> ColorPicker : "onColorSelect, onClose"
ObjectRenderer --> Cube : "key, id, selected..."
ObjectRenderer --> Tetrahedron : "key, id, selected..."
ObjectRenderer --> Sphere : "key, id, selected..."
ObjectRenderer --> Plane : "key, id, position..."
ObjectRenderer --> TextObject : "key, id, position..."
ObjectRenderer --> ModelObject : "key, obj, isSelected..."
ObjectsRenderer --> ObjectRenderer : "key, obj, selectedId..."
ObjectsRenderer --> GlobalCubeEdgesRenderer : "cubes, defaultLineWidth"
ObjectsRenderer --> GlobalCubeFaceRenderer : "cubes"
ObjectsRenderer --> GlobalCubeMediumLODRenderer : "cubes"
ObjectsRenderer --> GlobalCubeFullLODInstancedRenderer : "cubes, onInstanceClick"
ObjectsRenderer --> GlobalDodecahedronEdgesRenderer : "dodecahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalDodecahedronMediumLODRenderer : "dodecahedrons"
ObjectsRenderer --> GlobalTetrahedronEdgesRenderer : "tetrahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalTetrahedronMediumLODRenderer : "tetrahedrons"
ObjectsRenderer --> AtlasTextSprite : "key, text, position..."
ObjectUI --> ColorPicker : "pickerId, onColorSelect, onClose"
Plane --> SnapLineIndicator : "points, axis, visible"
Plane --> WebcamStream : "key, meshRef, active..."
Plane --> ScreenShareStream : "key, meshRef, active..."
Plane --> InstancedLine : "points, color, lineWidth..."
Plane --> FaceIndicator : "position, onClick, isActive..."
Plane --> AtlasTextSprite : "text, position, style..."
Plane --> TextStyleUI : "position, onStyleChange, onClose..."
Plane --> FaceUI : "position, onColorChange, onTextClick..."
Plane --> FaceTextInput : "position, onTextSubmit, inputId..."
Plane --> HeaderInput : "position, onTextSubmit, inputId..."
TreeRow --> TreeRow : "key, nodeId, nodes..."
GroupedView --> TreeRow : "key, nodeId, nodes..."
RepoAnalysisOverlay --> RepoAnalysisOverlay : "allNodes, hierarchy, filter..."
RepoAnalysisOverlay --> GroupedView : "receives"
RepoAnalysisOverlay --> RepoAnalysisOverlay : "key, nodeId, nodes..."
RepoAnalysisOverlay --> TreeRow : "receives"
RepoGrid_file --> RepoGrid_file : "key"
RepoGrid_file --> RepoGridLines : "receives"
SnapLineIndicator --> InstancedLine : "points, color, lineWidth"
SpacePresenceAvatars --> SpacePresenceAvatars : "uses"
SpacePresenceAvatars --> HandTrackingToggle : "receives"
SpacePresenceAvatars --> SpacePresenceAvatars : "key, user"
SpacePresenceAvatars --> Avatar : "receives"
Tetrahedron --> AtlasTextSprite : "text, position, onClick..."
Tetrahedron --> TextStyleUI : "position, onStyleChange, onClose..."
Tetrahedron --> TetrahedronFace : "key, id, faceName..."
Tetrahedron --> SnapLineIndicator : "points, axis, visible"
Tetrahedron --> InstancedLine : "points, color, lineWidth"
Tetrahedron --> HeaderInput : "position, onTextSubmit, inputId..."
Tetrahedron --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
TetrahedronFace --> AtlasTextSprite : "text, position, followTarget..."
TetrahedronFace --> TextStyleUI : "position, onStyleChange, onClose..."
TetrahedronFace --> FaceUI : "position, normal, onColorChange..."
TetrahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
TetrahedronFace --> FaceIndicator : "position, rotation, onClick..."
TextObject --> SnapLineIndicator : "points, axis, visible"
TextObject --> FaceIndicator : "position, rotation, onClick..."
TextObject --> TextObjectUI : "ref, id, textStyle..."
TextObjectUI --> TextStyleUI : "uiType, textStyle, onStyleChange..."
TextStyleUI --> TextStyleUIContent : "receives"
TextObjectUI --> ColorPicker : "onColorSelect, onClose"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> ColorPicker : "pickerId, onColorSelect, onClose"
TextStyleUI --> TextStyleUI : "onStyleChange, distance, onClose"
TextStyleUI --> TextStyleUIContent : "receives"
TextStyleUIContainer --> TextStyleUI : "onStyleChange"
TextStyleUI --> TextStyleUIContent : "receives"
UIOverlay --> SpacePresenceAvatars : "spaceId, currentCell, inline"
UIOverlay --> RepoAnalysisOverlay : "open, onClose, repoName"
UIOverlay --> UIOverlay : "uses"
UIOverlay --> EarthSidebarSections : "receives"
UIOverlay --> SpaceChat : "spaceId, user, isOpen..."
CreateSpacePopup --> OrgMemberDropdown : "members, selectedUserId, onSelect..."
DiagramContent --> SectionEyebrow : "uses"
FeaturesContent --> SectionEyebrow : "uses"
FeaturesContent --> Bullet : "key"
AudienceContent --> SectionEyebrow : "uses"
CtaContent --> SectionEyebrow : "uses"
CtaContent --> Bullet : "uses"
LandingScrollContent_file --> LandingScrollContent_file : "isMobile"
LandingScrollContent_file --> ContentPanel : "receives"
LandingApp --> CreateSpacePopup : "uses"
LandingApp --> UpgradePrompt : "show, onClose, currentTier"
LandingApp --> ShareSpacePopup : "uses"
LandingApp --> OrganizationManager : "user, show, onClose"
LandingApp --> OrderHeader : "windowSize"
LandingApp --> CustomCamera : "scrollProgressRef"
LandingApp --> PerspectiveGrid_file : "uses"
LandingApp --> SpacesTable : "uses"
LandingApp --> UserLoginSection : "user, windowSize, onLogin..."
LandingApp --> WelcomeOverlay : "windowSize, onLogin, onTryWithoutAccount"
LandingApp --> LandingScrollContent_file : "scrollProgress, isMobile, onLogin..."
UpdatesContainer --> UpdatesViewer : "content, timestamp"

%% Component Dependencies
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
App --> useObjectsStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useSpatialManagerStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useUIOverlayStore : "uses store"
App --> useSpatialManager_file : "{loadedCells, isInitialized, currentCellCoords...}"
useSpatialManager_file --> useSpatialManager_file : "receives"
App --> useConnectionStore : "uses store"
App --> useConnectionStore : "uses store"
App --> useConnectionStore : "uses store"
App --> useConnectionStore : "uses store"
App --> useConnections_file : "{connections, handleLineStyleChange, handleLineColorChange...}"
useConnections_file --> useConnections_file : "receives"
App --> useObjects_file : "{selectedId, setSelectedId, handleCreateObject...}"
useObjects_file --> useObjects_file : "receives"
App --> useIndicators_file : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator...}"
useIndicators_file --> useIndicators_file : "receives"
App --> useUIOverlayStore : "uses store"
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
App --> repoContainerService : "uses service"
repoContainerService --> toggleTaskExpansion : "receives"
App --> spatialObjectsService : "uses service"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> CELL_SIZE : "uses service"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> presenceService : "uses service"
presenceService --> setGuestPresence : "receives"
App --> spacesService : "uses service"
spacesService --> getPublicSpaceMetadata : "receives"
App --> webRservice : "uses service"
webRservice --> initWebRTC : "receives"
App --> useCentralizedBroadcastManager_file : "uses hook"
useCentralizedBroadcastManager_file --> useCentralizedBroadcastManager_file : "receives"
App --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> ConnectionAnimationManager : "receives"
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
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AtlasTextSprite --> useTextAtlasStore : "uses store"
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
BatchedCurvedLines --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
CellBoundaryRenderer --> CELL_NEIGHBOR_RADIUS : "uses service"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "{startObject, endObject}"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "uses store"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
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
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses store"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
useFrustumCulling --> useFrustumCulledConnections : "receives"
ConnectionsRenderer --> useConnectionStore : "uses store"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
ConnectionsRenderer --> useConnectionObjects_file : "uses hook"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
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
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "uses store"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "uses hook"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "uses hook"
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
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useObjectsStore : "uses store"
Cube --> useFaceIndicatorStore : "uses store"
Cube --> usePipelineStore : "uses store"
Cube --> useObjectsStore : "uses store"
Cube --> useConnectionStore : "uses store"
Cube --> useCubeStore : "uses store"
Cube --> useCubeStore : "uses store"
Cube --> useIndicatorsStore : "uses store"
Cube --> useFaceIndicatorStore : "uses store"
Cube --> useCubeStore : "uses store"
Cube --> useObjectsStore : "uses store"
Cube --> useConnectionStore : "uses store"
Cube --> useIndicatorsStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> LOD_LEVELS : "uses store"
Cube --> usePipelineStore : "uses store"
Cube --> useSpaceManagerStore : "uses store"
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
Cube --> TASK_STATUS : "uses service"
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
CubeFace --> useCubeStore : "uses store"
CubeFace --> useCubeStore : "uses store"
CubeFace --> cubeStore : "uses store"
cubeStore --> getCubeFaceStateSelector : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useUIOverlayStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useUIOverlayStore : "uses store"
DiagramOverlay2D --> useObjectsStore : "uses store"
Sphere --> useObjectsStore : "uses store"
Sphere --> useObjectsStore : "uses store"
Sphere --> useConnectionStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useDodecahedronStore : "uses store"
Sphere --> useDodecahedronStore : "uses store"
Sphere --> useIndicatorsStore : "uses store"
Sphere --> useDodecahedronStore : "uses store"
Sphere --> useObjectsStore : "uses store"
Sphere --> useConnectionStore : "uses store"
Sphere --> useIndicatorsStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> LOD_LEVELS : "uses store"
Sphere --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Sphere --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Sphere --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
DodecahedronFace --> useDodecahedronStore : "uses store"
DodecahedronFace --> useDodecahedronStore : "uses store"
EarthGlobe --> useEarthSettingsStore : "uses store"
EarthGlobe --> useEarthSettingsStore : "uses store"
EarthGlobe --> useEarthSettingsStore : "uses store"
EarthGlobe --> useEarthSettingsStore : "uses store"
EarthGlobe --> useEarthSettingsStore : "uses store"
EarthGlobe --> useEarthSettingsStore : "uses store"
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
FaceIndicator --> useFaceIndicatorStore : "uses store"
FaceIndicator --> useFaceIndicatorStore : "uses store"
FaceIndicator --> useFaceIndicatorStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FrameloopController --> useUIOverlayStore : "uses store"
FrameloopController --> useUIOverlayStore : "uses store"
FrameTicker --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
GlobalCubeEdgesRenderer --> useLODStore : "uses store"
GlobalCubeEdgesRenderer --> useLODStore : "uses store"
GlobalCubeEdgesRenderer --> LOD_LEVELS : "uses store"
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
GlobalCubeFaceRenderer --> useLODStore : "uses store"
GlobalCubeFaceRenderer --> useCubeStore : "uses store"
GlobalCubeFaceRenderer --> useLODStore : "uses store"
GlobalCubeFaceRenderer --> LOD_LEVELS : "uses store"
GlobalCubeFullLODInstancedRenderer --> useLODStore : "uses store"
GlobalCubeFullLODInstancedRenderer --> useCubeStore : "uses store"
GlobalCubeFullLODInstancedRenderer --> useCubeStore : "uses store"
GlobalCubeFullLODInstancedRenderer --> useLODStore : "uses store"
GlobalCubeFullLODInstancedRenderer --> LOD_LEVELS : "uses store"
GlobalCubeMediumLODRenderer --> useLODStore : "uses store"
GlobalCubeMediumLODRenderer --> useLODStore : "uses store"
GlobalCubeMediumLODRenderer --> LOD_LEVELS : "uses store"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses store"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses store"
GlobalDodecahedronEdgesRenderer --> LOD_LEVELS : "uses store"
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
GlobalDodecahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalDodecahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalDodecahedronMediumLODRenderer --> LOD_LEVELS : "uses store"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses store"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses store"
GlobalTetrahedronEdgesRenderer --> LOD_LEVELS : "uses store"
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
GlobalTetrahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalTetrahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalTetrahedronMediumLODRenderer --> LOD_LEVELS : "uses store"
HandsRenderer --> useHandTrackingStore : "uses store"
HandsRenderer --> useHandTrackingStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
InstancedAtlasText --> useTextAtlasStore : "uses store"
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
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LODManager --> useObjectsStore : "uses store"
LODManager --> useLODStore : "uses store"
LODManager --> useLODStore : "uses store"
LODManager --> lodStore : "uses store"
lodStore --> calculateLODLevel : "receives"
LODManager --> lodStore : "uses store"
lodStore --> calculateParentLODLevel : "receives"
LODManager --> LOD_LEVELS : "uses store"
LODManager --> FACE_TEXT_DISTANCE_SQ : "uses store"
LODManager --> useObjectsStore : "uses store"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
ObjectsRenderer --> useUIOverlayStore : "uses store"
ObjectsRenderer --> useCubeStore : "uses store"
ObjectsRenderer --> useCubeStore : "uses store"
ObjectsRenderer --> useUIOverlayStore : "uses store"
ObjectsRenderer --> useDiagramStore : "uses store"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectUI --> useColorPickerStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
Plane --> useObjectsStore : "uses store"
Plane --> useConnectionStore : "uses store"
Plane --> usePlaneStore : "uses store"
Plane --> usePlaneStore : "uses store"
Plane --> useIndicatorsStore : "uses store"
Plane --> useIndicatorsStore : "uses store"
Plane --> useUIOverlayStore : "uses store"
Plane --> useUIOverlayStore : "uses store"
Plane --> useUIOverlayStore : "uses store"
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
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useObjectsStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
RealTimeConnectionUpdater --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
RepoAnalysisOverlay --> useDiagramStore : "uses store"
RepoAnalysisOverlay --> useDiagramStore : "uses store"
RepoAnalysisOverlay --> useObjectsStore : "uses store"
RepoAnalysisOverlay --> useDiagramStore : "uses store"
RepoAnalysisOverlay --> useObjectsStore : "uses store"
TreeRow --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> useDiagramStore : "uses store"
TreeRow --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> useObjectsStore : "uses store"
GroupedView --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> useDiagramStore : "uses store"
GroupedView --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> useObjectsStore : "uses store"
RepoGrid_file --> useObjectsStore : "uses store"
RepoGrid_file --> repoContainerService : "uses service"
repoContainerService --> computeGridLayout : "receives"
RepoGrid_file --> TASK_STATUS : "uses service"
RepoGridLines --> RepoGrid_file : "calls out"
RepoGrid_file --> useObjectsStore : "uses store"
RepoGridLines --> RepoGrid_file : "calls out"
RepoGrid_file --> repoContainerService : "uses service"
repoContainerService --> computeGridLayout : "receives"
RepoGridLines --> RepoGrid_file : "calls out"
RepoGrid_file --> TASK_STATUS : "uses service"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> useTextureUpdater_file : "uses hook"
useTextureUpdater_file --> useTextureUpdater_file : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
Tetrahedron --> useFaceIndicatorStore : "uses store"
Tetrahedron --> useObjectsStore : "uses store"
Tetrahedron --> useConnectionStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useTetrahedronStore : "uses store"
Tetrahedron --> useTetrahedronStore : "uses store"
Tetrahedron --> useIndicatorsStore : "uses store"
Tetrahedron --> useIndicatorsStore : "uses store"
Tetrahedron --> useFaceIndicatorStore : "uses store"
Tetrahedron --> useTetrahedronStore : "uses store"
Tetrahedron --> useObjectsStore : "uses store"
Tetrahedron --> useConnectionStore : "uses store"
Tetrahedron --> useIndicatorsStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> LOD_LEVELS : "uses store"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Tetrahedron --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
TetrahedronFace --> useTetrahedronStore : "uses store"
TetrahedronFace --> useTetrahedronStore : "uses store"
TextObject --> useObjectsStore : "uses store"
TextObject --> useConnectionStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useIndicatorsStore : "uses store"
TextObject --> useIndicatorsStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useObjectsStore : "uses store"
TextObject --> useConnectionStore : "uses store"
TextObject --> useIndicatorsStore : "uses store"
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
TextObjectUI --> useColorPickerStore : "uses store"
TextObjectUI --> useColorPickerStore : "uses store"
TextObjectUI --> useColorPickerStore : "uses store"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUI --> useColorPickerStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useEarthSettingsStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useUIOverlayStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useDiagramStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useConnectionStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useObjectsStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> uiOverlayStore : "uses store"
uiOverlayStore --> setCellBoundariesVisible : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useEarthSettingsStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : "uses store"
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
UIOverlay --> TASK_STATUS : "uses service"
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
UIOverlay --> usePipelineStore : "uses store"
UIOverlay --> usePipelineStore : "uses store"
UIOverlay --> usePipelineStore : "uses store"
UIOverlay --> usePipelineStore : "uses store"
UIOverlay --> usePipelineStore : "uses store"
UIOverlay --> usePipelineStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useDiagramStore : "uses store"
UIOverlay --> useDiagramStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> useSpatialManagerStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useDiagramStore : "uses store"
UIOverlay --> useSpatialManagerStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> uiOverlayStore : "uses store"
uiOverlayStore --> setCellBoundariesVisible : "receives"
UIOverlay --> useEarthSettingsStore : "uses store"
UIOverlay --> usePipelineStore : "uses store"
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
UIOverlay --> TASK_STATUS : "uses service"
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
WebcamStream --> useWebcamStreamStore : "uses store"
WebcamStream --> useWebcamStreamStore : "uses store"
WebcamStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
WebcamStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
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
OrganizationManager --> PLAN_LIMITS : "uses service"
LandingApp --> useWindowSize_file : "uses hook"
useWindowSize_file --> useWindowSize_file : "receives"
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

%% Function Call Relationships
createVerifyAuthTokenApp --> backend_index : "calls out"
backend_index --> express : "calls express"
createVerifyAuthTokenApp --> backend_index : "calls out"
backend_index --> cors : "calls cors"
createBulkImportApp --> backend_index : "calls out"
backend_index --> express : "calls express"
createBulkImportApp --> backend_index : "calls out"
backend_index --> cors : "calls cors"
deleteCellContents --> toMillis : "calls toMillis"
deleteCellContents --> toMillis : "calls toMillis"
createBulkDeleteApp --> backend_index : "calls out"
backend_index --> express : "calls express"
createBulkDeleteApp --> backend_index : "calls out"
backend_index --> cors : "calls cors"
createBulkDeleteApp --> generateJobId : "calls generateJobId"
runBulkDeleteJob --> deleteCellContents : "calls deleteCellContents"
scanJsBundles --> extractSourceMapUrl : "calls extractSourceMapUrl"
scanJsBundles --> scanOriginalSource : "calls scanOriginalSource"
scanJsBundles --> extractNamesFromSourceMap : "calls extractNamesFromSourceMap"
captureRuntimeTrace --> getCompName : "calls getCompName"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> scanJsBundles : "calls scanJsBundles"
captureRuntimeTrace --> deduplicateApiCalls : "calls deduplicateApiCalls"
captureRuntimeTrace --> dedup : "calls dedup"
captureRuntimeTrace --> dedup : "calls dedup"
captureRuntimeTrace --> dedup : "calls dedup"
captureRuntimeTrace --> buildConnections : "calls buildConnections"
createScanWebsiteRuntimeApp --> backend_index : "calls out"
backend_index --> express : "calls express"
createScanWebsiteRuntimeApp --> backend_index : "calls out"
backend_index --> cors : "calls cors"
createScanWebsiteRuntimeApp --> validateRuntimeScanUrl : "calls validateRuntimeScanUrl"
createScanWebsiteRuntimeApp --> captureRuntimeTrace : "calls captureRuntimeTrace"
createScanWebsiteRuntimeApp --> backend_index : "calls out"
backend_index --> runtimeScanService : "calls generateMerfolkFromRuntimeTrace"
runtimeScanService --> generateMerfolkFromRuntimeTrace : "receives"
downloadTiles --> fetchBuffer : "calls fetchBuffer"
downloadTiles --> decodeTile : "calls decodeTile"
downloadTiles --> worker : "calls worker"
generateHeightmap --> latLonToMercatorPixel : "calls latLonToMercatorPixel"
generateHeightmap --> sampleElevation : "calls sampleElevation"
main --> downloadTiles : "calls downloadTiles"
main --> generateHeightmap : "calls generateHeightmap"
App --> presenceService : "calls setGuestPresence"
presenceService --> setGuestPresence : "receives"
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> spacesService : "calls getPublicSpaceMetadata"
spacesService --> getPublicSpaceMetadata : "receives"
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
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> webRservice : "calls initWebRTC"
webRservice --> initWebRTC : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> getSharedMaterial : "calls getSharedMaterial"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
BatchedCurvedLines --> numericCacheKey : "calls numericCacheKey"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
BatchedCurvedLines --> pathToSegments : "calls pathToSegments"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> computeVisibleCells : "calls computeVisibleCells"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "calls calculateMidpoint"
positionUtils --> calculateMidpoint : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> getTextParametricT : "calls getTextParametricT"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ConnectionsRenderer --> pathfindingUtils : "calls invalidatePathfindingCaches"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> pathfindingUtils : "calls precomputePathsBatch"
pathfindingUtils --> precomputePathsBatch : "receives"
ConnectionsRenderer --> redistributeFaces : "calls redistributeFaces"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> getTextParametricT : "calls getTextParametricT"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Cube --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
CubeFace --> cubeStore : "calls getCubeFaceStateSelector"
cubeStore --> getCubeFaceStateSelector : "receives"
CubeFace --> getColoredMaterial : "calls getColoredMaterial"
MerfolkEdge --> EdgeMarkerDefs : "calls out"
EdgeMarkerDefs --> getEdgeStyle : "calls getEdgeStyle"
MerfolkEdge --> EdgeMarkerDefs : "calls out"
EdgeMarkerDefs --> getSelectedStyle : "calls getSelectedStyle"
MerfolkEdge --> EdgeMarkerDefs : "calls out"
EdgeMarkerDefs --> getUnselectedStyle : "calls getUnselectedStyle"
DiagramOverlay2D --> worker_diagramLayoutWorkerClient : "calls getDiagramLayoutWorker"
worker_diagramLayoutWorkerClient --> getDiagramLayoutWorker : "receives"
DiagramOverlay2D --> buildReactFlowNodes : "calls buildReactFlowNodes"
DiagramOverlay2D --> buildReactFlowEdges : "calls buildReactFlowEdges"
DiagramOverlay2D --> filterEdges : "calls filterEdges"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
DodecahedronFace --> getDodecahedronColoredMaterial : "calls getDodecahedronColoredMaterial"
EarthGlobe --> earthTerrainGenerator : "calls setHeightmapData"
earthTerrainGenerator --> setHeightmapData : "receives"
EarthGlobe --> earthHeightmapLoader : "calls loadEarthHeightmap"
earthHeightmapLoader --> loadEarthHeightmap : "receives"
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
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeMesh"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeGeometry"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeMesh"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
FaceIndicator --> getIndicatorMaterial : "calls getIndicatorMaterial"
GlobalCubeEdgesRenderer --> _ensureCubeWasmBuffers : "calls _ensureCubeWasmBuffers"
GlobalCubeEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalCubeFullLODInstancedRenderer --> isCubeUnmodified : "calls isCubeUnmodified"
GlobalDodecahedronEdgesRenderer --> _ensureDodecaWasmBuffers : "calls _ensureDodecaWasmBuffers"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalTetrahedronEdgesRenderer --> _ensureTetraWasmBuffers : "calls _ensureTetraWasmBuffers"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
HandsRenderer --> makeHandState : "calls makeHandState"
HandsRenderer --> makeHandState : "calls makeHandState"
HandsRenderer --> applyJoints : "calls applyJoints"
HandsRenderer --> buildBonePoints : "calls buildBonePoints"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
LODManager --> worker_spatialIndexWorkerClient : "calls getSpatialIndexWorker"
worker_spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> worker_spatialIndexWorkerClient : "calls getSpatialIndexWorker"
worker_spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> worker_spatialIndexWorkerClient : "calls getSpatialIndexWorker"
worker_spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> lodStore : "calls calculateParentLODLevel"
lodStore --> calculateParentLODLevel : "receives"
LODManager --> lodStore : "calls calculateLODLevel"
lodStore --> calculateLODLevel : "receives"
LODManager --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "calls getSmoothedFrameTime"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
ModelObject --> createLoaders : "calls createLoaders"
ObjectRenderer --> useObjects_file : "calls handleObjectDelete"
useObjects_file --> handleObjectDelete : "receives"
ObjectRenderer --> useObjects_file : "calls registerTransformingObject"
useObjects_file --> registerTransformingObject : "receives"
ObjectRenderer --> useObjects_file : "calls registerTransformingObject"
useObjects_file --> registerTransformingObject : "receives"
ObjectRenderer --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> isCubeUnmodified : "calls isCubeUnmodified"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RepoGrid_file --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
SpaceChat --> mergeMessages : "calls mergeMessages"
SpaceChat --> mergeMessages : "calls mergeMessages"
SpaceChat --> getGuestId : "calls getGuestId"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls stopHandTracking"
handTrackingService --> stopHandTracking : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls startHandTracking"
handTrackingService --> startHandTracking : "receives"
SpacePresenceAvatars --> presenceService : "calls subscribeToSpacePresence"
presenceService --> subscribeToSpacePresence : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
TetrahedronFace --> getTetrahedronColoredMaterial : "calls getTetrahedronColoredMaterial"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> lerpVector : "calls lerpVector"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
UIOverlay --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
UIOverlay --> repoContainerService : "calls findRepoContainer"
repoContainerService --> findRepoContainer : "receives"
UIOverlay --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
UIOverlay --> uiOverlayStore : "calls setCellBoundariesVisible"
uiOverlayStore --> setCellBoundariesVisible : "receives"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> runtimeScanService : "calls validateScanUrl"
runtimeScanService --> validateScanUrl : "receives"
UIOverlay --> runtimeScanService : "calls scanWebsiteAndGenerateDiagram"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
UIOverlay --> githubRepoService : "calls handleGithubCallback"
githubRepoService --> handleGithubCallback : "receives"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> csvDiagramService : "calls processCsvFile"
csvDiagramService --> processCsvFile : "receives"
WebcamStream --> applyVideoTexture : "calls applyVideoTexture"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> applyVideoTexture : "calls applyVideoTexture"
useConnections_file --> connectionCallback : "calls connectionCallback"
useConnections_file --> connectionCallback : "calls connectionCallback"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> loadingState : "calls getIsInitialLoading"
loadingState --> getIsInitialLoading : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> loadingState : "calls getIsInitialLoading"
loadingState --> getIsInitialLoading : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> useDebouncedUpdate_file : "calls cleanup"
useDebouncedUpdate_file --> cleanup : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
isConnectionVisible --> useFrustumCulling : "calls out"
useFrustumCulling --> worker_spatialIndexWorker : "calls isPointInFrustum"
worker_spatialIndexWorker --> isPointInFrustum : "receives"
isConnectionVisible --> useFrustumCulling : "calls out"
useFrustumCulling --> worker_spatialIndexWorker : "calls isPointInFrustum"
worker_spatialIndexWorker --> isPointInFrustum : "receives"
LandingScrollContent_file --> getSectionVisibility : "calls getSectionVisibility"
OrganizationManager --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
OrganizationManager --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
OrganizationManager --> organizationService : "calls createOrganization"
organizationService --> createOrganization : "receives"
OrganizationManager --> organizationService : "calls inviteUserToOrganization"
organizationService --> inviteUserToOrganization : "receives"
OrganizationManager --> organizationService : "calls removeMemberFromOrganization"
organizationService --> removeMemberFromOrganization : "receives"
OrganizationManager --> organizationService : "calls leaveOrganization"
organizationService --> leaveOrganization : "receives"
OrganizationManager --> organizationService : "calls updateOrganizationPlan"
organizationService --> updateOrganizationPlan : "receives"
OrganizationManager --> organizationService : "calls deleteOrganization"
organizationService --> deleteOrganization : "receives"
OrganizationManager --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
OrganizationManager --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> authService : "calls signOut"
authService --> signOut : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
parseCsv --> splitCsvLine : "calls splitCsvLine"
parseCsv --> splitCsvLine : "calls splitCsvLine"
detectColumns --> isNumericColumn : "calls isNumericColumn"
detectColumns --> parseNumeric : "calls parseNumeric"
buildGroups --> parseNumeric : "calls parseNumeric"
buildGroups --> parseNumeric : "calls parseNumeric"
processCsvFile --> parseCsv : "calls parseCsv"
processCsvFile --> detectColumns : "calls detectColumns"
processCsvFile --> filterAggregateRows : "calls filterAggregateRows"
processCsvFile --> buildGroups : "calls buildGroups"
processCsvFile --> getCameraBasePosition : "calls getCameraBasePosition"
processCsvFile --> layoutGroup : "calls layoutGroup"
processCsvFile --> computeBounds : "calls computeBounds"
processCsvFile --> csvDiagramService : "calls out"
csvDiagramService --> constants : "calls getGroupColor"
constants --> getGroupColor : "receives"
processCsvFile --> csvDiagramService : "calls out"
csvDiagramService --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
processCsvFile --> computeBounds : "calls computeBounds"
createIssue --> githubFetch : "calls githubFetch"
assignCopilotToIssue --> githubFetch : "calls githubFetch"
getIssue --> githubFetch : "calls githubFetch"
findPullRequestForIssue --> githubFetch : "calls githubFetch"
approvePullRequest --> githubFetch : "calls githubFetch"
mergePullRequest --> githubFetch : "calls githubFetch"
getPullRequest --> githubFetch : "calls githubFetch"
getRepoInfo --> githubFetch : "calls githubFetch"
getBranchRef --> githubFetch : "calls githubFetch"
createBranchRef --> githubFetch : "calls githubFetch"
deleteBranchRef --> githubFetch : "calls githubFetch"
getFileContents --> githubFetch : "calls githubFetch"
createFileOnBranch --> githubFetch : "calls githubFetch"
createPullRequest --> githubFetch : "calls githubFetch"
addComment --> githubFetch : "calls githubFetch"
revertCommit --> githubFetch : "calls githubFetch"
revertCommit --> githubFetch : "calls githubFetch"
decodePalmDetections --> palmDecode : "calls out"
palmDecode --> worker_handTrackingWorker : "calls sigmoid"
worker_handTrackingWorker --> sigmoid : "receives"
decodePalmDetections --> iou : "calls iou"
decodePalmDetections --> detectionToRoi : "calls detectionToRoi"
ensureWorker --> handTrackingService : "calls out"
handTrackingService --> worker_handTrackingWorkerClient : "calls getHandTrackingWorker"
worker_handTrackingWorkerClient --> getHandTrackingWorker : "receives"
onFrame --> scheduleNext : "calls scheduleNext"
onFrame --> runOnce : "calls runOnce"
onFrame --> scheduleNext : "calls scheduleNext"
startHandTracking --> ensureWorker : "calls ensureWorker"
startHandTracking --> openCamera : "calls openCamera"
startHandTracking --> scheduleNext : "calls scheduleNext"
startHandTracking --> stopHandTracking : "calls stopHandTracking"
stopHandTracking --> teardownCamera : "calls teardownCamera"
stopHandTracking --> handTrackingService : "calls out"
handTrackingService --> worker_handTrackingWorkerClient : "calls terminateHandTrackingWorker"
worker_handTrackingWorkerClient --> terminateHandTrackingWorker : "receives"
processTask --> getGithubToken : "calls getGithubToken"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls getRepoInfo"
githubIssuesService --> getRepoInfo : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls getBranchRef"
githubIssuesService --> getBranchRef : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls createBranchRef"
githubIssuesService --> createBranchRef : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls deleteBranchRef"
githubIssuesService --> deleteBranchRef : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls createBranchRef"
githubIssuesService --> createBranchRef : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls getFileContents"
githubIssuesService --> getFileContents : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls createFileOnBranch"
githubIssuesService --> createFileOnBranch : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls createPullRequest"
githubIssuesService --> createPullRequest : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls addComment"
githubIssuesService --> addComment : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls updateTaskStatus"
pipelineTaskService --> updateTaskStatus : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls updateTaskStatus"
pipelineTaskService --> updateTaskStatus : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls getPullRequest"
githubIssuesService --> getPullRequest : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls updateTaskStatus"
pipelineTaskService --> updateTaskStatus : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> repoContainerService : "calls repositionAllTasks"
repoContainerService --> repositionAllTasks : "receives"
processTask --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls updateTaskStatus"
pipelineTaskService --> updateTaskStatus : "receives"
startPipeline --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
startPipeline --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
startPipeline --> reconcilePendingTasks : "calls reconcilePendingTasks"
startPipeline --> getLatestTasks : "calls getLatestTasks"
startPipeline --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls getNextActionableTask"
pipelineTaskService --> getNextActionableTask : "receives"
startPipeline --> getLatestTasks : "calls getLatestTasks"
startPipeline --> processTask : "calls processTask"
startPipeline --> getLatestTasks : "calls getLatestTasks"
startPipeline --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls getNextActionableTask"
pipelineTaskService --> getNextActionableTask : "receives"
reconcilePendingTasks --> getGithubToken : "calls getGithubToken"
reconcilePendingTasks --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> githubIssuesService : "calls getPullRequest"
githubIssuesService --> getPullRequest : "receives"
reconcilePendingTasks --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls updateTaskStatus"
pipelineTaskService --> updateTaskStatus : "receives"
reconcilePendingTasks --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> pipelineTaskService : "calls updateTaskStatus"
pipelineTaskService --> updateTaskStatus : "receives"
reconcilePendingTasks --> pipelineOrchestrator : "calls out"
pipelineOrchestrator --> repoContainerService : "calls repositionAllTasks"
repoContainerService --> repositionAllTasks : "receives"
getPipelineTasks --> isTaskObject : "calls isTaskObject"
getPipelineTasksForRepo --> getPipelineTasks : "calls getPipelineTasks"
getRepoSlugsFromTasks --> getPipelineTasks : "calls getPipelineTasks"
getCellId --> getCellCoordinates : "calls getCellCoordinates"
computeContainerScale --> computeGridLayout : "calls computeGridLayout"
repositionAllTasks --> findRepoContainer : "calls findRepoContainer"
repositionAllTasks --> computeContainerScale : "calls computeContainerScale"
repositionAllTasks --> computeGridLayout : "calls computeGridLayout"
repositionAllTasks --> repoContainerService : "calls out"
repoContainerService --> spatialObjectsService : "calls deleteObject"
spatialObjectsService --> deleteObject : "receives"
repositionAllTasks --> repoContainerService : "calls out"
repoContainerService --> spatialObjectsService : "calls saveObjectToCell"
spatialObjectsService --> saveObjectToCell : "receives"
repositionAllTasks --> getGridCellPosition : "calls getGridCellPosition"
repositionAllTasks --> repoContainerService : "calls out"
repoContainerService --> spatialPartitioning : "calls getCellId"
spatialPartitioning --> getCellId : "receives"
repositionAllTasks --> repoContainerService : "calls out"
repoContainerService --> spatialObjectsService : "calls saveObjectToCell"
spatialObjectsService --> saveObjectToCell : "receives"
repositionAllTasks --> getGridCellPosition : "calls getGridCellPosition"
repositionAllTasks --> repoContainerService : "calls out"
repoContainerService --> spatialPartitioning : "calls getCellId"
spatialPartitioning --> getCellId : "receives"
repositionAllTasks --> repoContainerService : "calls out"
repoContainerService --> spatialObjectsService : "calls saveObjectToCell"
spatialObjectsService --> saveObjectToCell : "receives"
assignRepoSlugToOrphanTasks --> getAllRepoContainers : "calls getAllRepoContainers"
createRepoContainer --> findRepoContainer : "calls findRepoContainer"
createRepoContainer --> countRepoContainers : "calls countRepoContainers"
createRepoContainer --> repoContainerService : "calls out"
repoContainerService --> spatialPartitioning : "calls getCellId"
spatialPartitioning --> getCellId : "receives"
createRepoContainer --> generateId : "calls generateId"
createRepoContainer --> repoContainerService : "calls out"
repoContainerService --> spatialObjectsService : "calls saveObjectToCell"
spatialObjectsService --> saveObjectToCell : "receives"
repositionIncomingTasks --> findRepoContainer : "calls findRepoContainer"
repositionIncomingTasks --> rewriteHeader : "calls rewriteHeader"
repositionIncomingTasks --> repositionAllTasks : "calls repositionAllTasks"
createTaskObjects --> findRepoContainer : "calls findRepoContainer"
createTaskObjects --> generateId : "calls generateId"
createTaskObjects --> repoContainerService : "calls out"
repoContainerService --> spatialPartitioning : "calls getCellId"
spatialPartitioning --> getCellId : "receives"
createTaskObjects --> repoContainerService : "calls out"
repoContainerService --> spatialObjectsService : "calls saveObjectToCell"
spatialObjectsService --> saveObjectToCell : "receives"
createTaskObjects --> repositionAllTasks : "calls repositionAllTasks"
clearRepoTasks --> repoContainerService : "calls out"
repoContainerService --> spatialObjectsService : "calls saveObjectToCell"
spatialObjectsService --> saveObjectToCell : "receives"
clearRepoTasks --> repositionAllTasks : "calls repositionAllTasks"
toggleTaskExpansion --> repoContainerService : "calls out"
repoContainerService --> spatialObjectsService : "calls saveObjectToCell"
spatialObjectsService --> saveObjectToCell : "receives"
flushSaveBatch --> spatialObjectsService : "calls out"
spatialObjectsService --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
flushSaveBatch --> spatialObjectsService : "calls out"
spatialObjectsService --> spatialPartitioning : "calls getCellId"
spatialPartitioning --> getCellId : "receives"
flushSaveBatch --> spatialObjectsService : "calls out"
spatialObjectsService --> spatialPartitioning : "calls addObjectToCell"
spatialPartitioning --> addObjectToCell : "receives"
getElevationFromHeightmap --> samplePixel : "calls samplePixel"
getElevationFromHeightmap --> samplePixel : "calls samplePixel"
getElevationFromHeightmap --> samplePixel : "calls samplePixel"
getElevationFromHeightmap --> samplePixel : "calls samplePixel"
getElevationFromHeightmap --> samplePixel : "calls samplePixel"
getElevationFromHeightmap --> pixelToElevation : "calls pixelToElevation"
getElevationFromHeightmap --> pixelToElevation : "calls pixelToElevation"
getElevationFromHeightmap --> pixelToElevation : "calls pixelToElevation"
getElevationFromHeightmap --> pixelToElevation : "calls pixelToElevation"
getElevationFromHeightmap --> pixelToElevation : "calls pixelToElevation"
getElevationFromHeightmap --> pixelToElevation : "calls pixelToElevation"
getElevationFromHeightmap --> pixelToElevation : "calls pixelToElevation"
getElevationFromHeightmap --> pixelToElevation : "calls pixelToElevation"
getElevation --> earthTerrainGenerator : "calls out"
earthTerrainGenerator --> terrainTileCache : "calls getCachedElevation"
terrainTileCache --> getCachedElevation : "receives"
getElevation --> getElevationFromHeightmap : "calls getElevationFromHeightmap"
getElevation --> getElevationFromModel : "calls getElevationFromModel"
generateGlobeGeometry --> getElevation : "calls getElevation"
generateGlobeGeometry --> getColorForElevation : "calls getColorForElevation"
generateGlobeGeometry --> posAt : "calls posAt"
generateGlobeGeometry --> posAt : "calls posAt"
generateGlobeGeometry --> addLine : "calls addLine"
generateGlobeGeometry --> posAt : "calls posAt"
generateGlobeGeometry --> addLine : "calls addLine"
generateGlobeGeometry --> posAt : "calls posAt"
generateGlobeGeometry --> addLine : "calls addLine"
getColorRGB --> getParsedScheme : "calls getParsedScheme"
generateGlobeMesh --> getElevation : "calls getElevation"
generateGlobeMesh --> getColorRGB : "calls getColorRGB"
generateLocalGlobeGeometry --> getElevation : "calls getElevation"
generateLocalGlobeGeometry --> getColorForElevation : "calls getColorForElevation"
generateLocalGlobeGeometry --> posAt : "calls posAt"
generateLocalGlobeGeometry --> posAt : "calls posAt"
generateLocalGlobeGeometry --> addLine : "calls addLine"
generateLocalGlobeGeometry --> posAt : "calls posAt"
generateLocalGlobeGeometry --> addLine : "calls addLine"
generateLocalGlobeGeometry --> posAt : "calls posAt"
generateLocalGlobeGeometry --> addLine : "calls addLine"
generateLocalGlobeMesh --> getElevation : "calls getElevation"
generateLocalGlobeMesh --> getColorRGB : "calls getColorRGB"
checkObjectMovement --> roundForCache : "calls roundForCache"
generateCacheKey --> roundForCache : "calls roundForCache"
generateCacheKey --> roundForCache : "calls roundForCache"
checkLineIntersection --> cleanCaches : "calls cleanCaches"
checkLineIntersection --> generateCacheKey : "calls generateCacheKey"
checkLineIntersection --> d : "calls d"
checkLineIntersection --> d : "calls d"
checkLineIntersection --> d : "calls d"
checkLineIntersection --> d : "calls d"
checkLineIntersection --> d : "calls d"
generateCurvedPath --> generateCacheKey : "calls generateCacheKey"
generateCurvedPath --> lineIntersectsBoundingBox : "calls lineIntersectsBoundingBox"
generateCurvedPath --> generateMultiSegmentPath : "calls generateMultiSegmentPath"
generateCurvedPath --> checkCurveIntersections : "calls checkCurveIntersections"
precomputeCacheKey --> roundForCache : "calls roundForCache"
precomputeCacheKey --> roundForCache : "calls roundForCache"
getPrecomputedResult --> precomputeCacheKey : "calls precomputeCacheKey"
computeConnectionPath --> getPrecomputedResult : "calls getPrecomputedResult"
computeConnectionPath --> checkLineIntersection : "calls checkLineIntersection"
computeConnectionPath --> generateCurvedPath : "calls generateCurvedPath"
precomputePathsBatch --> pathfindingUtils : "calls out"
pathfindingUtils --> worker_pathfindingWorkerClient : "calls getPathfindingWorker"
worker_pathfindingWorkerClient --> getPathfindingWorker : "receives"
precomputePathsBatch --> precomputeCacheKey : "calls precomputeCacheKey"
isCameraMovingRapidly --> isCameraMoving : "calls isCameraMoving"
benchmarkStreamlined --> createStreamlinedSpatialIndex : "calls createStreamlinedSpatialIndex"
fetchAndDecode --> tileKey : "calls tileKey"
fetchAndDecode --> tileBounds : "calls tileBounds"
fetchAndDecode --> terrainTileCache : "calls out"
terrainTileCache --> _onTilesLoaded : "calls _onTilesLoaded"
fetchAndDecode --> drainQueue : "calls drainQueue"
drainQueue --> tileKey : "calls tileKey"
drainQueue --> fetchAndDecode : "calls fetchAndDecode"
enqueueTile --> tileKey : "calls tileKey"
prefetchArea --> latLonToTile : "calls latLonToTile"
prefetchArea --> enqueueTile : "calls enqueueTile"
prefetchArea --> drainQueue : "calls drainQueue"
getCachedElevation --> latLonToTile : "calls latLonToTile"
getCachedElevation --> tileKey : "calls tileKey"
getGlobalTextAtlas --> isOffscreenCanvasTextSupported : "calls isOffscreenCanvasTextSupported"
createAtlasTextMesh --> getGlobalTextAtlas : "calls getGlobalTextAtlas"
compute_lod_updates --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
compute_lod_updates --> passArray8ToWasm0 : "calls passArray8ToWasm0"
compute_lod_updates --> passArray8ToWasm0 : "calls passArray8ToWasm0"
compute_lod_updates --> getArrayU32FromWasm0 : "calls getArrayU32FromWasm0"
fill_edge_buffers --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
fill_edge_buffers --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
fill_edge_buffers --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
fill_edge_buffers --> passArray8ToWasm0 : "calls passArray8ToWasm0"
fill_edge_buffers --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
fill_edge_buffers --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
frustum_cull_connections --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
frustum_cull_connections --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
frustum_cull_connections --> passArrayF32ToWasm0 : "calls passArrayF32ToWasm0"
frustum_cull_connections --> getArrayU8FromWasm0 : "calls getArrayU8FromWasm0"
__wbg_get_imports --> getArrayF32FromWasm0 : "calls getArrayF32FromWasm0"
getArrayF32FromWasm0 --> getFloat32ArrayMemory0 : "calls getFloat32ArrayMemory0"
getArrayU32FromWasm0 --> getUint32ArrayMemory0 : "calls getUint32ArrayMemory0"
getArrayU8FromWasm0 --> getUint8ArrayMemory0 : "calls getUint8ArrayMemory0"
getStringFromWasm0 --> decodeText : "calls decodeText"
passArray8ToWasm0 --> getUint8ArrayMemory0 : "calls getUint8ArrayMemory0"
passArrayF32ToWasm0 --> getFloat32ArrayMemory0 : "calls getFloat32ArrayMemory0"
decodeText --> getUint8ArrayMemory0 : "calls getUint8ArrayMemory0"
__wbg_load --> expectedResponseType : "calls expectedResponseType"
initSync --> __wbg_get_imports : "calls __wbg_get_imports"
initSync --> __wbg_finalize_init : "calls __wbg_finalize_init"
__wbg_init --> __wbg_get_imports : "calls __wbg_get_imports"
__wbg_init --> __wbg_load : "calls __wbg_load"
__wbg_init --> __wbg_finalize_init : "calls __wbg_finalize_init"
filterConnections --> isHierarchyConnection : "calls isHierarchyConnection"
filterConnections --> isHierarchyConnection : "calls isHierarchyConnection"
layoutNodes --> estimateNodeSize : "calls estimateNodeSize"
layoutNodes --> computeSize : "calls computeSize"
layoutNodes --> estimateNodeSize : "calls estimateNodeSize"
layoutNodes --> computeSize : "calls computeSize"
layoutNodes --> computeSubtreeWidth : "calls computeSubtreeWidth"
layoutNodes --> computeSubtreeWidth : "calls computeSubtreeWidth"
layoutNodes --> positionTree : "calls positionTree"
layoutNodes --> positionTree : "calls positionTree"
layoutNodes --> positionContained : "calls positionContained"
layoutNodes --> positionContained : "calls positionContained"
layoutEdges --> filterConnections : "calls filterConnections"
dedupeByRoi --> roiFromLandmarks : "calls roiFromLandmarks"
runPalmDetection --> worker_handTrackingWorker : "calls out"
worker_handTrackingWorker --> imageOps : "calls letterboxToImageData"
imageOps --> letterboxToImageData : "receives"
runPalmDetection --> worker_handTrackingWorker : "calls out"
worker_handTrackingWorker --> imageOps : "calls imageDataToTensor"
imageOps --> imageDataToTensor : "receives"
runPalmDetection --> worker_handTrackingWorker : "calls out"
worker_handTrackingWorker --> palmDecode : "calls decodePalmDetections"
palmDecode --> decodePalmDetections : "receives"
runPalmDetection --> worker_handTrackingWorker : "calls out"
worker_handTrackingWorker --> anchors : "calls getAnchors"
anchors --> getAnchors : "receives"
runLandmarks --> worker_handTrackingWorker : "calls out"
worker_handTrackingWorker --> imageOps : "calls extractRotatedRoi"
imageOps --> extractRotatedRoi : "receives"
runLandmarks --> worker_handTrackingWorker : "calls out"
worker_handTrackingWorker --> imageOps : "calls imageDataToTensor"
imageOps --> imageDataToTensor : "receives"
runLandmarks --> sigmoid : "calls sigmoid"
runLandmarks --> sigmoid : "calls sigmoid"
runLandmarks --> worker_handTrackingWorker : "calls out"
worker_handTrackingWorker --> imageOps : "calls roiToImage"
imageOps --> roiToImage : "receives"
detect --> ensureCanvases : "calls ensureCanvases"
detect --> runLandmarks : "calls runLandmarks"
detect --> dedupeByRoi : "calls dedupeByRoi"
detect --> runPalmDetection : "calls runPalmDetection"
detect --> runLandmarks : "calls runLandmarks"
detect --> dedupeByRoi : "calls dedupeByRoi"
detect --> roiFromLandmarks : "calls roiFromLandmarks"
parseFlowPaths --> worker_markdownLayoutWorker : "calls out"
worker_markdownLayoutWorker --> connectionMethods : "calls addTag"
connectionMethods --> addTag : "receives"
parseFlowPaths --> worker_markdownLayoutWorker : "calls out"
worker_markdownLayoutWorker --> connectionMethods : "calls addTag"
connectionMethods --> addTag : "receives"
getQuery --> getLanguage : "calls getLanguage"
getParser --> ensureInit : "calls ensureInit"
getParser --> getLanguage : "calls getLanguage"
summariseQueryMatches --> collectDottedSegments : "calls collectDottedSegments"
summariseQueryMatches --> collectDottedSegments : "calls collectDottedSegments"
summariseQueryMatches --> stripPathQuotes : "calls stripPathQuotes"

%% Store Usage Details
App --> useObjectsStore : "objects, setObjects, isInitialLoading, setIsInitialLoading"
App --> useConnectionStore : "selectConnection, setShowLineTextStyleUI, connectionsVisible, setFocusedObjectId"
App --> useUIOverlayStore : "viewMode"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "globalAnimationEnabled"
AtlasTextSprite --> useTextAtlasStore : "atlasVersion"
ColorPicker --> useColorPickerStore : "getColorPicker, setCurrentColor, applyColor, cancelColorPicker..."
ConnectionsRenderer --> useConnectionsRendererStore_file : "connections, connectionsVisible, focusedObjectId, selectedConnection..."
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
ConnectionsRenderer --> useConnectionStore : "selectConnectionWithFlowPath"
Cube --> useFaceIndicatorStore : "setIndicatorActive"
Cube --> usePipelineStore : "isRunning"
Cube --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
Cube --> useObjectsStore : "isInitialLoading"
CubeFace --> useCubeStore : "faceColor, isSelected"
DiagramOverlay2D --> useDiagramStore : "graphs, hierarchy, connectionTags, setLayout2D..."
DiagramOverlay2D --> useUIOverlayStore : "setViewMode"
Sphere --> useObjectsStore : "setObjects, isInitialLoading"
Sphere --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
DodecahedronFace --> useDodecahedronStore : "faceColor, isHighlighted, faceText, faceTextStyle..."
EarthGlobe --> useEarthSettingsStore : "radius, exaggeration, colorScheme, showOceanFloor..."
FaceIndicator --> useFaceIndicatorStore : "setIndicatorHovered"
FaceTextInput --> useTextInputStore : "setText, submitText"
FaceUI --> useFaceStore : "setShowBorderMenu, toggleBorderMenu, setIsBorderColor"
FaceUI --> useColorPickerStore : "openColorPicker, closeColorPicker"
FrameloopController --> useUIOverlayStore : "viewMode"
GlobalCubeEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalCubeFaceRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalCubeFullLODInstancedRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalCubeFullLODInstancedRenderer --> useCubeStore : "cubes"
GlobalCubeMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalDodecahedronEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalDodecahedronMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalTetrahedronEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalTetrahedronMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
HandsRenderer --> useHandTrackingStore : "enabled, leftHand, rightHand"
HeaderInput --> useTextInputStore : "setText, submitText"
InstancedAtlasText --> useTextAtlasStore : "atlasVersion"
LineUI --> useConnectionStore : "toggleLineStylesMenu, toggleArrowDropdown, closeAllLineUIMenus, setLineUIMenuState"
LineUI --> useColorPickerStore : "openColorPicker, closeColorPicker"
LODManager --> useObjectsStore : "objects"
LODManager --> useLODStore : "childParentMap, parentIds, lodEnabled, batchSetLODLevels..."
ObjectsRenderer --> useUIOverlayStore : "viewMode"
ObjectsRenderer --> useCubeStore : "cubes"
ObjectUI --> useColorPickerStore : "isColorPickerOpen, openColorPicker, closeColorPicker"
Plane --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
Plane --> useUIOverlayStore : "pinnedWebcamPlaneId, setPinnedWebcamPlaneId, clearPinnedWebcam"
RealTimeConnectionUpdater --> useConnectionStore : "updateConnections"
RealTimeConnectionUpdater --> useSpatialManagerStore : "isInitialized"
RepoAnalysisOverlay --> useDiagramStore : "graphs, hierarchy"
RepoAnalysisOverlay --> useObjectsStore : "length"
ScreenShareStream --> useScreenShareStore : "getScreenShare, setScreenShareLoading, setScreenShareError, retryScreenShare"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> useHandTrackingStore : "enabled, fps, error"
Tetrahedron --> useFaceIndicatorStore : "setIndicatorActive"
Tetrahedron --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
Tetrahedron --> useObjectsStore : "isInitialLoading"
TetrahedronFace --> useTetrahedronStore : "faceColor, isSelectedFace, showFaceTextInput, activeTextFace..."
TextObject --> useTextObjectStore : "getTextObject, setTextObject, updateTextObjectProperty"
TextObject --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
TextObjectUI --> useColorPickerStore : "isColorPickerOpen, closeColorPicker"
TextSprite --> useTextObjectStore : "getTextSprite, setTextSpriteDragging"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "openColorPicker, closeColorPicker"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useEarthSettingsStore : "radius, setRadius, exaggeration, setExaggeration..."
UIOverlay --> usePipelineStore : "isRunning, isPaused, autoApprove, connectedRepo..."
UIOverlay --> useObjectsStore : "objects, isInitialLoading, resetObjects"
UIOverlay --> useUIOverlayStore : "toggleMenu, toggleTemplate, updateTemplateConfig, isUploadingModel..."
UIOverlay --> useConnectionStore : "connectionsVisible, toggleConnectionsVisible, resetConnections, length"
UIOverlay --> useDiagramStore : "is2DReady, renderProgress"
WebcamStream --> useWebcamStreamStore : "getWebcamStream, setWebcamLoading, setWebcamError, retryWebcamStream"
useAuth_file --> useAuth_file : "calls out"
useAuth_file --> useAuthStore : "authState, initializeAuth, cleanup"
useAuthState_file --> useAuthState_file : "calls out"
useAuthState_file --> useAuthStore : "user, isAuthReady, isCheckingUrlAuth, initializeAuth..."
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> useConnectionStore : "connections, addConnection, updateConnection, removeConnection..."
useIndicators_file --> useIndicators_file : "calls out"
useIndicators_file --> useIndicatorsStore : "setShowAllCubesIndicators, setActiveIndicator, setIndicatorMode, setSelectedIndicators..."
useObjects_file --> useObjects_file : "calls out"
useObjects_file --> useObjectsStore : "selectedId, setSelectedId, objects, initializeObjectsLoading..."
useSpaceManager_file --> useSpaceManager_file : "calls out"
useSpaceManager_file --> useSpaceManagerStore : "currentSpaceId, setCurrentSpaceId, fetchCurrentSpace, setIntentionalSpaceChange"
updateTaskStatus --> pipelineTaskService : "calls out"
pipelineTaskService --> useObjectsStore : "setState()"
repositionAllTasks --> repoContainerService : "calls out"
repoContainerService --> useObjectsStore : "setState()"
assignRepoSlugToOrphanTasks --> repoContainerService : "calls out"
repoContainerService --> useObjectsStore : "setState()"
createRepoContainer --> repoContainerService : "calls out"
repoContainerService --> useObjectsStore : "setState()"
repositionIncomingTasks --> repoContainerService : "calls out"
repoContainerService --> useObjectsStore : "setState()"
createTaskObjects --> repoContainerService : "calls out"
repoContainerService --> useObjectsStore : "setState()"
clearRepoTasks --> repoContainerService : "calls out"
repoContainerService --> useObjectsStore : "setState()"
toggleTaskExpansion --> repoContainerService : "calls out"
repoContainerService --> useObjectsStore : "setState()"

%% API Endpoints
POST /verify-token[Endpoint: POST /verify-token]
POST /[Endpoint: POST /]
GET /job/:jobId[Endpoint: GET /job/:jobId]

%% API Handler Chains

%% Database Models
users_model[[Store: users]]
publicSpaces_model[[Store: publicSpaces]]
spaces_model[[Store: spaces]]
devUpdates_model[[Store: devUpdates]]
organizations_model[[Store: organizations]]
orgInvites_model[[Store: orgInvites]]
sharedSpaces_model[[Store: sharedSpaces]]

%% Auth Guards
signInWithRedirect[Guard: signInWithRedirect]
onAuthStateChanged[Guard: onAuthStateChanged]

%% Auth Flows
LandingApp --> signInWithRedirect : "auth check"
LandingApp --> signOut : "auth check"

%% Events
index_event((Service: index))
generateHeightmap_event((Service: generateHeightmap))
ScreenShareStream_event((Service: ScreenShareStream))
WebcamStream_event((Service: WebcamStream))
globalOptimizationCoordinator_event((Service: globalOptimizationCoordinator))
handTrackingService_event((Service: handTrackingService))
App_event((Service: App))
useSpatialManager_event((Service: useSpatialManager))
AppShell_event((Service: AppShell))
BVHIntegration_event((Service: BVHIntegration))
OrgMemberDropdown_event((Service: OrgMemberDropdown))
screenRecordingService_event((Service: screenRecordingService))
SpaceChat_event((Service: SpaceChat))
presenceService_event((Service: presenceService))
UIOverlay_event((Service: UIOverlay))
useWindowSize_event((Service: useWindowSize))
LandingApp_event((Service: LandingApp))
UpdatesContainer_event((Service: UpdatesContainer))
connectionsService_event((Service: connectionsService))
spatialObjectsService_event((Service: spatialObjectsService))
spatialPartitioning_event((Service: spatialPartitioning))
webRservice_event((Service: webRservice))
globalSubscriptionManager_event((Service: globalSubscriptionManager))
storageService_event((Service: storageService))
authStore_event((Service: authStore))

%% Event Flows

%% Error Boundaries
Suspense_AppShell[Boundary: Suspense]

%% Shared Interfaces
```
