import React, { useRef, useState } from "react";
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
  return vertices.map(vertex => ({
    x: x + (vertex.x - x) * cos - (vertex.y - y) * sin,
    y: y + (vertex.x - x) * sin + (vertex.y - y) * cos,
  }));
};

// Function to get edge vertices of a rotated rectangle
const getEdges = (vertices) => {
  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    edges.push({
      start: vertices[i],
      end: vertices[next],
    });
  }
  return edges;
};

// Function to calculate the distance from a point to a line segment
const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) {
    param = dot / len_sq;
  }
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

// Function to find the closest edge to a point within the threshold
const findClosestEdgeWithinThreshold = (verticesMoving, edgesStatic, threshold) => {
  let minDist = Infinity;
  let closestEdge = null;
  let closestVertex = null;

  for (const vertex of verticesMoving) {
    for (const edge of edgesStatic) {
      const dist = distanceToLineSegment(vertex.x, vertex.y, edge.start.x, edge.start.y, edge.end.x, edge.end.y);
      if (dist < threshold && dist < minDist) {
        minDist = dist;
        closestEdge = edge;
        closestVertex = vertex;
      }
    }
  }

  return { closestEdge, closestVertex };
};

// Function to snap the rectangle to the closest edge within the threshold
const snapToEdge = (movingRect, staticRect, threshold) => {
  const verticesMoving = getRotatedRectVertices(
    movingRect.x,
    movingRect.y,
    movingRect.width,
    movingRect.height,
    movingRect.rotation
  );

  const verticesStatic = getRotatedRectVertices(
    staticRect.x,
    staticRect.y,
    staticRect.width,
    staticRect.height,
    staticRect.rotation
  );
  const edgesStatic = getEdges(verticesStatic);

  // Find the closest edge between the moving rect and static rect
  const { closestEdge, closestVertex } = findClosestEdgeWithinThreshold(verticesMoving, edgesStatic, threshold);

  if (closestEdge && closestVertex) {
    // Snap the moving rectangle to the closest edge
    const edgeVector = {
      x: closestEdge.end.x - closestEdge.start.x,
      y: closestEdge.end.y - closestEdge.start.y,
    };

    const vertexToEdgeStart = {
      x: closestVertex.x - closestEdge.start.x,
      y: closestVertex.y - closestEdge.start.y,
    };

    const edgeLength = Math.sqrt(edgeVector.x * edgeVector.x + edgeVector.y * edgeVector.y);
    const edgeUnitVector = {
      x: edgeVector.x / edgeLength,
      y: edgeVector.y / edgeLength,
    };

    const projectionLength =
      vertexToEdgeStart.x * edgeUnitVector.x + vertexToEdgeStart.y * edgeUnitVector.y;
    const snappedPosition = {
      x: closestEdge.start.x + projectionLength * edgeUnitVector.x,
      y: closestEdge.start.y + projectionLength * edgeUnitVector.y,
    };

    const dx = snappedPosition.x - closestVertex.x;
    const dy = snappedPosition.y - closestVertex.y;

    // Move the whole rectangle by the offset between the snapped vertex and its original position
    return {
      x: movingRect.x + dx,
      y: movingRect.y + dy,
      width: movingRect.width,
      height: movingRect.height,
      rotation: movingRect.rotation,
    };
  }

  return movingRect;
};

const App = () => {
  const [movingRect, setMovingRect] = useState({
    x: 300,
    y: 300,
    width: 100,
    height: 50,
    rotation: 33,
  });

  const [staticRect] = useState({
    x: 200,
    y: 200,
    width: 100,
    height: 50,
    rotation: 33,
  });

  const threshold = 25; // Threshold in pixels

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    if (!mousePos) return;

    // Update the moving rectangle position with the mouse position
    const newMovingRect = {
      ...movingRect,
      x: mousePos.x,
      y: mousePos.y,
    };

    // Snap to the closest edge of the static rectangle within the threshold
    const snappedRect = snapToEdge(newMovingRect, staticRect, threshold);
    setMovingRect(snappedRect);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseMove={handleMouseMove} // Track mouse movements
    >
      <Layer>
        {/* Static rectangle */}
        <Rect
          x={staticRect.x}
          y={staticRect.y}
          width={staticRect.width}
          height={staticRect.height}
          fill="lightblue"
          stroke="blue"
          strokeWidth={2}
          rotation={45}
        />
        {/* Moving rectangle */}
        <Rect
          x={movingRect.x}
          y={movingRect.y}
          width={movingRect.width}
          height={movingRect.height}
          fill="lightcoral"
          stroke="red"
          strokeWidth={2}
          rotation={45}
          draggable={true}
        />
      </Layer>
    </Stage>
  );
};

export default App;
