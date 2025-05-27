"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { SizePicker } from "~/app/_components/specific-pickers/SizePicker";
import PriorityPicker from "~/app/_components/specific-pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import {
  useFormatIssueScrumId,
  useFormatTaskScrumId,
} from "~/app/_hooks/scrumIdHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import { CreateTaskForm } from "~/app/_components/tasks/CreateTaskPopup";
import UserStoryPicker from "~/app/_components/specific-pickers/UserStoryPicker";
import {
  useInvalidateQueriesAllIssues,
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesIssueDetails,
  useInvalidateQueriesTaskDetails,
} from "~/app/_hooks/invalidateHooks";
import StatusPicker from "~/app/_components/specific-pickers/StatusPicker";
import ItemAutomaticStatus from "~/app/_components/ItemAutomaticStatus";
import HelpIcon from "@mui/icons-material/Help";
import {
  permissionNumbers,
  type Permission,
} from "~/lib/types/firebaseSchemas";
import usePersistentState from "~/app/_hooks/usePersistentState";
import { SprintPicker } from "~/app/_components/specific-pickers/SprintPicker";
import { emptyRole } from "~/lib/defaultValues/roles";
import { checkPermissions } from "~/lib/defaultValues/permission";

interface Props {
  issueId: string;
  showDetail: boolean;
  setDetailId: (id: string) => void;
  taskIdToOpenImmediately?: string;
}

