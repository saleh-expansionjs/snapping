import React, { useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

const SnapToRectangles = () => {
  const snapThreshold = 15; // Adjust this value for sensitivity
  const stageRef = useRef(null);

  const rectangles = [
    { id: 'rect1', x: 50, y: 50, width: 100, height: 50 },
    { id: 'rect2', x: 200, y: 50, width: 100, height: 50 },
    { id: 'rect3', x: 350, y: 50, width: 100, height: 50 },
    { id: 'rect4', x: 500, y: 50, width: 100, height: 50 },
    { id: 'rect5', x: 650, y: 50, width: 100, height: 50 },
    { id: 'rect6', x: 50, y: 150, width: 100, height: 50 },
    { id: 'rect7', x: 200, y: 150, width: 100, height: 50 },
    { id: 'rect8', x: 350, y: 150, width: 100, height: 50 },
    { id: 'rect9', x: 500, y: 150, width: 100, height: 50 },
    { id: 'rect10', x: 650, y: 150, width: 100, height: 50 },
  ];

  const getEdges = (rect) => {
    return {
      left: rect.x,
      right: rect.x + rect.width,
      top: rect.y,
      bottom: rect.y + rect.height,
    };
  };

  const handleDragMove = (e) => {
    const draggedLine = e.target;
    const { x, y } = draggedLine.position();
    const draggedEdges = getEdges({
      x,
      y,
      width: draggedLine.width(),
      height: draggedLine.height(),
    });

    let newX = x;
    let newY = y;

    const stage = stageRef.current;
    const allLines = stage.find('.line');

    allLines.forEach((otherLine) => {
      if (otherLine !== draggedLine) {
        const otherPos = otherLine.position();
        const otherWidth = otherLine.width();
        const otherHeight = otherLine.height();
        const otherEdges = getEdges({
          x: otherPos.x,
          y: otherPos.y,
          width: otherWidth,
          height: otherHeight,
        });

        // Horizontal snapping (left-right edges)
        if (Math.abs(draggedEdges.left - otherEdges.right) < snapThreshold) {
          newX = otherEdges.right;
        } else if (Math.abs(draggedEdges.right - otherEdges.left) < snapThreshold) {
          newX = otherEdges.left - draggedLine.width();
        }

        // Vertical snapping (top-bottom edges)
        if (Math.abs(draggedEdges.top - otherEdges.bottom) < snapThreshold) {
          newY = otherEdges.bottom;
        } else if (Math.abs(draggedEdges.bottom - otherEdges.top) < snapThreshold) {
          newY = otherEdges.top - draggedLine.height();
        }
      }
    });

    // Update the position of the dragged rectangle
    draggedLine.position({ x: newX, y: newY });

    // Force redraw after snapping to prevent visual glitches
    draggedLine.getLayer().batchDraw();
  };

  return (
    <Stage width={800} height={600} ref={stageRef}>
      <Layer>
        {rectangles.map((rect) => (
          <Line
            key={rect.id}
            id={rect.id}
            name="line" // Assign a class name to identify all Line nodes
            points={[
              rect.x, rect.y,
              rect.x + rect.width, rect.y,
              rect.x + rect.width, rect.y + rect.height,
              rect.x, rect.y + rect.height,
              rect.x, rect.y, // Closing the rectangle
            ]}
            stroke="yellow"
            strokeWidth={2}
            draggable
            onDragMove={handleDragMove}
            fill={'black'}
            closed
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default SnapToRectangles;
