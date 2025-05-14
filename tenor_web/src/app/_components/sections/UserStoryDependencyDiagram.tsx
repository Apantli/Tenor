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
import { useInvalidateQueriesUserStoriesDetails } from "~/app/_hooks/invalidateHooks";

export default function UserStoryDependencyDiagram() {
  // #region Hooks
  const { projectId } = useParams();
  const utils = api.useUtils();
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();

  // #endregion
  // #region TRPC
  const { data: dependencyData, isLoading: isLoadingDependencies } =
    api.userStories.getUserStoryDependencies.useQuery({
      projectId: projectId as string,
    });

  const { mutateAsync: updateUserStoryDependencies } =
    api.userStories.updateUserStoryDependencies.useMutation();

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

  const onConnect = useCallback(async (params: Connection) => {
    // Cancel ongoing queries for this user story data
    await utils.userStories.getUserStoryDependencies.cancel({
      projectId: projectId as string,
    });

    // Optimistically update the query data
    utils.userStories.getUserStoryDependencies.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return oldData;
        const newEdges = addEdge(params, oldData.edges);
        return {
          ...oldData,
          edges: newEdges,
        };
      },
    );

    await updateUserStoryDependencies({
      projectId: projectId as string,
      sourceId: params.source,
      targetId: params.target,
    });

    // Make other places refetch the data
    await invalidateQueriesUserStoriesDetails(projectId as string, [
      params.source,
      params.target,
    ]);
  }, []);
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
