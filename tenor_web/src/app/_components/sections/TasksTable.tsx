"use client";

import React, { useEffect, useRef, useState } from "react";
import type { TaskPreview } from "~/lib/types/detailSchemas";
import Table, { type TableColumns } from "../table/Table";
import ProfilePicture from "../ProfilePicture";
import PrimaryButton from "../buttons/PrimaryButton";
import CollapsableSearchBar from "../CollapsableSearchBar";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import { SidebarPopup } from "../Popup";
import { CreateTaskForm } from "../tasks/CreateTaskPopup";
import TaskDetailPopup from "../tasks/TaskDetailPopup";
import { api } from "~/trpc/react";
import StatusPicker from "../specific-pickers/StatusPicker";
import { useParams } from "next/navigation";
import { WithId, type Tag } from "~/lib/types/firebaseSchemas";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { TaskCol, tasksRouter } from "~/server/api/routers/tasks";
import { usePopupVisibilityState } from "../Popup";
import AiGeneratorDropdown from "../ai/AiGeneratorDropdown";
import useGhostTableStateManager from "~/app/_hooks/useGhostTableStateManager";
import { inferRouterOutputs } from "@trpc/server";
import LoadingSpinner from "../LoadingSpinner";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesAllUserStories,
} from "~/app/_hooks/invalidateHooks";

interface Props {
  itemId: string;
  itemType: "US" | "IS" | "IT";
  setShowAddTaskPopup: (show: boolean) => void;
  setSelectedTaskId: (taskId: string) => void;
  setShowTaskDetail: (show: boolean) => void;
  setUnsavedTasks?: React.Dispatch<React.SetStateAction<boolean>>;
  taskIdToOpenImmediately?: string;
}

