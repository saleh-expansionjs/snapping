import Konva from "konva";
import React, { useEffect } from "react";
import PredefinedRectangles from "./Rectangle2";
import Algo from "./Algo";
import LineRect from "./LineRect";
import GuideLine from "./GuideLine";
import NewSnap from "./NewSnap";
import MouseDetection from "./MouseDetection";
import MouseDetection2 from "./MouseDetection2";
import MouseDetectionSnapping from "./MouseDetectionSnapping";
import LineRectSnap from "./LineRectSnap";

export const App = () => {
  return (
    <div
      style={{ backgroundColor: "#f0f0f0", width: "100vw", height: "100vh" }}
    >
      {/* <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
      >
        <Layer ref={layerRef} />
        <Grid ref={layerRef} />
      </Stage> */}
      {/* <PredefinedRectangles /> */}
      {/* <Algo /> */}
      {/* <LineRect /> */}
      {/* <GuideLine /> */}
      {/* < NewSnap /> */}
      {/* <MouseDetection /> */}
      {/* <MouseDetection2 /> */}
      {/* <MouseDetectionSnapping /> */}
      {/* <LineRectSnap /> */}
    </div>
  );
};

export default App;
