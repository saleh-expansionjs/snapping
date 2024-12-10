import React, { useState } from "react";
import { RectPoints } from "./RectsPoint";
import { Stage, Layer, Line } from "react-konva";
import * as THREE from "three";

function LineSatV1() {
  const [rectangles, setRectangles] = useState(
    RectPoints.map((points) => ({
      points,
      position: { x: 0, y: 0 }, // Initial position (for translation)
      rotation: 0, // Initial rotation in radians
    }))
  );

  // Handle drag move: update the position and handle snapping
  const handleDragMove = (e, index) => {
    const newRectangles = [...rectangles];
    const shape = newRectangles[index];

    // Update the position with drag movement
    shape.position = {
      x: e.target.x(),
      y: e.target.y(),
    };

    const currentPolygon = createPolygon(shape);

    // Check for collisions with other shapes
    for (let i = 0; i < newRectangles.length; i++) {
      if (i !== index) {
        const otherShape = createPolygon(newRectangles[i]);
        const currentBoundingBox = createBoundingBox(currentPolygon);
        const otherBoundingBox = createBoundingBox(otherShape);

        // Check for intersection
        if (currentBoundingBox.intersectsBox(otherBoundingBox)) {
          // Calculate overlap amounts
          const overlapX = Math.min(
            currentBoundingBox.max.x - otherBoundingBox.min.x,
            otherBoundingBox.max.x - currentBoundingBox.min.x
          );
          const overlapY = Math.min(
            currentBoundingBox.max.y - otherBoundingBox.min.y,
            otherBoundingBox.max.y - currentBoundingBox.min.y
          );

          // Apply snapping by adjusting position based on minimum overlap
          if (overlapX < overlapY) {
            shape.position.x -=
              currentBoundingBox.max.x - otherBoundingBox.min.x <
              otherBoundingBox.max.x - currentBoundingBox.min.x
                ? overlapX
                : -overlapX;
          } else {
            shape.position.y -=
              currentBoundingBox.max.y - otherBoundingBox.min.y <
              otherBoundingBox.max.y - currentBoundingBox.min.y
                ? overlapY
                : -overlapY;
          }
        }
      }
    }

    setRectangles(newRectangles); // Update state
  };

  // Create bounding box from shape
  const createBoundingBox = (shape) => {
    const box = new THREE.Box2().setFromPoints(shape.getPoints());
    return box;
  };

  // Create Three.js shape from rectangle's points considering rotation
  const createPolygon = (rect) => {
    const points = rect.points.flat(); // Get flat points array
    const vertices = []; // Array to hold vertices for the polygon

    const rotation = rect.rotation; // Get current rotation
    const centerX = rect.position.x;
    const centerY = rect.position.y;

    for (let i = 0; i < points.length; i += 2) {
      // Calculate rotated vertex position
      const x = points[i];
      const y = points[i + 1];

      const rotatedX = centerX + (x - centerX) * Math.cos(rotation) - (y - centerY) * Math.sin(rotation);
      const rotatedY = centerY + (x - centerX) * Math.sin(rotation) + (y - centerY) * Math.cos(rotation);

      vertices.push(new THREE.Vector2(rotatedX, rotatedY));
    }

    // Create a Three.js shape from the vertices
    const shape = new THREE.Shape(vertices);

    return shape; // Return the shape which can be used for collision detection
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {rectangles.map((rect, index) => {
          const flattenedPoints = rect.points
            .flat()
            .map((p, i) =>
              i % 2 === 0 ? p + rect.position.x : p + rect.position.y
            );
          return (
            <Line
              id={index}
              key={index}
              points={flattenedPoints}
              stroke={"yellow"}
              strokeWidth={2}
              fill={"black"}
              closed={true}
              draggable
              onDragMove={(e) => handleDragMove(e, index)} // Move dynamically during drag
              onDragEnd={() => setRectangles([...rectangles])} // Ensure to update state on drag end
              name={"rects"}
            />
          );
        })}
      </Layer>
    </Stage>
  );
}

export default LineSatV1;
