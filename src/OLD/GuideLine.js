import React, { useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

const EDGE_DETECTION_THRESHOLD = 10; // Define snapping distance threshold

const SnappingRectangles = () => {
  const [rects, setRects] = useState([
    { id: 1, x: 50, y: 50, width: 100, height: 100 },
    { id: 2, x: 300, y: 200, width: 100, height: 100 },
  ]);

  const handleDragMove = (e, index) => {
    const activeObject = e.target;
    const { x: ax, y: ay, width: aw, height: ah } = activeObject.attrs;
    const activeObjectCorners = {
      tl: { x: ax, y: ay },
      tr: { x: ax + aw, y: ay },
      br: { x: ax + aw, y: ay + ah },
      bl: { x: ax, y: ay + ah }
    };

    let snap = false;
    
    const otherRects = rects.filter((_, i) => i !== index);
    
    otherRects.forEach((targ) => {
      const { x: tx, y: ty, width: tw, height: th } = targ;
      const targetCorners = {
        tl: { x: tx, y: ty },
        tr: { x: tx + tw, y: ty },
        br: { x: tx + tw, y: ty + th },
        bl: { x: tx, y: ty + th }
      };

      // Snap to edges
      if (Math.abs(activeObjectCorners.tr.x - targetCorners.tl.x) < EDGE_DETECTION_THRESHOLD) {
        activeObject.x(targetCorners.tl.x - aw);
        snap = true;
      }
      if (Math.abs(activeObjectCorners.tl.x - targetCorners.tr.x) < EDGE_DETECTION_THRESHOLD) {
        activeObject.x(targetCorners.tr.x);
        snap = true;
      }
      if (Math.abs(activeObjectCorners.br.y - targetCorners.tl.y) < EDGE_DETECTION_THRESHOLD) {
        activeObject.y(targetCorners.tl.y - ah);
        snap = true;
      }
      if (Math.abs(targetCorners.br.y - activeObjectCorners.tl.y) < EDGE_DETECTION_THRESHOLD) {
        activeObject.y(targetCorners.br.y);
        snap = true;
      }
      
      // Highlight intersection
      if (activeObject.intersects(targetCorners.tl, targetCorners.br)) {
        targ.stroke('red');
        targ.strokeWidth(10);
      } else {
        targ.stroke(null);
        targ.strokeWidth(0);
      }
    });

    // Update active object border color if it intersects with any target
    if (snap) {
      activeObject.stroke('blue');
      activeObject.strokeWidth(2);
    } else {
      activeObject.stroke(null);
      activeObject.strokeWidth(0);
    }

    activeObject.getLayer().batchDraw(); // Force re-draw of layer
  };

  const handleDragEnd = (e, index) => {
    const newRects = [...rects];
    newRects[index] = { ...newRects[index], x: e.target.x(), y: e.target.y() };
    setRects(newRects);
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {rects.map((rect, index) => (
          <Rect
            key={rect.id}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="lightblue"
            draggable
            onDragMove={(e) => handleDragMove(e, index)}
            onDragEnd={(e) => handleDragEnd(e, index)}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default SnappingRectangles;
