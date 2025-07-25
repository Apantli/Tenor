"use client";

import React, { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { SizePicker } from "~/app/_components/inputs/pickers/SizePicker";
import { useFormatTaskScrumId } from "~/app/_hooks/scrumIdHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import { SidebarPopup } from "../Popup";
import { Timestamp } from "firebase/firestore";
import StatusPicker from "../inputs/pickers/StatusPicker";
import { UserPicker } from "../inputs/pickers/UserPicker";
import { DatePicker } from "../inputs/pickers/DatePicker";
import LoadingSpinner from "../LoadingSpinner";
import type { TaskDetail } from "~/lib/types/detailSchemas";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesTaskDetails,
} from "~/app/_hooks/invalidateHooks";
import AiIcon from "@mui/icons-material/AutoAwesome";
import {
  permissionNumbers,
  type Permission,
} from "~/lib/types/firebaseSchemas";
import { useSearchParam } from "~/app/_hooks/useSearchParam";
import { TRPCClientError } from "@trpc/client";
import DeleteButton from "~/app/_components/inputs/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import TertiaryButton from "~/app/_components/inputs/buttons/TertiaryButton";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import DependencyListTask from "../inputs/DependencyListTask";
import { emptyRole } from "~/lib/defaultValues/roles";
import { checkPermissions } from "~/lib/defaultValues/permission";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";

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
  closeAllPopupsOnDismiss?: boolean;
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
  closeAllPopupsOnDismiss,
}: Props) {
  const { projectId } = useParams();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

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

  const taskDetail = taskData ?? fetchedTask;

  const { mutateAsync: updateTask } = api.tasks.modifyTask.useMutation();
  const { mutateAsync: deleteTask } = api.tasks.deleteTask.useMutation();

  const utils = api.useUtils();

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  const formatTaskScrumId = useFormatTaskScrumId(projectId as string);

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
      dependencies: updatedData.dependencies ?? [],
      requiredBy: updatedData.requiredBy ?? [],
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

    try {
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
          dependencyIds: updatedData.dependencies.map((task) => task.id),
          requiredByIds: updatedData.requiredBy.map((task) => task.id),
        },
      });

      await invalidateQueriesAllTasks(projectId as string, [itemId]);
      await invalidateQueriesTaskDetails(projectId as string, [taskId]);
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.data?.code === "BAD_REQUEST"
      ) {
        predefinedAlerts.cyclicDependency();
      }
    } finally {
      await refetch();
    }
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
      const { modifiedTaskIds } = await deleteTask({
        projectId: projectId as string,
        taskId: taskId,
      });

      await invalidateQueriesAllTasks(projectId as string, [itemId]);
      await invalidateQueriesTaskDetails(projectId as string, modifiedTaskIds);

      setShowDetail(false);
    }
  };

  const { resetParam } = useSearchParam();

  const checkTitleLimit = useCharacterLimit("Task name", 80);

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
      afterDismissWithCloseButton={
        closeAllPopupsOnDismiss
          ? () => {
              resetParam("ts");
            }
          : undefined
      }
      footer={
        !isLoading &&
        permission >= permissionNumbers.write &&
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
              <span className="wrap-properly">{taskDetail.name}</span>
            </h1>
          )}
        </>
      }
      editMode={
        permission >= permissionNumbers.write
          ? isLoading
            ? undefined
            : editMode
          : undefined
      }
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
            id="task-name-field"
            label="Task Name"
            value={editForm.name}
            onChange={(e) => {
              if (checkTitleLimit(e.target.value)) {
                setEditForm({ ...editForm, name: e.target.value });
              }
            }}
            placeholder="Task Objective"
            containerClassName="mb-4"
          />
          <InputTextAreaField
            id="task-description-field"
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
                disabled={permission < permissionNumbers.write}
                status={taskDetail.status}
                onChange={async (status) => {
                  await handleSave({ ...taskDetail, status });
                }}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Size</label>
              <SizePicker
                disabled={permission < permissionNumbers.write}
                currentSize={
                  taskDetail.size === "" ? undefined : taskDetail.size
                }
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
              disabled={permission < permissionNumbers.write}
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
              disabled={permission < permissionNumbers.write}
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
          <DependencyListTask
            tasks={taskDetail?.dependencies ?? []}
            taskId={taskId}
            onChange={async (dependencies) => {
              await handleSave({ ...taskDetail, dependencies });
            }}
            label="Dependencies"
            // FIXME OPEN TASK DETAIL
            onClick={() => {}}
            disabled={permission < permissionNumbers.write}
          />
          <DependencyListTask
            tasks={taskDetail?.requiredBy ?? []}
            taskId={taskId}
            onChange={async (requiredBy) => {
              await handleSave({ ...taskDetail, requiredBy });
            }}
            label="Required by"
            // FIXME OPEN TASK DETAIL
            onClick={() => {}}
            disabled={permission < permissionNumbers.write}
          />
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
