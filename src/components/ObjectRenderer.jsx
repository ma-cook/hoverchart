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
        position={obj.position}
        color={obj.color}
        headerText={obj.headerText || ''}
        scale={obj.scale}
        faceColors={obj.faceColors}
        faceTexts={
          obj.faceTexts || {
            front: '',
            back: '',
            top: '',
            bottom: '',
            right: '',
            left: '',
          }
        }
        textStyle={
          obj.textStyle || {
            fontSize: 1.5,
            color: 'black',
            underline: false,
          }
        }
        faceTextStyles={
          obj.faceTextStyles || {
            front: {
              fontSize: 0.5,
              color: 'black',
              underline: false,
            },
            back: {
              fontSize: 0.5,
              color: 'black',
              underline: false,
            },
            top: {
              fontSize: 0.5,
              color: 'black',
              underline: false,
            },
            bottom: {
              fontSize: 0.5,
              color: 'black',
              underline: false,
            },
            right: {
              fontSize: 0.5,
              color: 'black',
              underline: false,
            },
            left: {
              fontSize: 0.5,
              color: 'black',
              underline: false,
            },
          }
        }
        selected={selectedId === obj.id}
        onClick={() => handleObjectClick(obj.id)}
        onMove={(newPosition) => handleObjectMove(obj.id, newPosition)}
        onUpdate={handleObjectUpdate}
        disableOrbitControls={disableOrbitControls}
        enableOrbitControls={enableOrbitControls}
        onFaceIndicatorClick={handleFaceIndicatorClick}
        onFaceClick={handleFaceClick}
        showAllIndicators={showAllCubesIndicators}
        activeIndicator={activeIndicator}
        indicatorMode={indicatorMode}
        connections={connections}
        selectedIndicators={selectedIndicators}
        activeTextStyleUI={activeTextStyleUI}
        setActiveTextStyleUI={setActiveTextStyleUI}
        onIndicatorDeselected={handleIndicatorDeselected}
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
      />
    );
  }

  if (obj.type === 'sphere') {
    return (
      <Sphere
        key={obj.id}
        id={obj.id}
        position={obj.position}
        scale={obj.scale || [1, 1, 1]}
        headerText={obj.headerText || ''}
        headerStyle={
          obj.headerStyle || {
            fontSize: 'medium',
            color: 'black',
            underline: false,
          }
        }
        lineColor={obj.lineColor || 'black'}
        faceColors={obj.faceColors || {}}
        faceTexts={obj.faceTexts || {}}
        faceTextStyles={obj.faceTextStyles || {}}
        selected={selectedId === obj.id}
        onClick={() => handleObjectClick(obj.id)}
        showAllIndicators={showAllCubesIndicators}
        onIndicatorSelected={handleIndicatorSelected}
        globalIndicatorSelected={globalIndicatorSelected}
        onFaceIndicatorClick={handleFaceIndicatorClick}
        onMove={(newPosition) => handleObjectMove(obj.id, newPosition)}
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
        onMove={(newPosition) => handleObjectMove(obj.id, newPosition)}
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
        initialText={obj.text || ''}
        initialTextStyle={obj.textStyle || { fontSize: 32, color: 'black' }}
        initialScale={obj.scale || [15, 10, 1]}
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
