import Cube from './Cube';
import Sphere from './Dodecahedron';
import Plane from './Plane';
import TextObject from './TextObject';

const ObjectRenderer = ({
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
  connections,
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
        connections={connections}
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
  if (obj.type === 'sphere') {
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
        connections={connections}
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
        connections={connections}
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
        connections={connections}
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

  return null;
};

export default ObjectRenderer;
