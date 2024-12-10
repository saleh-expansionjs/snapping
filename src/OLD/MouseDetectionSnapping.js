import React, { useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";

// Function to get vertices of a rotated rectangle
const getRotatedRectVertices = (x, y, width, height, rotation) => {
  const rad = (Math.PI / 180) * rotation;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Rectangle vertices before rotation
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const vertices = [
    { x: x - halfWidth, y: y - halfHeight }, // top-left
    { x: x + halfWidth, y: y - halfHeight }, // top-right
    { x: x + halfWidth, y: y + halfHeight }, // bottom-right
    { x: x - halfWidth, y: y + halfHeight }, // bottom-left
  ];

  // Rotate vertices
  return vertices.map(vertex => {
    return {
      x: x + (vertex.x - x) * cos - (vertex.y - y) * sin,
      y: y + (vertex.x - x) * sin + (vertex.y - y) * cos,
    };
  });
};

// Function to get projection of vertices on an axis
const getProjection = (vertices, axis) => {
  const projections = vertices.map(vertex => {
    return vertex.x * axis.x + vertex.y * axis.y;
  });
  return { min: Math.min(...projections), max: Math.max(...projections) };
};

// Function to check if two projections overlap
const areProjectionsOverlapping = (projA, projB) => {
  return projA.max >= projB.min && projB.max >= projA.min;
};

// Function to get the normal vector of an edge
const getNormalVector = (p1, p2) => {
  return {
    x: p2.y - p1.y,
    y: p1.x - p2.x,
  };
};

// Function to expand vertices by threshold
const expandVertices = (vertices, threshold) => {
  const expandedVertices = [];
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    const normal = getNormalVector(vertices[i], vertices[next]);
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    normal.x /= length;
    normal.y /= length;

    expandedVertices.push({
      x: vertices[i].x + normal.x * threshold,
      y: vertices[i].y + normal.y * threshold,
    });
  }
  return expandedVertices;
};

// Function to check if two rectangles are colliding with threshold
const checkCollisionWithThreshold = (rect1, rect2, threshold) => {
  const verticesA = getRotatedRectVertices(
    rect1.x,
    rect1.y,
    rect1.width,
    rect1.height,
    rect1.rotation
  );
  const verticesB = getRotatedRectVertices(
    rect2.x,
    rect2.y,
    rect2.width,
    rect2.height,
    rect2.rotation
  );

  const expandedVerticesA = expandVertices(verticesA, threshold);
  const expandedVerticesB = expandVertices(verticesB, threshold);

  // Define axes to test (edges of both rectangles)
  const axes = [
    ...verticesA.map((_, i) => getNormalVector(verticesA[i], verticesA[(i + 1) % verticesA.length])),
    ...verticesB.map((_, i) => getNormalVector(verticesB[i], verticesB[(i + 1) % verticesB.length])),
  ];

  // Check projections on each axis
  for (const axis of axes) {
    const projA = getProjection(expandedVerticesA, axis);
    const projB = getProjection(expandedVerticesB, axis);
    if (!areProjectionsOverlapping(projA, projB)) {
      return false; // No overlap on this axis means no collision
    }
  }

  return true; // Overlap on all axes means collision
};

const App = () => {
  const threshold = 2; // Threshold in pixels

  const staticRectRef = useRef(null);
  const movingRectRef = useRef(null);

  const handleDragMove = (e) => {
    if (movingRectRef.current && staticRectRef.current) {
      const staticRect = staticRectRef.current;
      const movingRect = movingRectRef.current;

      const staticRectProps = {
        x: staticRect.x(),
        y: staticRect.y(),
        width: staticRect.width(),
        height: staticRect.height(),
        rotation: staticRect.rotation(),
      };

      const movingRectProps = {
        x: movingRect.x(),
        y: movingRect.y(),
        width: movingRect.width(),
        height: movingRect.height(),
        rotation: movingRect.rotation(),
      };

      // Check collision with threshold
      const isColliding = checkCollisionWithThreshold(staticRectProps, movingRectProps, threshold);

      if (isColliding) {
        // Snap the moving rectangle to the static rectangle
        movingRect.position({
          x: staticRect.x() + (staticRect.width() - movingRect.width()) / 2,
          y: staticRect.y() + (staticRect.height() - movingRect.height()) / 2,
        });
        movingRect.getLayer().batchDraw();
      }
    }
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {/* Static rectangle */}
        <Rect
          ref={staticRectRef}
          x={200}
          y={200}
          width={100}
          height={50}
          fill="lightblue"
          stroke="blue"
          strokeWidth={2}
          rotation={2}
        />
        {/* Moving rectangle */}
        <Rect
          ref={movingRectRef}
          x={300}
          y={300}
          width={100}
          height={50}
          fill="lightcoral"
          stroke="red"
          strokeWidth={2}
          rotation={2}
          draggable
          onDragMove={handleDragMove} // Handle dragging and snapping
        />
      </Layer>
    </Stage>
  );
};

export default App;
