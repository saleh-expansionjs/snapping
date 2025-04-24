import { Stage, Layer, Line } from "react-konva";
import SAT from "sat";
import { hullPoints, panelPoints } from './HullPoints'

export default function PanelGridGenerator() {
  const [width, height] = [7.371, 10.11585716382073];
  const rotationAngle = 145.64622497558594;

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Line
          points={hullPoints.flat()}
          fill="blue"
          stroke="black"
          strokeWidth={2}
          closed
        />
        <Line
          points={panelPoints.flat()}
          fill="green"
          stroke="black"
          strokeWidth={1}
          closed
        />
      </Layer>
    </Stage>
  );
}
