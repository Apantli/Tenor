"use client";

import React, { useCallback, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import { useParams } from "next/navigation";
import { nodeTypes } from "~/lib/types/reactFlowTypes";
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
  useReactFlow,
  Panel,
} from "@xyflow/react";
import { api } from "~/trpc/react";
import { useInvalidateQueriesUserStoriesDetails } from "~/app/_hooks/invalidateHooks";
import {
  getLayoutedElements,
  saveNodePositionsToLocalStorage,
} from "~/utils/reactFlow";
import SecondaryButton from "../buttons/SecondaryButton";

export default function UserStoryDependencyDiagram() {
  // #region Hooks
  const { projectId } = useParams();
  const utils = api.useUtils();
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const { fitView } = useReactFlow();

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
  const [initialLayoutDone, setInitialLayoutDone] = React.useState(
    localStorage.getItem("initialLayoutDone") === "true",
  );

  // Save node positions to localStorage whenever they change
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      // Save positions of all nodes to localStorage
      saveNodePositionsToLocalStorage(projectId as string, nodes);
    },
    [nodes, projectId, onNodesChange],
  );

  useEffect(() => {
    if (dependencyData) {
      // Load saved positions from localStorage
      const savedPositions = localStorage.getItem(
        `nodePositions:${projectId as string}`,
      );
      let nodesWithPositions = [...dependencyData.nodes];

      if (savedPositions) {
        const positions = JSON.parse(savedPositions) as Record<
          string,
          { x: number; y: number }
        >;
        nodesWithPositions = nodesWithPositions.map((node) => {
          const savedPosition = positions[node.id];
          if (savedPosition) {
            return {
              ...node,
              position: savedPosition,
            };
          }
          return node;
        });
      }

      setNodes(nodesWithPositions);
      setEdges(dependencyData.edges);
    }
  }, [dependencyData, projectId]);

  useEffect(() => {
    if (!initialLayoutDone && nodes.length > 0 && nodes[0]?.measured) {
      localStorage.setItem("initialLayoutDone", "true");
      setInitialLayoutDone(true);
      onLayout();
    }
  }, [nodes]);

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

  const onLayout = useCallback(
    (forcedNodes?: Node[], forcedEdges?: Edge[]) => {
      const layouted = getLayoutedElements(
        forcedNodes ?? nodes,
        forcedEdges ?? edges,
      );

      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      saveNodePositionsToLocalStorage(projectId as string, layouted.nodes);

      void fitView();
    },
    [nodes, edges, projectId],
  );
  // #endregion

  // TODO: verify no cyclic dependencies

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
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="top-right">
            <SecondaryButton onClick={() => onLayout()} className={"bg-white"}>
              Layout
            </SecondaryButton>
          </Panel>
        </ReactFlow>
      )}
    </div>
  );
}
