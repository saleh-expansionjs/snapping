import React, { useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";

export default function MultiPanel() {
  const [currentRect, setCurrentRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [smallRects, setSmallRects] = useState([]);
  const rotationRef = useRef(0); // Rotation angle as a mutable variable

  // Helper: Generate small rectangles aligned with rotated currentRect
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

    // Center of the rotated rectangle
    const rectCenterX = normalizedRect.x + normalizedRect.width / 2;
    const rectCenterY = normalizedRect.y + normalizedRect.height / 2;

    const smallRects = [];

    // Iterate over the bounding box
    for (
      let y = normalizedRect.y;
      y < normalizedRect.y + normalizedRect.height;
      y += smallRectSize
    ) {
      for (
        let x = normalizedRect.x;
        x < normalizedRect.x + normalizedRect.width;
        x += smallRectSize
      ) {
        // Center of the small rectangle in the grid
        const smallRectCenterX = x + smallRectSize / 2;
        const smallRectCenterY = y + smallRectSize / 2;

        // Rotate the center of the small rectangle
        const dx = smallRectCenterX - rectCenterX;
        const dy = smallRectCenterY - rectCenterY;

        const rotatedX =
          rectCenterX + dx * Math.cos(radians) - dy * Math.sin(radians);
        const rotatedY =
          rectCenterY + dx * Math.sin(radians) + dy * Math.cos(radians);

        // Check if the rotated small rectangle center falls within the original rectangle
        if (
          rotatedX >= normalizedRect.x &&
          rotatedX <= normalizedRect.x + normalizedRect.width &&
          rotatedY >= normalizedRect.y &&
          rotatedY <= normalizedRect.y + normalizedRect.height
        ) {
          smallRects.push({
            x: rotatedX - smallRectSize / 2,
            y: rotatedY - smallRectSize / 2,
            width: smallRectSize,
            height: smallRectSize,
            rotation: angle,
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
    setSmallRects(generateSmallRectangles(newRect, rotationRef.current));
  };

  const handleMouseUp = () => {
    setCurrentRect(null);
    setSmallRects([]);
    setIsDrawing(false);
  };

  const handleRotationChange = (e) => {
    const newRotation = parseFloat(e.target.value);
    rotationRef.current = newRotation; // Update the rotation variable
    if (currentRect) {
      setSmallRects(generateSmallRectangles(currentRect, newRotation));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Rotation Angle:{" "}
          <input
            type="number"
            defaultValue={rotationRef.current}
            onChange={handleRotationChange}
            style={{ width: "60px" }}
          />{" "}
          °
        </label>
      </div>
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
              x={currentRect.x + currentRect.width / 2}
              y={currentRect.y + currentRect.height / 2}
              width={Math.abs(currentRect.width)}
              height={Math.abs(currentRect.height)}
              fill="rgba(0, 128, 255, 0.3)"
              stroke="black"
              strokeWidth={2}
              offsetX={Math.abs(currentRect.width) / 2}
              offsetY={Math.abs(currentRect.height) / 2}
              rotation={rotationRef.current}
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
              offsetX={smallRect.width / 2}
              offsetY={smallRect.height / 2}
              rotation={smallRect.rotation} // Rotate the small rectangle dynamically
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
