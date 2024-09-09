import React, { useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import * as SAT from 'sat';

const App = () => {
  const [movingRect] = useState({
    x: 300,
    y: 300,
    width: 100,
    height: 50,
    rotation: 98,
  });

  const [staticRect] = useState({
    x: 200,
    y: 200,
    width: 100,
    height: 50,
    rotation: 98,
  });

  const threshold = 15; // Snapping threshold in pixels

  // Function to create SAT.js polygon from Konva rectangle
  const createPolygon = (x, y, width, height, rotation) => {
    const points = [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [width / 2, height / 2],
      [-width / 2, height / 2],
    ];
    const polygon = new SAT.Polygon(new SAT.Vector(x, y), points.map(p => new SAT.Vector(p[0], p[1])));
    polygon.setAngle((rotation * Math.PI) / 180); // Convert rotation to radians
    return polygon;
  };

  // Function to calculate the distance between two points
  const calculateDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle snapping based on threshold
  const snapToClosest = (movingRect, staticRect) => {
    const movingPolygon = createPolygon(
      movingRect.x,
      movingRect.y,
      movingRect.width,
      movingRect.height,
      movingRect.rotation
    );

    const staticPolygon = createPolygon(
      staticRect.x,
      staticRect.y,
      staticRect.width,
      staticRect.height,
      staticRect.rotation
    );

    const response = new SAT.Response();
    const collided = SAT.testPolygonPolygon(movingPolygon, staticPolygon, response);

    if (collided) {
      // Snap based on overlap if they collide
      movingRect.x -= response.overlapV.x;
      movingRect.y -= response.overlapV.y;
    } else {
      // Check for distance between all corners
      for (let i = 0; i < movingPolygon.points.length; i++) {
        const movingPoint = movingPolygon.points[i].clone().rotate(movingPolygon.angle).add(movingPolygon.pos);
        for (let j = 0; j < staticPolygon.points.length; j++) {
          const staticPoint = staticPolygon.points[j].clone().rotate(staticPolygon.angle).add(staticPolygon.pos);
          const distance = calculateDistance(movingPoint, staticPoint);
          
          // Snap if within the threshold
          if (distance <= threshold) {
            movingRect.x += staticPoint.x - movingPoint.x;
            movingRect.y += staticPoint.y - movingPoint.y;
            return movingRect; // Early exit after snapping
          }
        }
      }
    }

    return movingRect;
  };

  const handleDragMove = (e) => {
    const movingRectNode = e.target;
    const stage = movingRectNode.getStage();
    const mousePos = stage.getPointerPosition();

    if (!mousePos) return;

    const newMovingRect = {
      x: mousePos.x,
      y: mousePos.y,
      width: movingRect.width,
      height: movingRect.height,
      rotation: movingRect.rotation,
    };

    const snappedRect = snapToClosest(newMovingRect, staticRect);
    movingRectNode.position({
      x: snappedRect.x,
      y: snappedRect.y,
    });

    movingRectNode.getLayer().batchDraw();
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
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
          rotation={staticRect.rotation}
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
          rotation={movingRect.rotation}
          draggable
          onDragMove={handleDragMove} // Update snapping on drag move
        />
      </Layer>
    </Stage>
  );
};

export default App;
