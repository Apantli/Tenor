"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SearchBar from "~/app/_components/SearchBar";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import Popup, { usePopupVisibilityState } from "~/app/_components/Popup";
import UserStoryCardColumn from "~/app/_components/cards/UserStoryCardColumn";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/utils";
import SprintCardColumn from "../sprints/SprintCardColumn";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { Timestamp } from "firebase/firestore";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { DatePicker } from "~/app/_components/DatePicker";
import {
  useFormatTaskScrumId,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import type { inferRouterOutputs } from "@trpc/server";
import { useAlert } from "~/app/_hooks/useAlert";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import AssignableCardColumn from "~/app/_components/cards/AssignableCardColumn";
import Dropdown, { DropdownButton } from "~/app/_components/Dropdown";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesAllUserStories,
  useInvalidateQueriesTaskDetails,
} from "~/app/_hooks/invalidateHooks";
import IssueDetailPopup from "../issues/IssueDetailPopup";

export default function TasksKanban() {
  // GENERAL
  const { projectId } = useParams();
  const utils = api.useUtils();
  const formatTaskScrumId = useFormatTaskScrumId();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();

  // TRPC
  const { data: tasksAndColumnsData, isLoading } =
    api.kanban.getTasksForKanban.useQuery({
      projectId: projectId as string,
    });

  const { mutateAsync: changeStatus } =
    api.tasks.changeTaskStatus.useMutation();

  // REACT
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [lastDraggedTaskId, setLastDraggedTaskId] = useState<string | null>(
    null,
  );

  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  // Detail item and parent
  const [detailItemId, setDetaiItemId] = useState("");
  const detailItem = tasksAndColumnsData?.cardTasks[detailItemId];
  const detailItemType = detailItem?.itemType;
  const detailParentItemId = detailItem?.itemId;

  // UTILITY
  let updateOperationsInProgress = 0;

  const handleDragEnd = async (taskId: string, columnId: string) => {
    setLastDraggedTaskId(null);
    if (tasksAndColumnsData == undefined) return;
    if (columnId === tasksAndColumnsData.cardTasks[taskId]?.columnId) return;

    setLastDraggedTaskId(taskId);
    await moveTasksToColumn([taskId], columnId);
  };

  const moveTasksToColumn = async (taskIds: string[], columnId: string) => {
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

  return (
    <>
      <DragDropProvider
        onDragEnd={async (event) => {
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
                  lastDraggedItemId={lastDraggedTaskId}
                  assignSelectionToColumn={assignSelectionToColumn}
                  column={renamedColumn}
                  items={tasksAndColumnsData.cardTasks}
                  key={column.id}
                  selectedItems={selectedTasks}
                  setSelectedItems={setSelectedTasks}
                  setDetailItemId={setDetaiItemId}
                  setShowDetail={setShowDetail}
                  renderCard={(item) => (
                    <ItemCardRender
                      item={item}
                      scrumIdFormatter={formatTaskScrumId}
                    />
                  )}
                  header={
                    <div className="flex flex-col items-start pr-1">
                      <div className="flex w-full justify-between">
                        <h1 className="text-2xl font-medium">{column.name}</h1>
                        <div className="flex gap-2">
                          <button
                            className={cn(
                              "rounded-lg px-1 text-app-text transition",
                              {
                                "text-app-secondary": allSelected,
                              },
                            )}
                            onClick={toggleSelectAll}
                          >
                            {allSelected ? (
                              <CheckNone fontSize="small" />
                            ) : (
                              <CheckAll fontSize="small" />
                            )}
                          </button>
                          <Dropdown label={"• • •"}>
                            <DropdownButton>Edit status</DropdownButton>
                          </Dropdown>
                        </div>
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
          setShowDetail={setShowDetail}
          showDetail={showDetail}
          userStoryId={detailParentItemId}
          taskIdToOpenImmediately={detailItemId}
        />
      )}

      {renderDetail && detailItemType === "IS" && detailParentItemId && (
        <IssueDetailPopup
          setShowDetail={setShowDetail}
          showDetail={showDetail}
          issueId={detailParentItemId}
          taskIdToOpenImmediately={detailItemId}
        />
      )}
    </>
  );
}
