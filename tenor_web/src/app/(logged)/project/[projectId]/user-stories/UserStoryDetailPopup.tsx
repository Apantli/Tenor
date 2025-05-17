"use client";

import React, { useEffect, useState } from "react";
import TertiaryButton from "~/app/_components/buttons/TertiaryButton";
import Popup, {
  SidebarPopup,
  usePopupVisibilityState,
} from "~/app/_components/Popup";
import Markdown from "react-markdown";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import DependencyList from "./DependencyList";
import TasksTable, {
  type BacklogItemWithTasks,
} from "~/app/_components/sections/TasksTable";
import { SizePillComponent } from "~/app/_components/specific-pickers/SizePillComponent";
import EpicPicker from "~/app/_components/specific-pickers/EpicPicker";
import PriorityPicker from "~/app/_components/specific-pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import {
  useFormatSprintNumber,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import type { UserStoryDetailWithTasks } from "~/lib/types/detailSchemas";
import { CreateTaskForm } from "~/app/_components/tasks/CreateTaskPopup";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesAllUserStories,
  useInvalidateQueriesUserStoriesDetails,
} from "~/app/_hooks/invalidateHooks";
import AiIcon from "@mui/icons-material/AutoAwesome";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import StatusPicker from "~/app/_components/specific-pickers/StatusPicker";
import ItemAutomaticStatus from "~/app/_components/ItemAutomaticStatus";
import HelpIcon from "@mui/icons-material/Help";

