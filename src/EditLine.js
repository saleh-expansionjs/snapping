import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Circle } from 'react-konva';
import  massHullPoints  from './smallRect.js';

const HullRenderer = () => {
  const [lines, setLines] = useState([]);
  const [circles, setCircles] = useState([]);
  const [isDelete, setIsDelete] = useState(false);
  const lineLayerRef = useRef(null);
  const circleLayerRef = useRef(null);

  useEffect(() => {
    const newLines = [];
    const newCircles = [];
    massHullPoints.slice(0, 2).forEach((hullPoints, index) => {
      const panelId = `panel-${index}`;
      const panelPoints = hullPoints.flat();
      
      newLines.push({
        id: panelId,
        points: panelPoints,
        closed: true,
      });

      hullPoints.forEach((point, i) => {
        newCircles.push({
          id: `circle-${index}-${i}`,
          x: point[0],
          y: point[1],
        });
      });
    });
    setLines(newLines);
    setCircles(newCircles);
  }, []);

  const handleDeleteToggle = () => {
    setIsDelete((prev) => !prev);
  };

  const handleCircleDragMove = (e, circleId) => {
    const updatedCircles = circles.map((circle) =>
      circle.id === circleId ? { ...circle, x: e.target.x(), y: e.target.y() } : circle
    );
    setCircles(updatedCircles);

    const updatedLines = lines.map((line) => {
      const newPoints = [...line.points];
      for (let i = 0; i < newPoints.length; i += 2) {
        if (newPoints[i] === e.target.attrs.x && newPoints[i + 1] === e.target.attrs.y) {
          newPoints[i] = e.target.x();
          newPoints[i + 1] = e.target.y();
        }
      }
      return { ...line, points: newPoints };
    });
    setLines(updatedLines);
  };

  const handleCircleClick = (circleId) => {
    if (!isDelete) return;
    const newCircles = circles.filter((circle) => circle.id !== circleId);
    setCircles(newCircles);
  };

  return (
    <div>
      <button onClick={handleDeleteToggle}>
        {isDelete ? 'Delete Point Disable' : 'Delete Point Enable'}
      </button>
      <Stage width={500} height={500}>
        <Layer ref={lineLayerRef}>
          {lines.map((line) => (
            <Line
              key={line.id}
              id={line.id}
              points={line.points}
              stroke="black"
              strokeWidth={1.4}
              closed={true}
              fill="rgba(0,0,255,0.3)"
              draggable
              onClick={() => console.log(`Clicked on ${line.id}`)}
              name={line.id}
            />
          ))}
        </Layer>
        <Layer ref={circleLayerRef}>
          {circles.map((circle) => (
            <Circle
              key={circle.id}
              x={circle.x}
              y={circle.y}
              radius={4}
              fill="red"
              draggable
              onDragMove={(e) => handleCircleDragMove(e, circle.id)}
              onClick={() => handleCircleClick(circle.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default HullRenderer;
