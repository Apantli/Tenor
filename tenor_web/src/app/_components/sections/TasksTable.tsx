"use client";

import React, { useEffect, useState } from "react";
import type { TaskDetail, TaskPreview } from "~/lib/types/detailSchemas";
import Table, { type TableColumns } from "../table/Table";
import ProfilePicture from "../ProfilePicture";
import PrimaryButton from "../buttons/PrimaryButton";
import CollapsableSearchBar from "../CollapsableSearchBar";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import { api } from "~/trpc/react";
import StatusPicker from "../specific-pickers/StatusPicker";
import { useParams } from "next/navigation";
import type { BacklogItem, StatusTag } from "~/lib/types/firebaseSchemas";
import useConfirmation from "~/app/_hooks/useConfirmation";
import AiGeneratorDropdown from "../ai/AiGeneratorDropdown";
import useGhostTableStateManager from "~/app/_hooks/useGhostTableStateManager";
import LoadingSpinner from "../LoadingSpinner";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesBacklogItems,
  useInvalidateQueriesTaskDetails,
} from "~/app/_hooks/invalidateHooks";
import TagIcon from "@mui/icons-material/Tag";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import { Timestamp } from "firebase/firestore";
import { usePopupVisibilityState } from "../Popup";
import TaskDetailPopup from "../tasks/TaskDetailPopup";
import type { TaskCol } from "~/lib/types/columnTypes";

export type BacklogItemWithTasks = BacklogItem & {
  tasks: TaskDetail[];
  extra: string;
};

interface Props<T extends BacklogItemWithTasks> {
  itemId: string;
  itemType: "US" | "IS" | "IT";
  setShowAddTaskPopup: (show: boolean) => void;
  setSelectedGhostTask: (taskId: string) => void;
  setUnsavedTasks?: React.Dispatch<React.SetStateAction<boolean>>;
  taskIdToOpenImmediately?: string;
  fetchedTasks?: TaskCol[];
  itemData?: T;
  updateTaskData?: (
    taskId: string,
    updater: (oldData: TaskDetail) => TaskDetail,
  ) => void;
  setTaskData?: (data: TaskDetail[] | undefined) => void;
  selectedGhostTaskId?: string;
  setItemData?: (data: T | undefined) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

// TODO: Update this to invalidate for backlog items also
export default function TasksTable<T extends BacklogItemWithTasks>({
  setSelectedGhostTask,
  itemId,
  itemType,
  setShowAddTaskPopup,
  setUnsavedTasks,
  fetchedTasks,
  taskIdToOpenImmediately,
  itemData,
  updateTaskData,
  setTaskData,
  selectedGhostTaskId,
  setItemData,
  scrollContainerRef,
}: Props<T>) {
  const [taskSearchText, setTaskSearchText] = useState("");
  const [taskToOpen, setTaskToOpen] = useState(taskIdToOpenImmediately);
  const { projectId } = useParams();
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const invalidateQueriesBacklogItems = useInvalidateQueriesBacklogItems();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  const [renderTaskDetailPopup, showTaskDetail, setShowTaskDetail] =
    usePopupVisibilityState();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(
    undefined,
  );

  const { mutateAsync: deleteTask } = api.tasks.deleteTask.useMutation();

  const tasksData = itemData?.tasks;

  const { data: todoStatus } = api.tasks.getTodoStatusTag.useQuery({
    projectId: projectId as string,
  });

  const { data: fetchedTasksTable, isLoading } =
    api.tasks.getTaskTable.useQuery(
      {
        projectId: projectId as string,
        itemId,
      },
      {
        enabled: tasksData === undefined,
        initialData: fetchedTasks,
      },
    );
  const { mutateAsync: changeStatus } =
    api.tasks.changeTaskStatus.useMutation();
  const { mutateAsync: generateTasks } = api.tasks.generateTasks.useMutation();
  const { mutateAsync: createTask } = api.tasks.createTask.useMutation();

  const taskDetailToTaskCol = (detail: TaskDetail): TaskCol => ({
    id: detail.id,
    name: detail.name,
    scrumId: detail.scrumId,
    status: detail.status,
    assignee: detail.assignee,
  });

  const tasksTableData =
    tasksData?.map(taskDetailToTaskCol) ?? fetchedTasksTable;

  const transformedTasks: TaskPreview[] = (tasksTableData ?? []).map(
    (task) => ({
      id: task.id,
      scrumId: task.scrumId,
      name: task.name,
      status: task.status,
      assignee: task.assignee,
    }),
  );

  // Show task detail if taskToOpen is provided
  useEffect(() => {
    if (!taskToOpen) return;
    if (!transformedTasks.some((task) => task.id === taskToOpen)) return;
    setSelectedTaskId(taskToOpen);
    setSelectedGhostTask("");
    setShowTaskDetail(true);
    setTaskToOpen(undefined);
  }, [taskToOpen, tasksTableData]);

  const filteredTasks = transformedTasks
    .filter((task) => {
      if (
        taskSearchText !== "" &&
        !task.name.toLowerCase().includes(taskSearchText.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Flipped to show the latest user stories first (also makes AI generated ones appear at the top after getting accepted)
      if (
        (a.scrumId === undefined || a.scrumId === -1) &&
        (b.scrumId === undefined || b.scrumId === -1)
      )
        return 0;
      if (a.scrumId === undefined || a.scrumId === -1) return -1;
      if (b.scrumId === undefined || b.scrumId === -1) return 1;

      return a.scrumId < b.scrumId ? 1 : -1;
    });

  const formatTaskScrumId = useFormatTaskScrumId();
  const completedTasks = transformedTasks.filter(
    (task) => task.status?.marksTaskAsDone,
  ).length;

  const onTaskStatusChange = async (taskId: string, status: StatusTag) => {
    // This is if it's inside a ghost
    if (tasksData !== undefined) {
      updateTaskData?.(taskId, (oldData) => ({
        ...oldData,
        status,
      }));
      return;
    }

    const updatedTasks = tasksTableData?.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: status,
        };
      }
      return task;
    });

