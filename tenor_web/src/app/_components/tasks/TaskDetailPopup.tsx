"use client";

import React, { useEffect, useState } from "react";
import TertiaryButton from "~/app/_components/buttons/TertiaryButton";
import Markdown from "react-markdown";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { SizePillComponent } from "~/app/_components/specific-pickers/SizePillComponent";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import { SidebarPopup } from "../Popup";
import { Timestamp } from "firebase/firestore";
import StatusPicker from "../specific-pickers/StatusPicker";
import { UserPicker } from "../specific-pickers/UserPicker";
import { DatePicker } from "../DatePicker";
import LoadingSpinner from "../LoadingSpinner";
import type { TaskDetail, UserPreview } from "~/lib/types/detailSchemas";
import { useInvalidateQueriesAllTasks } from "~/app/_hooks/invalidateHooks";
import PrimaryButton from "../buttons/PrimaryButton";
import AiIcon from "@mui/icons-material/AutoAwesome";
import type { WithId } from "~/lib/types/firebaseSchemas";

interface Props {
  taskId: string;
  itemId: string;
  taskData?: TaskDetail;
  updateTaskData?: (task: TaskDetail) => void;
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;
  isGhost?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function TaskDetailPopup({
  taskId,
  itemId,
  taskData,
  showDetail,
  setShowDetail,
  updateTaskData,
  isGhost,
  onAccept,
  onReject,
}: Props) {
  const { projectId } = useParams();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  const {
    data: fetchedTask,
    isLoading,
    refetch,
    error,
  } = api.tasks.getTaskDetail.useQuery(
    {
      taskId,
      projectId: projectId as string,
    },
    {
      enabled: taskData === undefined,
    },
  );

  const taskDetail = taskData ?? fetchedTask;

  const { mutateAsync: updateTask } = api.tasks.modifyTask.useMutation();
  const { mutateAsync: deleteTask } = api.tasks.deleteTask.useMutation();

  const { data: users } = api.users.getUsers.useQuery({
    projectId: projectId as string,
  });
  const people: WithId<UserPreview>[] = users ?? [];

  const utils = api.useUtils();

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  const formatTaskScrumId = useFormatTaskScrumId();

  const { predefinedAlerts } = useAlert();

  useEffect(() => {
    if (!taskDetail) return;
    setEditForm({
      name: taskDetail.name,
      description: taskDetail.description,
    });
  }, [taskDetail]);

  const confirm = useConfirmation();

  useEffect(() => {
    if (error) {
      setShowDetail(false);
      predefinedAlerts.unexpectedError();
    }
  }, [error]);

  const isModified = () => {
    if (editForm.name !== taskDetail?.name) return true;
    if (editForm.description !== taskDetail?.description) return true;
    return false;
  };

  /* CHECK ASSIGNEE BECAUSE IT IS USER PREVIEW */

  const handleSave = async (updatedData: NonNullable<typeof taskDetail>) => {
    const updatedTask = {
      name: updatedData.name,
      description: updatedData.description,
      status: updatedData.status,
      size: updatedData.size,
      assignee: updatedData.assignee ?? undefined,
      dueDate: updatedData.dueDate,
    };

    if (taskData !== undefined || isGhost) {
      updateTaskData?.({ ...updatedTask, id: taskId, scrumId: -1 });

      return;
    }

    await utils.tasks.getTaskDetail.cancel({
      taskId: taskId,
      projectId: projectId as string,
    });

    utils.tasks.getTaskDetail.setData(
      {
        taskId: taskId,
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return;
        return {
          ...oldData,
          ...updatedTask,
        };
      },
    );

    await updateTask({
      projectId: projectId as string,
      taskId: taskId,
      taskData: {
        name: updatedData.name,
        description: updatedData.description,
        statusId: updatedData.status?.id ?? "",
        size: updatedData.size,
        assigneeId: updatedData.assignee?.id ?? "",
        dueDate: updatedData.dueDate
          ? Timestamp.fromDate(updatedData.dueDate)
          : undefined,
      },
    });

    await invalidateQueriesAllTasks(projectId as string, [itemId]);

    await refetch();
  };

  const handleDelete = async () => {
    if (
      await confirm(
        "Are you sure?",
        "This action cannot be undone.",
        "Delete task",
        "Cancel",
      )
    ) {
      await deleteTask({
        projectId: projectId as string,
        taskId: taskId,
      });

      await invalidateQueriesAllTasks(projectId as string, [itemId]);

      setShowDetail(false);
    }
  };

  return (
    <SidebarPopup
      show={showDetail}
      dismiss={async () => {
        if (editMode && isModified()) {
          const confirmation = await confirm(
            "Are you sure?",
            "Your changes will be discarded.",
            "Discard changes",
            "Keep Editing",
          );
          if (!confirmation) return;
        }
        setShowDetail(false);
      }}
      footer={
        !isLoading &&
        (!isGhost ? (
          <DeleteButton onClick={handleDelete}>Delete task</DeleteButton>
        ) : (
          <div className="flex items-center gap-2">
            <AiIcon
              className="animate-pulse text-app-secondary"
              data-tooltip-id="tooltip"
              data-tooltip-content="This is a generated task. It will not get saved until you accept it."
            />
            <TertiaryButton onClick={onReject}>Reject</TertiaryButton>
            <PrimaryButton
              onClick={onAccept}
              className="bg-app-secondary hover:bg-app-hover-secondary"
            >
              Accept
            </PrimaryButton>
          </div>
        ))
      }
      title={
        <>
          {!isLoading && taskDetail && (
            <h1 className="mb-4 items-center text-3xl">
              <span className="font-bold">
                {formatTaskScrumId(taskDetail.scrumId)}:{" "}
              </span>
              <span>{taskDetail.name}</span>
            </h1>
          )}
        </>
      }
      editMode={isLoading ? undefined : editMode}
      setEditMode={async (isEditing) => {
        setEditMode(isEditing);

        if (!taskDetail) return;
        if (!isEditing) {
          const updatedData = {
            ...taskDetail,
            name: editForm.name,
            description: editForm.description,
          };
          await handleSave(updatedData);
        }
      }}
      disablePassiveDismiss={editMode}
    >
      {editMode && (
        <>
          <InputTextField
            label="Task Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Task Objective"
            containerClassName="mb-4"
          />
          <InputTextAreaField
            label="Notes"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Notes to complete the task"
            containerClassName="mb-4"
          />
        </>
      )}
      {!editMode && !isLoading && taskDetail && (
        <div className="flex flex-col gap-2">
          {taskDetail.description != "" && (
            <div className="mb-2 w-full">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <Markdown>{taskDetail.description}</Markdown>
            </div>
          )}
          <div className="mb-2 flex w-full gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Status</label>
              <StatusPicker
                status={taskDetail.status}
                onChange={async (status) => {
                  await handleSave({ ...taskDetail, status });
                }}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Size</label>
              <SizePillComponent
                currentSize={taskDetail.size}
                callback={async (size) => {
                  await handleSave({ ...taskDetail, size });
                }}
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-sm font-medium">
              Assigned to
            </label>
            <UserPicker
              options={people}
              selectedOption={taskDetail.assignee}
              onChange={async (assignee) => {
                console.log(assignee);
                await handleSave({
                  ...taskDetail,
                  assignee: assignee,
                });
              }}
              placeholder="Select a person"
              className="w-full"
            />
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-sm font-medium">Due Date</label>
            <DatePicker
              selectedDate={taskDetail.dueDate}
              onChange={async (dueDate) => {
                await handleSave({
                  ...taskDetail,
                  dueDate: dueDate ?? undefined,
                });
              }}
              placeholder="Select a due date"
              className="w-full"
            />
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      )}
    </SidebarPopup>
  );
}
