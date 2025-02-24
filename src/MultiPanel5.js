import React, { useState } from "react";
import { Stage, Layer, Rect, Group, Line } from "react-konva";
import * as SAT from "sat";
import prebuildLineRects from './smallRect';

const App = () => {
  const [angle, setAngle] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [rectDims, setRectDims] = useState({ width: 20, height: 25 });
  const [once, setOnce] = useState(false);

  let angleInRadians = (angle * Math.PI) / 180;

  const handleMouseDown = (e) => {
    const position = e.target.getStage().getPointerPosition();

    const rectWidth = rectDims.width;
    const rectHeight = rectDims.height;

    // Adjust the rectangle's center considering rotation
    const centerX =
      position.x - (rectWidth / 2) * Math.cos(angleInRadians) +
      (rectHeight / 2) * Math.sin(angleInRadians);
    const centerY =
      position.y - (rectWidth / 2) * Math.sin(angleInRadians) -
      (rectHeight / 2) * Math.cos(angleInRadians);

    setStartPoint({ x: centerX, y: centerY, initialWidth: rectWidth, initialHeight: rectHeight });
    setRectDims({
      width: rectWidth + 5,
      height: rectHeight + 5,
    });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;

    const stage = e.target.getStage();
    const position = stage.getPointerPosition();

    if (!position || !startPoint) return;

    const dx = position.x - startPoint.x;
    const dy = position.y - startPoint.y;

    const rotatedDx = dx * Math.cos(angleInRadians) + dy * Math.sin(angleInRadians);
    const rotatedDy = -dx * Math.sin(angleInRadians) + dy * Math.cos(angleInRadians);


    const baseWidth = startPoint.initialWidth;
    const baseHeight = startPoint.initialHeight;

    let projectedWidth = 0;
    let projectedHeight = 0;

    if (rectDims.width < 26 && rectDims.width > 0) {
      console.clear();
      console.log(rectDims.width);
        setStartPoint({ ...startPoint, x: startPoint.x + (startPoint.initialWidth + 5) });
        projectedWidth = -baseWidth - startPoint.initialWidth + dx * Math.cos(angleInRadians) + dy * Math.sin(angleInRadians);
        setRectDims({
          ...rectDims,
          width: projectedWidth,
        });
        return;
    }

    if (rectDims.width > -26 && rectDims.width < 0) {
      console.clear();
      console.log(rectDims.width);
      setStartPoint({ ...startPoint, x: startPoint.x - (startPoint.initialWidth + 5) });
      projectedWidth = +baseWidth + startPoint.initialWidth + dx * Math.cos(angleInRadians) + dy * Math.sin(angleInRadians);
      setRectDims({
        ...rectDims,
        width: projectedWidth,
      });
      return;
  }

    if (rotatedDx < 0) {
      projectedWidth = -baseWidth + dx * Math.cos(angleInRadians) + dy * Math.sin(angleInRadians);
    } else {
      projectedWidth = baseWidth + dx * Math.cos(angleInRadians) + dy * Math.sin(angleInRadians);
    }

    if (rotatedDy < 0) {
      projectedHeight = -baseHeight - dx * Math.sin(angleInRadians) + dy * Math.cos(angleInRadians);
    } else {
      projectedHeight = baseHeight - dx * Math.sin(angleInRadians) + dy * Math.cos(angleInRadians);
    }

    setRectDims({
      width: projectedWidth,
      height: projectedHeight,
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setOnce(false);

    if (!startPoint) return;

    const stageRectangles = generateSmallRectsAsLines();
    console.log(stageRectangles);

    setStartPoint(undefined);
    setRectDims({ width: 20, height: 25, x: 0, y: 0 });
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

        // Convert flat points to SAT.Polygon
        const smallRectPolygon = new SAT.Polygon(
          new SAT.Vector(0, 0),
          transformedPoints.map((p) => new SAT.Vector(p.x, p.y))
        );

        // Check collision with prebuilt rectangles
        let hasCollision = false;
        for (const rectPoints of prebuildLineRects) {
          const prebuiltPolygon = new SAT.Polygon(
            new SAT.Vector(0, 0),
            rectPoints.reduce((acc, _, i) => {
              if (i % 2 === 0) acc.push(new SAT.Vector(rectPoints[i], rectPoints[i + 1]));
              return acc;
            }, [])
          );

          if (SAT.testPolygonPolygon(smallRectPolygon, prebuiltPolygon)) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          smallRectsAsLines.push(flatPoints);
        }
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
                stroke={"black"}
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
          {prebuildLineRects.map((points, index) => (
            <Line
              key={index}
              points={points}
              fill="rgba(255, 0, 0, 0.5)"
              stroke="black"
              strokeWidth={0.5}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default App;
