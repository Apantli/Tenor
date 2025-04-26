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
import TasksTable from "~/app/_components/sections/TasksTable";
import { SizePillComponent } from "~/app/_components/specific-pickers/SizePillComponent";
import EpicPicker from "~/app/_components/specific-pickers/EpicPicker";
import PriorityPicker from "~/app/_components/specific-pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import {
  useFormatSprintNumber,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import type { TaskPreview } from "~/lib/types/detailSchemas";
import type { Tag } from "~/lib/types/firebaseSchemas";
import { CreateTaskForm } from "~/app/_components/tasks/CreateTaskPopup";
import TaskDetailPopup from "~/app/_components/tasks/TaskDetailPopup";
import { useInvalidateQueriesAllTasks, useInvalidateQueriesAllUserStories } from "~/app/_hooks/invalidateHooks";

interface Props {
  userStoryId: string;
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;
  taskIdToOpenImmediately?: string; // Optional prop to open a specific task detail immediately when the popup opens
}

export default function UserStoryDetailPopup({
  userStoryId,
  showDetail,
  setShowDetail,
  taskIdToOpenImmediately,
}: Props) {
  const { projectId } = useParams();
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();

  const {
    data: userStoryDetail,
    isLoading,
    refetch,
    error,
  } = api.userStories.getUserStoryDetail.useQuery({
    projectId: projectId as string,
    userStoryId,
  });

  const { data: tasksTableData } = api.tasks.getTasksTableFriendly.useQuery(
    {
      projectId: projectId as string,
      itemId: userStoryId,
    },
    {
      enabled: showDetail,
    },
  );

  const transformedTasks: TaskPreview[] = (tasksTableData ?? []).map(
    (task) => ({
      id: task.id,
      scrumId: task.scrumId,
      name: task.title,
      status: task.status,
      assignee: task.assignee,
    }),
  );

  const { mutateAsync: updateUserStory } =
    api.userStories.modifyUserStory.useMutation();
  const { mutateAsync: deleteUserStory } =
    api.userStories.deleteUserStory.useMutation();
  const { mutateAsync: changeStatus } =
    api.tasks.changeTaskStatus.useMutation();

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    acceptanceCriteria: "",
  });
  const [showAcceptanceCriteria, setShowAcceptanceCriteria] = useState(false);
  const [renderCreateTaskPopup, showCreateTaskPopup, setShowCreateTaskPopup] =
    usePopupVisibilityState();

  const [renderTaskDetailPopup, showTaskDetail, setShowTaskDetail] =
    usePopupVisibilityState();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(
    undefined,
  );

  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const { predefinedAlerts } = useAlert();
  const formatSprintNumber = useFormatSprintNumber();

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

  // Show task detail if taskIdToOpenImmediately is provided
  useEffect(() => {
    if (!taskIdToOpenImmediately) return;
    if (!transformedTasks.some((task) => task.id === taskIdToOpenImmediately)) return;
    setSelectedTaskId(taskIdToOpenImmediately);
    setShowTaskDetail(true);
  }, [taskIdToOpenImmediately, tasksTableData]);

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

    await updateUserStory({
      projectId: projectId as string,
      userStoryId: userStoryId,
      userStoryData: updatedUserStory,
    });

    // Make other places refetch the data
    await invalidateQueriesAllUserStories(projectId as string);

    if (!editMode || saveEditForm) {
      await refetch();
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: Tag) => {
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
      itemId: userStoryId,
    });

    utils.tasks.getTasksTableFriendly.setData(
      {
        projectId: projectId as string,
        itemId: userStoryId,
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

    await invalidateQueriesAllTasks(projectId as string);
    await invalidateQueriesAllUserStories(projectId as string);
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
      setShowDetail(false);
    }
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
                />

                <DependencyList
                  label="Required by"
                  userStoryId={userStoryDetail.id}
                  userStories={userStoryDetail.requiredBy}
                  onChange={async (requiredBy) => {
                    await handleSave({ ...userStoryDetail, requiredBy });
                  }}
                />
              </>
            )}
          </>
        )
      }
      footer={
        !isLoading && (
          <DeleteButton onClick={handleDelete}>Delete story</DeleteButton>
        )
      }
      title={
        <>
          {!isLoading && userStoryDetail && (
            <h1 className="mb-4 text-3xl">
              <span className="font-bold">
                {formatUserStoryScrumId(userStoryDetail.scrumId)}:{" "}
              </span>
              <span>{userStoryDetail.name}</span>
            </h1>
          )}
        </>
      }
      editMode={isLoading ? undefined : editMode}
      setEditMode={async (isEditing) => {
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
      disablePassiveDismiss={editMode}
    >
      {editMode && (
        <>
          <InputTextField
            label="Story name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Short summary of the story..."
            className="mb-4"
          />
          <InputTextAreaField
            label="Story description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Explain the story in detail..."
            className="mb-4 h-36 min-h-36"
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
        <div className="overflow-hidden">
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
            tasks={transformedTasks ?? []}
            itemId={userStoryId}
            itemType="US"
            onTaskStatusChange={handleTaskStatusChange}
            setShowAddTaskPopup={setShowCreateTaskPopup}
            setSelectedTaskId={setSelectedTaskId}
            setShowTaskDetail={setShowTaskDetail}
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
          />
        </SidebarPopup>
      )}
      {renderTaskDetailPopup && selectedTaskId && (
        <TaskDetailPopup
          taskId={selectedTaskId}
          itemId={userStoryId}
          showDetail={showTaskDetail}
          setShowDetail={setShowTaskDetail}
        />
      )}
    </Popup>
  );
}
