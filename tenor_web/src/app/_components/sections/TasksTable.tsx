"use client";

import React, { useState } from "react";
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
import { type Tag } from "~/lib/types/firebaseSchemas";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { TaskCol } from "~/server/api/routers/tasks";
import { usePopupVisibilityState } from "../Popup";

interface Props {
  tasks: TaskPreview[];
  itemId: string;
  itemType: "US" | "IS" | "IT";
  onTaskStatusChange: (taskId: string, statusId: Tag) => void;
  setShowAddTaskPopup: (show: boolean) => void;
  setSelectedTaskId: (taskId: string) => void;
  setShowTaskDetail: (show: boolean) => void;
}

export default function TasksTable({
  tasks,
  setSelectedTaskId,
  setShowTaskDetail,
  itemId,
  setShowAddTaskPopup,
  onTaskStatusChange,
}: Props) {
  const [taskSearchText, setTaskSearchText] = useState("");
  // Estado para el TaskDetailPopup

  const { projectId } = useParams();
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { mutateAsync: deleteTask } = api.tasks.deleteTask.useMutation();

  const filteredTasks = tasks.filter((task) => {
    if (
      taskSearchText !== "" &&
      !task.name.toLowerCase().includes(taskSearchText.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const formatTaskScrumId = useFormatTaskScrumId();

  const completedTasks = tasks.filter(
    (task) => task.status?.name === "Done",
  ).length;

  const taskColumns: TableColumns<TaskPreview> = {
    id: { visible: false },
    scrumId: {
      label: "Id",
      width: 100,
      render(row) {
        return (
          <button
            className="text-left underline-offset-4 hover:text-app-primary hover:underline"
            onClick={() => {
              setSelectedTaskId(row.id);
              setShowTaskDetail(true);
            }}
          >
            {formatTaskScrumId(row.scrumId)}
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
      render(row) {
        return (
          <StatusPicker
            status={row.status}
            onChange={async (status) => {
              onTaskStatusChange(row.id, status);
            }}
            className="w-32"
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
    const newTasks = tasks.filter((task) => !ids.includes(task.id));

    await utils.tasks.getTasksTableFriendly.cancel({
      projectId: projectId as string,
      itemId: itemId,
    });

    const transformedTasks = newTasks.map((task) => ({
      id: task.id,
      scrumId: task.scrumId,
      title: task.name, // name to title
      status: task.status,
      assignee: task.assignee,
    }));

    utils.tasks.getTasksTableFriendly.setData(
      { projectId: projectId as string, itemId: itemId },
      transformedTasks,
    );

    await Promise.all(
      ids.map((id) =>
        deleteTask({
          projectId: projectId as string,
          taskId: id,
        }),
      ),
    );

    await utils.tasks.getTasksTableFriendly.invalidate({
      projectId: projectId as string,
      itemId: itemId,
    });

    return true;
  };

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Tasks ({completedTasks} / {tasks.length})
        </h2>
        <div className="flex items-center gap-3">
          {tasks.length > 0 && (
            <CollapsableSearchBar
              searchText={taskSearchText}
              setSearchText={setTaskSearchText}
            />
          )}
          <PrimaryButton onClick={() => setShowAddTaskPopup(true)}>
            + Add task
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-4 w-full max-w-full">
        <Table
          data={filteredTasks}
          columns={taskColumns}
          className="font-sm w-full table-fixed overflow-visible"
          multiselect
          deletable
          onDelete={handleTaskDelete}
          emptyMessage={tasks.length > 0 ? "No tasks found" : "No tasks yet"}
        />
      </div>
    </>
  );
}
