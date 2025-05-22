"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import { useParams } from "next/navigation";
import { edgeTypes, nodeTypes } from "~/lib/types/reactFlowTypes";
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
  MarkerType,
} from "@xyflow/react";
import { api } from "~/trpc/react";
import { useInvalidateQueriesUserStoriesDetails } from "~/app/_hooks/invalidateHooks";
import {
  getLayoutedElements,
  loadFlowFromLocalStorage,
  saveFlowToLocalStorage,
} from "~/utils/reactFlow";
import SecondaryButton from "../buttons/SecondaryButton";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import UserStoryDetailPopup from "~/app/(logged)/project/[projectId]/user-stories/UserStoryDetailPopup";
import { TRPCClientError } from "@trpc/client";
import { useAlert } from "~/app/_hooks/useAlert";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import {
  permissionNumbers,
  type Permission,
} from "~/lib/types/firebaseSchemas";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";

const fitViewOptions = { padding: 0.2, duration: 500, maxZoom: 1.5 };

export default function UserStoryDependencyTree() {
  // #region Hooks
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();
  const utils = api.useUtils();
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const { fitView, setViewport } = useReactFlow();
  const [rfInstance, setRfInstance] = useState<ReturnType<
    typeof useReactFlow
  > | null>(null);
  const [renderDetail, showDetail, detailItemId, setDetailItemId] =
    useQueryIdForPopup("id");
  // #endregion

  // #region TRPC
  const {
    data: dependencyData,
    isLoading: isLoadingDependencies,
    refetch: refetchDependencies,
  } = api.userStories.getUserStoryDependencies.useQuery({
    projectId: projectId as string,
  });

  const { mutateAsync: addUserStoryDependencies } =
    api.userStories.addUserStoryDependencies.useMutation();

  const { mutateAsync: deleteUserStoryDependencies } =
    api.userStories.deleteUserStoryDependencies.useMutation();

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["backlog"],
      },
      role ?? emptyRole,
    );
  }, [role]);
  // #endregion

  // #region FLOW UTILITY
  const [nodes, setNodes, onNodesChange] = useNodesState(
    dependencyData?.nodes ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    dependencyData?.edges ?? [],
  );
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(
    (localStorage.getItem((projectId as string) + ":showEdgeLabels") ??
      "true") === "true",
  );
  const [initialLayoutDone, setInitialLayoutDone] = useState(
    (localStorage.getItem((projectId as string) + ":initialLayoutDone") ??
      "true") === "true",
  );
  const defaultViewport = loadFlowFromLocalStorage(
    projectId as string,
  )?.viewport;

  // Save flow state including node positions and zoom to localStorage
  const saveFlow = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      saveFlowToLocalStorage(projectId as string, flow);
    }
  }, [rfInstance, projectId]);

  // Save node positions to localStorage whenever they change
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      // Save flow after nodes change
      saveFlow();
    },
    [onNodesChange, saveFlow],
  );

  const handleEdgeLabelChange = useCallback(
    (edges: Edge[], showEdgeLabels: boolean) => {
      const updatedEdges = edges.map((edge) => ({
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        label: showEdgeLabels ? "Unblocks" : "",
      }));
      return updatedEdges;
    },
    [showEdgeLabels],
  );

  const handleShowLabels = () => {
    // Not updating first and then passing the parameter due to react delay in updating useState
    const updatedEdges = handleEdgeLabelChange(edges, !showEdgeLabels);
    setEdges(updatedEdges);
    localStorage.setItem(
      (projectId as string) + ":showEdgeLabels",
      !showEdgeLabels ? "true" : "false",
    );
    setShowEdgeLabels(!showEdgeLabels);
  };

  const onConnect = useCallback(async (params: Connection) => {
    if (permission < permissionNumbers.write) {
      return;
    }
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
        const newEdges = addEdge(
          { ...params, type: "dependency" },
          oldData.edges,
        );
        return {
          ...oldData,
          edges: newEdges,
        };
      },
    );

    try {
      await addUserStoryDependencies({
        projectId: projectId as string,
        dependencyUsId: params.source,
        parentUsId: params.target,
      });
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.data?.code === "BAD_REQUEST"
      ) {
        predefinedAlerts.cyclicDependency();
        await refetchDependencies();
        return;
      }
    }

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
        showEdgeLabels,
      );

      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      // Save flow after layout
      setTimeout(() => {
        saveFlow();
      }, 0);

      void fitView(fitViewOptions);
    },
    [nodes, edges, showEdgeLabels, fitView, saveFlow],
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
          dependencyUsId: edge.source,
          parentUsId: edge.target,
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

  // Handle viewport changes (pan/zoom)
  const onMove = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      saveFlowToLocalStorage(projectId as string, flow);
    }
  }, [rfInstance, projectId]);

  // Put nodes in the same positions as in the saved flow
  useEffect(() => {
    if (dependencyData) {
      // Load saved flow state from localStorage
      const savedFlow = loadFlowFromLocalStorage(projectId as string);
      let nodesWithPositions = [...dependencyData.nodes];

      if (savedFlow) {
        // Map positions from saved flow to current nodes
        const savedNodes = savedFlow.nodes;
        nodesWithPositions = nodesWithPositions.map((node) => {
          const savedNode = savedNodes.find((n) => n.id === node.id);
          if (savedNode) {
            return {
              ...node,
              position: savedNode.position,
            };
          }
          return node;
        });
      }

      setNodes(nodesWithPositions);

      const updatedEdges = handleEdgeLabelChange(
        dependencyData.edges,
        showEdgeLabels,
      );
      setEdges(updatedEdges);
    }
  }, [dependencyData, projectId, setViewport]);

  // Trigger layout if the user has not interacted with the diagram yet
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

  return (
    <div className="mt-3 h-[calc(100vh-250px)] w-full">
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
          onMove={onMove}
          onConnect={onConnect}
          onEdgesDelete={onEdgeDelete}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultViewport={defaultViewport}
          nodesConnectable={permission >= permissionNumbers.write}
          elementsSelectable={permission >= permissionNumbers.write}
        >
          <Controls fitViewOptions={fitViewOptions} showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="top-right">
            <div className="flex flex-row gap-2">
              <SecondaryButton
                onClick={() => onLayout()}
                className={"bg-white"}
              >
                <SwapVertOutlinedIcon />
                Organize nodes
              </SecondaryButton>
              <SecondaryButton
                onClick={handleShowLabels}
                className={"bg-white"}
              >
                <InfoOutlinedIcon />
                Toggle labels
              </SecondaryButton>
            </div>
          </Panel>
        </ReactFlow>
      )}

      {renderDetail && (
        <UserStoryDetailPopup
          showDetail={showDetail}
          userStoryId={detailItemId}
          setUserStoryId={setDetailItemId}
        />
      )}
    </div>
  );
}
