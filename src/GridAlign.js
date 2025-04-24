import { Stage, Layer, Line } from "react-konva";
import { useState, useRef } from "react";
import SAT from "sat";
import { hullPoints } from './HullPoints';

const degToRad = deg => deg * (Math.PI / 180);
const rotateVector = ([x, y], angleRad) => {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return [x * cos - y * sin, x * sin + y * cos];
};
const distance = ([x1, y1], [x2, y2]) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

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

const toSATPolygon = (points) => {
  const vectors = [];
  for (let i = 0; i < points.length; i += 2) {
    vectors.push(new SAT.Vector(points[i], points[i + 1]));
  }
  return new SAT.Polygon(new SAT.Vector(), vectors);
};

export default function GridAlign() {
  const rotationAngle = 190;
  const angleRad = degToRad(rotationAngle);
  const width = 7.371;
  const height = 10.11585716382073;

  const [origin, setOrigin] = useState(null);
  const [panels, setPanels] = useState([]);
  const isDragging = useRef(false);
  const facetPolygon = toSATPolygon(hullPoints.flat());

  const stepX = rotateVector([width, 0], angleRad);
  const stepY = rotateVector([0, height], angleRad);

  const handleMouseDown = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();
    const basePanel = generatePanelAt(x, y, width, height, angleRad);
    const poly = toSATPolygon(basePanel);
    if (SAT.testPolygonPolygon(poly, facetPolygon)) {
      setOrigin([x, y]);
      setPanels([basePanel]);
      isDragging.current = true;
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !origin) return;

    const { x, y } = e.target.getStage().getPointerPosition();
    const dx = x - origin[0];
    const dy = y - origin[1];

    const projX = (dx * stepX[0] + dy * stepX[1]) / (stepX[0] ** 2 + stepX[1] ** 2);
    const projY = (dx * stepY[0] + dy * stepY[1]) / (stepY[0] ** 2 + stepY[1] ** 2);

    const maxStepsX = Math.round(projX);
    const maxStepsY = Math.round(projY);

    const newPanels = [];

    for (let i = Math.min(0, maxStepsX); i <= Math.max(0, maxStepsX); i++) {
      for (let j = Math.min(0, maxStepsY); j <= Math.max(0, maxStepsY); j++) {
        const px = origin[0] + i * stepX[0] + j * stepY[0];
        const py = origin[1] + i * stepX[1] + j * stepY[1];

        const rect = generatePanelAt(px, py, width, height, angleRad);
        const poly = toSATPolygon(rect);
        if (SAT.testPolygonPolygon(poly, facetPolygon)) {
          newPanels.push(rect);
        }
      }
    }

    setPanels(newPanels);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
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
        {/* Facet */}
        <Line
          points={hullPoints.flat()}
          fill="blue"
          stroke="black"
          strokeWidth={2}
          closed
        />

        {/* Grid Panels */}
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
      </Layer>
    </Stage>
  );
}
