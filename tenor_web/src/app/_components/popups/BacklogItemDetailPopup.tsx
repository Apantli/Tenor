"use client";

import React, { useEffect, useState } from "react";
import DeleteButton from "~/app/_components/inputs/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import TertiaryButton from "~/app/_components/inputs/buttons/TertiaryButton";
import Popup, { usePopupVisibilityState } from "~/app/_components/Popup";
import Markdown from "react-markdown";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { SizePicker } from "~/app/_components/inputs/pickers/SizePicker";
import PriorityPicker from "~/app/_components/inputs/pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import {
  useFormatGenericBacklogItemScrumId,
  useFormatTaskScrumId,
} from "~/app/_hooks/scrumIdHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import AiIcon from "@mui/icons-material/AutoAwesome";
import StatusPicker from "~/app/_components/inputs/pickers/StatusPicker";
import ItemAutomaticStatus from "~/app/_components/ItemAutomaticStatus";
import { permissionNumbers } from "~/lib/types/firebaseSchemas";
import { CreateTaskPopup } from "./CreateTaskPopup";
import TasksTable, { type BacklogItemWithTasks } from "../TasksTable";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";
import { automaticTag, isAutomatic } from "~/lib/defaultValues/status";
import { SprintPicker } from "../inputs/pickers/SprintPicker";
import type { BacklogItemFullDetailWithTasks } from "~/lib/types/detailSchemas";
import {
  useInvalidateQueriesAllGenericBacklogItems,
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesGenericBacklogItemDetails,
  useInvalidateQueriesTaskDetails,
} from "~/app/_hooks/invalidateHooks";
import { useGetPermission } from "~/app/_hooks/useGetPermission";

interface Props {
  backlogItemId: string;
  showDetail: boolean;
  setDetailId: (backlogItemId: string) => void;
  taskIdToOpenImmediately?: string; // Optional prop to open a specific task detail immediately when the popup opens
  backlogItemData?: BacklogItemFullDetailWithTasks;
  setBacklogItemData?: (
    data: BacklogItemFullDetailWithTasks | undefined,
  ) => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function BacklogItemDetailPopup({
  backlogItemId,
  showDetail,
  setDetailId,
  taskIdToOpenImmediately,
  backlogItemData,
  setBacklogItemData,
  onAccept,
  onReject,
}: Props) {
  // #region Hooks
  const { projectId } = useParams();
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { predefinedAlerts } = useAlert();
  const permission = useGetPermission({ flags: ["backlog"] });

  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();
  const invalidateQueriesAllBacklogItems =
    useInvalidateQueriesAllGenericBacklogItems();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesGenericBacklogItemDetails =
    useInvalidateQueriesGenericBacklogItemDetails();
  const formatGenericBacklogItemScrumId = useFormatGenericBacklogItemScrumId(
    projectId as string,
  );
  useFormatTaskScrumId(projectId as string); // preload the task format function before the user sees the loading state

  const [unsavedTasks, setUnsavedTasks] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGhostTaskId, setSelectedGhostTaskId] = useState<string>("");
  const [taskToOpen, setTaskToOpen] = useState<string>(
    taskIdToOpenImmediately ?? "",
  );
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  const [renderCreateTaskPopup, showCreateTaskPopup, setShowCreateTaskPopup] =
    usePopupVisibilityState();
  // #endregion

  // #region TRPC
  const { data: automaticStatus } = api.kanban.getItemAutomaticStatus.useQuery({
    projectId: projectId as string,
    itemId: backlogItemId,
  });
  const { mutateAsync: modifyBacklogItem, isPending } =
    api.backlogItems.modifyBacklogItem.useMutation();
  const { mutateAsync: deleteBacklogItem, isPending: isDeleting } =
    api.backlogItems.deleteBacklogItem.useMutation();
  const {
    data: fetchedBacklogItem,
    isLoading,
    refetch,
    error,
  } = api.backlogItems.getBacklogItemDetail.useQuery(
    {
      projectId: projectId as string,
      backlogItemId,
    },
    {
      enabled: !backlogItemData,
    },
  );
  // #endregion

  // #region React
  const backlogItemDetail = backlogItemData ?? fetchedBacklogItem;
  useEffect(() => {
    if (!backlogItemDetail) return;
    if (!editMode) {
      // Only update the form when we're not in edit mode
      setEditForm({
        name: backlogItemDetail.name,
        description: backlogItemDetail.description,
      });
    }
  }, [backlogItemDetail, editMode]);