interface Props {
  userStoryId: string;
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;
  setUserStoryId?: (userStoryId: string) => void;
  taskIdToOpenImmediately?: string; // Optional prop to open a specific task detail immediately when the popup opens
  userStoryData?: UserStoryDetailWithTasks;
  setUserStoryData?: (data: UserStoryDetailWithTasks | undefined) => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function UserStoryDetailPopup({
  userStoryId,
  showDetail,
  setShowDetail,
  setUserStoryId,
  taskIdToOpenImmediately,
  userStoryData,
  setUserStoryData,
  onAccept,
  onReject,
}: Props) {
  const { projectId } = useParams();
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const [unsavedTasks, setUnsavedTasks] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const {
    data: fetchedUserStory,
    isLoading,
    refetch,
    error,
  } = api.userStories.getUserStoryDetail.useQuery(
    {
      projectId: projectId as string,
      userStoryId,
    },
    {
      enabled: !userStoryData,
    },
  );

  const userStoryDetail = userStoryData ?? fetchedUserStory;

  const { mutateAsync: updateUserStory } =
    api.userStories.modifyUserStory.useMutation();
  const { mutateAsync: deleteUserStory } =
    api.userStories.deleteUserStory.useMutation();

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    acceptanceCriteria: "",
  });
  const [showAcceptanceCriteria, setShowAcceptanceCriteria] = useState(false);
  const [renderCreateTaskPopup, showCreateTaskPopup, setShowCreateTaskPopup] =
    usePopupVisibilityState();

  const [selectedGhostTaskId, setSelectedGhostTaskId] = useState<string>("");

  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const { predefinedAlerts } = useAlert();
  const formatSprintNumber = useFormatSprintNumber();

  const changeVisibleUserStory = async (userStoryId: string) => {
    setShowDetail(false);
    setTimeout(() => {
      setUserStoryId?.(userStoryId);
      setShowDetail(true);
    }, 300);
  };

  useEffect(() => {
    if (!userStoryDetail) return;
    if (!editMode) {
      // Only update the form when we're not in edit mode
      setEditForm({
        name: userStoryDetail.name,
        description: userStoryDetail.description,
        acceptanceCriteria: userStoryDetail.acceptanceCriteria,
      });
    }
  }, [userStoryDetail, editMode]);

  useEffect(() => {
    if (error) {
      setShowDetail(false);
      predefinedAlerts.unexpectedError();
    }
  }, [error]);

  const isModified = () => {
    if (editForm.name !== userStoryDetail?.name) return true;
    if (editForm.description !== userStoryDetail?.description) return true;
    if (editForm.acceptanceCriteria !== userStoryDetail?.acceptanceCriteria)
      return true;
    return false;
  };

  const handleSave = async (
    updatedData: NonNullable<typeof userStoryDetail>,
    saveEditForm = false,
  ) => {
    const finalData =
      saveEditForm && editMode
        ? {
            ...updatedData,
            name: editForm.name,
            description: editForm.description,
            acceptanceCriteria: editForm.acceptanceCriteria,
          }
        : updatedData;

    // This means we're editing a ghost user story, so it should be treated differently
    if (userStoryData !== undefined) {
      setUserStoryData?.({ ...finalData, tasks: userStoryData.tasks });
      return;
    }

    const updatedUserStory = {
      name: finalData.name,
      description: finalData.description,
      acceptanceCriteria: finalData.acceptanceCriteria,
      tagIds:
        finalData?.tags
          .map((tag) => tag.id)
          .filter((tag) => tag !== undefined) ?? [],
      priorityId: finalData?.priority?.id,
      size: finalData?.size,
      statusId: finalData?.status?.id ?? "",
      epicId: finalData?.epic?.id ?? "",
      sprintId: finalData?.sprint?.id ?? "",
      dependencyIds: finalData?.dependencies.map((us) => us.id) ?? [],
      requiredByIds: finalData?.requiredBy.map((us) => us.id) ?? [],
    };

    // Cancel ongoing queries for this user story data
    await utils.userStories.getUserStoryDetail.cancel({
      projectId: projectId as string,
      userStoryId,
    });

    // Optimistically update the query data
    utils.userStories.getUserStoryDetail.setData(
      {
        projectId: projectId as string,
        userStoryId,
      },
      (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          ...finalData,
        };
      },
    );

    const { updatedUserStoryIds } = await updateUserStory({
      projectId: projectId as string,
      userStoryId: userStoryId,
      userStoryData: updatedUserStory,
    });

    // Make other places refetch the data
    await invalidateQueriesAllUserStories(projectId as string);
    await invalidateQueriesUserStoriesDetails(
      projectId as string,
      updatedUserStoryIds,
    );

    if (!editMode || saveEditForm) {
      await refetch();
    }
  };

  const handleDelete = async () => {
    if (
      await confirm(
        "Are you sure?",
        "This action cannot be undone.",
        "Delete user story",
        "Cancel",
      )
    ) {
      await deleteUserStory({
        projectId: projectId as string,
        userStoryId: userStoryId,
      });
      await invalidateQueriesAllUserStories(projectId as string);
      await invalidateQueriesAllTasks(projectId as string);
      setShowDetail(false);
    }
  };

  const userStoryDataToItemData = (
    userStory: UserStoryDetailWithTasks,
  ): BacklogItemWithTasks => {
    return {
      scrumId: -1,
      name: userStory.name,
      description: userStory.description,
      deleted: false,
      sprintId: "",
      taskIds: [],
      complete: false,
      tagIds: [],
      size: userStory.size ?? "M",
      statusId: userStory.status?.id ?? "",
      priorityId: userStory.priority?.id ?? "",
      tasks: userStoryData?.tasks ?? [],
      extra: userStoryData?.acceptanceCriteria ?? "",
    };
  };

  const showAutomaticDetails = () => {
    return (
      userStoryDetail?.status === undefined || userStoryDetail?.status?.id == ""
    );
  };

  return (
    <Popup
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
        if (unsavedTasks) {
          const confirmation = await confirm(
            "Are you sure?",
            "You have unsaved AI generated tasks. To save them, please accept them first.",
            "Discard",
            "Keep editing",
          );
          if (!confirmation) return;
        }
        setShowDetail(false);
      }}
      size="large"
      sidebarClassName="basis-[210px]"
      sidebar={
        isLoading ? undefined : (
          <>
            {!isLoading && userStoryDetail && (
              <>
                <h3 className="text-lg font-semibold">Epic</h3>
                <EpicPicker
                  epic={userStoryDetail?.epic}
                  onChange={async (epic) => {
                    await handleSave({ ...userStoryDetail, epic });
                  }}
                />

                <div className="mt-4 flex gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Priority</h3>
                    <PriorityPicker
                      priority={userStoryDetail.priority}
                      onChange={async (priority) => {
                        await handleSave({ ...userStoryDetail, priority });
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Size</h3>
                    <SizePillComponent
                      currentSize={userStoryDetail.size}
                      callback={async (size) => {
                        await handleSave({ ...userStoryDetail, size });
                      }}
                    />
                  </div>
                </div>

                {/* Only show if its not a ghost! */}
                {userStoryData === undefined && (
                  <div className="mt-4 flex-1">
                    <div className="flex">
                      <h3 className="text-lg font-semibold">Status</h3>
                      {showAutomaticDetails() && (
                        <HelpIcon
                          className="ml-[3px] text-gray-500"
                          data-tooltip-id="tooltip"
                          data-tooltip-content="A status is assigned based on the progress of all its tasks."
                          data-tooltip-place="top-start"
                          style={{ width: "15px" }}
                        />
                      )}
                    </div>
                    <StatusPicker
                      status={userStoryDetail.status}
                      onChange={async (status) => {
                        await handleSave({ ...userStoryDetail, status });
                      }}
                      showAutomaticStatus={true}
                    />
                    {showAutomaticDetails() && (
                      <ItemAutomaticStatus itemId={userStoryId} />
                    )}
                  </div>
                )}

                <BacklogTagList
                  tags={userStoryDetail.tags}
                  onChange={async (tags) => {
                    await handleSave({ ...userStoryDetail, tags });
                  }}
                />

                <h3 className="mt-4 text-lg">
                  <span className="font-semibold">Sprint: </span>
                  {formatSprintNumber(userStoryDetail.sprint?.number)}
                </h3>

                <DependencyList
                  label="Dependencies"
                  userStoryId={userStoryDetail.id}
                  userStories={userStoryDetail.dependencies}
                  onChange={async (dependencies) => {
                    await handleSave({ ...userStoryDetail, dependencies });
                  }}
                  onClick={changeVisibleUserStory}
                />

                <DependencyList
                  label="Required by"
                  userStoryId={userStoryDetail.id}
                  userStories={userStoryDetail.requiredBy}
                  onChange={async (requiredBy) => {
                    await handleSave({ ...userStoryDetail, requiredBy });
                  }}
                  onClick={changeVisibleUserStory}
                />
              </>
            )}
          </>
        )
      }
      footer={
        !isLoading &&
        (userStoryDetail?.scrumId !== undefined ? (
          <DeleteButton onClick={handleDelete}>Delete story</DeleteButton>
        ) : (
          <div className="flex items-center gap-2">
            <AiIcon
              className="animate-pulse text-app-secondary"
              data-tooltip-id="tooltip"
              data-tooltip-content="This is a generated task. It will not get saved until you accept it."
            />
            <TertiaryButton onClick={onReject}>Reject</TertiaryButton>
            <PrimaryButton
              className="bg-app-secondary hover:bg-app-hover-secondary"
              onClick={onAccept}
            >
              Accept
            </PrimaryButton>
          </div>
        ))
      }
      title={
        <>
          {!isLoading && userStoryDetail && (
            <h1 className="mb-4 items-center text-3xl">
              <span className="font-bold">
                {userStoryDetail.scrumId && (
                  <span className="pr-2">
                    {formatUserStoryScrumId(userStoryDetail.scrumId)}:
                  </span>
                )}
              </span>
              <span className="">{userStoryDetail.name}</span>
            </h1>
          )}
        </>
      }
      editMode={isLoading ? undefined : editMode}
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

        if (!userStoryDetail) return;
        if (!isEditing) {
          const updatedData = {
            ...userStoryDetail,
            name: editForm.name,
            description: editForm.description,
            acceptanceCriteria: editForm.acceptanceCriteria,
          };
          await handleSave(updatedData, true); // Pass true to save the edit form
        }
      }}
      disablePassiveDismiss={editMode || unsavedTasks}
    >
      {editMode && (
        <>
          <InputTextField
            label="Story name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Short summary of the story..."
            containerClassName="mb-4"
          />
          <InputTextAreaField
            label="Story description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Explain the story in detail..."
            className="h-36 min-h-36"
            containerClassName="mb-4"
          />
          <InputTextAreaField
            label="Acceptance Criteria"
            value={editForm.acceptanceCriteria}
            onChange={(e) =>
              setEditForm({ ...editForm, acceptanceCriteria: e.target.value })
            }
            placeholder="Describe the work that needs to be done..."
            className="h-36 min-h-36"
          />
        </>
      )}
      {!editMode && !isLoading && userStoryDetail && (
        <div className="overflow-hidden" ref={scrollContainerRef}>
          <div className="markdown-content overflow-hidden text-lg">
            <Markdown>{userStoryDetail.description}</Markdown>
          </div>

          {userStoryDetail.acceptanceCriteria !== "" && (
            <>
              <div className="mt-4 flex items-center gap-4">
                <h2 className="text-2xl font-semibold">Acceptance Criteria</h2>
                <TertiaryButton
                  onClick={() =>
                    setShowAcceptanceCriteria(!showAcceptanceCriteria)
                  }
                >
                  {showAcceptanceCriteria ? "Hide" : "Show"}
                </TertiaryButton>
              </div>
              {showAcceptanceCriteria && (
                <div className="markdown-content overflow-hidden text-lg">
                  <Markdown>{userStoryDetail.acceptanceCriteria}</Markdown>
                </div>
              )}
            </>
          )}

          <TasksTable
            scrollContainerRef={scrollContainerRef}
            itemId={userStoryId}
            itemType="US"
            fetchedTasks={userStoryDetail.tasks}
            setSelectedGhostTask={setSelectedGhostTaskId}
            setShowAddTaskPopup={setShowCreateTaskPopup}
            selectedGhostTaskId={selectedGhostTaskId}
            setItemData={(data) => {
              if (!data || !userStoryData) return;
              setUserStoryData?.({
                ...userStoryData,
                tasks: data.tasks,
              });
            }}
            setUnsavedTasks={setUnsavedTasks}
            taskIdToOpenImmediately={taskIdToOpenImmediately}
            itemData={
              userStoryData ? userStoryDataToItemData(userStoryData) : undefined
            }
            setTaskData={(tasks) => {
              if (!userStoryData) return;
              setUserStoryData?.({
                ...userStoryData,
                tasks: tasks ?? [],
              });
            }}
            updateTaskData={(taskId, updater) => {
              if (!userStoryData) return;
              const taskIndex = userStoryData.tasks.findIndex(
                (task) => task.id === taskId,
              );
              if (taskIndex === -1) return;
              const updatedTask = updater(userStoryData.tasks[taskIndex]!);
              const updatedTasks = [...userStoryData.tasks];
              updatedTasks[taskIndex] = updatedTask;
              setUserStoryData?.({
                ...userStoryData,
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
        <SidebarPopup
          show={showCreateTaskPopup}
          dismiss={() => setShowCreateTaskPopup(false)}
        >
          <CreateTaskForm
            itemId={userStoryId}
            itemType="US"
            onTaskAdded={() => setShowCreateTaskPopup(false)}
            addTaskToGhost={
              userStoryData !== undefined
                ? (task) => {
                    setUserStoryData?.({
                      ...userStoryData,
                      tasks: [...userStoryData.tasks, task],
                    });
                  }
                : undefined
            }
          />
        </SidebarPopup>
      )}
    </Popup>
  );
}
