import React, { useState } from "react";
import { Stage, Layer, Rect } from "react-konva";

function App() {
  const [rectangles, setRectangles] = useState([]);
  const [rotation, setRotation] = useState(0); // Rotation input
  const [currentRect, setCurrentRect] = useState(null); // Track the rectangle being resized
  const [startPosition, setStartPosition] = useState(null); // Starting mouse position

  const handleStageClick = (e) => {
    const pointerPos = e.target.getStage().getPointerPosition();
    if (!pointerPos) return;

    const { x, y } = pointerPos;

    // Create a new rectangle with default size and user-defined rotation
    const newRect = {
      x: x - 10, // Center the rectangle
      y: y - 12.5, // Center the rectangle
      width: 20,
      height: 25,
      rotation: parseFloat(rotation) || 0,
    };

    setStartPosition({ x, y });
    setCurrentRect(newRect);
    setRectangles([...rectangles, newRect]);
  };

  const handleMouseMove = (e) => {
    if (!currentRect || !startPosition) return;

    const pointerPos = e.target.getStage().getPointerPosition();
    if (!pointerPos) return;

    const { x, y } = pointerPos;

    // Calculate movement relative to the start position
    const dx = x - startPosition.x;
    const dy = y - startPosition.y;

    // Initialize new rectangle properties
    let newWidth = currentRect.width;
    let newHeight = currentRect.height;
    let newX = currentRect.x;
    let newY = currentRect.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal movement
      if (dx > 0) {
        // Expand to the right
        newWidth = Math.max(dx, 20);
      } else {
        // Expand to the left without shifting the center
        newWidth = Math.max(-dx, 20);
        newX = startPosition.x - newWidth; // Adjust x for leftward growth
      }
    } else {
      // Vertical movement
      if (dy > 0) {
        // Expand downward
        newHeight = Math.max(dy, 25);
      } else {
        // Expand upward without shifting the center
        newHeight = Math.max(-dy, 25);
        newY = startPosition.y - newHeight; // Adjust y for upward growth
      }
    }

    // Update the rectangle properties
    const updatedRect = {
      ...currentRect,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };

    setCurrentRect(updatedRect);

    const updatedRectangles = [...rectangles];
    updatedRectangles[updatedRectangles.length - 1] = updatedRect;
    setRectangles(updatedRectangles);
  };

  const handleMouseUp = () => {
    setCurrentRect(null);
    setStartPosition(null);
  };

  return (
    <div>
      {/* Rotation Input */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Rotation (degrees):{" "}
          <input
            type="number"
            value={rotation}
            onChange={(e) => setRotation(e.target.value)}
          />
        </label>
      </div>

      {/* Konva Stage */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ backgroundColor: "lightgray" }}
        onMouseDown={handleStageClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {rectangles.map((rect, index) => (
            <Rect
              key={index}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rotation={rect.rotation}
              fill="blue"
              stroke="black"
              strokeWidth={2}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
