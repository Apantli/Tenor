"use client";

import React, { useEffect, useState } from "react";
import { DatePicker } from "~/app/_components/inputs/pickers/DatePicker";
import { UserPicker } from "~/app/_components/inputs/pickers/UserPicker";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { SizePicker } from "~/app/_components/inputs/pickers/SizePicker";
import type {
  StatusTag,
  WithId,
  Size,
  AnyBacklogItemType,
} from "~/lib/types/firebaseSchemas";
import { Timestamp } from "firebase/firestore";
import StatusPicker from "../inputs/pickers/StatusPicker";
import { useInvalidateQueriesAllTasks } from "~/app/_hooks/invalidateHooks";
import type {
  TaskDetail,
  TaskPreview,
  UserPreview,
} from "~/lib/types/detailSchemas";
import { TRPCClientError } from "@trpc/client";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import DependencyListTask from "../inputs/DependencyListTask";
import { SidebarPopup } from "../Popup";

interface Props {
  onTaskAdded?: (taskId: string) => void;
  itemType: AnyBacklogItemType;
  itemId: string;
  addTaskToGhost?: (task: TaskDetail) => void;
  show: boolean;
  dismiss: () => void;
}

export function CreateTaskPopup({
  onTaskAdded,
  itemType,
  itemId,
  addTaskToGhost,
  show,
  dismiss,
}: Props) {
  const { projectId } = useParams();
  const projectIdString = projectId as string;
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  const { mutateAsync: createTask, isPending } =
    api.tasks.createTask.useMutation();
  const { data: todoStatusTag } = api.settings.getTodoTag.useQuery({
    projectId: projectIdString,
  });

  const { predefinedAlerts } = useAlert();

  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    status: StatusTag;
    assigneeId?: string;
    assignee?: WithId<UserPreview>;
    size: Size | "";
    dueDate?: Date;
    dependencies: TaskPreview[];
    requiredBy: TaskPreview[];
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
    size: "",
    dueDate: undefined,
    dependencies: [],
    requiredBy: [],
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

  const handleCreateTask = async () => {
    if (createForm.name.trim() === "") {
      predefinedAlerts.taskNameError();
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
        dependencies: createForm.dependencies,
        requiredBy: createForm.requiredBy,
      });
      onTaskAdded?.(taskId);
      return;
    }

    try {
      const { id: taskId } = await createTask({
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
          dependencyIds: createForm.dependencies.map((task) => task.id),
          requiredByIds: createForm.requiredBy.map((task) => task.id),
        },
      });

      if (onTaskAdded) {
        onTaskAdded(taskId);
      }

      await invalidateQueriesAllTasks(projectIdString, [itemId]);
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.data?.code === "BAD_REQUEST"
      ) {
        predefinedAlerts.cyclicDependency();
        return;
      }
      predefinedAlerts.taskCreateError();
      console.error("Error creating task:", error);
    }
  };

  const checkTitleLimit = useCharacterLimit("Task name", 80);

  return (
    <SidebarPopup
      show={show}
      dismiss={dismiss}
      footer={
        <PrimaryButton
          onClick={handleCreateTask}
          disabled={isPending}
          className="px-6 py-2"
          loading={isPending}
        >
          {isPending ? "Creating..." : "Create Task"}
        </PrimaryButton>
      }
    >
      <div className="max-w-2xl p-2 pt-0">
        <h2 className="mb-4 text-2xl font-semibold">Add New Task</h2>
        <div className="flex h-full flex-col gap-2 overflow-y-hidden">
          <div className="mb-2">
            <label className="mb-1 block text-sm font-medium">Task Name</label>
            <InputTextField
              id="task-name-field"
              value={createForm.name}
              onChange={(e) => {
                if (checkTitleLimit(e.target.value)) {
                  setCreateForm({ ...createForm, name: e.target.value });
                }
              }}
              placeholder="Enter task name..."
              required
              className="w-full"
            />
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <InputTextAreaField
              id="task-description-field"
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
              <SizePicker
                currentSize={
                  createForm.size === "" ? undefined : createForm.size
                }
                callback={(size) => setCreateForm({ ...createForm, size })}
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-sm font-medium">
              Assigned to
            </label>
            <UserPicker
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

          <DependencyListTask
            label="Dependencies"
            tasks={createForm.dependencies}
            onChange={(dependencies) =>
              setCreateForm({ ...createForm, dependencies })
            }
          />
          <DependencyListTask
            label="Required by"
            tasks={createForm.requiredBy}
            onChange={(requiredBy) =>
              setCreateForm({ ...createForm, requiredBy })
            }
          />
        </div>
      </div>
    </SidebarPopup>
  );
}
