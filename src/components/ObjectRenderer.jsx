import React from 'react';
import Cube from './Cube';
import Tetrahedron from './Tetrahedron';
import Sphere from './Dodecahedron';
import Plane from './Plane';
import TextObject from './TextObject';
import ModelObject from './ModelObject';

const ObjectRenderer = React.memo(
  ({
    obj,
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
    user, // Add this prop
    currentSpaceId, // Add this prop
  }) => {
    if (obj.type === 'cube') {
      return (
        <Cube
          key={obj.id}
          id={obj.id}
          selected={selectedId === obj.id}
          onClick={() => handleObjectClick(obj.id)}
          onUpdate={handleObjectUpdate}
          disableOrbitControls={disableOrbitControls}
          enableOrbitControls={enableOrbitControls}
          onFaceIndicatorClick={handleFaceIndicatorClick}
          onFaceClick={handleFaceClick}
          showAllCubesIndicators={showAllCubesIndicators}
          activeIndicator={activeIndicator}
          indicatorMode={indicatorMode}
          selectedIndicators={selectedIndicators}
          activeTextStyleUI={activeTextStyleUI}
          setActiveTextStyleUI={setActiveTextStyleUI}
          handleIndicatorDeselected={handleIndicatorDeselected}
          registerTransformingObject={registerTransformingObject}
          onTransformStart={() => registerTransformingObject(obj.id, true)}
          onTransformEnd={() => registerTransformingObject(obj.id, false)}
          onMatrixChanged={(matrixWorld) =>
            handleObjectMatrixChanged(obj.id, matrixWorld)
          }
          transformControls={{
            matrixAutoUpdate: false,
            coordinateSystem: 'local',
            stackBehavior: 'detach_on_modify',
          }}
          onDelete={() => handleObjectDelete(obj.id)}
          handleObjectMove={handleObjectMove}
          onMove={(newPosition) =>
            handleObjectMove(obj.id, newPosition, false, false)
          }
        />
      );
    }
    if (obj.type === 'tetrahedron') {
      return (
        <Tetrahedron
          key={obj.id}
          id={obj.id}
          selected={selectedId === obj.id}
          onClick={() => handleObjectClick(obj.id)}
          onUpdate={handleObjectUpdate}
          disableOrbitControls={disableOrbitControls}
          enableOrbitControls={enableOrbitControls}
          onFaceIndicatorClick={handleFaceIndicatorClick}
          onFaceClick={handleFaceClick}
          showAllCubesIndicators={showAllCubesIndicators}
          activeIndicator={activeIndicator}
          indicatorMode={indicatorMode}
          selectedIndicators={selectedIndicators}
          activeTextStyleUI={activeTextStyleUI}
          setActiveTextStyleUI={setActiveTextStyleUI}
          handleIndicatorDeselected={handleIndicatorDeselected}
          registerTransformingObject={registerTransformingObject}
          onTransformStart={() => registerTransformingObject(obj.id, true)}
          onTransformEnd={() => registerTransformingObject(obj.id, false)}
          onMatrixChanged={(matrixWorld) =>
            handleObjectMatrixChanged(obj.id, matrixWorld)
          }
          transformControls={{
            matrixAutoUpdate: false,
            coordinateSystem: 'local',
            stackBehavior: 'detach_on_modify',
          }}
          onDelete={() => handleObjectDelete(obj.id)}
          handleObjectMove={handleObjectMove}
          onMove={(newPosition) =>
            handleObjectMove(obj.id, newPosition, false, false)
          }
        />
      );
    }
    if (obj.type === 'sphere' || obj.type === 'dodecahedron') {
      return (
        <Sphere
          key={obj.id}
          id={obj.id}
          selected={selectedId === obj.id}
          onClick={() => handleObjectClick(obj.id)}
          showAllIndicators={showAllCubesIndicators}
          onIndicatorSelected={handleIndicatorSelected}
          globalIndicatorSelected={globalIndicatorSelected}
          onFaceIndicatorClick={handleFaceIndicatorClick}
          onMove={(newPosition) =>
            handleObjectMove(obj.id, newPosition, false, false)
          }
          onUpdate={handleObjectUpdate}
          onIndicatorDeselected={handleIndicatorDeselected}
          onDelete={() => handleObjectDelete(obj.id)}
        />
      );
    }

    if (obj.type === 'plane') {
      return (
        <Plane
          key={obj.id}
          id={obj.id}
          position={obj.position}
          scale={obj.scale || [1, 1, 1]}
          selected={selectedId === obj.id}
          onClick={() => handleObjectClick(obj.id)}
          showAllIndicators={showAllCubesIndicators}
          onIndicatorSelected={handleIndicatorSelected}
          globalIndicatorSelected={globalIndicatorSelected}
          onFaceIndicatorClick={handleFaceIndicatorClick}
          onMove={(newPosition) =>
            handleObjectMove(obj.id, newPosition, false, false)
          }
          selectedIndicators={selectedIndicators}
          indicatorMode={indicatorMode}
          onUpdate={handleObjectUpdate}
          color={obj.color}
          headerText={obj.headerText}
          borderStyle={obj.borderStyle}
          borderColor={obj.borderColor}
          lineThickness={obj.lineThickness}
          headerStyle={obj.headerStyle}
          faceText={obj.faceText}
          faceTextStyle={obj.faceTextStyle}
          imageUrl={obj.imageUrl}
          webcamActive={obj.webcamActive}
          activeTextStyleUI={activeTextStyleUI}
          setActiveTextStyleUI={setActiveTextStyleUI}
          onDelete={() => handleObjectDelete(obj.id)}
          user={user}
          currentSpaceId={currentSpaceId}
        />
      );
    }
    if (obj.type === 'text') {
      return (
        <TextObject
          key={obj.id}
          id={obj.id}
          position={obj.position}
          selected={selectedId === obj.id}
          onClick={() => handleObjectClick(obj.id)}
          showAllIndicators={showAllCubesIndicators}
          onIndicatorSelected={handleIndicatorSelected}
          globalIndicatorSelected={globalIndicatorSelected}
          onFaceIndicatorClick={handleFaceIndicatorClick}
          selectedIndicators={selectedIndicators}
          indicatorMode={indicatorMode}
          onUpdate={handleObjectUpdate}
          onDelete={() => handleObjectDelete(obj.id)}
          registerTransformingObject={registerTransformingObject}
          onResizeStart={() => registerTransformingObject(obj.id, true)}
          onResizeEnd={() => registerTransformingObject(obj.id, false)}
          onTransformStart={() => registerTransformingObject(obj.id, true)}
          onTransformEnd={() => registerTransformingObject(obj.id, false)}
        />
      );
    }
    if (obj.type === 'model') {
      return (
        <ModelObject
          key={obj.id}
          obj={obj}
          isSelected={selectedId === obj.id}
          onClick={() => handleObjectClick(obj.id)}
          onUpdate={handleObjectUpdate}
          onTranformStart={() => registerTransformingObject(obj.id, true)}
          onTransformEnd={() => registerTransformingObject(obj.id, false)}
          onMatrixChanged={handleObjectMatrixChanged}
        />
      );
    }
    return null;
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if critical props change
    return (
      prevProps.obj.id === nextProps.obj.id &&
      prevProps.selectedId === nextProps.selectedId &&
      prevProps.obj.position === nextProps.obj.position &&
      prevProps.obj.scale === nextProps.obj.scale &&
      prevProps.obj.color === nextProps.obj.color &&
      prevProps.obj.headerText === nextProps.obj.headerText &&
      prevProps.obj.faceText === nextProps.obj.faceText &&
      prevProps.showAllCubesIndicators === nextProps.showAllCubesIndicators &&
      prevProps.activeIndicator === nextProps.activeIndicator &&
      prevProps.indicatorMode === nextProps.indicatorMode &&
      prevProps.activeTextStyleUI === nextProps.activeTextStyleUI &&
      prevProps.globalIndicatorSelected === nextProps.globalIndicatorSelected &&
      (prevProps.selectedIndicators?.length || 0) ===
        (nextProps.selectedIndicators?.length || 0)
    );
  }
);

ObjectRenderer.displayName = 'ObjectRenderer';

export default ObjectRenderer;
