import React from "react";
import { Stage, Layer, Line } from "react-konva";
import SAT from "sat";

const DraggableDiamondCollision = () => {
  const width = 20; // Diamond width
  const height = 25; // Diamond height
  const commonRotation = 45; // Common rotation for all panels

  // Convert points (flat array) to SAT.Vectors
  const convertPointsToVectors = (points) => {
    const vectors = [];
    for (let i = 0; i < points.length; i += 2) {
      vectors.push(new SAT.Vector(points[i], points[i + 1]));
    }
    return vectors;
  };

  // Rotate points based on origin
  const rotatePoints = (points, angle, origin) => {
    const radians = (angle * Math.PI) / 180;
    return points.map((point) => {
      const dx = point.x - origin.x;
      const dy = point.y - origin.y;
      return {
        x: origin.x + dx * Math.cos(radians) - dy * Math.sin(radians),
        y: origin.y + dx * Math.sin(radians) + dy * Math.cos(radians),
      };
    });
  };

  // Create a SAT Polygon with given points, position, and rotation
  const createPolygon = (points, position, rotation) => {
    // Rotate the points based on the rotation
    const rotatedPoints = rotatePoints(points, rotation, position);
    return new SAT.Polygon(new SAT.Vector(position.x, position.y), rotatedPoints.map((p) => new SAT.Vector(p.x, p.y)));
  };

  // Collision detection between draggable and static panels
  const checkCollision = (stage, draggableNode) => {
    const { x, y, points, rotation } = draggableNode.attrs;

    // Draggable panel points and polygon
    const draggablePoints = convertPointsToVectors(points);
    const draggablePolygon = createPolygon(draggablePoints, { x, y }, rotation);

    // Static panels
    const allPanels = stage.find("Line").filter((node) => node.attrs.strokeWidth !== 1); // Only static panels

    for (const panel of allPanels) {
      const { points: panelPoints, x: px, y: py, rotation: panelRotation } = panel.attrs;

      // Static panel points and polygon with its own rotation
      const staticPoints = convertPointsToVectors(panelPoints);
      const staticPolygon = createPolygon(staticPoints, { x: px, y: py }, panelRotation || commonRotation);

      // Check for collision using SAT
      if (SAT.testPolygonPolygon(draggablePolygon, staticPolygon)) {
        console.log("Collision detected with panel:", panel);
        return true; // Collision detected
      }
    }

    console.log("No collision detected.");
    return false; // No collision
  };

  const handleDragMove = (e) => {
    const stage = e.target.getStage();
    const draggableNode = e.target;
    checkCollision(stage, draggableNode); // Check collision on drag
  };

  return (
    <Stage width={500} height={500}>
      <Layer>
        {/* Static panels */}
        {[...Array(3)].map((_, row) =>
          [...Array(3)].map((_, col) => {
            if (row === 1 && col === 1) return null; // Skip center (empty space)

            const x = 250 + (col - 1) * width;
            const y = 250 + (row - 1) * height;

            const points = [
              0, -height / 2,
              width / 2, 0,
              0, height / 2,
              -width / 2, 0,
              0, -height / 2,
            ];

            return (
              <Line
                key={`${row}-${col}`}
                points={points}
                closed
                stroke="black"
                strokeWidth={2}
                x={x}
                y={y}
                rotation={commonRotation} // Apply common rotation
              />
            );
          })
        )}

        {/* Draggable diamond */}
        <Line
          points={[
            0, -height / 2,
            width / 2, 0,
            0, height / 2,
            -width / 2, 0,
            0, -height / 2,
          ]}
          closed
          stroke="blue"
          strokeWidth={2}
          x={250}
          y={250}
          draggable
          onDragMove={handleDragMove}
          rotation={0} // Initial rotation for the draggable panel
        />
      </Layer>
    </Stage>
  );
};

export default DraggableDiamondCollision;
