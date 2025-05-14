"use client";

import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from "@xyflow/react";
import { api } from "~/trpc/react";

import "@xyflow/react/dist/style.css";
import { useParams } from "next/navigation";
import { nodeTypes } from "~/lib/types/reactFlowTypes";

export default function UserStoryDependencyDiagram() {
  // #region Hooks
  const { projectId } = useParams();

  // #endregion
  // #region TRPC
  const { data: dependencyData, isLoading: isLoadingDependencies } =
    api.userStories.getUserStoryDependencies.useQuery({
      projectId: projectId as string,
    });

  // #endregion
  // #region FLOW UTILITY
  const [nodes, setNodes, onNodesChange] = useNodesState(
    dependencyData?.nodes ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    dependencyData?.edges ?? [],
  );

  useEffect(() => {
    if (dependencyData) {
      setNodes(dependencyData.nodes);
      setEdges(dependencyData.edges);
    }
  }, [dependencyData]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );
  // #endregion
  return (
    <div style={{ width: "80vw", height: "80vh" }}>
      {isLoadingDependencies && (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-2xl font-bold text-gray-500">
            Loading dependencies...
          </p>
        </div>
      )}
      {!isLoadingDependencies && dependencyData?.nodes.length == 0 && (
        <div>
          <p className="text-2xl font-bold text-gray-500">
            No dependencies found.
          </p>
          TODO: FIX THIS
        </div>
      )}

      {!isLoadingDependencies && dependencyData?.nodes.length != 0 && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      )}
    </div>
  );
}
