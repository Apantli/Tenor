"use client";

import React, { useEffect, useState } from "react";
import InputTextField from "~/app/_components/inputs/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { DatePicker } from "~/app/_components/DatePicker";
import { UserPicker } from "~/app/_components/specific-pickers/UserPicker";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { SizePillComponent } from "~/app/_components/specific-pickers/SizePillComponent";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import type { StatusTag, WithId, Size } from "~/lib/types/firebaseSchemas";
import { Timestamp } from "firebase/firestore";
import StatusPicker from "../specific-pickers/StatusPicker";
import { useInvalidateQueriesAllTasks } from "~/app/_hooks/invalidateHooks";
import type { TaskDetail, UserPreview } from "~/lib/types/detailSchemas";

interface Props {
  onTaskAdded?: (taskId: string) => void;
  itemType: "US" | "IS" | "IT";
  itemId: string;
  addTaskToGhost?: (task: TaskDetail) => void;
}

export function CreateTaskForm({
  onTaskAdded,
  itemType,
  itemId,
  addTaskToGhost,
}: Props) {
  const { projectId } = useParams();
  const projectIdString = projectId as string;
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  const { data: users } = api.users.getUsers.useQuery({
    projectId: projectIdString,
  });

  const { mutateAsync: createTask, isPending } =
    api.tasks.createTask.useMutation();
  const { data: todoStatusTag } = api.settings.getTodoTag.useQuery({
    projectId: projectIdString,
  });

  const { alert } = useAlert();

  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    status: StatusTag;
    assigneeId?: string;
    assignee?: WithId<UserPreview>;
    size?: Size;
    dueDate?: Date;
  }>({
    name: "",
    description: "",
    status: todoStatusTag ?? {
      id: "temp",
      name: "Todo",
      color: "#0737E3",
      deleted: false,
      marksTaskAsDone: false,
      orderIndex: 0,
    },
    assigneeId: "",
    assignee: undefined,
    size: undefined,
    dueDate: undefined,
  });

  // Select a status after the todo status is fetched
  useEffect(() => {
    if (todoStatusTag && createForm.status.id === "temp") {
      setCreateForm((prev) => ({
        ...prev,
        status: todoStatusTag,
      }));
    }
  }, [todoStatusTag]);

  const [selectedAssignee, setSelectedAssignee] = useState<
    WithId<UserPreview> | undefined
  >();
  const people: WithId<UserPreview>[] = users ?? [];

  const handleCreateTask = async () => {
    if (createForm.name.trim() === "") {
      alert("Oops...", "Please enter a name for the task.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    let dueDate: Timestamp | undefined = undefined;
    if (createForm.dueDate) {
      dueDate = Timestamp.fromDate(createForm.dueDate);
    }

    // Check if the task is being added to a ghost
    if (addTaskToGhost) {
      const taskId = crypto.randomUUID();
      addTaskToGhost({
        id: taskId,
        name: createForm.name,
        description: createForm.description,
        status: createForm.status,
        size: createForm.size,
        assignee: createForm.assignee,
        dueDate: createForm.dueDate,
        scrumId: -1,
      });
      onTaskAdded?.(taskId);
      return;
    }

    const { taskId } = await createTask({
      projectId: projectId as string,
      taskData: {
        name: createForm.name,
        description: createForm.description,
        statusId: createForm.status?.id ?? "",
        assigneeId: createForm.assigneeId ?? "",
        size: createForm.size,
        dueDate: dueDate,
        itemId: itemId,
        itemType: itemType,
      },
    });

    if (onTaskAdded) {
      onTaskAdded(taskId);
    }

    await invalidateQueriesAllTasks(projectIdString, [itemId]);
  };

  return (
    <div className="max-w-2xl p-2 pt-0">
      <h2 className="mb-4 text-2xl font-semibold">Add New Task</h2>
      <div className="flex flex-col gap-2">
        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Task Name</label>
          <InputTextField
            value={createForm.name}
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
            placeholder="Enter task name..."
            required
            className="w-full"
          />
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <InputTextAreaField
            value={createForm.description}
            onChange={(e) =>
              setCreateForm({ ...createForm, description: e.target.value })
            }
            placeholder="Task description"
            className="h-24 min-h-24 w-full"
          />
        </div>

        <div className="mb-2 flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Status</label>
            <StatusPicker
              status={createForm.status}
              onChange={(status) => {
                setCreateForm({ ...createForm, status: status });
              }}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Size</label>
            <SizePillComponent
              currentSize={createForm.size}
              callback={(size) => setCreateForm({ ...createForm, size })}
            />
          </div>
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Assigned to</label>
          <UserPicker
            options={people}
            selectedOption={selectedAssignee}
            onChange={(person) => {
              setSelectedAssignee(person ?? undefined);
              setCreateForm({
                ...createForm,
                assigneeId: person?.id?.toString() ?? undefined,
                assignee: {
                  id: person?.id?.toString() ?? "",
                  displayName: person?.displayName ?? "",
                  photoURL: person?.photoURL ?? "",
                  email: "",
                },
              });
            }}
            placeholder="Select a person"
            className="w-full"
          />
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Due Date</label>
          <DatePicker
            selectedDate={createForm.dueDate}
            onChange={(date) => {
              setCreateForm({ ...createForm, dueDate: date ?? undefined });
            }}
            placeholder="Select a due date"
            className="w-full"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <PrimaryButton
            onClick={handleCreateTask}
            disabled={isPending}
            className="px-6 py-2"
          >
            {isPending ? "Creating..." : "Create Task"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
