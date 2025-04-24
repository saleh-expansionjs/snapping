import { Stage, Layer, Line } from "react-konva";
import { useState } from "react";
import SAT from "sat";
import { hullPoints, panelPoints } from './HullPoints';

const toSATPolygon = (points) => {
  const vectors = [];
  for (let i = 0; i < points.length; i += 2) {
    vectors.push(new SAT.Vector(points[i], points[i + 1]));
  }
  return new SAT.Polygon(new SAT.Vector(), vectors);
};

const degToRad = (deg) => deg * (Math.PI / 180);
const rotateVector = ([x, y], angleRad) => [
  x * Math.cos(angleRad) - y * Math.sin(angleRad),
  x * Math.sin(angleRad) + y * Math.cos(angleRad)
];

const generatePanelAt = (cx, cy, width, height, angleRad) => {
  const halfW = width / 2;
  const halfH = height / 2;

  const corners = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ];

  return corners.map(([dx, dy]) => {
    const [x, y] = rotateVector([dx, dy], angleRad);
    return [cx + x, cy + y];
  }).flat();
};

const distance = ([x1, y1], [x2, y2]) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export default function PanelGridGenerator() {
  const rotationAngle = 145.64622497558594;
  const angleRad = degToRad(rotationAngle);
  const [panels, setPanels] = useState([]);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });

  // Compute actual corners of yellow panel based on original shape + drag position
  const rawCorners = [];
  const flatPanel = panelPoints.flat();
  for (let i = 0; i < flatPanel.length; i += 2) {
    rawCorners.push([
      flatPanel[i] + panelPos.x,
      flatPanel[i + 1] + panelPos.y
    ]);
  }

  const facetPolygon = toSATPolygon(hullPoints.flat());

  const handleClick = () => {
    const cx = rawCorners.reduce((sum, [x]) => sum + x, 0) / 4;
    const cy = rawCorners.reduce((sum, [, y]) => sum + y, 0) / 4;

    const width = distance(rawCorners[0], rawCorners[1]);
    const height = distance(rawCorners[1], rawCorners[2]);

    const stepX = rotateVector([width, 0], angleRad);
    const stepY = rotateVector([0, height], angleRad);

    const newPanels = [];
    const gridSize = 50;

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (i === 0 && j === 0) continue;

        const px = cx + i * stepX[0] + j * stepY[0];
        const py = cy + i * stepX[1] + j * stepY[1];

        const rect = generatePanelAt(px, py, width, height, angleRad);
        const panelPoly = toSATPolygon(rect);
        const isInside = SAT.testPolygonPolygon(panelPoly, facetPolygon);

        if (isInside) {
          newPanels.push(rect);
        }
      }
    }

    setPanels(newPanels);
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {/* Blue Facet */}
        <Line
          points={hullPoints.flat()}
          fill="blue"
          stroke="black"
          strokeWidth={2}
          closed
        />

        {/* Green Panels */}
        {panels.map((pts, i) => (
          <Line
            key={i}
            points={pts}
            fill="green"
            stroke="black"
            strokeWidth={0.5}
            closed
          />
        ))}

        {/* Yellow Draggable Clickable Panel */}
        <Line
          points={panelPoints.flat()}
          fill="yellow"
          stroke="black"
          strokeWidth={1}
          closed
          x={panelPos.x}
          y={panelPos.y}
          onClick={handleClick}
          draggable
          onDragEnd={(e) =>
            setPanelPos({ x: e.target.x(), y: e.target.y() })
          }
        />
      </Layer>
    </Stage>
  );
}
