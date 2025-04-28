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
import TasksTable from "~/app/_components/sections/TasksTable";
import { SizePillComponent } from "~/app/_components/specific-pickers/SizePillComponent";
import PriorityPicker from "~/app/_components/specific-pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import {
  useFormatSprintNumber,
  useFormatTaskIssueId,
} from "~/app/_hooks/scrumIdHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import type { TaskPreview } from "~/lib/types/detailSchemas";
import type { Tag } from "~/lib/types/firebaseSchemas";
import { CreateTaskForm } from "~/app/_components/tasks/CreateTaskPopup";
import TaskDetailPopup from "~/app/_components/tasks/TaskDetailPopup";
import UserStoryPicker from "~/app/_components/specific-pickers/UserStoryPicker";

interface Props {
  issueId: string;
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;
  taskIdToOpenImmediately?: string;
}

export default function IssueDetailPopup({
  issueId,
  showDetail,
  setShowDetail,
  taskIdToOpenImmediately,
}: Props) {
  const { projectId } = useParams();

  const {
    data: issueDetail,
    isLoading,
    refetch,
    error,
  } = api.issues.getIssueDetail.useQuery({
    projectId: projectId as string,
    issueId,
  });

  const { mutateAsync: updateIssue } = api.issues.modifyIssue.useMutation();
  const { mutateAsync: deleteIssue } = api.issues.deleteIssue.useMutation();
  const utils = api.useUtils();

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    stepsToRecreate: "",
  });
  const [showStepsToRecreate, setShowStepsToRecreate] = useState(false);
  const [renderCreateTaskPopup, showCreateTaskPopup, setShowCreateTaskPopup] =
    usePopupVisibilityState();
  const [renderTaskDetailPopup, showTaskDetail, setShowTaskDetail] =
    usePopupVisibilityState();

  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(
    undefined,
  );

  const formatIssueScrumId = useFormatTaskIssueId();
  const { predefinedAlerts } = useAlert();
  const formatSprintNumber = useFormatSprintNumber();

  // Copy the editable data from the issue
  useEffect(() => {
    if (!issueDetail) return;
    setEditForm({
      name: issueDetail.name,
      description: issueDetail.description,
      stepsToRecreate: issueDetail.stepsToRecreate,
    });
  }, [issueDetail]);

  const confirm = useConfirmation();

  useEffect(() => {
    if (error) {
      setShowDetail(false);
      predefinedAlerts.unexpectedError();
    }
  }, [error]);

  const isModified = () => {
    if (editForm.name !== issueDetail?.name) return true;
    if (editForm.description !== issueDetail?.description) return true;
    if (editForm.stepsToRecreate !== issueDetail?.stepsToRecreate) return true;
    return false;
  };

  const handleSave = async (updatedData: NonNullable<typeof issueDetail>) => {
    const updatedIssue = {
      name: updatedData.name,
      description: updatedData.description,
      stepsToRecreate: updatedData.stepsToRecreate,
      tagIds:
        updatedData?.tags
          .map((tag) => tag.id)
          .filter((tag) => tag !== undefined) ?? [],
      priorityId: updatedData?.priority?.id,
      size: updatedData?.size,
      relatedUserStoryId: updatedData?.relatedUserStory?.id ?? "",
      sprintId: updatedData?.sprint?.id ?? "",
    };

    // Cancel ongoing queries for this user story data
    await utils.issues.getIssueDetail.cancel({
      projectId: projectId as string,
      issueId,
    });

    // Optimistically update the query data
    utils.issues.getIssueDetail.setData(
      {
        projectId: projectId as string,
        issueId,
      },
      (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          ...updatedData,
        };
      },
    );

    await updateIssue({
      projectId: projectId as string,
      issueId: issueId,
      issueData: updatedIssue,
    });

    await utils.userStories.getAllUserStoryPreviews.invalidate({
      projectId: projectId as string,
    });
    await utils.sprints.getUserStoryPreviewsBySprint.invalidate({
      projectId: projectId as string,
    });

    await utils.issues.getIssuesTableFriendly.invalidate({
      projectId: projectId as string,
    });

    await refetch();
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
      await deleteIssue({
        projectId: projectId as string,
        issueId: issueId,
      });

      await utils.userStories.getAllUserStoryPreviews.invalidate({
        projectId: projectId as string,
      });
      await utils.sprints.getUserStoryPreviewsBySprint.invalidate({
        projectId: projectId as string,
      });
      await utils.issues.getIssuesTableFriendly.invalidate({
        projectId: projectId as string,
      });

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
            {!isLoading && issueDetail && (
              <>
                <h3 className="text-lg font-semibold">User Story</h3>
                <UserStoryPicker
                  userStory={issueDetail?.relatedUserStory}
                  onChange={async (userStory) => {
                    await handleSave({
                      ...issueDetail,
                      relatedUserStory: userStory,
                    });
                  }}
                />

                <div className="mt-4 flex gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Priority</h3>
                    <PriorityPicker
                      priority={issueDetail.priority}
                      onChange={async (priority) => {
                        await handleSave({ ...issueDetail, priority });
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Size</h3>
                    <SizePillComponent
                      currentSize={issueDetail.size}
                      callback={async (size) => {
                        await handleSave({ ...issueDetail, size });
                      }}
                    />
                  </div>
                </div>

                <BacklogTagList
                  tags={issueDetail.tags}
                  onChange={async (tags) => {
                    await handleSave({ ...issueDetail, tags });
                  }}
                />

                <h3 className="mt-4 text-lg">
                  <span className="font-semibold">Sprint: </span>
                  {formatSprintNumber(issueDetail.sprint?.number)}
                </h3>
              </>
            )}
          </>
        )
      }
      footer={
        !isLoading && (
          <DeleteButton onClick={handleDelete}>Delete issue</DeleteButton>
        )
      }
      title={
        <>
          {!isLoading && issueDetail && (
            <h1 className="mb-4 text-3xl">
              <span className="font-bold">
                {formatIssueScrumId(issueDetail.scrumId)}:{" "}
              </span>
              <span>{issueDetail.name}</span>
            </h1>
          )}
        </>
      }
      editMode={isLoading ? undefined : editMode}
      setEditMode={async (isEditing) => {
        setEditMode(isEditing);

        if (!issueDetail) return;
        if (!isEditing) {
          const updatedData = {
            ...issueDetail,
            name: editForm.name,
            description: editForm.description,
            stepsToRecreate: editForm.stepsToRecreate,
          };
          await handleSave(updatedData);
        }
      }}
      disablePassiveDismiss={editMode}
    >
      {editMode && (
        <>
          <InputTextField
            label="Issue name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Short summary of the issue..."
            className="mb-4"
          />
          <InputTextAreaField
            label="Issue description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Explain the issue in detail..."
            className="mb-4 h-36 min-h-36"
          />
          <InputTextAreaField
            label="Steps To Recreate"
            value={editForm.stepsToRecreate}
            onChange={(e) =>
              setEditForm({ ...editForm, stepsToRecreate: e.target.value })
            }
            placeholder="Describe the steps to recreate the issue..."
            className="h-36 min-h-36"
          />
        </>
      )}
      {!editMode && !isLoading && issueDetail && (
        <div className="overflow-hidden">
          <div className="markdown-content overflow-hidden text-lg">
            <Markdown>{issueDetail.description}</Markdown>
          </div>

          {issueDetail.stepsToRecreate !== "" && (
            <>
              <div className="mt-4 flex items-center gap-4">
                <h2 className="text-2xl font-semibold">Steps to Recreate</h2>
                <TertiaryButton
                  onClick={() => setShowStepsToRecreate(!showStepsToRecreate)}
                >
                  {showStepsToRecreate ? "Hide" : "Show"}
                </TertiaryButton>
              </div>
              {showStepsToRecreate && (
                <div className="markdown-content overflow-hidden text-lg">
                  <Markdown>{issueDetail.stepsToRecreate}</Markdown>
                </div>
              )}
            </>
          )}

          <TasksTable
            itemId={issueId}
            itemType="IS"
            setShowAddTaskPopup={setShowCreateTaskPopup}
            setSelectedTaskId={setSelectedTaskId}
            setShowTaskDetail={setShowTaskDetail}
            taskIdToOpenImmediately={taskIdToOpenImmediately}
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
            itemId={issueId}
            itemType="IS"
            onTaskAdded={() => setShowCreateTaskPopup(false)}
          />
        </SidebarPopup>
      )}
      {renderTaskDetailPopup && selectedTaskId && (
        <TaskDetailPopup
          taskId={selectedTaskId}
          itemId={issueId}
          showDetail={showTaskDetail}
          setShowDetail={setShowTaskDetail}
        />
      )}
    </Popup>
  );
}
