import React, { useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

const threshold = 10;  // snapping distance threshold

// Function to calculate the four corners of a rectangle
const calculateCorners = (rect) => {
  const { x, y, width, height } = rect;
  return [
    { x, y },                          // top-left
    { x: x + width, y },               // top-right
    { x, y: y + height },              // bottom-left
    { x: x + width, y: y + height }    // bottom-right
  ];
};

// Function to get the Euclidean distance between two points
const getDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
};

// Function to find the closest point between two sets of corners
const findClosestPoint = (movingCorners, staticCorners) => {
  let closestPoint = null;
  let minDistance = Infinity;

  movingCorners.forEach((movingPoint) => {
    staticCorners.forEach((staticPoint) => {
      const distance = getDistance(movingPoint, staticPoint);
      if (distance < minDistance && distance <= threshold) {
        minDistance = distance;
        closestPoint = staticPoint;
      }
    });
  });

  return closestPoint;
};

const SnappingRectangles = () => {
  const [rects, setRects] = useState([
    { id: 1, x: 50, y: 50, width: 100, height: 100 },
    { id: 2, x: 300, y: 200, width: 100, height: 100 },
  ]);

  const handleDragMove = (e, index) => {
    const movingRect = e.target;
    const movingCorners = calculateCorners(movingRect.attrs); // Moving rect corners

    const otherRects = rects.filter((_, i) => i !== index); // Exclude the current moving rect

    let snappedPosition = null;

    for (const otherRect of otherRects) {
      const staticCorners = calculateCorners(otherRect); // Other rect corners
      const closestPoint = findClosestPoint(movingCorners, staticCorners);

      if (closestPoint) {
        const topLeftCorner = movingCorners[0]; // Get the moving rect's top-left corner
        const dx = closestPoint.x - topLeftCorner.x; // Difference in x
        const dy = closestPoint.y - topLeftCorner.y; // Difference in y

        snappedPosition = { x: movingRect.x() + dx, y: movingRect.y() + dy };
        break; // If a snap is found, break out of the loop
      }
    }

    if (snappedPosition) {
      movingRect.x(snappedPosition.x);
      movingRect.y(snappedPosition.y);
    }
  };

  const handleDragEnd = (e, index) => {
    const newRects = [...rects];
    newRects[index] = { ...newRects[index], x: e.target.x(), y: e.target.y() };
    setRects(newRects);
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {rects.map((rect, index) => (
          <Rect
            key={rect.id}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="lightblue"
            draggable
            onDragMove={(e) => handleDragMove(e, index)}
            onDragEnd={(e) => handleDragEnd(e, index)}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default SnappingRectangles;