export default function IssueDetailPopup({
  issueId,
  showDetail,
  setDetailId,
  taskIdToOpenImmediately,
}: Props) {
  const { projectId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskToOpen, setTaskToOpen] = useState<string>(
    taskIdToOpenImmediately ?? "",
  );

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const { data: sprintsData } = api.sprints.getProjectSprintsOverview.useQuery({
    projectId: projectId as string,
  });

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["issues"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  const {
    data: issueDetail,
    isLoading,
    error,
  } = api.issues.getIssueDetail.useQuery({
    projectId: projectId as string,
    issueId,
  });

  const { mutateAsync: updateIssue } = api.issues.modifyIssue.useMutation();
  const { mutateAsync: deleteIssue, isPending: isDeleting } =
    api.issues.deleteIssue.useMutation();
  const utils = api.useUtils();

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    stepsToRecreate: "",
  });
  const [showStepsToRecreate, setShowStepsToRecreate] = usePersistentState(
    false,
    "stepsToRecreate",
  );
  const [renderCreateTaskPopup, showCreateTaskPopup, setShowCreateTaskPopup] =
    usePopupVisibilityState();

  const [selectedGhostTaskId, setSelectedGhostTaskId] = useState<string>("");
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  const { alert, predefinedAlerts } = useAlert();
  const formatIssueScrumId = useFormatIssueScrumId();
  useFormatTaskScrumId(); // preload the task format function before the user sees the loading state
  const invalidateQueriesAllIssues = useInvalidateQueriesAllIssues();
  const invalidateQueriesIssueDetails = useInvalidateQueriesIssueDetails();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

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
    setDetailId("");
  };

  useEffect(() => {
    if (error) {
      void dismissPopup();
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
      statusId: updatedData?.status?.id,
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

    await invalidateQueriesIssueDetails(projectId as string, [issueId]);
    await invalidateQueriesAllIssues(projectId as string);
  };

  const handleDelete = async () => {
    if (
      await confirm(
        "Are you sure?",
        "This action cannot be undone.",
        "Delete issue",
        "Cancel",
      )
    ) {
      const { modifiedTaskIds: modifiedTaskIdsIs } = await deleteIssue({
        projectId: projectId as string,
        issueId: issueId,
      });

      await invalidateQueriesAllIssues(projectId as string);
      await invalidateQueriesAllTasks(projectId as string);
      await invalidateQueriesTaskDetails(
        projectId as string,
        modifiedTaskIdsIs,
      );

      await dismissPopup();
    }
  };
  const showAutomaticDetails = () => {
    return issueDetail?.status === undefined || issueDetail?.status?.id == "";
  };

  return (
    <Popup
      setSidebarOpen={setSidebarOpen}
      scrollRef={scrollContainerRef}
      show={showDetail}
      dismiss={dismissPopup}
      size="large"
      sidebarClassName="basis-[210px]"
      sidebar={
        isLoading ? undefined : (
          <>
            {!isLoading && issueDetail && (
              <>
                <h3 className="text-lg font-semibold">User Story</h3>
                <UserStoryPicker
                  disabled={permission < permissionNumbers.write}
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
                      disabled={permission < permissionNumbers.write}
                      priority={issueDetail.priority}
                      onChange={async (priority) => {
                        await handleSave({ ...issueDetail, priority });
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Size</h3>
                    <SizePicker
                      disabled={permission < permissionNumbers.write}
                      currentSize={issueDetail.size}
                      callback={async (size) => {
                        await handleSave({ ...issueDetail, size });
                      }}
                    />
                  </div>
                </div>

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
                    disabled={permission < permissionNumbers.write}
                    status={issueDetail.status}
                    onChange={async (status) => {
                      await handleSave({ ...issueDetail, status });
                    }}
                    showAutomaticStatus={true}
                  />
                  {showAutomaticDetails() && (
                    <ItemAutomaticStatus itemId={issueId} />
                  )}
                </div>

                <BacklogTagList
                  disabled={permission < permissionNumbers.write}
                  tags={issueDetail.tags}
                  onChange={async (tags) => {
                    await handleSave({ ...issueDetail, tags });
                  }}
                />

                <h3 className="mt-4 text-lg">
                  <span className="font-semibold">Sprint</span>
                  <SprintPicker
                    disabled={permission < permissionNumbers.write}
                    selectedOption={issueDetail.sprint}
                    options={sprintsData ?? []}
                    onChange={async (sprint) => {
                      await handleSave({ ...issueDetail, sprint });
                    }}
                    placeholder="None"
                    className="w-full"
                  />
                </h3>
              </>
            )}
          </>
        )
      }
      footer={
        !isLoading &&
        permission >= permissionNumbers.write && (
          <DeleteButton onClick={handleDelete} loading={isDeleting}>
            Delete issue
          </DeleteButton>
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
      editMode={
        permission >= permissionNumbers.write
          ? isLoading
            ? undefined
            : editMode
          : undefined
      }
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
          if (updatedData.name === "") {
            setEditMode(true);
            alert("Oops", "Please provide a name for the issue.", {
              type: "error",
              duration: 5000,
            });
            return;
          }
          await handleSave(updatedData);
        }
      }}
      disablePassiveDismiss={editMode}
    >
      {editMode && (
        <div className="flex flex-col gap-4">
          <InputTextField
            id="issue-name-field"
            label="Issue name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Short summary of the issue..."
            containerClassName=""
          />
          <InputTextAreaField
            id="issue-description-field"
            label="Issue description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Explain the issue in detail..."
            containerClassName="min-h-36"
          />
          <InputTextAreaField
            id="issue-steps-field"
            chatPosition="right"
            label="Steps to recreate"
            value={editForm.stepsToRecreate}
            onChange={(e) =>
              setEditForm({ ...editForm, stepsToRecreate: e.target.value })
            }
            placeholder="Describe the steps to recreate the issue..."
            className="min-h-36"
          />
        </div>
      )}
      {!editMode && !isLoading && issueDetail && (
        <div className="overflow-hidden">
          {issueDetail.description === "" ? (
            <p className="text-lg italic text-gray-500">
              No description provided.
            </p>
          ) : (
            <div className="markdown-content overflow-hidden text-lg">
              <Markdown>{issueDetail.description}</Markdown>
            </div>
          )}

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
            sidebarOpen={sidebarOpen}
            scrollContainerRef={scrollContainerRef}
            fetchedTasks={issueDetail.tasks}
            itemId={issueId}
            itemType="IS"
            setSelectedGhostTask={setSelectedGhostTaskId}
            setShowAddTaskPopup={setShowCreateTaskPopup}
            selectedGhostTaskId={selectedGhostTaskId}
            setTaskToOpen={setTaskToOpen}
            taskToOpen={taskToOpen}
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
    </Popup>
  );
}
