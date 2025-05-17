"use client";

import React, { useCallback, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import { useParams } from "next/navigation";
import { nodeTypes } from "~/lib/types/reactFlowTypes";
import {
  ReactFlow,
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
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import UserStoryDetailPopup from "~/app/(logged)/project/[projectId]/user-stories/UserStoryDetailPopup";
import { useSelectedNode } from "~/app/_hooks/useSelectedNode";

const fitViewOptions = { padding: 0.2, duration: 500, maxZoom: 1.5 };

export default function UserStoryDependencyTree() {
  // #region Hooks
  const { projectId } = useParams();
  const utils = api.useUtils();
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const { fitView } = useReactFlow();
  const {
    selectedId,
    setSelectedId: _setSelectedId,
    showDetail,
    setShowDetail,
  } = useSelectedNode();
  // #endregion

  // #region TRPC
  const { data: dependencyData, isLoading: isLoadingDependencies } =
    api.userStories.getUserStoryDependencies.useQuery({
      projectId: projectId as string,
    });

  const { mutateAsync: updateUserStoryDependencies } =
    api.userStories.addUserStoryDependencies.useMutation();

  const { mutateAsync: deleteUserStoryDependencies } =
    api.userStories.deleteUserStoryDependencies.useMutation();
  // #endregion

  // #region FLOW UTILITY
  const [nodes, setNodes, onNodesChange] = useNodesState(
    dependencyData?.nodes ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    dependencyData?.edges ?? [],
  );
  const [initialLayoutDone, setInitialLayoutDone] = React.useState(
    localStorage.getItem((projectId as string) + ":initialLayoutDone") ===
      "true",
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
      localStorage.setItem(
        (projectId as string) + ":initialLayoutDone",
        "true",
      );
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

      void fitView(fitViewOptions);
    },
    [nodes, edges, projectId],
  );

  const onEdgeDelete = useCallback(
    async (targetEdges: Edge[]) => {
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
          const newEdges = oldData.edges.filter(
            (edge) => !targetEdges.some((t) => t.id === edge.id),
          );
          return {
            ...oldData,
            edges: newEdges,
          };
        },
      );

      // Delete each dependency in the backend
      for (const edge of targetEdges) {
        await deleteUserStoryDependencies({
          projectId: projectId as string,
          sourceId: edge.source,
          targetId: edge.target,
        });
      }

      // Make other places refetch the data
      await invalidateQueriesUserStoriesDetails(
        projectId as string,
        Array.from(
          new Set([
            ...targetEdges.map((edge) => edge.source),
            ...targetEdges.map((edge) => edge.target),
          ]),
        ),
      );
    },
    [
      projectId,
      utils,
      deleteUserStoryDependencies,
      invalidateQueriesUserStoriesDetails,
    ],
  );

  // Do layout next time if there are no nodes
  useEffect(() => {
    if (!isLoadingDependencies && dependencyData?.nodes.length == 0) {
      localStorage.setItem(
        (projectId as string) + ":initialLayoutDone",
        "false",
      );
    }
  }, [isLoadingDependencies, dependencyData]);

  // #endregion

  // TODO: verify no cyclic dependencies

  return (
    <div className="mt-3 h-[75vh] w-full">
      {isLoadingDependencies && (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-2xl font-bold text-gray-500">
            Loading dependencies...
          </p>
        </div>
      )}
      {!isLoadingDependencies && dependencyData?.nodes.length == 0 && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <span className="-mb-8 text-[100px] text-gray-500">
              <NoteAddIcon fontSize="inherit" />
            </span>
            <h1 className="mb-5 text-3xl font-semibold text-gray-500">
              No user stories yet
            </h1>
          </div>
        </div>
      )}

      {!isLoadingDependencies && dependencyData?.nodes.length != 0 && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgeDelete}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ ...fitViewOptions, duration: 0 }}
        >
          <Controls fitViewOptions={fitViewOptions} showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="top-right">
            <SecondaryButton onClick={() => onLayout()} className={"bg-white"}>
              Organize nodes
            </SecondaryButton>
          </Panel>
        </ReactFlow>
      )}

      {showDetail && (
        <UserStoryDetailPopup
          showDetail={showDetail}
          setShowDetail={setShowDetail}
          userStoryId={selectedId}
        />
      )}
    </div>
  );
}
