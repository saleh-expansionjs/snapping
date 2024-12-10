import React, { useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import * as SAT from "sat";
import rects from "./RectsPoint"; // Make sure to provide this data

const App = () => {
  const stageRef = useRef(null);

  const threshold = 5; // Snapping threshold in pixels
  const proximityThreshold = 15; // Only check for rectangles within this distance

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

  const calculateEdges = (rect) => {
    return {
      top: rect.y - rect.height / 2,
      bottom: rect.y + rect.height / 2,
      left: rect.x - rect.width / 2,
      right: rect.x + rect.width / 2,
    };
  };

  const getClosestRect = (movingRect, staticRects) => {
    const movingEdges = calculateEdges(movingRect);
    let closestRect = null;
    let minDistance = proximityThreshold; // Set initial distance threshold

    staticRects.forEach((staticRect) => {
      const staticEdges = calculateEdges(staticRect);

      // Calculate the minimum distance between the edges of the moving rect and the static rect
      const dx = Math.max(staticEdges.left - movingEdges.right, movingEdges.left - staticEdges.right, 0);
      const dy = Math.max(staticEdges.top - movingEdges.bottom, movingEdges.top - staticEdges.bottom, 0);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestRect = staticRect;
      }
    });

    return closestRect;
  };

  const snapToClosest = (movingRect, staticRect, mousePos) => {
    let snappedRect = { ...movingRect };

    if (!staticRect) {
      return snappedRect; // No nearby rectangle to snap to
    }

    const movingEdges = calculateEdges(movingRect);
    const staticEdges = calculateEdges(staticRect);

    const response = new SAT.Response();
    const collided = SAT.testPolygonPolygon(
      createPolygon(movingRect.x, movingRect.y, movingRect.width, movingRect.height, movingRect.rotation),
      createPolygon(staticRect.x, staticRect.y, staticRect.width, staticRect.height, staticRect.rotation),
      response
    );

    if (collided) {
      // Prevent overlap if they collide
      snappedRect.x -= response.overlapV.x;
      snappedRect.y -= response.overlapV.y;
    } else {
      // Snap to the closest edge
      const dx = Math.min(Math.abs(staticEdges.left - movingEdges.right), Math.abs(staticEdges.right - movingEdges.left));
      const dy = Math.min(Math.abs(staticEdges.top - movingEdges.bottom), Math.abs(staticEdges.bottom - movingEdges.top));

      if (dx < dy && dx <= threshold) {
        // Snap along the x-axis
        snappedRect.x = dx === Math.abs(staticEdges.left - movingEdges.right)
          ? staticEdges.left - movingRect.width / 2
          : staticEdges.right + movingRect.width / 2;
      } else if (dy <= threshold) {
        // Snap along the y-axis
        snappedRect.y = dy === Math.abs(staticEdges.top - movingEdges.bottom)
          ? staticEdges.top - movingRect.height / 2
          : staticEdges.bottom + movingRect.height / 2;
      }
    }

    return snappedRect;
  };

  const handleDragMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const movingRectNode = e.target;
    const mousePos = stage.getPointerPosition();

    if (!mousePos) return;

    const movingRect = {
      x: movingRectNode.x(),
      y: movingRectNode.y(),
      width: movingRectNode.width(),
      height: movingRectNode.height(),
      rotation: movingRectNode.rotation(),
    };

    // Get static rectangles from the stage
    // stage.find(".static-rect") all panels exclude e.target all static panel
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

    // Snap based on mouse position
    const mouseSnapRect = snapToClosest({
      ...movingRect,
      x: mousePos.x,
      y: mousePos.y
    }, null, mousePos);

    // Determine if the new position would cause a collision
    const willCollide = staticRects.some(staticRect => {
      const response = new SAT.Response();
      return SAT.testPolygonPolygon(
        createPolygon(mouseSnapRect.x, mouseSnapRect.y, mouseSnapRect.width, mouseSnapRect.height, mouseSnapRect.rotation),
        createPolygon(staticRect.x, staticRect.y, staticRect.width, staticRect.height, staticRect.rotation),
        response
      );
    });

    // Determine the closest static rectangle
    const closestRect = getClosestRect(movingRect, staticRects);

    // Snap to the closest static rectangle
    const closestRectSnap = snapToClosest(movingRect, closestRect, mousePos);

    // Decide the final position based on collision detection
    const distanceToMouseSnap = calculateDistance(
      { x: mouseSnapRect.x, y: mouseSnapRect.y },
      mousePos
    );

    const distanceToClosestRectSnap = calculateDistance(
      { x: closestRectSnap.x, y: closestRectSnap.y },
      mousePos
    );

    const finalSnap = distanceToMouseSnap < distanceToClosestRectSnap && !willCollide
      ? mouseSnapRect
      : closestRectSnap;

    movingRectNode.position({
      x: finalSnap.x,
      y: finalSnap.y,
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
