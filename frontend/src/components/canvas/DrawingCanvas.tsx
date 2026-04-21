import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Layer, Line, Stage } from "react-konva";

export interface DrawingCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
  clear: () => void;
  isEmpty: () => boolean;
}

interface DrawingCanvasProps {
  width: number;
  height: number;
  className?: string;
}

interface LineData {
  tool: string;
  points: number[];
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ width, height, className }, ref) => {
    const [lines, setLines] = useState<LineData[]>([]);
    const isDrawing = useRef(false);
    const stageRef = useRef<Konva.Stage>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => {
        if (!stageRef.current) return null;
        // pixelRatio 1 ensures easier pixel manipulation without scaling issues
        return stageRef.current.toCanvas({ pixelRatio: 1 });
      },
      clear: () => {
        setLines([]);
      },
      isEmpty: () => lines.length === 0,
    }));

    const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      isDrawing.current = true;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      setLines([...lines, { tool: "pen", points: [pos.x, pos.y] }]);
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDrawing.current) return;
      const stage = e.target.getStage();
      const point = stage?.getPointerPosition();
      if (!point) return;

      const lastLine = lines[lines.length - 1];
      // add point
      lastLine.points = lastLine.points.concat([point.x, point.y]);

      // replace last
      lines.splice(lines.length - 1, 1, lastLine);
      setLines(lines.concat());
    };

    const handleMouseUp = () => {
      isDrawing.current = false;
    };

    return (
      <div
        className={`${className} bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden touch-none`}
      >
        <Stage
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke="#0f172a" // slate-900
                strokeWidth={15}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            ))}
          </Layer>
        </Stage>
      </div>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";

export default DrawingCanvas;
