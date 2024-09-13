import React, { useState } from "react";
import { RectPoints } from "./RectsPoint";
import { Stage, Layer, Line } from "react-konva";
import * as SAT from "sat";

function LineSatV1() {
  const [rectangles, setRectangles] = useState(
    RectPoints.map((points) => ({
      points,
      position: { x: 0, y: 0 }, // Initial position (for translation)
    }))
  );

  // Handle drag move: update the position of the shape
  const handleDragMove = (e, index) => {
    const newRectangles = [...rectangles];
    const shape = newRectangles[index];

    // Update the position with drag movement
    shape.position = {
      x: e.target.x(),
      y: e.target.y(),
    };

    const currentPolygon = createPolygon(newRectangles[index]);

    // Check for collisions with other shapes
    for (let i = 0; i < newRectangles.length; i++) {
      if (i !== index) {
        const otherPolygon = createPolygon(newRectangles[i]);
        const response = new SAT.Response();

        // Check for collision and apply snapping
        if (SAT.testPolygonPolygon(currentPolygon, otherPolygon, response)) {
          const { overlapV } = response;
          shape.position.x -= overlapV.x;
          shape.position.y -= overlapV.y;
        }
      }
    }

    setRectangles(newRectangles);
  };

  // Create SAT.js Polygon from rectangle's points
  const createPolygon = (rect) => {
    const points = rect.points.flat();
    const vertices = [];
    for (let i = 0; i < points.length; i += 2) {
      vertices.push(
        new SAT.Vector(
          points[i] + rect.position.x,
          points[i + 1] + rect.position.y
        )
      );
    }
    return new SAT.Polygon(
      new SAT.Vector(rect.position.x, rect.position.y),
      vertices
    );
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
				  name={"rects"}
            />
          );
        })}
      </Layer>
    </Stage>
  );
}

export default LineSatV1;
