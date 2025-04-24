import React, { useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import SAT from "sat";

export default function MultiPanel() {
  const [currentRect, setCurrentRect] = useState(null); // Tracks the rectangle being drawn
  const [isDrawing, setIsDrawing] = useState(false);
  const [smallRects, setSmallRects] = useState([]); // Stores small rectangles being drawn
  const [rotationAngle, setRotationAngle] = useState(0); // Rotation angle for small rectangles

  // Helper: Convert points to SAT.Polygon
  const createPolygonFromPoints = (points) => {
    const vectors = [];
    for (let i = 0; i < points?.length; i += 2) {
      vectors.push(new SAT.Vector(points[i], points[i + 1]));
    }
    return new SAT.Polygon(new SAT.Vector(), vectors);
  };

  // Collision check for overlap with the current rectangle using SAT
  const isInsideCurrentRect = (smallRectPolygon, currentRectPolygon) => {
    // Use SAT's collide function to check if the small rectangle overlaps with the current rectangle
    const response = new SAT.Response();
    return SAT.testPolygonPolygon(smallRectPolygon, currentRectPolygon, response);
  };

  // Generate small rectangles dynamically, considering the rotation angle
  const generateSmallRectangles = (rect, angle) => {
    if (!rect) return [];

    const smallRectSize = 20; // Size of small rectangles
    const radians = (angle * Math.PI) / 180; // Convert rotation angle to radians

    // Normalize the rectangle coordinates
    const normalizedRect = {
      x: Math.min(rect.x, rect.x + rect.width),
      y: Math.min(rect.y, rect.y + rect.height),
      width: Math.abs(rect.width),
      height: Math.abs(rect.height),
    };

    // Center of the rectangle
    const rectCenterX = normalizedRect.x + normalizedRect.width / 2;
    const rectCenterY = normalizedRect.y + normalizedRect.height / 2;

    // Determine the coordinates of the rotated corners
    const corners = [
      { x: normalizedRect.x, y: normalizedRect.y },
      { x: normalizedRect.x + normalizedRect.width, y: normalizedRect.y },
      { x: normalizedRect.x, y: normalizedRect.y + normalizedRect.height },
      { x: normalizedRect.x + normalizedRect.width, y: normalizedRect.y + normalizedRect.height },
    ];

    const rotatedCorners = corners.map((corner) => {
      const dx = corner.x - rectCenterX;
      const dy = corner.y - rectCenterY;
      const rotatedX = rectCenterX + dx * Math.cos(radians) - dy * Math.sin(radians);
      const rotatedY = rectCenterY + dx * Math.sin(radians) + dy * Math.cos(radians);
      return { x: rotatedX, y: rotatedY };
    });

    // Find the bounding box of the rotated rectangle
    const minX = Math.min(...rotatedCorners.map((corner) => corner.x));
    const maxX = Math.max(...rotatedCorners.map((corner) => corner.x));
    const minY = Math.min(...rotatedCorners.map((corner) => corner.y));
    const maxY = Math.max(...rotatedCorners.map((corner) => corner.y));

    const expandedRect = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // Create SAT Polygon for the current rectangle
    const currentRectPolygon = createPolygonFromPoints([
      normalizedRect.x, normalizedRect.y,
      normalizedRect.x + normalizedRect.width, normalizedRect.y,
      normalizedRect.x + normalizedRect.width, normalizedRect.y + normalizedRect.height,
      normalizedRect.x, normalizedRect.y + normalizedRect.height
    ]);

    const smallRects = [];

    // Loop through the grid of small rectangles within the expanded bounding box
    for (let y = expandedRect.y; y < expandedRect.y + expandedRect.height; y += smallRectSize) {
      for (let x = expandedRect.x; x < expandedRect.x + expandedRect.width; x += smallRectSize) {
        // Calculate the center of the small rectangle
        const smallRectCenterX = x + smallRectSize / 2;
        const smallRectCenterY = y + smallRectSize / 2;

        // Rotate the small rectangle center
        const dx = smallRectCenterX - rectCenterX;
        const dy = smallRectCenterY - rectCenterY;

        const rotatedX = rectCenterX + dx * Math.cos(radians) - dy * Math.sin(radians);
        const rotatedY = rectCenterY + dx * Math.sin(radians) + dy * Math.cos(radians);

        // Create SAT Polygon for the small rectangle
        const smallRectPolygon = createPolygonFromPoints([
          rotatedX - smallRectSize / 2, rotatedY - smallRectSize / 2,
          rotatedX + smallRectSize / 2, rotatedY - smallRectSize / 2,
          rotatedX + smallRectSize / 2, rotatedY + smallRectSize / 2,
          rotatedX - smallRectSize / 2, rotatedY + smallRectSize / 2
        ]);

        // Check if the small rectangle is inside the current rectangle
        if (isInsideCurrentRect(smallRectPolygon, currentRectPolygon)) {
          smallRects.push({
            x: rotatedX - smallRectSize / 2,
            y: rotatedY - smallRectSize / 2,
            width: smallRectSize,
            height: smallRectSize,
            azimuth: angle,
          });
        }
      }
    }

    return smallRects;
  };

  // Event Handlers
  const handleMouseDown = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();
    setCurrentRect({ x, y, width: 0, height: 0 });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const { x, y } = e.target.getStage().getPointerPosition();
    const newRect = {
      x: currentRect.x,
      y: currentRect.y,
      width: x - currentRect.x,
      height: y - currentRect.y,
    };

    setCurrentRect(newRect);
    setSmallRects(generateSmallRectangles(newRect, rotationAngle));
  };

  const handleMouseUp = () => {
    setCurrentRect(null);
    setSmallRects([]);
    setIsDrawing(false);
  };

  const handleRotationChange = (e) => {
    setRotationAngle(parseInt(e.target.value, 10));
  };

  return (
    <div>
      <input
        type="number"
        value={rotationAngle}
        onChange={handleRotationChange}
        min="0"
        max="360"
        step="1"
        style={{ position: "absolute", zIndex: 10 }}
      />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Render the rectangle being drawn */}
          {currentRect && (
            <Rect
              x={currentRect.x}
              y={currentRect.y}
              width={Math.abs(currentRect.width)}
              height={Math.abs(currentRect.height)}
              fill="rgba(0, 128, 255, 0.3)"
              stroke="black"
              strokeWidth={2}
              offsetX={currentRect.width < 0 ? Math.abs(currentRect.width) : 0}
              offsetY={currentRect.height < 0 ? Math.abs(currentRect.height) : 0}
            />
          )}

          {/* Render dynamically generated small rectangles */}
          {smallRects.map((smallRect, index) => (
            <Rect
              key={`small-rect-${index}`}
              x={smallRect.x}
              y={smallRect.y}
              width={smallRect.width}
              height={smallRect.height}
              fill="rgba(0, 255, 0, 0.5)"
              stroke="black"
              strokeWidth={0.5}
              rotation={smallRect.azimuth}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
