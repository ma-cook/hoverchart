import React, { useMemo } from 'react';
import ObjectRenderer from './ObjectRenderer';
import GlobalCubeEdgesRenderer from './GlobalCubeEdgesRenderer';
import GlobalDodecahedronEdgesRenderer from './GlobalDodecahedronEdgesRenderer';
import GlobalTetrahedronEdgesRenderer from './GlobalTetrahedronEdgesRenderer';

/**
 * ObjectsRenderer - Renders all objects with optimized batching
 * 
 * This component wraps the individual ObjectRenderer and adds batched rendering
 * for performance-critical elements like cube, dodecahedron, and tetrahedron edges.
 * 
 * Architecture:
 * - GlobalCubeEdgesRenderer: Renders ALL cube edges in 1 draw call
 * - GlobalDodecahedronEdgesRenderer: Renders ALL dodecahedron edges in 1 draw call
 * - GlobalTetrahedronEdgesRenderer: Renders ALL tetrahedron edges in 1 draw call
 * - ObjectRenderer (per object): Renders individual object features (faces, UI, etc.)
 */
const ObjectsRenderer = React.memo(({
  objects,
  visibleObjectIds,
  selectedId,
  handleObjectClick,
  handleObjectMove,
  handleObjectUpdate,
  disableOrbitControls,
  enableOrbitControls,
  handleFaceIndicatorClick,
  handleFaceClick,
  showAllCubesIndicators,
  activeIndicator,
  indicatorMode,
  selectedIndicators,
  activeTextStyleUI,
  setActiveTextStyleUI,
  handleIndicatorDeselected,
  registerTransformingObject,
  handleObjectMatrixChanged,
  handleIndicatorSelected,
  globalIndicatorSelected,
  handleObjectDelete,
  user,
  currentSpaceId,
  getTransformStartPosition,
  checkPositionJitter,
  useLOD,
}) => {
  // Filter visible objects
  const visibleObjects = useMemo(() => {
    return objects.filter((obj) => visibleObjectIds.has(obj.id));
  }, [objects, visibleObjectIds]);

  // Extract cube objects for batched edge rendering (includes containers)
  const cubeObjects = useMemo(() => {
    return visibleObjects.filter((obj) => obj.type === 'cube');
  }, [visibleObjects]);

  // Extract dodecahedron objects for batched edge rendering
  const dodecahedronObjects = useMemo(() => {
    return visibleObjects.filter(
      (obj) => obj.type === 'sphere' || obj.type === 'dodecahedron'
    );
  }, [visibleObjects]);

  // Extract tetrahedron objects for batched edge rendering
  const tetrahedronObjects = useMemo(() => {
    return visibleObjects.filter((obj) => obj.type === 'tetrahedron');
  }, [visibleObjects]);

  // Render individual objects
  const renderedObjects = useMemo(() => {
    return visibleObjects.map((obj) => (
      <ObjectRenderer
        key={obj.id}
        obj={obj}
        selectedId={selectedId}
        handleObjectClick={handleObjectClick}
        handleObjectMove={handleObjectMove}
        handleObjectUpdate={handleObjectUpdate}
        disableOrbitControls={disableOrbitControls}
        enableOrbitControls={enableOrbitControls}
        handleFaceIndicatorClick={handleFaceIndicatorClick}
        handleFaceClick={handleFaceClick}
        showAllCubesIndicators={showAllCubesIndicators}
        activeIndicator={activeIndicator}
        indicatorMode={indicatorMode}
        selectedIndicators={selectedIndicators}
        activeTextStyleUI={activeTextStyleUI}
        setActiveTextStyleUI={setActiveTextStyleUI}
        handleIndicatorDeselected={handleIndicatorDeselected}
        registerTransformingObject={registerTransformingObject}
        handleObjectMatrixChanged={handleObjectMatrixChanged}
        handleIndicatorSelected={handleIndicatorSelected}
        globalIndicatorSelected={globalIndicatorSelected}
        handleObjectDelete={handleObjectDelete}
        user={user}
        currentSpaceId={currentSpaceId}
        getTransformStartPosition={getTransformStartPosition}
        checkPositionJitter={checkPositionJitter}
        useLOD={useLOD}
      />
    ));
  }, [
    visibleObjects,
    selectedId,
    handleObjectClick,
    handleObjectMove,
    handleObjectUpdate,
    disableOrbitControls,
    enableOrbitControls,
    handleFaceIndicatorClick,
    handleFaceClick,
    showAllCubesIndicators,
    activeIndicator,
    indicatorMode,
    selectedIndicators,
    activeTextStyleUI,
    setActiveTextStyleUI,
    handleIndicatorDeselected,
    registerTransformingObject,
    handleObjectMatrixChanged,
    handleIndicatorSelected,
    globalIndicatorSelected,
    handleObjectDelete,
    user,
    currentSpaceId,
    getTransformStartPosition,
    checkPositionJitter,
    useLOD,
  ]);

  return (
    <>
      {/* PERFORMANCE: Render all cube edges in a single draw call */}
      <GlobalCubeEdgesRenderer cubes={cubeObjects} defaultLineWidth={1} />
      
      {/* PERFORMANCE: Render all dodecahedron edges in a single draw call */}
      <GlobalDodecahedronEdgesRenderer dodecahedrons={dodecahedronObjects} defaultLineWidth={1} />
      
      {/* PERFORMANCE: Render all tetrahedron edges in a single draw call */}
      <GlobalTetrahedronEdgesRenderer tetrahedrons={tetrahedronObjects} defaultLineWidth={1} />
      
      {/* Render all individual objects */}
      {renderedObjects}
    </>
  );
});

ObjectsRenderer.displayName = 'ObjectsRenderer';

export default ObjectsRenderer;
