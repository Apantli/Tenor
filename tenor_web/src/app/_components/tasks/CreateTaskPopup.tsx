"use client";

import React, { useState } from "react";
import InputTextField from "~/app/_components/inputs/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { DatePicker } from "~/app/_components/DatePicker";
import { type Option, EditableBox } from "~/app/_components/EditableBox/EditableBox";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { SizePillComponent } from "~/app/_components/specific-pickers/SizePillComponent";
import PillComponent from "~/app/_components/PillComponent";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { type Size, type Tag } from "~/lib/types/firebaseSchemas";
import { Timestamp } from "firebase/firestore";

interface Props {
  onTaskAdded?: (taskId: string) => void;
  itemType: "US" | "IS" | "IT";
  itemId: string;
}

export function CreateTaskForm({
  onTaskAdded,
  itemType,
  itemId,
}: Props) {
  const { projectId } = useParams();

  const { data: users, isLoading } = api.users.getUserListEdiBox.useQuery();

  const { mutateAsync: createTask, isPending } = api.tasks.createTask.useMutation();

  const utils = api.useUtils();
  const { alert } = useAlert();

  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    status?: string;
    assignee?: string;
    size?: Size;
    dueDate?: Date;
  }>({
    name: "",
    description: "",
    status: "",
    assignee: "",
    size: undefined,
    dueDate: undefined,
  });

  const [selectedStatus, setSelectedStatus] = useState<Tag | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedAssignee, setSelectedAssignee] = useState<Option | undefined>();

  const statusOptions: Tag[] = [
    { id: "todo", name: "Todo", color: "#6B7280", deleted: false },
    { id: "in-progress", name: "In Progress", color: "#3B82F6", deleted: false },
    { id: "review", name: "Review", color: "#F59E0B", deleted: false },
    { id: "done", name: "Done", color: "#10B981", deleted: false },
  ];

  const people: Option[] = users ?? [];

  const handleCreateTask = async () => {
    if (createForm.name.trim() === "") {
      alert("Oops", "Please enter a name for the task.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    let dueDate: Timestamp | null = null;
    if (selectedDate) {
      dueDate = Timestamp.fromDate(selectedDate);
    }

    const { taskId } = await createTask({
      projectId: projectId as string,
      taskData: {
        name: createForm.name,
        description: createForm.description,
        statusId: selectedStatus?.id ?? "",
        assigneeId: createForm.assignee ?? "",
        size: createForm.size,
        dueDate: dueDate,
        itemId: itemId,
        itemType: itemType,
      },
    });

    if (onTaskAdded) {
      onTaskAdded(taskId);
    }

    await utils.tasks.getTasksTableFriendly.invalidate();
  };

  return (
    <div className="p-2 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>
      <div className="flex flex-col gap-2">
        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Task Name</label>
          <InputTextField
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Enter task name..."
            required
            className="w-full"
          />
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <InputTextAreaField
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            placeholder="Task description"
            className="h-24 min-h-24 w-full"
          />
        </div>

        <div className="flex gap-3 mb-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Status</label>
            <PillComponent
              currentTag={selectedStatus}
              allTags={statusOptions}
              callBack={(status) => {
                setSelectedStatus(status);
                setCreateForm({ ...createForm, status: status.id });
              }}
              labelClassName="w-full"
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
          <EditableBox
            options={people}
            selectedOption={selectedAssignee}
            onChange={(person) => {
              setSelectedAssignee(person ?? undefined);
              setCreateForm({ ...createForm, assignee: person?.id?.toString() ?? undefined });
            }}
            placeholder="Select a person"
            className="w-full"
          />
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium">Due Date</label>
          <DatePicker
            selectedDate={selectedDate}
            onChange={(date) => {
              setSelectedDate(date ?? undefined);
              setCreateForm({ ...createForm, dueDate: date ?? undefined});
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

