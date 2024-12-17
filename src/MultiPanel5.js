import React, { useState } from "react";
import { Stage, Layer, Rect, Group } from "react-konva";

const App = () => {
  const [angle, setAngle] = useState(45); // Default angle in degrees
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null); // Fixed starting point
  const [rectDims, setRectDims] = useState({ width: 0, height: 0 }); // Rectangle dimensions

  // Convert angle to radians
  const angleInRadians = (angle * Math.PI) / 180;

  const handleMouseDown = (e) => {
    const position = e.target.getStage().getRelativePointerPosition();
    setStartPoint(position); // Set fixed starting point
    setIsDrawing(true);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPoint(undefined);
		setRectDims({ width: 0, height: 0, x: 0, y: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;
    
    const stage = e.target.getStage();
		const position = stage.getRelativePointerPosition();

    if (!position || !startPoint) return;

    const dx = position.x - startPoint.x;
    const dy = position.y - startPoint.y;

    const angleDegrees = angle;
		const angleRadians = (angleDegrees * Math.PI) / 180;

    const projectedWidth = dx * Math.cos(angleRadians) + dy * Math.sin(angleRadians);
		const projectedHeight = -dx * Math.sin(angleRadians) + dy * Math.cos(angleRadians);

		const adjustedX = dx < 0 ? startPoint.x + projectedWidth : startPoint.x;
		const adjustedY = dy < 0 ? startPoint.y + projectedHeight : startPoint.y;

    setRectDims({
			width: projectedWidth,
			height: projectedHeight,
			x: adjustedX,
			y: adjustedY,
		});
  };

  

  // Function to generate small rectangles
  const generateSmallRects = () => {
		const smallRects = [];
		const smallWidth = 25;
		const smallHeight = 20;

		// Calculate the number of small rectangles fitting in both directions
		const cols = Math.floor(Math.abs(rectDims?.width) / smallWidth);
		const rows = Math.floor(Math.abs(rectDims?.height) / smallHeight);

		const rowVector = Math.abs(rectDims.width) / rectDims.width;
		const coVector = Math.abs(rectDims.height) / rectDims.height;

		const rowConstant = rowVector > 0 ? 0 : 1;
		const colConstant= coVector > 0 ? 0 : 1;

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				smallRects.push({
					x: (col + rowConstant) * smallWidth * rowVector,
					y: (row + colConstant) * smallHeight * coVector
				});
			}
		}

		return smallRects;
  };

  const smallRects = generateSmallRects();

  return (
    <div>
      <input
        type="number"
        value={angle}
        onChange={(e) => setAngle(Number(e.target.value))}
        placeholder="Set angle in degrees"
        style={{ marginBottom: "10px" }}
      />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {isDrawing && startPoint && (
            <Group
              x={startPoint.x}
              y={startPoint.y}
              rotation={angle} // Align group with rotation
            >
              {/* Main Rectangle */}
              <Rect
                width={rectDims.width}
                height={rectDims.height}
                fill="rgba(0, 128, 255, 0.5)"
                stroke="black"
                strokeWidth={1}
              />
              {/* Small Rectangles */}
              {smallRects.map((pos, index) => (
                <Rect
                  key={index}
                  x={pos.x} // Adjust for offset
                  y={pos.y} // Adjust for offset
                  width={25}
                  height={20}
                  fill="rgba(255, 0, 0, 0.5)"
                  stroke="black"
                  strokeWidth={0.5}
                />
              ))}
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default App;
