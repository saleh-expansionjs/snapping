import { Stage, Layer, Line, Group } from "react-konva";
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
  const facetPolygon = toSATPolygon(hullPoints.flat());

  // Compute width and height of the yellow panel from static shape
  const raw = panelPoints.flat();
  const corners = [[raw[0], raw[1]], [raw[2], raw[3]], [raw[4], raw[5]]];
  const width = distance(corners[0], corners[1]);
  const height = distance(corners[1], corners[2]);

  const [panels, setPanels] = useState([]);
  const [center, setCenter] = useState(() => {
    const x = (raw[0] + raw[2] + raw[4] + raw[6]) / 4;
    const y = (raw[1] + raw[3] + raw[5] + raw[7]) / 4;
    return { x, y };
  });

  const getBoundingBox = (points) => {
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  };
  
  const facetBBox = getBoundingBox(hullPoints.flat());
  const handleClick = () => {
    const stepX = rotateVector([width, 0], angleRad);
    const stepY = rotateVector([0, height], angleRad);
  
    const newPanels = [];
  
    const estimateSteps = (min, max, stepSize, axisVector) => {
      const axisLen = Math.abs(stepSize[0]) + Math.abs(stepSize[1]);
      return Math.ceil((max - min) / axisLen) + 2; // +2 buffer
    };
  
    const maxI = estimateSteps(facetBBox.minX, facetBBox.maxX, stepX);
    const maxJ = estimateSteps(facetBBox.minY, facetBBox.maxY, stepY);
  
    for (let i = -maxI; i <= maxI; i++) {
      for (let j = -maxJ; j <= maxJ; j++) {
        if (i === 0 && j === 0) continue;
  
        const px = center.x + i * stepX[0] + j * stepY[0];
        const py = center.y + i * stepX[1] + j * stepY[1];
  
        const rect = generatePanelAt(px, py, width, height, angleRad);
        const poly = toSATPolygon(rect);
        if (SAT.testPolygonPolygon(poly, facetPolygon)) {
          newPanels.push(rect);
        }
      }
    }
  
    setPanels(newPanels);
  };
    

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {/* Blue facet */}
        <Line
          points={hullPoints.flat()}
          fill="blue"
          stroke="black"
          strokeWidth={2}
          closed
        />

        {/* Green panels */}
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

        {/* Yellow draggable center panel */}
        <Group
          x={center.x}
          y={center.y}
          draggable
          onDragEnd={(e) =>
            setCenter({ x: e.target.x(), y: e.target.y() })
          }
        >
          <Line
            points={generatePanelAt(0, 0, width, height, angleRad)}
            fill="yellow"
            stroke="black"
            strokeWidth={1}
            closed
            onClick={handleClick}
          />
        </Group>
      </Layer>
    </Stage>
  );
}
