import React, { useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import Konva from "konva";

const GUIDELINE_OFFSET = 3;

// Utility functions
const getVector = (p1, p2) => ({
  x: p2.x - p1.x,
  y: p2.y - p1.y
});

const getVectorMagnitude = (vector) => Math.sqrt(vector.x * vector.x + vector.y * vector.y);

const normalizeVector = (vector) => {
  const magnitude = getVectorMagnitude(vector);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude
  };
};

const projectPointOntoVector = (point, vectorStart, vectorEnd) => {
  const vector = getVector(vectorStart, vectorEnd);
  const lengthSquared = vector.x * vector.x + vector.y * vector.y;
  const t = ((point.x - vectorStart.x) * vector.x + (point.y - vectorStart.y) * vector.y) / lengthSquared;

  return {
    x: vectorStart.x + t * vector.x,
    y: vectorStart.y + t * vector.y
  };
};

const getBoundingBoxVectors = (shape) => {
  const absPos = shape.absolutePosition();
  const width = shape.width();
  const height = shape.height();
  const rotation = shape.rotation();
  const rad = (rotation * Math.PI) / 180;

  const centerX = absPos.x + width / 2;
  const centerY = absPos.y + height / 2;

  const corners = [
    { x: absPos.x, y: absPos.y },
    { x: absPos.x + width, y: absPos.y },
    { x: absPos.x, y: absPos.y + height },
    { x: absPos.x + width, y: absPos.y + height }
  ];

  const rotatedCorners = corners.map((corner) => {
    const dx = corner.x - centerX;
    const dy = corner.y - centerY;
    return {
      x: centerX + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: centerY + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  });

  return {
    top: { start: rotatedCorners[0], end: rotatedCorners[1] },
    right: { start: rotatedCorners[1], end: rotatedCorners[3] },
    bottom: { start: rotatedCorners[2], end: rotatedCorners[3] },
    left: { start: rotatedCorners[0], end: rotatedCorners[2] }
  };
};

const getLineGuideStops = (skipShape, stage) => {
  const vertical = [];
  const horizontal = [];

  stage.find(".object").forEach((guideItem) => {
    if (guideItem === skipShape) return;

    const boundingBoxVectors = getBoundingBoxVectors(guideItem);

    const edges = Object.values(boundingBoxVectors);
    edges.forEach(({ start, end }) => {
      vertical.push(start.x, end.x);
      horizontal.push(start.y, end.y);
    });
  });

  return { vertical, horizontal };
};

const getObjectSnappingEdges = (node) => {
  const boundingBoxVectors = getBoundingBoxVectors(node);
  const absPos = node.absolutePosition();

  const vertical = [];
  const horizontal = [];

  Object.values(boundingBoxVectors).forEach(({ start, end }) => {
    const projectedStart = projectPointOntoVector(absPos, start, end);
    const projectedEnd = projectPointOntoVector(
      { x: absPos.x + node.width(), y: absPos.y },
      start,
      end
    );

    vertical.push({
      guide: projectedStart.x,
      offset: absPos.x - projectedStart.x,
      snap: "custom"
    });
    vertical.push({
      guide: projectedEnd.x,
      offset: absPos.x - projectedEnd.x,
      snap: "custom"
    });

    horizontal.push({
      guide: projectedStart.y,
      offset: absPos.y - projectedStart.y,
      snap: "custom"
    });
    horizontal.push({
      guide: projectedEnd.y,
      offset: absPos.y - projectedEnd.y,
      snap: "custom"
    });
  });

  return { vertical, horizontal };
};

const getGuides = (lineGuideStops, itemBounds) => {
  const resultV = [];
  const resultH = [];

  lineGuideStops.vertical.forEach((lineGuide) => {
    itemBounds.vertical.forEach((itemBound) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset
        });
      }
    });
  });

  lineGuideStops.horizontal.forEach((lineGuide) => {
    itemBounds.horizontal.forEach((itemBound) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset
        });
      }
    });
  });

  const guides = [];

  const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

  if (minV) {
    guides.push({
      lineGuide: minV.lineGuide,
      offset: minV.offset,
      orientation: "V",
      snap: minV.snap
    });
  }

  if (minH) {
    guides.push({
      lineGuide: minH.lineGuide,
      offset: minH.offset,
      orientation: "H",
      snap: minH.snap
    });
  }

  return guides;
};

const drawGuides = (guides, layer) => {
  guides.forEach((lg) => {
    if (lg.orientation === "H") {
      const line = new Konva.Line({
        points: [-6000, 0, 6000, 0],
        stroke: "rgb(0, 161, 255)",
        strokeWidth: 2,
        name: "guid-line",
        dash: [4, 6]
      });
      layer.add(line);
      line.absolutePosition({
        x: 0,
        y: lg.lineGuide
      });
    } else if (lg.orientation === "V") {
      const line = new Konva.Line({
        points: [0, -6000, 0, 6000],
        stroke: "rgb(0, 161, 255)",
        strokeWidth: 2,
        name: "guid-line",
        dash: [4, 6]
      });
      layer.add(line);
      line.absolutePosition({
        x: lg.lineGuide,
        y: 0
      });
    }
  });
};

const onDragMove = (e, stage, layer) => {
  layer.find(".guid-line").forEach((l) => l.destroy());

  const lineGuideStops = getLineGuideStops(e.target, stage);
  const itemBounds = getObjectSnappingEdges(e.target);
  const guides = getGuides(lineGuideStops, itemBounds);

  if (!guides.length) return;

  drawGuides(guides, layer);

  const absPos = e.target.absolutePosition();

  guides.forEach((lg) => {
    switch (lg.orientation) {
      case "V": {
        absPos.x = lg.lineGuide + lg.offset;
        break;
      }
      case "H": {
        absPos.y = lg.lineGuide + lg.offset;
        break;
      }
      default:
        break;
    }
  });

  e.target.absolutePosition(absPos);
};

const onDragEnd = (e) => {
  const layer = e.target.getLayer();
  layer.find(".guid-line").forEach((l) => l.destroy());
};

export const Demo = () => {
  const stageRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;

    if (!stage || !layer) return;

    // Create snapping lines
    for (let i = 0; i < 10; i++) {
      const xPos = (i % 5) * 100 + 50;
      const yPos = Math.floor(i / 5) * 100 + 50;
      
      // Horizontal Line
      const hLine = new Konva.Line({
        points: [0, yPos, stage.width(), yPos],
        stroke: "black",
        strokeWidth: 2,
        name: "object",
        lineCap: 'round',
        lineJoin: 'round'
      });
      layer.add(hLine);

      // Vertical Line
      const vLine = new Konva.Line({
        points: [xPos, 0, xPos, stage.height()],
        stroke: "black",
        strokeWidth: 2,
        name: "object",
        lineCap: 'round',
        lineJoin: 'round'
      });
      layer.add(vLine);
    }

    // Add movable rectangle
    const movableRect = new Konva.Rect({
      x: 150,
      y: 150,
      width: 50,
      height: 50,
      fill: "red",
      draggable: true,
      name: "movable"
    });

    movableRect.on("dragmove", (e) => onDragMove(e, stage, layer));
    movableRect.on("dragend", onDragEnd);

    layer.add(movableRect);

    layer.draw();
  }, [onDragMove]);

  return (
    <div style={{ backgroundColor: "#f0f0f0", width: "100vw", height: "100vh" }}>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
      >
        <Layer ref={layerRef} />
      </Stage>
    </div>
  );
};

export default Demo;
