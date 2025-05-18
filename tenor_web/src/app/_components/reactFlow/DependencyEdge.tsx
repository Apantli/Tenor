import React from "react";
import {
  getBezierPath,
  BaseEdge,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";

export default function DependencyEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label,
}: EdgeProps) {
  const edgePathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  const [edgePath, labelX, labelY] = getBezierPath(edgePathParams);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        onSelect={() => console.log("selected")}
      />
      {label !== "" && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-all nodrag nopan absolute origin-center rounded bg-gray-100 px-2 py-1 text-center text-xs"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
