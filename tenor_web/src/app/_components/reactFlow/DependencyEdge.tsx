import React from "react";
import { getBezierPath, BaseEdge, type EdgeProps } from "@xyflow/react";

export default function DependencyEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const edgePathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  let path = "";
  [path] = getBezierPath(edgePathParams);

  return <BaseEdge path={path} markerEnd={markerEnd} />;
}
