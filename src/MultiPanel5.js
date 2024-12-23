import React, { useState } from "react";
import { Stage, Layer, Rect, Group, Line } from "react-konva";

const App = () => {
  const [angle, setAngle] = useState(45);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [rectDims, setRectDims] = useState({ width: 0, height: 0 });

  const angleInRadians = (angle * Math.PI) / 180;

  const handleMouseDown = (e) => {
    const position = e.target.getStage().getRelativePointerPosition();
    setStartPoint(position);
    setIsDrawing(true);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    if (!startPoint) return;

    const stageRectangles = generateSmallRectsAsLines();
    console.log(stageRectangles);

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

    const projectedWidth = dx * Math.cos(angleInRadians) + dy * Math.sin(angleInRadians);
    const projectedHeight = -dx * Math.sin(angleInRadians) + dy * Math.cos(angleInRadians);

    const adjustedX = dx < 0 ? startPoint.x + projectedWidth : startPoint.x;
    const adjustedY = dy < 0 ? startPoint.y + projectedHeight : startPoint.y;

    setRectDims({
      width: projectedWidth,
      height: projectedHeight,
      x: adjustedX,
      y: adjustedY,
    });
  };

  const generateSmallRectsAsLines = () => {
    const smallWidth = 25;
    const smallHeight = 20;

    // Calculate the number of small rectangles fitting in both directions
    const cols = Math.floor(Math.abs(rectDims?.width) / smallWidth);
    const rows = Math.floor(Math.abs(rectDims?.height) / smallHeight);

    const rowVector = Math.abs(rectDims.width) / rectDims.width;
    const coVector = Math.abs(rectDims.height) / rectDims.height;

    const rowConstant = rowVector > 0 ? 0 : 1;
    const colConstant = coVector > 0 ? 0 : 1;

    const smallRectsAsLines = [];

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

        // Convert the transformed points to a flat array for Line rendering
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

        smallRectsAsLines.push(flatPoints);
      }
    }

    return smallRectsAsLines;
  };

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
              rotation={angle}
            >
              {/* Main Rectangle */}
              <Rect
                width={rectDims.width}
                height={rectDims.height}
                fill="rgba(0, 128, 255, 0.5)"
                stroke="black"
                strokeWidth={1}
              />
            </Group>
          )}

          {/* Render small rectangles as lines */}
          {generateSmallRectsAsLines().map((points, index) => (
            <Line
              key={index}
              points={points}
              stroke="red"
              strokeWidth={1}
              closed={true}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default App;
