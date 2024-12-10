import React, { useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";
import SAT from "sat";

export default function MultiPanel() {
  const [currentRect, setCurrentRect] = useState(null); // Tracks the rectangle being drawn
  const [isDrawing, setIsDrawing] = useState(false);
  const [smallRects, setSmallRects] = useState([]); // Stores small rectangles being drawn
  const [panels, setPanels] = useState([]); // Stores all panels

  // Define facets as polygons
  const blueFacet = new SAT.Polygon(new SAT.Vector(), [
    new SAT.Vector(150, 200),
    new SAT.Vector(300, 300),
    new SAT.Vector(150, 400),
  ]);

  const redFacet = new SAT.Polygon(new SAT.Vector(), [
    new SAT.Vector(450, 200),
    new SAT.Vector(300, 300),
    new SAT.Vector(450, 400),
  ]);

  // Predefined panels with line points
  const predefinedPanels = [
    { points: [160, 220, 200, 220, 200, 250, 160, 250], facet: blueFacet },
    { points: [170, 270, 210, 270, 210, 300, 170, 300], facet: blueFacet },
    { points: [400, 220, 440, 220, 440, 250, 400, 250], facet: redFacet },
    { points: [420, 270, 460, 270, 460, 300, 420, 300], facet: redFacet },
  ];

  // Helper: Convert points to SAT.Polygon
  const createPolygonFromPoints = (points) => {
    const vectors = [];
    for (let i = 0; i < points?.length; i += 2) {
      vectors.push(new SAT.Vector(points[i], points[i + 1]));
    }
    return new SAT.Polygon(new SAT.Vector(), vectors);
  };

  // Convert predefined panels into SAT.Polygons
  const predefinedPolygons = predefinedPanels.map((panel) => ({
    polygon: createPolygonFromPoints(panel.points),
    facet: panel.facet,
  }));

  // Collision check for overlap with existing panels
  const isOverlappingWithPanels = (smallRectPolygon) => {
    return (
      predefinedPolygons.some(({ polygon }) =>
        SAT.testPolygonPolygon(smallRectPolygon, polygon)
      ) ||
      panels.some((panel) =>
        SAT.testPolygonPolygon(smallRectPolygon, createPolygonFromPoints(panel.points))
      )
    );
  };

  // Check if a small rectangle is within a facet
  const isInsideFacet = (smallRectPolygon, facetPolygon) => {
    return SAT.testPolygonPolygon(smallRectPolygon, facetPolygon);
  };

  // Generate small rectangles dynamically
  const generateSmallRectangles = (rect) => {
    if (!rect) return [];

    const smallRectWidth = 20; // Width of small rectangles
    const smallRectHeight = 20; // Height of small rectangles

    const rows = Math.floor(Math.abs(rect.height) / smallRectHeight);
    const cols = Math.floor(Math.abs(rect.width) / smallRectWidth);

    const smallRects = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x =
          rect.x +
          (rect.width < 0 ? -col * smallRectWidth : col * smallRectWidth);
        const y =
          rect.y +
          (rect.height < 0 ? -row * smallRectHeight : row * smallRectHeight);

        const smallRectPolygon = new SAT.Box(
          new SAT.Vector(x, y),
          smallRectWidth,
          smallRectHeight
        ).toPolygon();

        const currentFacet = SAT.testPolygonPolygon(smallRectPolygon, blueFacet)
          ? blueFacet
          : SAT.testPolygonPolygon(smallRectPolygon, redFacet)
          ? redFacet
          : null;

        if (
          currentFacet &&
          isInsideFacet(smallRectPolygon, currentFacet) &&
          !isOverlappingWithPanels(smallRectPolygon)
        ) {
          smallRects.push({
            x,
            y,
            width: smallRectWidth,
            height: smallRectHeight,
            facet: currentFacet,
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
    setSmallRects(generateSmallRectangles(newRect));
  };

  const handleMouseUp = () => {
    // setPanels([...panels, ...smallRects]);
    setCurrentRect(null);
    setSmallRects([]);
    setIsDrawing(false);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {/* Render facets */}
        <Line
          points={[150, 200, 300, 300, 150, 400]}
          fill="blue"
          stroke="black"
          strokeWidth={2}
          closed={true}
        />
        <Line
          points={[450, 200, 300, 300, 450, 400]}
          fill="red"
          stroke="black"
          strokeWidth={2}
          closed={true}
        />

        {/* Render predefined panels */}
        {predefinedPanels.map((panel, index) => (
          <Line
            key={index}
            points={panel.points}
            fill="green"
            stroke="black"
            strokeWidth={2}
            closed={true}
          />
        ))}

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
          />
        ))}
      </Layer>
    </Stage>
  );
}