  useEffect(() => {
    if (error) {
      void dismissPopup();
      predefinedAlerts.unexpectedError();
    }
  }, [error]);

  // #endregion

  // #region Utility

  const isModified = () => {
    if (editForm.name !== backlogItemDetail?.name) return true;
    if (editForm.description !== backlogItemDetail?.description) return true;
    return false;
  };

  const dismissPopup = async () => {
    if (editMode && isModified()) {
      const confirmation = await confirm(
        "Are you sure?",
        "Your changes will be discarded.",
        "Discard changes",
        "Keep Editing",
      );
      if (!confirmation) return;
    }
    if (unsavedTasks) {
      const confirmation = await confirm(
        "Are you sure?",
        "You have unsaved AI generated tasks. To save them, please accept them first.",
        "Discard",
        "Keep editing",
      );
      if (!confirmation) return;
    }
    setDetailId("");
  };

  const handleSave = async (
    updatedData: NonNullable<typeof backlogItemDetail>,
    saveEditForm = false,
  ) => {
    const finalData =
      saveEditForm && editMode
        ? {
            ...updatedData,
            name: editForm.name,
            description: editForm.description,
          }
        : updatedData;

    // This means we're editing a ghost backlog item, so it should be treated differently
    if (backlogItemData !== undefined) {
      setBacklogItemData?.({ ...finalData, tasks: backlogItemData.tasks });
      return;
    }

    const updatedBacklogItem = {
      name: finalData.name,
      description: finalData.description,
      tagIds:
        finalData?.tags
          .map((tag) => tag.id)
          .filter((tag) => tag !== undefined) ?? [],
      priorityId: finalData?.priority?.id,
      size: finalData?.size,
      statusId: finalData?.status?.id ?? "",
      sprintId: finalData?.sprint?.id ?? "",
    };

    // Cancel ongoing queries for this backlog item data
    await utils.backlogItems.getBacklogItemDetail.cancel({
      projectId: projectId as string,
      backlogItemId,
    });

    // Optimistically update the query data
    utils.backlogItems.getBacklogItemDetail.setData(
      {
        projectId: projectId as string,
        backlogItemId,
      },
      (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          ...finalData,
        };
      },
    );

    try {
      const { updatedBacklogItemIds } = await modifyBacklogItem({
        projectId: projectId as string,
        backlogItemId: backlogItemId,
        backlogItemData: updatedBacklogItem,
      });

      // Make other places refetch the data
      await invalidateQueriesAllBacklogItems(projectId as string);
      await invalidateQueriesGenericBacklogItemDetails(
        projectId as string,
        updatedBacklogItemIds,
      );
    } catch {
      predefinedAlerts.unexpectedError();
      await refetch();
      return;
    }

