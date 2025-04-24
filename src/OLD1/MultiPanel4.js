import React, { useState } from "react";
import { Stage, Layer, Rect, Group, Line } from "react-konva";

const App = () => {
  const [angle, setAngle] = useState(45); // Default angle in degrees
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null); // Fixed starting point
  const [rectDims, setRectDims] = useState({ width: 0, height: 0 }); // Rectangle dimensions

  // Convert angle to radians
  const angleInRadians = (angle * Math.PI) / 180;

  const handleMouseDown = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();
    setStartPoint({ x, y }); // Set fixed starting point
    setIsDrawing(true);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPoint(false);
    setRectDims({ width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;

    const { x: mouseX, y: mouseY } = e.target.getStage().getPointerPosition();
    const dx = mouseX - startPoint.x;
    const dy = mouseY - startPoint.y;

    // Calculate projections
    const projectedWidth = dx * Math.cos(angleInRadians) + dy * Math.sin(angleInRadians);
    const projectedHeight = -dx * Math.sin(angleInRadians) + dy * Math.cos(angleInRadians);

    setRectDims({
      width: Math.abs(projectedWidth),
      height: Math.abs(projectedHeight),
      offsetX: projectedWidth < 0 ? Math.abs(projectedWidth) : 0,
      offsetY: projectedHeight < 0 ? Math.abs(projectedHeight) : 0,
    });
  };



  // Function to generate small rectangles
  const generateSmallRects = (width, height) => {
    const smallRects = [];
    const smallWidth = 25;
    const smallHeight = 20;

    // Calculate the number of small rectangles fitting in both directions
    const cols = Math.floor(width / smallWidth);
    const rows = Math.floor(height / smallHeight);

    const rowVector = Math.abs(rectDims.width) / rectDims.width;
    const coVector = Math.abs(rectDims.height) / rectDims.height;

    const rowConstant = rowVector > 0 ? 0 : 1;
    const colConstant = coVector > 0 ? 0 : 1;


    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {

        const localX = (col + rowConstant) * smallWidth * rowVector;
        const localY = (row + colConstant) * smallHeight * coVector;

        const points = [
          { x: localX, y: localY },
          { x: localX + smallWidth, y: localY },
          { x: localX + smallWidth, y: localY + smallHeight },
          { x: localX, y: localY + smallHeight },
        ];

        const transformedPoints = points.map((point) => {
          const rotatedX = point.x * Math.cos(angleInRadians) - point.y * Math.sin(angleInRadians);
          const rotatedY = point.x * Math.sin(angleInRadians) + point.y * Math.cos(angleInRadians);

          const stageX = startPoint.x + rotatedX;
          const stageY = startPoint.y + rotatedY;

          return { x: stageX, y: stageY };
        });

        const flatPoints = [
          transformedPoints[0].x,
          transformedPoints[0].y,
          transformedPoints[1].x,
          transformedPoints[1].y,
          transformedPoints[2].x,
          transformedPoints[2].y,
          transformedPoints[3].x,
          transformedPoints[3].y,
          transformedPoints[0].x,
          transformedPoints[0].y,
        ];

        smallRects.push(flatPoints);
      }
    }

    return smallRects;
  };

  const smallRects = generateSmallRects(rectDims.width, rectDims.height);

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
                offsetX={rectDims.offsetX}
                offsetY={rectDims.offsetY}
                fill="rgba(0, 128, 255, 0.5)"
                stroke="black"
                strokeWidth={1}
              />
            </Group>
          )}
          {smallRects.map((points, index) => (
                <Line
                  key={index}
                  points={points}
                  stroke={'rgba(0, 128, 255, 0.5)'}
                  strokeWidth={1.4}
                  closed={true}
                />
              ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default App;
