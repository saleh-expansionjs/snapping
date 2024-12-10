import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { vec2 } from 'gl-matrix';

const App = () => {
  const [shapes, setShapes] = React.useState([
    { id: 'shape1', x: 50, y: 50, width: 100, height: 100, rotation: 0 },
    { id: 'shape2', x: 200, y: 200, width: 100, height: 100, rotation: 45 }
  ]);

  const snappingThreshold = 5; // Example threshold in pixels

  const handleDragMove = (e) => {
    const shape = e.target;
    const shapeData = {
      id: shape.id(),
      x: shape.x(),
      y: shape.y(),
      width: shape.width(),
      height: shape.height(),
      rotation: shape.rotation()
    };

    let snapTo = null;
    let minDistance = snappingThreshold;

    shapes.forEach(otherShape => {
      if (otherShape.id !== shapeData.id) {
        const distanceToShape = calculateMinimumCornerDistance(shapeData, otherShape);
        if (distanceToShape < minDistance) {
          minDistance = distanceToShape;
          snapTo = otherShape;
        }
      }
    });

    if (snapTo) {
      // Snap to target position
      shape.position({ x: snapTo.x, y: snapTo.y });
      shape.rotation(snapTo.rotation);
      shape.getLayer().batchDraw();
    }
  };

  // Calculate the minimum distance between corners of two shapes
  const calculateMinimumCornerDistance = (shape1, shape2) => {
    const corners1 = getCorners(shape1);
    const corners2 = getCorners(shape2);

    let minDistance = Infinity;

    corners1.forEach(c1 => {
      corners2.forEach(c2 => {
        const distance = vec2.distance(c1, c2);
        minDistance = Math.min(minDistance, distance);
      });
    });

    return minDistance;
  };

  // Get the corners of a shape considering rotation and position
  const getCorners = (shape) => {
    const vertices = getTransformedVertices(shape);
    return [
      vertices[0],
      vertices[1],
      vertices[2],
      vertices[3]
    ];
  };

  // Convert shape's position and rotation to world coordinates
  const getTransformedVertices = (shape) => {
    const halfWidth = shape.width / 2;
    const halfHeight = shape.height / 2;

    // Local corners of the shape
    const localCorners = [
      vec2.fromValues(-halfWidth, -halfHeight),
      vec2.fromValues(halfWidth, -halfHeight),
      vec2.fromValues(halfWidth, halfHeight),
      vec2.fromValues(-halfWidth, halfHeight)
    ];

    // Rotation angle in radians
    const angle = shape.rotation * (Math.PI / 180);

    return localCorners.map(corner => {
      // Rotate the corner
      const rotated = vec2.rotate(vec2.create(), corner, vec2.create(), angle);
      // Translate the rotated corner
      return vec2.add(vec2.create(), rotated, vec2.fromValues(shape.x, shape.y));
    });
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {shapes.map(shape => (
          <Rect
            key={shape.id}
            id={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rotation={shape.rotation}
            fill="red"
            draggable
            onDragMove={handleDragMove}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default App;