    if (!editMode || saveEditForm) {
      await refetch();
    }
    return;
  };

  const handleDelete = async () => {
    if (
      await confirm(
        "Are you sure?",
        "This action cannot be undone.",
        "Delete backlog item",
        "Cancel",
      )
    ) {
      const { updatedBacklogItemIds, modifiedTaskIds } =
        await deleteBacklogItem({
          projectId: projectId as string,
          backlogItemId: backlogItemId,
        });
      await invalidateQueriesAllBacklogItems(projectId as string);
      await invalidateQueriesAllTasks(projectId as string);
      await invalidateQueriesGenericBacklogItemDetails(
        projectId as string,
        updatedBacklogItemIds, // for example, if you delete a backlog item, all its dependencies will be updated
      );
      // for example, if you delete a backlog item, all its tasks that were related to any of the IT tasks will be updated
      await invalidateQueriesTaskDetails(projectId as string, modifiedTaskIds);
      await dismissPopup();
    }
  };

  const backlogItemDataToItemData = (
    backlogItem: BacklogItemFullDetailWithTasks,
  ): BacklogItemWithTasks => {
    return {
      scrumId: -1,
      name: backlogItem.name,
      description: backlogItem.description,
      deleted: false,
      sprintId: "",
      taskIds: [],
      complete: false,
      tagIds: [],
      size: backlogItem.size ?? "M",
      statusId: backlogItem.status?.id ?? "",
      priorityId: backlogItem.priority?.id ?? "",
      tasks: backlogItemData?.tasks ?? [],
      extra: "",
    };
  };

  const checkTitleLimit = useCharacterLimit("Backlog item title", 80);
  // #endregion

  return (
    <Popup
      scrollRef={scrollContainerRef}
      setSidebarOpen={setSidebarOpen}
      show={showDetail}
      dismiss={dismissPopup}
      size="large"
      sidebarClassName="basis-[210px]"
      sidebar={
        isLoading ? undefined : (
          <>
            {!isLoading && backlogItemDetail && (
              <>
                <h3 className="text-lg font-semibold">Sprint</h3>
                <SprintPicker
                  disabled={permission < permissionNumbers.write}
                  sprint={backlogItemDetail.sprint}
                  onChange={async (sprint) => {
                    await handleSave({ ...backlogItemDetail, sprint });
                  }}
                />

                <div className="mt-4 flex gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Priority</h3>
                    <PriorityPicker
                      disabled={permission < permissionNumbers.write}
                      priority={backlogItemDetail.priority}
                      onChange={async (priority) => {
                        await handleSave({ ...backlogItemDetail, priority });
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Size</h3>
                    <SizePicker
                      disabled={permission < permissionNumbers.write}
                      currentSize={
                        backlogItemDetail.size === ""
                          ? undefined
                          : backlogItemDetail.size
                      }
                      callback={async (size) => {
                        await handleSave({ ...backlogItemDetail, size });
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex-1">
                  <div className="flex">
                    <h3 className="text-lg font-semibold">Status</h3>
                  </div>
                  <StatusPicker
                    disabled={
                      permission < permissionNumbers.write ||
                      isAutomatic(backlogItemDetail.status)
                    }
                    status={
                      isAutomatic(backlogItemDetail.status)
                        ? automaticStatus
                        : backlogItemDetail.status
                    }
                    onChange={async (status) => {
                      await handleSave({ ...backlogItemDetail, status });
                    }}
                  />
                  <ItemAutomaticStatus
                    isAutomatic={isAutomatic(backlogItemDetail.status)}
                    onChange={async (automatic) => {
                      if (automatic) {
                        await handleSave({
                          ...backlogItemDetail,
                          status: automaticTag,
                        });
                      } else {
                        await handleSave({
                          ...backlogItemDetail,
                          status: automaticStatus,
                        });
                      }
                    }}
                  />
                </div>

                <BacklogTagList
                  disabled={permission < permissionNumbers.write}
                  tags={backlogItemDetail.tags}
                  onChange={async (tags) => {
                    await handleSave({ ...backlogItemDetail, tags });
                  }}
                />
              </>
            )}
          </>
        )
      }
      footer={
        !isLoading &&
        permission >= permissionNumbers.write &&
        (backlogItemDetail?.scrumId !== -1 ? (
          <DeleteButton onClick={handleDelete} loading={isDeleting}>
            Delete item
          </DeleteButton>
        ) : (
          <div className="flex items-center gap-2">
            <AiIcon
              className="animate-pulse text-app-secondary"
              data-tooltip-id="tooltip"
              data-tooltip-content="This is a generated task. It will not get saved until you accept it."
            />
            <TertiaryButton
              onClick={async () => {
                if (unsavedTasks) {
                  const confirmation = await confirm(
                    "Are you sure?",
                    "You have unsaved AI generated tasks. By rejecting this item, you will lose them as well.",
                    "Reject item",
                    "Keep editing",
                  );
                  if (!confirmation) return;
                }
                setUnsavedTasks(false);
                onReject?.();
              }}
            >
              Reject
            </TertiaryButton>
            <PrimaryButton
              className="bg-app-secondary hover:bg-app-hover-secondary"
              onClick={async () => {
                if (unsavedTasks) {
                  const confirmation = await confirm(
                    "Are you sure?",
                    "You have unsaved AI generated tasks. To save them, please accept them first.",
                    "Discard tasks",
                    "Keep editing",
                  );
                  if (!confirmation) return;
                }
                setUnsavedTasks(false);
                onAccept?.();
              }}
            >
              Accept
            </PrimaryButton>
          </div>
        ))
      }
      title={
        <>
          {!isLoading && backlogItemDetail && (
            <h1 className="mb-4 items-center text-3xl">
              <span className="font-bold">
                <span className="pr-2">
                  {formatGenericBacklogItemScrumId(backlogItemDetail.scrumId)}:
                </span>
              </span>
              <span className="">{backlogItemDetail.name}</span>
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
      saving={isPending}
      setEditMode={async (isEditing) => {
        if (unsavedTasks) {
          const confirmation = await confirm(
            "Are you sure?",
            "You have unsaved AI generated tasks. To save them, please accept them first.",
            "Discard",
            "Keep editing",
          );
          if (!confirmation) return;
          setUnsavedTasks(false);
        }

        setEditMode(isEditing);

        if (!backlogItemDetail) return;
        if (!isEditing) {
          const updatedData = {
            ...backlogItemDetail,
            name: editForm.name,
            description: editForm.description,
          };
          if (updatedData.name === "") {
            setEditMode(true);
            predefinedAlerts.backlogItemNameError();
            return;
          }
          await handleSave(updatedData, true); // Pass true to save the edit form
        }
      }}
      disablePassiveDismiss={editMode || unsavedTasks}
    >
      {editMode && (
        <>
          <InputTextField
            id="item-name-field"
            label="Item name"
            value={editForm.name}
            onChange={(e) => {
              if (checkTitleLimit(e.target.value)) {
                setEditForm({ ...editForm, name: e.target.value });
              }
            }}
            placeholder="Short summary of the item..."
            containerClassName="mb-4"
          />
          <InputTextAreaField
            id="item-description-field"
            label="Item description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Explain the item in detail..."
            className="h-36 min-h-36"
            containerClassName="mb-4"
          />
        </>
      )}
      {!editMode && !isLoading && backlogItemDetail && (
        <div className="overflow-hidden">
          {backlogItemDetail.description === "" ? (
            <p className="text-lg italic text-gray-500">
              No description provided.
            </p>
          ) : (
            <div className="markdown-content overflow-hidden text-lg">
              <Markdown>{backlogItemDetail.description}</Markdown>
            </div>
          )}

          <TasksTable
            sidebarOpen={sidebarOpen}
            scrollContainerRef={scrollContainerRef}
            itemId={backlogItemId}
            itemType="IT"
            fetchedTasks={backlogItemDetail.tasks}
            setSelectedGhostTask={setSelectedGhostTaskId}
            setShowAddTaskPopup={setShowCreateTaskPopup}
            selectedGhostTaskId={selectedGhostTaskId}
            setItemData={(data) => {
              if (!data || !backlogItemData) return;
              setBacklogItemData?.({
                ...backlogItemData,
                tasks: data.tasks,
              });
            }}
            setUnsavedTasks={setUnsavedTasks}
            taskToOpen={taskToOpen}
            setTaskToOpen={setTaskToOpen}
            itemData={
              backlogItemData
                ? backlogItemDataToItemData(backlogItemData)
                : undefined
            }
            setTaskData={(tasks) => {
              if (!backlogItemData) return;
              setBacklogItemData?.({
                ...backlogItemData,
                tasks: tasks ?? [],
              });
            }}
            updateTaskData={(taskId, updater) => {
              if (!backlogItemData) return;
              const taskIndex = backlogItemData.tasks.findIndex(
                (task) => task.id === taskId,
              );
              if (taskIndex === -1) return;
              const updatedTask = updater(backlogItemData.tasks[taskIndex]!);
              const updatedTasks = [...backlogItemData.tasks];
              updatedTasks[taskIndex] = updatedTask;
              setBacklogItemData?.({
                ...backlogItemData,
                tasks: updatedTasks,
              });
            }}
          />
        </div>
      )}
      {isLoading && (
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      )}

      {renderCreateTaskPopup && (
        <CreateTaskPopup
          itemId={backlogItemId}
          show={showCreateTaskPopup}
          dismiss={() => setShowCreateTaskPopup(false)}
          itemType="IT"
          onTaskAdded={() => setShowCreateTaskPopup(false)}
          addTaskToGhost={
            backlogItemData !== undefined
              ? (task) => {
                  setBacklogItemData?.({
                    ...backlogItemData,
                    tasks: [...backlogItemData.tasks, task],
                  });
                }
              : undefined
          }
        />
      )}
    </Popup>
  );
}
