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
import { useInvalidateQueriesTaskDetails } from "~/app/_hooks/invalidateHooks";
import {
  getLayoutedElements,
  loadFlowFromLocalStorage,
  saveFlowToLocalStorage,
} from "~/utils/reactFlow";
import SecondaryButton from "../../../../_components/inputs/buttons/SecondaryButton";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import UserStoryDetailPopup from "~/app/(logged)/project/[projectId]/user-stories/UserStoryDetailPopup";
import { TRPCClientError } from "@trpc/client";
import { useAlert } from "~/app/_hooks/useAlert";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import {
  type BacklogItemType,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import usePersistentState from "~/app/_hooks/usePersistentState";
import { useGetPermission } from "~/app/_hooks/useGetPermission";
import IssueDetailPopup from "../issues/IssueDetailPopup";
import LoadingSpinner from "~/app/_components/LoadingSpinner";

const fitViewOptions = { padding: 0.2, duration: 500, maxZoom: 1.5 };
const flowIdentifier = "taskDependencyTree";

export default function TaskDependencyTree() {
  // #region Hooks
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();
  const { fitView, setViewport } = useReactFlow();

  const utils = api.useUtils();
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  const [rfInstance, setRfInstance] = useState<ReturnType<
    typeof useReactFlow
  > | null>(null);

  const [renderDetail, showDetail, detailItemId, setDetailItemId] =
    useQueryIdForPopup("id");

  const [showEdgeLabels, setShowEdgeLabels] = usePersistentState(
    true,
    ":task:showEdgeLabels",
  );
  const [initialLayoutDone, setInitialLayoutDone] = usePersistentState(
    false,
    ":task:initialLayoutDone",
  );
  // #endregion

  // #region TRPC
  const {
    data: dependencyData,
    isLoading: isLoadingDependencies,
    refetch: refetchDependencies,
  } = api.tasks.getTaskDependencies.useQuery({
    projectId: projectId as string,
  });

  const { mutateAsync: addTaskDependencies } =
    api.tasks.addTaskDependencies.useMutation();

  const { mutateAsync: deleteTaskDependencies } =
    api.tasks.deleteTaskDependencies.useMutation();

  const permission = useGetPermission({ flags: ["backlog", "issues"] });
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
    // Cancel ongoing queries for this task data
    await utils.tasks.getTaskDependencies.cancel({
      projectId: projectId as string,
    });

    // Optimistically update the query data
    utils.tasks.getTaskDependencies.setData(
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
      await addTaskDependencies({
        projectId: projectId as string,
        dependencyTaskId: params.source,
        parentTaskId: params.target,
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
    await invalidateQueriesTaskDetails(projectId as string, [
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
      // Cancel ongoing queries for this task data
      await utils.tasks.getTaskDependencies.cancel({
        projectId: projectId as string,
      });

      // Optimistically update the query data
      utils.tasks.getTaskDependencies.setData(
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
        await deleteTaskDependencies({
          projectId: projectId as string,
          dependencyTaskId: edge.source,
          parentTaskId: edge.target,
        });
      }

      // Make other places refetch the data
      await invalidateQueriesTaskDetails(
        projectId as string,
        Array.from(
          new Set([
            ...targetEdges.map((edge) => edge.source),
            ...targetEdges.map((edge) => edge.target),
          ]),
        ),
      );
    },
    [projectId, utils, deleteTaskDependencies, invalidateQueriesTaskDetails],
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

  // #region Utils
  const [parentId, taskId, parentType] = detailItemId.split("-") as [
    string,
    string,
    BacklogItemType,
  ];

  // #endregion

  return (
    <div className="mt-3 h-[calc(100vh-250px)] w-full">
      {isLoadingDependencies && (
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      )}
      {!isLoadingDependencies && dependencyData?.nodes.length == 0 && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <span className="-mb-8 text-[100px] text-gray-500">
              <NoteAddIcon fontSize="inherit" />
            </span>
            <h1 className="mb-5 text-3xl font-semibold text-gray-500">
              No tasks yet
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

      {renderDetail && parentId && parentType === "US" && taskId && (
        <UserStoryDetailPopup
          showDetail={showDetail}
          userStoryId={parentId}
          setUserStoryId={setDetailItemId}
          taskIdToOpenImmediately={taskId}
        />
      )}
      {renderDetail && parentId && parentType === "IS" && taskId && (
        <IssueDetailPopup
          showDetail={showDetail}
          issueId={parentId}
          setDetailId={setDetailItemId}
          taskIdToOpenImmediately={taskId}
        />
      )}
    </div>
  );
}
