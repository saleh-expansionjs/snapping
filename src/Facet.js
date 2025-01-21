import { Stage, Layer, Line } from "react-konva";
import { useEffect, useRef, useState } from "react";
import SAT from "sat";
import { facetPoints } from './facetPoints';

const Facet = () => {
    const facetRef = useRef(null);
    const rectRef = useRef(null);
    const [isColliding, setIsColliding] = useState(false);

    const rectPoints = [
        250, 150,
        350, 150,
        350, 250,
        250, 250,
        250, 150
    ];

    const [expandableRect, setExpandableRect] = useState(null);
    const [dynamicSmallRects, setDynamicSmallRects] = useState([]);

    // Convert Konva points into SAT polygons
    const createSATPolygon = (points) => {
        const vertices = [];
        for (let i = 0; i < points.length; i += 2) {
            vertices.push(new SAT.Vector(points[i], points[i + 1]));
        }
        return new SAT.Polygon(new SAT.Vector(), vertices);
    };

    // Facet polygon (created once)
    const facetPolygon = createSATPolygon(facetPoints);

    // Handle mouse move for creating an expandable rectangle
    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const mousePos = stage.getPointerPosition();

        if (expandableRect) {
            const [x, y] = expandableRect.start;
            const width = mousePos.x - x;
            const height = mousePos.y - y;

            const points = [
                x, y,
                x + width, y,
                x + width, y + height,
                x, y + height,
                x, y
            ];

            const smallRects = [];
            const numRectsX = Math.floor(Math.abs(width) / 20); // Adjust size as needed
            const numRectsY = Math.floor(Math.abs(height) / 20);

            for (let i = 0; i < numRectsX; i++) {
                for (let j = 0; j < numRectsY; j++) {
                    const rectX = x + i * 20;
                    const rectY = y + j * 20;

                    const smallRectPoints = [
                        rectX, rectY,
                        rectX + 20, rectY,
                        rectX + 20, rectY + 20,
                        rectX, rectY + 20,
                        rectX, rectY
                    ];

                    const smallRectPolygon = createSATPolygon(smallRectPoints);

                    // Check if all points of the small rectangle are inside the facet
                    const isInsideFacet = smallRectPolygon.points.every((vertex) =>
                        SAT.pointInPolygon(vertex, facetPolygon)
                    );

                    if (isInsideFacet) {
                        smallRects.push({
                            points: smallRectPoints
                        });
                    }
                }
            }

            setExpandableRect({
                start: [x, y],
                width,
                height,
                points
            });

            setDynamicSmallRects(smallRects);
        }
    };

    // Handle mouse down to start drawing the rectangle
    const handleMouseDown = (e) => {
        const stage = e.target.getStage();
        const mousePos = stage.getPointerPosition();

        setExpandableRect({
            start: [mousePos.x, mousePos.y],
            width: 0,
            height: 0,
            points: [mousePos.x, mousePos.y]
        });
    };

    // Handle mouse up to finalize the expandable rectangle
    const handleMouseUp = () => {
        setExpandableRect(null);
        // Small rectangles remain in dynamicSmallRects
    };

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <Layer>
                {/* Facet Polygon */}
                <Line
                    ref={facetRef}
                    points={facetPoints}
                    fill="rgba(0, 0, 255, 0.2)"
                    stroke="black"
                    strokeWidth={2}
                    closed={true}
                    name="facet"
                />

                {/* Draggable Rectangle */}
                <Line
                    ref={rectRef}
                    draggable={true}
                    points={rectPoints}
                    fill="black"
                    strokeWidth={1.4}
                    closed={true}
                    name="rect"
                />

                {/* Expandable Rectangle */}
                {expandableRect && (
                    <Line
                        points={expandableRect.points}
                        fill="rgba(0,0,0,0.2)"
                        stroke="black"
                        strokeWidth={1.4}
                        closed={true}
                    />
                )}

                {/* Small Rectangles */}
                {dynamicSmallRects.map((rect, i) => (
                    <Line
                        key={i}
                        points={rect.points}
                        fill="gray"
                        stroke="black"
                        strokeWidth={0.5}
                        closed={true}
                    />
                ))}
            </Layer>
        </Stage>
    );
};

export default Facet;