export default function TasksTable({
  setSelectedTaskId,
  setShowTaskDetail,
  itemId,
  itemType,
  setShowAddTaskPopup,
  setUnsavedTasks,
  taskIdToOpenImmediately,
}: Props) {
  const [taskSearchText, setTaskSearchText] = useState("");
  const { projectId } = useParams();
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  const { mutateAsync: deleteTask } = api.tasks.deleteTask.useMutation();

  const {
    data: tasksTableData,
    refetch: refetchTasks,
    isLoading,
  } = api.tasks.getTasksTableFriendly.useQuery({
    projectId: projectId as string,
    itemId,
  });
  const { mutateAsync: changeStatus } =
    api.tasks.changeTaskStatus.useMutation();
  const { mutateAsync: generateTasks } = api.tasks.generateTasks.useMutation();
  const { mutateAsync: createTask } = api.tasks.createTask.useMutation();

  const generatedTasks =
    useRef<
      WithId<inferRouterOutputs<typeof tasksRouter>["generateTasks"][number]>[]
    >();

  const transformedTasks: TaskPreview[] = (tasksTableData ?? []).map(
    (task) => ({
      id: task.id,
      scrumId: task.scrumId,
      name: task.title,
      status: task.status,
      assignee: task.assignee,
    }),
  );

  // Show task detail if taskIdToOpenImmediately is provided
  useEffect(() => {
    if (!taskIdToOpenImmediately) return;
    if (!transformedTasks.some((task) => task.id === taskIdToOpenImmediately))
      return;
    setSelectedTaskId(taskIdToOpenImmediately);
    setShowTaskDetail(true);
  }, [taskIdToOpenImmediately, tasksTableData]);

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
      if (a.scrumId === undefined && b.scrumId === undefined) return 0;
      if (a.scrumId === undefined) return -1;
      if (b.scrumId === undefined) return 1;

      return a.scrumId < b.scrumId ? 1 : -1;
    });

  const formatTaskScrumId = useFormatTaskScrumId();
  const completedTasks = transformedTasks.filter(
    (task) => task.status?.name === "Done",
  ).length;

  const onTaskStatusChange = async (taskId: string, status: Tag) => {
    const updatedTasks = tasksTableData?.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: status,
        };
      }
      return task;
    });

    await utils.tasks.getTasksTableFriendly.cancel({
      projectId: projectId as string,
      itemId,
    });

    utils.tasks.getTasksTableFriendly.setData(
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

    if (itemType === "US") {
      await invalidateQueriesAllUserStories(projectId as string);
    }
  };

  const taskColumns: TableColumns<TaskPreview> = {
    id: { visible: false },
    scrumId: {
      label: "Id",
      width: 100,
      hiddenOnGhost: true,
      render(row) {
        return (
          <button
            className="flex w-full items-center truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
            onClick={() => {
              setSelectedTaskId(row.id);
              setShowTaskDetail(true);
            }}
          >
            {row.scrumId ? (
              formatTaskScrumId(row.scrumId)
            ) : (
              <div className="h-6 w-[calc(100%-40px)] animate-pulse rounded-md bg-slate-500/50"></div>
            )}
          </button>
        );
      },
    },
    name: {
      label: "Title",
      width: 200,
      render(row) {
        return (
          <button
            className="w-full truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
            onClick={() => {
              setSelectedTaskId(row.id);
              setShowTaskDetail(true);
            }}
          >
            {row.name}
          </button>
        );
      },
    },
    status: {
      label: "Status",
      width: 150,
      render(row, _, isGhost) {
        const onGhostTaskStatusChange = (status: Tag) => {
          updateGhostRow(row.id, (oldData) => ({
            ...oldData,
            status: status,
          }));
          generatedTasks.current = generatedTasks.current?.map((task) => {
            if (task.id === row.id) {
              return {
                ...task,
                status: status,
              };
            }
            return task;
          });
        };
        return (
          <StatusPicker
            status={row.status}
            onChange={async (status) => {
              isGhost
                ? onGhostTaskStatusChange(status)
                : onTaskStatusChange(row.id, status);
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
        "This action is not revertible.",
        `Delete ${confirmMessage}`,
      ))
    ) {
      callback(false);
      return;
    }
    callback(true);

    // Optimistic update - filter out deleted tasks
    const newTasks = transformedTasks.filter((task) => !ids.includes(task.id));

    await utils.tasks.getTasksTableFriendly.cancel({
      projectId: projectId as string,
      itemId: itemId,
    });

    const newTransformedTasks = newTasks.map((task) => ({
      id: task.id,
      scrumId: task.scrumId!,
      title: task.name, // name to title
      status: task.status,
      assignee: task.assignee,
    }));

    utils.tasks.getTasksTableFriendly.setData(
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
    await invalidateQueriesAllUserStories(projectId as string);

    return true;
  };

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
        generatedTasks.current?.filter((task) =>
          acceptedIds.includes(task.id),
        ) ?? [];
      const acceptedRows = ghostData?.filter((task) =>
        acceptedIds.includes(task.id),
      );

      await utils.tasks.getTasksTableFriendly.cancel({
        projectId: projectId as string,
        itemId: itemId,
      });

      const generatedTasksPreviews = accepted?.map((task) => ({
        id: task.id,
        scrumId: undefined,
        title: task.name,
        status: task.status,
        assignee: undefined,
      }));

      utils.tasks.getTasksTableFriendly.setData(
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
            assigneeId: "",
            dueDate: null,
          },
        });
      }

      await invalidateQueriesAllTasks(projectId as string, [itemId]);

      if (itemType === "US") {
        await invalidateQueriesAllUserStories(projectId as string);
      }
    },
    (removedIds) => {
      const newGeneratedTasks = generatedTasks.current?.filter(
        (task) => !removedIds.includes(task.id),
      );
      generatedTasks.current = newGeneratedTasks;
      if ((newGeneratedTasks?.length ?? 0) === 0 && setUnsavedTasks)
        setUnsavedTasks(false);
    },
  );

  const handleGenerateTasks = async (amount: number, prompt: string) => {
    beginLoading(amount);
    const generatedData = await generateTasks({
      projectId: projectId as string,
      itemId,
      itemType,
      amount,
      prompt,
    });
    generatedTasks.current = generatedData.map((task, i) => ({
      ...task,
      id: i.toString(),
    }));
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

      <div className="mt-4 w-full max-w-full overflow-hidden">
        {tasksTableData === undefined || isLoading ? (
          <div className="mt-8 flex h-full w-full items-center justify-center">
            <LoadingSpinner color="primary" />
          </div>
        ) : (
          <Table
            tableKey="tasks"
            data={filteredTasks}
            columns={taskColumns}
            className="font-sm max-w-[min(678px,100vw-320px)] overflow-hidden"
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
    </>
  );
}
