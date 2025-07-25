"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../../../../_components/popups/UserStoryDetailPopup";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/helpers/utils";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import AssignableCardColumn from "~/app/_components/cards/AssignableCardColumn";
import {
  useInvalidateQueriesAllStatuses,
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesAllUserStories,
  useInvalidateQueriesTaskDetails,
} from "~/app/_hooks/invalidateHooks";
import IssueDetailPopup from "../../../../_components/popups/IssueDetailPopup";
import {
  type Permission,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import useQueryIdForPopup, {
  useQueryId,
} from "~/app/_hooks/useQueryIdForPopup";
import { emptyRole } from "~/lib/defaultValues/roles";
import { checkPermissions } from "~/lib/defaultValues/permission";
import type { AdvancedSearchFilters } from "~/app/_hooks/useAdvancedSearchFilters";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import StatusDetailPopup from "../settings/tags-scrumboard/StatusDetailPopup";
import MoveLeftIcon from "@mui/icons-material/ArrowBackIos";
import MoveRightIcon from "@mui/icons-material/ArrowForwardIos";
import EditIcon from "@mui/icons-material/EditOutlined";
import BacklogItemDetailPopup from "~/app/_components/popups/BacklogItemDetailPopup";

interface Props {
  filter: string;
  advancedFilters: AdvancedSearchFilters;
}

export default function TasksKanban({ filter, advancedFilters }: Props) {
  // GENERAL
  const { projectId } = useParams();
  const utils = api.useUtils();
  const formatTaskScrumId = useFormatTaskScrumId(projectId as string);
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();
  const invalidateQueriesAllStatuses = useInvalidateQueriesAllStatuses();

  // TRPC
  const { data: tasksAndColumnsData, isLoading } =
    api.kanban.getTasksForKanban.useQuery({
      projectId: projectId as string,
    });
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

  const { mutateAsync: changeStatus } = api.tasks.changeTaskStatus.useMutation({
    onSuccess: async () => {
      await utils.projects.getProjectStatus.invalidate({
        projectId: projectId as string,
      }); // <-- Invalidate all tasks
    },
  });
  const { mutateAsync: reorderStatus } =
    api.settings.reorderStatusTypes.useMutation();

  // REACT
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [lastDraggedTaskId, setLastDraggedTaskId] = useState<string | null>(
    null,
  );

  const [forcedDetailParentUserStoryId, setForcedDetailParentUserStoryId] =
    useQueryId("id");

  const [renderStatusPopup, showStatusPopup, setShowStatusPopup] =
    usePopupVisibilityState();
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>();
  const [statusEditMode, setStatusEditMode] = useState(false);

  const [
    renderDetail,
    showDetail,
    detailItemId,
    setDetailItemId,
    setShowDetail,
  ] = useQueryIdForPopup("ts");
  // Detail item and parent
  const detailItem =
    detailItemId !== ""
      ? tasksAndColumnsData?.cardTasks[detailItemId]
      : undefined;
  const detailItemType = forcedDetailParentUserStoryId
    ? "US"
    : detailItem?.itemType;
  const detailParentItemId =
    forcedDetailParentUserStoryId ?? detailItem?.itemId;

  useEffect(() => {
    if (forcedDetailParentUserStoryId) {
      setShowDetail(true);
    }
  }, [forcedDetailParentUserStoryId]);

  // UTILITY
  let updateOperationsInProgress = 0;

  const handleDragEnd = async (taskId: string, columnId: string) => {
    setLastDraggedTaskId(null);
    if (tasksAndColumnsData == undefined) return;
    // Ensure the task exists and the column is different
    const taskBeingDragged = tasksAndColumnsData.cardTasks[taskId];
    if (!taskBeingDragged || columnId === taskBeingDragged.columnId) return;

    await moveTasksToColumn([taskId], columnId, true);
  };

  const moveTasksToColumn = async (
    taskIds: string[],
    columnId: string,
    dragAndDrop = false,
  ) => {
    if (tasksAndColumnsData == undefined) return;
    updateOperationsInProgress += 1;
    const cardTasks = tasksAndColumnsData.cardTasks;
    await utils.kanban.getTasksForKanban.cancel({
      projectId: projectId as string,
    });

    utils.kanban.getTasksForKanban.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return undefined;

        const sortByScrumId = (a: string, b: string) => {
          const taskA = cardTasks[a];
          const taskB = cardTasks[b];
          return (taskA?.scrumId ?? 0) - (taskB?.scrumId ?? 0);
        };

        const columns = oldData.columns.map((column) => {
          if (column.id === columnId) {
            const sortedTaskIds = [...column.taskIds, ...taskIds].sort(
              sortByScrumId,
            );
            return {
              ...column,
              taskIds: sortedTaskIds,
            };
          } else {
            return {
              ...column,
              taskIds: column.taskIds.filter(
                (taskId) => !taskIds.includes(taskId),
              ),
            };
          }
        });

        const updatedTasks = Object.fromEntries(
          Object.entries(oldData.cardTasks).map(([id, task]) => {
            if (taskIds.includes(id)) {
              return [
                id,
                {
                  ...task,
                  columnId: columnId,
                },
              ];
            }
            return [id, task];
          }),
        );

        return {
          columns,
          cardTasks: updatedTasks,
        };
      },
    );

    // Set lastDraggedTaskId AFTER optimistic update, only if a single task was moved (typical for drag-and-drop)
    if (dragAndDrop) {
      if (taskIds.length === 1) {
        setLastDraggedTaskId(taskIds[0] ?? null);
      } else {
        // If multiple tasks are moved (e.g., batch assign), clear any single-item highlight
        setLastDraggedTaskId(null);
      }
    }

    setSelectedTasks(new Set());

    await Promise.all(
      taskIds.map(async (taskId) => {
        await changeStatus({
          projectId: projectId as string,
          taskId: taskId,
          statusId: columnId,
        });
      }),
    );

    if (updateOperationsInProgress == 1) {
      if (dragAndDrop) {
        setTimeout(() => {
          setLastDraggedTaskId(null);
        }, 1500);
      }
      const uniqueItemIds = taskIds.reduce<Set<string>>((acc, taskId) => {
        const itemId = tasksAndColumnsData.cardTasks[taskId]?.itemId;
        if (itemId) {
          acc.add(itemId);
        }
        return acc;
      }, new Set<string>());
      const itemIds = Array.from(uniqueItemIds);
      await invalidateQueriesAllTasks(projectId as string, itemIds);
      await invalidateQueriesTaskDetails(projectId as string, taskIds);
      await invalidateQueriesAllUserStories(projectId as string);
    }

    updateOperationsInProgress--;
  };

  const assignSelectionToColumn = async (columnId: string) => {
    setLastDraggedTaskId(null);
    if (tasksAndColumnsData == undefined) return;

    const taskIds = Array.from(selectedTasks);
    if (taskIds.length === 0) return;

    await moveTasksToColumn(taskIds, columnId);
  };

  const moveStatus = async (statusId: string, dir: 1 | -1) => {
    const statuses = tasksAndColumnsData?.columns;
    if (!statuses) return;

    const statusIndex = statuses.findIndex((status) => status.id === statusId);
    const newIndex = statusIndex + dir;

    if (newIndex < 0 || newIndex >= statuses.length) return;

    // Swap statusIndex and newIndex;
    const otherStatus = statuses[newIndex]!;
    statuses[newIndex] = statuses[statusIndex]!;
    statuses[statusIndex] = otherStatus;

    await utils.kanban.getTasksForKanban.cancel({
      projectId: projectId as string,
    });

    utils.kanban.getTasksForKanban.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          cardTasks: oldData.cardTasks,
          columns: statuses.map((status, index) => ({
            ...status,
            orderIndex: index,
          })),
        };
      },
    );

    await reorderStatus({
      projectId: projectId as string,
      statusIds: statuses.map((status) => status.id),
    });

    await invalidateQueriesAllStatuses(projectId as string);
  };

  return (
    <>
      <DragDropProvider
        onDragEnd={async (event) => {
          if (permission < permissionNumbers.write) return;
          const { operation, canceled } = event;
          const { source, target } = operation;

          if (!source || canceled || !target) {
            return;
          }

          await handleDragEnd(source.id as string, target.id as string);
        }}
      >
        <div className="flex h-full grow flex-col overflow-x-hidden">
          <div className="flex h-full w-full flex-1 gap-4 overflow-x-auto">
            {isLoading && (
              <div className="flex h-full w-full items-center justify-center">
                <LoadingSpinner color="primary" />
              </div>
            )}
            {tasksAndColumnsData?.columns.map((column) => {
              const allSelected =
                column.taskIds.length > 0 &&
                column.taskIds.every((taskId) => selectedTasks.has(taskId));

              const toggleSelectAll = () => {
                const newSelection = new Set(selectedTasks);
                if (allSelected) {
                  column.taskIds.forEach((taskId) => {
                    newSelection.delete(taskId);
                  });
                } else {
                  column.taskIds.forEach((taskId) => {
                    newSelection.add(taskId);
                  });
                }
                setSelectedTasks(newSelection);
              };

              const renamedColumn = {
                ...column,
                itemIds: column.taskIds,
              };

              return (
                <AssignableCardColumn
                  filter={filter}
                  advancedFilters={advancedFilters}
                  disabled={permission < permissionNumbers.write}
                  lastDraggedItemId={lastDraggedTaskId}
                  assignSelectionToColumn={assignSelectionToColumn}
                  column={renamedColumn}
                  items={tasksAndColumnsData.cardTasks}
                  key={column.id}
                  selectedItems={selectedTasks}
                  setSelectedItems={setSelectedTasks}
                  setDetailItemId={setDetailItemId}
                  renderCard={(item) => (
                    <ItemCardRender
                      disabled={permission < permissionNumbers.write}
                      item={item}
                      scrumIdFormatter={formatTaskScrumId}
                    />
                  )}
                  header={
                    <div className="flex flex-col items-start pr-1">
                      <div className="flex w-full justify-between gap-2">
                        <div className="flex flex-1 items-center gap-3 overflow-hidden">
                          <div
                            className="h-5 w-5 shrink-0 rounded-full"
                            style={{
                              borderColor: `${column.color}90`,
                              borderWidth: "1.4px",
                              backgroundColor: `${column.color}3E`,
                            }}
                          ></div>
                          <h1 className="flex-1 truncate text-xl font-medium">
                            {column.name}
                          </h1>
                        </div>
                        {permission >= permissionNumbers.write && (
                          <div className="flex shrink-0 gap-1">
                            <button
                              className={cn(
                                "rounded-lg px-1 text-app-text transition hover:text-app-primary",
                                {
                                  "text-app-secondary": allSelected,
                                },
                              )}
                              onClick={toggleSelectAll}
                              data-tooltip-id="tooltip"
                              data-tooltip-content="Toggle select all"
                              data-tooltip-delay-show={500}
                            >
                              {allSelected ? (
                                <CheckNone fontSize="medium" />
                              ) : (
                                <CheckAll fontSize="medium" />
                              )}
                            </button>
                            <button
                              className="rounded-lg px-1 text-app-text transition hover:text-app-primary"
                              onClick={() => {
                                setShowStatusPopup(true);
                                setSelectedStatusId(column.id);
                              }}
                              data-tooltip-id="tooltip"
                              data-tooltip-content="Edit status"
                              data-tooltip-delay-show={500}
                            >
                              <EditIcon fontSize="medium" />
                            </button>
                            <div className="ml-2 flex gap-0">
                              {column.orderIndex != 0 && (
                                <button
                                  className="rounded-lg text-app-text transition hover:text-app-primary"
                                  onClick={() => moveStatus(column.id, -1)}
                                  data-tooltip-id="tooltip"
                                  data-tooltip-content="Move left"
                                  data-tooltip-delay-show={500}
                                >
                                  <MoveLeftIcon fontSize="small" />
                                </button>
                              )}
                              {column.orderIndex !==
                                tasksAndColumnsData.columns.length - 1 && (
                                <button
                                  className="rounded-lg text-app-text transition hover:text-app-primary"
                                  onClick={() => moveStatus(column.id, 1)}
                                  data-tooltip-id="tooltip"
                                  data-tooltip-content="Move right"
                                  data-tooltip-delay-show={500}
                                >
                                  <MoveRightIcon fontSize="small" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <hr className="my-2 w-full border border-app-border" />
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {(source) => {
            const taskId = source.id as string;
            if (!taskId) return null;
            const draggingTask = tasksAndColumnsData?.cardTasks[taskId];
            if (!draggingTask) return null;
            return (
              <ItemCardRender
                item={draggingTask}
                showBackground={true}
                scrumIdFormatter={formatTaskScrumId}
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>

      {renderDetail && detailItemType === "US" && detailParentItemId && (
        <UserStoryDetailPopup
          setUserStoryId={(newId) => {
            if (newId === "") {
              setDetailItemId("");
              if (forcedDetailParentUserStoryId) {
                setShowDetail(false);
                setTimeout(() => {
                  setForcedDetailParentUserStoryId("");
                }, 500);
              }
            } else {
              // User wants to open a new user story (like by clicking on a link in the dependency list)
              setForcedDetailParentUserStoryId(newId);
            }
          }}
          showDetail={showDetail}
          userStoryId={detailParentItemId}
          taskIdToOpenImmediately={detailItemId}
        />
      )}

      {renderDetail && detailItemType === "IS" && detailParentItemId && (
        <IssueDetailPopup
          setDetailId={setDetailItemId}
          showDetail={showDetail}
          issueId={detailParentItemId}
          taskIdToOpenImmediately={detailItemId}
        />
      )}

      {renderDetail && detailItemType === "IT" && detailParentItemId && (
        <BacklogItemDetailPopup
          setDetailId={setDetailItemId}
          showDetail={showDetail}
          backlogItemId={detailParentItemId}
          taskIdToOpenImmediately={detailItemId}
        />
      )}

      {renderStatusPopup && selectedStatusId && (
        <StatusDetailPopup
          editMode={statusEditMode}
          setEditMode={setStatusEditMode}
          setShowPopup={(show) => {
            if (!show) {
              setTimeout(() => setStatusEditMode(false), 200);
            }
            setShowStatusPopup(show);
          }}
          showPopup={showStatusPopup}
          statusId={selectedStatusId}
        />
      )}
    </>
  );
}
