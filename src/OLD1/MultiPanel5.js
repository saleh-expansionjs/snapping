import React, { Component } from "react";
import {
  Stage,
  Layer,
  Rect,
  Transformer,
  Shape,
  RegularPolygon,
  Text
} from "react-konva";

class Rectangle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rotation: 0, // Track rotation separately
    };
  }

  handleTransform = (e) => {
    const node = e.target;
    this.setState({ rotation: node.rotation() });
  };

  render() {
    const { x, y, fill, name } = this.props;
    const { rotation } = this.state;
    
    return (
      <>
        <RegularPolygon
          x={x}
          y={y}
          sides={3}
          radius={100}
          fill={fill}
          name={name}
          draggable
          rotation={rotation}
          onTransformEnd={this.handleTransform}
          ref={(node) => (this.shapeRef = node)}
        />
        <Text
          x={x}
          y={y - 120} // Position above the polygon
          text="Triangle"
          fontSize={16}
          fill="black"
          offsetX={30}
          offsetY={10}
          rotation={-rotation} // Counteract the polygon's rotation
        />
      </>
    );
  }
}


class Polygon extends React.Component {
  componentDidMount() {
    const { points } = this.props;
    this.shape.getSelfRect = () => {
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    };
  }
  render() {
    return (
      <Shape
        sceneFunc={(context, shape) => {
          context.beginPath();
          {
            this.props.points.map((point, i) =>
              i === 0
                ? context.moveTo(point.x, point.y)
                : context.lineTo(point.x, point.y)
            );
          }
          //context.quadraticCurveTo(150, 100, 260, 170);
          context.closePath();
          // (!) Konva specific method, it is very important
          context.fillStrokeShape(shape);
        }}
        radius={100}
        sides={4}
        fill={"lightblue"}
        stroke={"black"}
        strokeWidth={1}
        name={this.props.name}
        draggable
        ref={node => {
          this.shape = node;
        }}
      />
    );
  }
}

class TransformerComponent extends React.Component {
  componentDidMount() {
    this.checkNode();
  }
  componentDidUpdate() {
    this.checkNode();
  }
  checkNode() {
    // here we need to manually attach or detach Transformer node
    const stage = this.transformer.getStage();
    const { selectedShapeName } = this.props;

    const selectedNode = stage.findOne("." + selectedShapeName);
    // do nothing if selected node is already attached
    if (selectedNode === this.transformer.node()) {
      return;
    }

    if (selectedNode) {
      // attach to another node
      this.transformer.attachTo(selectedNode);
    } else {
      // remove transformer
      this.transformer.detach();
    }
    this.transformer.getLayer().batchDraw();
  }
  render() {
    return (
      <Transformer
        ref={node => {
          this.transformer = node;
        }}
      />
    );
  }
}

class App extends Component {
  state = {
    shapes: [
      {
        type: "rect",
        stroke: "black",
        strokeWidth: 1,
        fill: "#00D2FF",
        name: "triangle"
      }
    ],
    selectedShapeName: ""
  };
  handleStageMouseDown = e => {
    // clicked on stage - cler selection
    if (e.target === e.target.getStage()) {
      this.setState({
        selectedShapeName: ""
      });
      return;
    }
    // clicked on transformer - do nothing
    const clickedOnTransformer =
      e.target.getParent().className === "Transformer";
    if (clickedOnTransformer) {
      return;
    }

    // find clicked rect by its name
    const name = e.target.name();
    const rect = this.state.shapes.find(r => r.name === name);
    if (rect) {
      this.setState({
        selectedShapeName: name
      });
    } else {
      this.setState({
        selectedShapeName: ""
      });
    }
  };
  render() {
    return (
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={this.handleStageMouseDown}
      >
        <Layer>
          {this.state.shapes.map((shape, i) =>
            shape.type === "rect" ? (
              <Rectangle key={i} {...shape} />
            ) : (
              <Polygon key={i} {...shape} />
            )
          )}
          <TransformerComponent
            selectedShapeName={this.state.selectedShapeName}
          />
          <Text
          x={0}
          y={0}
          text="Triangle"
          fontSize={16}
          fill="black"
          offsetX={30} // Centering text
          offsetY={10}
          rotation={0} // Sync rotation
        />
        </Layer>
      </Stage>
    );
  }
}

export default App;
