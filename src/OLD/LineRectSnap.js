import React, { useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";

// Function to get edges of a rotated rectangle
const getEdges = (x, y, width, height, rotation) => {
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

  // Rotate vertices and calculate edges
  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % vertices.length];
    edges.push({ start, end });
  }

  return edges;
};

// Function to calculate distance from point to line segment
const pointToLineSegmentDistance = (px, py, x1, y1, x2, y2) => {
  const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  if (lineLength === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength ** 2)));
  const projectionX = x1 + t * (x2 - x1);
  const projectionY = y1 + t * (y2 - y1);
  return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
};

// Function to get the nearest edge for snapping
const getNearestEdge = (movingRect, staticRect) => {
  const movingEdges = getEdges(
    movingRect.x,
    movingRect.y,
    movingRect.width,
    movingRect.height,
    movingRect.rotation
  );

  const staticEdges = getEdges(
    staticRect.x,
    staticRect.y,
    staticRect.width,
    staticRect.height,
    staticRect.rotation
  );

  let minDistance = Infinity;
  let closestEdge = null;

  movingEdges.forEach(movingEdge => {
    staticEdges.forEach(staticEdge => {
      // Check distance from all four corners of the moving rectangle to the static edge
      const distance = pointToLineSegmentDistance(
        movingRect.x, movingRect.y,
        staticEdge.start.x, staticEdge.start.y,
        staticEdge.end.x, staticEdge.end.y
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestEdge = staticEdge;
      }
    });
  });

  return closestEdge;
};

const App = () => {
  const threshold = 2; // Threshold in pixels

  const staticRectRef = useRef(null);
  const movingRectRef = useRef(null);

  const handleDragMove = () => {
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

      // Get the nearest edge for snapping
      const nearestEdge = getNearestEdge(movingRectProps, staticRectProps);

      if (nearestEdge) {
        // Snap the moving rectangle to the nearest edge
        const edgeMidpoint = {
          x: (nearestEdge.start.x + nearestEdge.end.x) / 2,
          y: (nearestEdge.start.y + nearestEdge.end.y) / 2,
        };

        movingRect.position({
          x: edgeMidpoint.x - movingRect.width() / 2,
          y: edgeMidpoint.y - movingRect.height() / 2,
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
          rotation={33}
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
          rotation={33}
          draggable
          onDragMove={handleDragMove} // Handle dragging and snapping
        />
      </Layer>
    </Stage>
  );
};

export default App;
