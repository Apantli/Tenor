"use client";

import React, { useCallback, useEffect, useState } from "react";
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
} from "~/lib/helpers/reactFlow";
import SecondaryButton from "../../../../_components/inputs/buttons/SecondaryButton";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import UserStoryDetailPopup from "~/app/_components/popups/UserStoryDetailPopup";
import { TRPCClientError } from "@trpc/client";
import { useAlert } from "~/app/_hooks/useAlert";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import { permissionNumbers } from "~/lib/types/firebaseSchemas";
import usePersistentState from "~/app/_hooks/usePersistentState";
import { useGetPermission } from "~/app/_hooks/useGetPermission";
import LoadingSpinner from "~/app/_components/LoadingSpinner";

const fitViewOptions = { padding: 0.2, duration: 500, maxZoom: 1.5 };
const flowIdentifier = "userStoryDependencyTree";

interface Props {
  segmentedControl: React.ReactNode;
}

export default function UserStoryDependencyTree({ segmentedControl }: Props) {
  // #region Hooks
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();
  const { fitView, setViewport } = useReactFlow();

  const utils = api.useUtils();
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();

  const [rfInstance, setRfInstance] = useState<ReturnType<
    typeof useReactFlow
  > | null>(null);

  const [renderDetail, showDetail, detailItemId, setDetailItemId] =
    useQueryIdForPopup("id");

  const [showEdgeLabels, setShowEdgeLabels] = usePersistentState(
    true,
    ":userStory:showEdgeLabels",
  );
  const [initialLayoutDone, setInitialLayoutDone] = usePersistentState(
    false,
    ":userStory:initialLayoutDone",
  );
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

  const permission = useGetPermission({ flags: ["backlog"] });
  // #endregion

  // #region FLOW UTILITY
  const [nodes, setNodes, onNodesChange] = useNodesState(
    dependencyData?.nodes ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    dependencyData?.edges ?? [],
  );
  const defaultViewport = loadFlowFromLocalStorage(
    projectId as string,
    flowIdentifier,
  )?.viewport;

  // Save flow state including node positions and zoom to localStorage
  const saveFlow = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      saveFlowToLocalStorage(projectId as string, flowIdentifier, flow);
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
      saveFlowToLocalStorage(projectId as string, flowIdentifier, flow);
    }
  }, [rfInstance, projectId]);

  // Put nodes in the same positions as in the saved flow
  useEffect(() => {
    if (dependencyData) {
      // Load saved flow state from localStorage
      const savedFlow = loadFlowFromLocalStorage(
        projectId as string,
        flowIdentifier,
      );
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
      setInitialLayoutDone(true);
      onLayout();
    }
  }, [nodes]);

  // Do layout next time if there are no nodes
  useEffect(() => {
    if (!isLoadingDependencies && dependencyData?.nodes.length == 0) {
      setInitialLayoutDone(false);
    }
  }, [isLoadingDependencies, dependencyData]);

  // #endregion

  return (
    <div className="h-full w-full">
      {!isLoadingDependencies && dependencyData?.nodes.length == 0 && (
        <div className="p-10">
          <div className="flex w-full flex-row flex-wrap items-start justify-between self-end">
            <h1 className="text-3xl font-semibold">User Stories</h1>
            {segmentedControl}
          </div>
          <div className="mt-[22vh] flex flex-col items-center gap-5">
            <span className="-mb-8 text-[100px] text-gray-500">
              <NoteAddIcon fontSize="inherit" />
            </span>
            <h1 className="mb-5 text-3xl font-semibold text-gray-500">
              No user stories yet
            </h1>
          </div>
        </div>
      )}

      {(isLoadingDependencies || dependencyData?.nodes.length != 0) && (
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
          {!isLoadingDependencies && (
            <Controls fitViewOptions={fitViewOptions} showInteractive={false} />
          )}
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="top-right">
            <div className="flex flex-row flex-wrap-reverse items-center justify-end gap-2 pr-6 pt-6">
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

              <div className="pr-[1px] pt-[1px]">{segmentedControl}</div>
            </div>
          </Panel>

          {isLoadingDependencies && (
            <Panel position="top-center">
              <div className="mt-[40vh]">
                <LoadingSpinner color="primary" />
              </div>
            </Panel>
          )}
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
