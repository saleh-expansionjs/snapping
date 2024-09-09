import Konva from "konva";
import React from "react";
import { Stage, Layer } from "react-konva";

const GUIDELINE_OFFSET = 5;

export const Demo = () => {
  const stageRef = React.useRef(null);
  const layerRef = React.useRef(null);

  const getLineGuideStops = (skipShape) => {
    const stage = skipShape.getStage();
    if (!stage) return { vertical: [], horizontal: [] };

    const vertical = [0, stage.width() / 2, stage.width()];
    const horizontal = [0, stage.height() / 2, stage.height()];

    stage.find(".object").forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      const box = guideItem.getClientRect();
      vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
      horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    });
    return {
      vertical,
      horizontal,
    };
  };

  const getObjectSnappingEdges = React.useCallback((node) => {
    const box = node.getClientRect();
    const absPos = node.absolutePosition();
    const rotation = node.rotation();
  
    // Calculate the four corners of the rotated rectangle
    const width = box.width;
    const height = box.height;
    const x = absPos.x;
    const y = absPos.y;
  
    // Convert rotation from degrees to radians
    const angle = (rotation * Math.PI) / 180;
  
    // Calculate the rotated corners
    const corners = [
      {
        x: x + width / 2 * Math.cos(angle) - height / 2 * Math.sin(angle),
        y: y + width / 2 * Math.sin(angle) + height / 2 * Math.cos(angle),
      },
      {
        x: x - width / 2 * Math.cos(angle) - height / 2 * Math.sin(angle),
        y: y - width / 2 * Math.sin(angle) + height / 2 * Math.cos(angle),
      },
      {
        x: x - width / 2 * Math.cos(angle) + height / 2 * Math.sin(angle),
        y: y - width / 2 * Math.sin(angle) - height / 2 * Math.cos(angle),
      },
      {
        x: x + width / 2 * Math.cos(angle) + height / 2 * Math.sin(angle),
        y: y + width / 2 * Math.sin(angle) - height / 2 * Math.cos(angle),
      },
    ];
  
    // Find min/max for bounding box
    const minX = Math.min(...corners.map((corner) => corner.x));
    const maxX = Math.max(...corners.map((corner) => corner.x));
    const minY = Math.min(...corners.map((corner) => corner.y));
    const maxY = Math.max(...corners.map((corner) => corner.y));
  
    return {
      vertical: [
        {
          guide: Math.round(minX),
          offset: Math.round(x - minX),
          snap: "start"
        },
        {
          guide: Math.round((minX + maxX) / 2),
          offset: Math.round(x - (minX + maxX) / 2),
          snap: "center"
        },
        {
          guide: Math.round(maxX),
          offset: Math.round(x - maxX),
          snap: "end"
        }
      ],
      horizontal: [
        {
          guide: Math.round(minY),
          offset: Math.round(y - minY),
          snap: "start"
        },
        {
          guide: Math.round((minY + maxY) / 2),
          offset: Math.round(y - (minY + maxY) / 2),
          snap: "center"
        },
        {
          guide: Math.round(maxY),
          offset: Math.round(y - maxY),
          snap: "end"
        }
      ]
    };
  }, []);
  

  const getGuides = React.useCallback((lineGuideStops, itemBounds) => {
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
            offset: itemBound.offset,
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
            offset: itemBound.offset,
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
        snap: minV.snap,
      });
    }

    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: "H",
        snap: minH.snap,
      });
    }

    return guides;
  }, []);

  const drawGuides = React.useCallback((guides, layer) => {
    guides.forEach((lg) => {
      if (lg.orientation === "H") {
        const line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: "rgb(0, 161, 255)",
          strokeWidth: 1,
          name: "guid-line",
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: 0,
          y: lg.lineGuide,
        });
      } else if (lg.orientation === "V") {
        const line = new Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: "rgb(0, 161, 255)",
          strokeWidth: 1,
          name: "guid-line",
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: lg.lineGuide,
          y: 0,
        });
      }
    });
  }, []);

  const onDragMove = React.useCallback(
    (e) => {
      const layer = e.target.getLayer();

      layer.find(".guid-line").forEach((l) => l.destroy());

      const lineGuideStops = getLineGuideStops(e.target);
      const itemBounds = getObjectSnappingEdges(e.target);

      const guides = getGuides(lineGuideStops, itemBounds);

      if (!guides.length) {
        return;
      }

      drawGuides(guides, layer);

      const absPos = e.target.absolutePosition();
      guides.forEach((lg) => {
        switch (lg.snap) {
          case "start":
          case "center":
          case "end":
            switch (lg.orientation) {
              case "V":
                absPos.x = lg.lineGuide + lg.offset;
                break;
              case "H":
                absPos.y = lg.lineGuide + lg.offset;
                break;
            }
            break;
        }
      });
      e.target.absolutePosition(absPos);
    },
    [drawGuides, getGuides, getObjectSnappingEdges]
  );

  const onDragEnd = (e) => {
    const layer = e.target.getLayer();
    layer.find(".guid-line").forEach((l) => l.destroy());
  };

  React.useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;

    if (!stage || !layer) return;

    const rectWidth = 50;
    const rectHeight = 50;
    const margin = 10; // margin between rectangles

    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / 5); // determine which row the rectangle should be in
      const col = i % 5; // determine the column for the rectangle

      const rect = new Konva.Rect({
        x: col * (rectWidth + margin),
        y: row * (rectHeight + margin),
        width: rectWidth,
        height: rectHeight,
        fill: Konva.Util.getRandomColor(),
        draggable: true,
        name: "object",
        rotation: 50,
        stroke: "black",
        strokeWidth: 4, 
      });

      rect.on("dragmove", onDragMove);
      rect.on("dragend", onDragEnd);

      layer.add(rect);
    }

    layer.draw();
  }, [onDragMove]);

  return (
    <div
      style={{ backgroundColor: "#f0f0f0", width: "100vw", height: "100vh" }}
    >
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
