import React, { useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import * as SAT from "sat";

const App = () => {
  const stageRef = useRef(null);

  const rects = [];
  const rows = 2;
  const cols = 5;
  const rectWidth = 100;
  const rectHeight = 50;
  const spacing = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rects.push({
        x: 100 + col * (rectWidth + spacing),
        y: 100 + row * (rectHeight + spacing),
        width: rectWidth,
        height: rectHeight,
        rotation: 0,
        id: `rect-${row}-${col}`,
      });
    }
  }

  const threshold = 15; // Snapping threshold in pixels

  const createPolygon = (x, y, width, height, rotation) => {
    const points = [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [width / 2, height / 2],
      [-width / 2, height / 2],
    ];
    const polygon = new SAT.Polygon(
      new SAT.Vector(x, y),
      points.map((p) => new SAT.Vector(p[0], p[1]))
    );
    polygon.setAngle((rotation * Math.PI) / 180); // Convert rotation to radians
    return polygon;
  };

  const calculateDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const snapToClosest = (movingRect, staticRects) => {
    let snappedRect = { ...movingRect };

    const movingPolygon = createPolygon(
      movingRect.x,
      movingRect.y,
      movingRect.width,
      movingRect.height,
      movingRect.rotation
    );

    staticRects.forEach((staticRect) => {
      const staticPolygon = createPolygon(
        staticRect.x,
        staticRect.y,
        staticRect.width,
        staticRect.height,
        staticRect.rotation
      );

      const response = new SAT.Response();
      const collided = SAT.testPolygonPolygon(
        movingPolygon,
        staticPolygon,
        response
      );

      if (collided) {
        // Snap based on overlap if they collide
        snappedRect.x -= response.overlapV.x;
        snappedRect.y -= response.overlapV.y;
      } else {
        // Check for distance between all corners
        for (let i = 0; i < movingPolygon.points.length; i++) {
          const movingPoint = movingPolygon.points[i]
            .clone()
            .rotate(movingPolygon.angle)
            .add(movingPolygon.pos);
          for (let j = 0; j < staticPolygon.points.length; j++) {
            const staticPoint = staticPolygon.points[j]
              .clone()
              .rotate(staticPolygon.angle)
              .add(staticPolygon.pos);
            const distance = calculateDistance(movingPoint, staticPoint);

            // Snap if within the threshold
            if (distance <= threshold) {
              snappedRect.x += staticPoint.x - movingPoint.x;
              snappedRect.y += staticPoint.y - movingPoint.y;
              return; // Early exit after snapping
            }
          }
        }
      }
    });

    return snappedRect;
  };

  const handleDragMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const movingRectNode = e.target;
    const mousePos = stage.getPointerPosition();

    if (!mousePos) return;

    const movingRect = {
      x: mousePos.x,
      y: mousePos.y,
      width: movingRectNode.width(),
      height: movingRectNode.height(),
      rotation: movingRectNode.rotation(),
    };

    // Get static rectangles from the stage
    const staticRects = stage.find(".static-rect").reduce((acc, rectNode) => {
      const newObj = {
        x: rectNode.x(),
        y: rectNode.y(),
        width: rectNode.width(),
        height: rectNode.height(),
        rotation: rectNode.rotation(),
      };
      if (rectNode._id !== e.target._id) {
        acc.push(newObj);
      }
      return acc;
    }, []);

    const snappedRect = snapToClosest(movingRect, staticRects);
    movingRectNode.position({
      x: snappedRect.x,
      y: snappedRect.y,
    });

    movingRectNode.getLayer().batchDraw();
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef}>
      <Layer>
        {rects.map((eachRect) => (
          <Rect
            key={eachRect.id}
            x={eachRect.x}
            y={eachRect.y}
            width={eachRect.width}
            height={eachRect.height}
            fill="lightcoral"
            stroke="red"
            strokeWidth={2}
            rotation={eachRect.rotation}
            draggable
            name="static-rect"
            onDragMove={handleDragMove}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default App;