    await utils.tasks.getTaskTable.cancel({
      projectId: projectId as string,
      itemId,
    });

    utils.tasks.getTaskTable.setData(
      {
        projectId: projectId as string,
        itemId,
      },
      (oldData) => {
        if (!oldData) return undefined;
        return updatedTasks ?? [];
      },
    );

    await changeStatus({
      taskId,
      projectId: projectId as string,
      statusId: status.id ?? "",
    });

    await invalidateQueriesAllTasks(projectId as string, [itemId]);
    await invalidateQueriesTaskDetails(projectId as string, [taskId]);

    await invalidateQueriesBacklogItems(projectId as string, itemType);
  };

  const taskColumns: TableColumns<TaskPreview> = {
    id: { visible: false },
    scrumId: {
      label: "Id",
      width: 100,
      hiddenOnGhost: true,
      render(row, _, isGhost) {
        return (
          <>
            {tasksData !== undefined && row.scrumId === -1 ? (
              <TagIcon
                className="text-app-text"
                data-tooltip-id="tooltip"
                data-tooltip-html="<b>Why no id?</b><br>This task will be created when the user story gets accepted"
              />
            ) : (
              <button
                className="flex w-full items-center truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
                onClick={() => {
                  if (isGhost) {
                    setSelectedGhostTask(row.id);
                    setSelectedTaskId("");
                  } else {
                    setSelectedTaskId(row.id);
                    setSelectedGhostTask("");
                  }
                  setShowTaskDetail(true);
                }}
              >
                {row.scrumId ? (
                  formatTaskScrumId(row.scrumId)
                ) : (
                  <div className="h-6 w-[calc(100%-40px)] animate-pulse rounded-md bg-slate-500/50"></div>
                )}
              </button>
            )}
          </>
        );
      },
    },
    name: {
      label: "Title",
      width: 200,
      render(row, _, isGhost) {
        return (
          <>
            <button
              className="w-full items-center truncate text-left text-app-text underline-offset-4 hover:text-app-primary hover:underline disabled:animate-pulse disabled:opacity-70 disabled:hover:text-app-text disabled:hover:no-underline"
              onClick={() => {
                if (isGhost) {
                  setSelectedGhostTask(row.id);
                  setSelectedTaskId("");
                } else {
                  setSelectedTaskId(row.id);
                  setSelectedGhostTask("");
                }
                setShowTaskDetail(true);
              }}
              disabled={!tasksData && !isGhost && row.scrumId === undefined}
            >
              {row.name}
            </button>
          </>
        );
      },
    },
    status: {
      label: "Status",
      width: 150,
      render(row, _, isGhost) {
        const onGhostTaskStatusChange = (status: StatusTag) => {
          updateGhostRow(row.id, (oldData) => ({
            ...oldData,
            status: status,
          }));
          setGeneratedTasks((prev) =>
            prev?.map((task) => {
              if (task.id === row.id) {
                return {
                  ...task,
                  status: status,
                };
              }
              return task;
            }),
          );
        };
        return (
          <StatusPicker
            status={row.status}
            onChange={async (status) => {
              if (isGhost) {
                onGhostTaskStatusChange(status);
              } else {
                await onTaskStatusChange(row.id, status);
              }
            }}
            className="w-full"
          />
        );
      },
    },
    assignee: {
      label: "Assignee",
      width: 100,
      render(row) {
        if (!row.assignee) {
          return <div></div>;
        }
        return (
          <div>{row.assignee && <ProfilePicture user={row.assignee} />}</div>
        );
      },
    },
  };

  const handleTaskDelete = async (
    ids: string[],
    callback: (del: boolean) => void,
  ) => {
    const confirmMessage = ids.length > 1 ? "tasks" : "task";
    if (
      !(await confirm(
        `Are you sure you want to delete ${ids.length == 1 ? "this " + confirmMessage : ids.length + " " + confirmMessage}?`,
        "This action is not reversible.",
        `Delete ${confirmMessage}`,
      ))
    ) {
      callback(false);
      return;
    }
    callback(true);

    // This is if it's inside a ghost
    if (tasksData !== undefined) {
      const newData = tasksData?.filter((task) => !ids.includes(task.id));
      setTaskData?.(newData);
      return;
    }

    // Optimistic update - filter out deleted tasks
    const newTasks = transformedTasks.filter((task) => !ids.includes(task.id));

    await utils.tasks.getTaskTable.cancel({
      projectId: projectId as string,
      itemId: itemId,
    });

    const newTransformedTasks = newTasks.map((task) => ({
      id: task.id,
      scrumId: task.scrumId,
      name: task.name,
      status: task.status,
      assignee: task.assignee,
    }));

    utils.tasks.getTaskTable.setData(
      { projectId: projectId as string, itemId: itemId },
      newTransformedTasks,
    );

    await Promise.all(
      ids.map((id) =>
        deleteTask({
          projectId: projectId as string,
          taskId: id,
        }),
      ),
    );

    await invalidateQueriesAllTasks(projectId as string, [itemId]);
    await invalidateQueriesBacklogItems(projectId as string, itemType);

    return true;
  };

  const [generatedTasks, setGeneratedTasks] = useState<TaskDetail[]>();

  const {
    beginLoading,
    finishLoading,
    ghostData,
    ghostRows,
    setGhostRows,
    updateGhostRow,
    generating,
    onAccept,
    onReject,
    onAcceptAll,
    onRejectAll,
  } = useGhostTableStateManager<TaskPreview, string>(
    async (acceptedIds) => {
      const accepted =
        generatedTasks?.filter((task) => acceptedIds.includes(task.id)) ?? [];

      // Ghost user story, so the tasks don't get saved yet
      if (tasksData !== undefined) {
        setTaskData?.([
          ...tasksData,
          ...accepted?.map(
            (task) =>
              ({
                id: crypto.randomUUID(),
                scrumId: -1,
                name: task.name,
                description: task.description,
                status: task.status,
                size: task.size,
                assignee: task.assignee,
                dueDate: task.dueDate,
              }) as TaskDetail,
          ),
        ]);
        return;
      }

      await utils.tasks.getTaskTable.cancel({
        projectId: projectId as string,
        itemId: itemId,
      });

      const generatedTasksPreviews: TaskCol[] = accepted?.map((task) => ({
        id: task.id,
        scrumId: undefined,
        name: task.name,
        status: task.status,
        assignee: task.assignee,
      }));

      utils.tasks.getTaskTable.setData(
        { projectId: projectId as string, itemId: itemId },
        tasksTableData?.concat(generatedTasksPreviews ?? []),
      );

      // Add the tasks to the database
      for (const task of accepted.reverse()) {
        await createTask({
          projectId: projectId as string,
          taskData: {
            name: task.name,
            description: task.description,
            itemId: itemId,
            itemType: itemType,
            size: task.size,
            statusId: task.status.id ?? "",
            assigneeId: task.assignee?.id ?? "",
            dueDate: task.dueDate
              ? Timestamp.fromDate(task.dueDate)
              : undefined,
          },
        });
      }

      await invalidateQueriesAllTasks(projectId as string, [itemId]);

      await invalidateQueriesBacklogItems(projectId as string, itemType);
    },
    (removedIds) => {
      if (!generatedTasks) return;
      const newGeneratedTasks = generatedTasks?.filter(
        (task) => !removedIds.includes(task.id),
      );
      setGeneratedTasks(newGeneratedTasks);
      if ((newGeneratedTasks?.length ?? 0) === 0 && setUnsavedTasks)
        setUnsavedTasks(false);
    },
  );

  const handleGenerateTasks = async (amount: number, prompt: string) => {
    beginLoading(amount);

    let generatedData = undefined;
    if (tasksData === undefined) {
      generatedData = await generateTasks({
        projectId: projectId as string,
        itemId,
        itemType,
        amount,
        prompt,
      });
    } else {
      const tasks =
        itemData?.tasks.map((task) => ({
          id: task.id,
          name: task.name,
          description: task.description,
          statusId: task.status.id ?? "",
          size: task.size,
        })) ?? [];

      generatedData = await generateTasks({
        projectId: projectId as string,
        amount,
        prompt,
        itemType,
        itemDetail: {
          name: itemData?.name ?? "",
          description: itemData?.description ?? "",
          extra: itemData?.extra ?? "",
          size: itemData?.size,
          tagIds: itemData?.tagIds ?? [],
          priorityId: itemData?.priorityId,
          tasks,
        },
      });
    }

    setGeneratedTasks(
      generatedData.map((task, i) => ({
        ...task,
        scrumId: -1,
        id: i.toString(),
        status: task.status ?? todoStatus!,
      })),
    );
    if (setUnsavedTasks) setUnsavedTasks(true);

    const newGhostData = generatedData.map((task, i) => ({
      id: i.toString(),
      scrumId: undefined,
      name: task.name,
      status: task.status,
      assignee: undefined,
    }));
    finishLoading(newGhostData);
  };

  const selectedGhostTask = generatedTasks?.find(
    (task) => task.id === selectedGhostTaskId,
  );

  useNavigationGuard(
    async () => {
      if ((generatedTasks?.length ?? 0) > 0) {
        return !(await confirm(
          "Are you sure?",
          "You have unsaved AI generated tasks. To save them, please accept them first.",
          "Discard",
          "Keep editing",
        ));
      } else if (generating) {
        return !(await confirm(
          "Are you sure?",
          "You are currently generating tasks. If you leave now, the generation will be cancelled.",
          "Discard",
          "Keep editing",
        ));
      }
      return false;
    },
    generating || (generatedTasks?.length ?? 0) > 0,
    "Are you sure you want to leave? You have unsaved AI generated tasks. To save them, please accept them first.",
  );

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Tasks ({completedTasks} / {transformedTasks.length})
        </h2>
        <div className="flex items-center gap-3">
          {transformedTasks.length > 0 && (
            <CollapsableSearchBar
              searchText={taskSearchText}
              setSearchText={setTaskSearchText}
            />
          )}
          <div className="flex items-center gap-1">
            <PrimaryButton onClick={() => setShowAddTaskPopup(true)}>
              + Add task
            </PrimaryButton>
            <AiGeneratorDropdown
              singularLabel="task"
              pluralLabel="tasks"
              disabled={generating}
              onGenerate={handleGenerateTasks}
              alreadyGenerated={(ghostData?.length ?? 0) > 0}
              onAcceptAll={onAcceptAll}
              onRejectAll={onRejectAll}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 w-full max-w-full overflow-x-hidden">
        {tasksTableData === undefined || isLoading ? (
          <div className="mt-8 flex h-full w-full items-center justify-center">
            <LoadingSpinner color="primary" />
          </div>
        ) : (
          <Table
            scrollContainerRef={scrollContainerRef}
            tableKey="tasks"
            data={filteredTasks}
            columns={taskColumns}
            className="font-sm min-y-fit max-w-[min(678px,100vw-320px)]"
            scrollContainerClassName="overflow-y-hidden"
            multiselect
            deletable
            onDelete={handleTaskDelete}
            emptyMessage={
              transformedTasks.length > 0 ? "No tasks found" : "No tasks yet"
            }
            ghostData={ghostData}
            ghostRows={ghostRows}
            setGhostRows={setGhostRows}
            acceptGhosts={onAccept}
            rejectGhosts={onReject}
            ghostLoadingEstimation={5000}
            rowClassName="h-12"
          />
        )}
      </div>

      {renderTaskDetailPopup &&
        (selectedTaskId !== undefined || selectedGhostTaskId !== undefined) && (
          <TaskDetailPopup
            taskId={selectedTaskId ?? selectedGhostTaskId ?? ""}
            itemId={itemId}
            showDetail={showTaskDetail}
            setShowDetail={setShowTaskDetail}
            isGhost={selectedGhostTaskId !== ""}
            closeAllPopupsOnDismiss={taskIdToOpenImmediately !== undefined}
            taskData={
              selectedGhostTask ??
              itemData?.tasks.find((task) => task.id === selectedTaskId)
            }
            updateTaskData={(task) => {
              if (selectedGhostTaskId && selectedGhostTaskId !== "") {
                setGeneratedTasks((prev) =>
                  prev?.map((t) => {
                    if (t.id === selectedGhostTaskId) {
                      return {
                        ...task,
                        id: selectedGhostTaskId,
                      };
                    }
                    return t;
                  }),
                );
                updateGhostRow(selectedGhostTaskId, (_) => ({
                  id: selectedGhostTaskId,
                  name: task.name,
                  status: task.status ?? todoStatus!,
                  scrumId: task.scrumId,
                  assignee: task.assignee,
                }));
              } else if (itemData) {
                const taskIndex = itemData?.tasks.findIndex(
                  (t) => t.id === task.id,
                );
                if (taskIndex === undefined || taskIndex === -1) return;
                const updatedTasks = [...(itemData?.tasks ?? [])];
                updatedTasks[taskIndex] = task;
                setItemData?.({
                  ...itemData,
                  tasks: updatedTasks,
                });
              }
            }}
            onAccept={async () => {
              if (selectedGhostTaskId && selectedGhostTaskId !== "") {
                setShowTaskDetail(false);
                setTimeout(() => setSelectedGhostTask(""), 300);
                await onAccept([selectedGhostTaskId]);
              }
            }}
            onReject={() => {
              if (selectedGhostTaskId && selectedGhostTaskId !== "") {
                setShowTaskDetail(false);
                setTimeout(() => {
                  onReject([selectedGhostTaskId]);
                  setSelectedGhostTask("");
                }, 300);
              }
            }}
          />
        )}
    </>
  );
}
