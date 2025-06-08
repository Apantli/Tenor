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
} from "~/lib/helpers/reactFlow";
import SecondaryButton from "../../../../_components/inputs/buttons/SecondaryButton";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import UserStoryDetailPopup from "~/app/_components/popups/UserStoryDetailPopup";
import { TRPCClientError } from "@trpc/client";
import { useAlert } from "~/app/_hooks/useAlert";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import {
  type AnyBacklogItemType,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import usePersistentState from "~/app/_hooks/usePersistentState";
import { useGetPermission } from "~/app/_hooks/useGetPermission";
import IssueDetailPopup from "../../../../_components/popups/IssueDetailPopup";
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
    if (!dependencyData) return;

    // Load saved flow state from localStorage
    const savedFlow = loadFlowFromLocalStorage(
      projectId as string,
      flowIdentifier,
    );

    const nodesWithPositions: Node[] = []; // the final position of the nodes
    const newNodes: Node[] = []; // nodes that have not been saved yet previously

    if (savedFlow) {
      // Map positions from saved flow to current nodes
      const savedNodes = savedFlow.nodes;
      dependencyData.nodes.forEach((node) => {
        const savedNode = savedNodes.find((n) => n.id === node.id);
        if (savedNode) {
          nodesWithPositions.push({
            ...node,
            position: savedNode.position,
          });
        } else {
          // If no saved position, add to new nodes
          newNodes.push(node);
        }
      });
    } else {
      // If no saved flow, all nodes are new
      newNodes.push(...dependencyData.nodes);
    }

    // Position new nodes and handle overlaps
    let currentY = -100; // Starting Y position for new nodes
    newNodes.forEach((node) => {
      let nodeY = currentY;
      let hasOverlap = true;

      while (hasOverlap) {
        hasOverlap = false;
        const newPosition = { x: 0, y: nodeY };

        // Check for overlap with existing positioned nodes
        for (const existingNode of nodesWithPositions) {
          const nodeWidth = node.measured?.width ?? 200; // Default width if not measured
          const nodeHeight = node.measured?.height ?? 100; // Default height if not measured
          const existingWidth = existingNode.measured?.width ?? 200;
          const existingHeight = existingNode.measured?.height ?? 100;

          // Check if nodes overlap
          const overlap = !(
            newPosition.x + nodeWidth <= existingNode.position.x ||
            newPosition.x >= existingNode.position.x + existingWidth ||
            newPosition.y + nodeHeight <= existingNode.position.y ||
            newPosition.y >= existingNode.position.y + existingHeight
          );

          if (overlap) {
            hasOverlap = true;
            nodeY -= 100; // Move down by 100 pixels
            break;
          }
        }
      }

      // Add node with calculated position
      nodesWithPositions.push({
        ...node,
        position: { x: 0, y: nodeY },
      });

      currentY = nodeY - 120; // Prepare next Y position with some spacing
    });

    setNodes(nodesWithPositions);

    const updatedEdges = handleEdgeLabelChange(
      dependencyData.edges,
      showEdgeLabels,
    );
    setEdges(updatedEdges);

    // Check if the saved viewport shows any nodes on screen
    if (savedFlow?.viewport && nodesWithPositions.length > 0) {
      const viewport = savedFlow.viewport;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate visible area bounds based on viewport position and zoom
      const visibleLeft = -viewport.x / viewport.zoom;
      const visibleTop = -viewport.y / viewport.zoom;
      const visibleRight = visibleLeft + viewportWidth / viewport.zoom;
      const visibleBottom = visibleTop + viewportHeight / viewport.zoom;

      // Check if any node is visible within the viewport
      const hasVisibleNode = nodesWithPositions.some((node) => {
        const nodeWidth = node.measured?.width ?? 200;
        const nodeHeight = node.measured?.height ?? 100;
        const nodeLeft = node.position.x;
        const nodeTop = node.position.y;
        const nodeRight = nodeLeft + nodeWidth;
        const nodeBottom = nodeTop + nodeHeight;

        // Check if node overlaps with visible area
        return !(
          nodeRight < visibleLeft ||
          nodeLeft > visibleRight ||
          nodeBottom < visibleTop ||
          nodeTop > visibleBottom
        );
      });

      // If no nodes are visible, use fitView to show nodes
      if (!hasVisibleNode) {
        setTimeout(() => {
          void fitView(fitViewOptions);
        }, 0);
      }
    }
  }, [dependencyData, projectId, setViewport, fitView]);

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
    AnyBacklogItemType,
  ];

  // #endregion

  return (
    <div className="h-full w-full">
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
          <Controls fitViewOptions={fitViewOptions} showInteractive={false} />
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
