"use client";

import React, { useContext, useEffect, useState } from "react";
import Popup from "~/app/_components/Popup";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import type { Size, Sprint, Tag, WithId } from "~/lib/types/firebaseSchemas";
import type { UserPreview, UserStoryPreview } from "~/lib/types/detailSchemas";
import PriorityPicker from "~/app/_components/inputs/pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import { SizePicker } from "~/app/_components/inputs/pickers/SizePicker";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import UserStoryPicker from "../inputs/pickers/UserStoryPicker";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";
import { SprintPicker } from "../inputs/pickers/SprintPicker";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import { UserPicker } from "../inputs/pickers/UserPicker";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import MoreInformation from "../helps/MoreInformation";
import { PageContext } from "~/app/_hooks/usePageContext";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onIssueAdded: (issueId: string) => void;
}

export default function CreateIssuePopup({
  showPopup,
  setShowPopup,
  onIssueAdded,
}: Props) {
  const { projectId } = useParams();
  const { user } = useFirebaseAuth();

  const { mutateAsync: createIssue, isPending } =
    api.issues.createIssue.useMutation();

  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    stepsToRecreate: string;
    tags: Tag[];
    priority?: Tag;
    sprint?: WithId<Sprint>;
    size?: Size | "";
    relatedUserStory?: UserStoryPreview;
    reviewer?: WithId<UserPreview>;
  }>({
    name: "",
    description: "",
    stepsToRecreate: "",
    tags: [],
    priority: undefined,
    size: undefined,
    sprint: undefined,
    relatedUserStory: undefined,
    reviewer: user
      ? {
          id: user.uid,
          displayName: user.displayName ?? "",
          email: user.email ?? "",
          photoURL: user.photoURL ?? "",
        }
      : undefined,
  });

  useEffect(() => {
    if (!user) return;
    setCreateForm({
      ...createForm,
      reviewer: {
        id: user.uid,
        displayName: user.displayName ?? "",
        email: user.email ?? "",
        photoURL: user.photoURL ?? "",
      },
    });
  }, [user]);

  const confirm = useConfirmation();
  const { predefinedAlerts } = useAlert();

  const isModified = () => {
    if (createForm.name !== "") return true;
    if (createForm.description !== "") return true;
    if (createForm.stepsToRecreate !== "") return true;
    if (createForm.tags.length > 0) return true;
    if (createForm.priority !== undefined) return true;
    if (createForm.size !== undefined) return true;
    if (createForm.sprint !== undefined) return true;
    if (createForm.relatedUserStory !== undefined) return true;
    if (createForm.reviewer?.id !== user?.uid) return true;
    return false;
  };

  const handleCreateIssue = async () => {
    if (createForm.name === "") {
      predefinedAlerts.issueNameError();
      return;
    }

    if (createForm.reviewer === undefined) {
      predefinedAlerts.issueNoReviewer();
      return;
    }

    const { issueId } = await createIssue({
      projectId: projectId as string,
      issueData: {
        name: createForm.name,
        description: createForm.description,
        tagIds: createForm.tags
          .map((tag) => tag.id)
          .filter((val) => val !== undefined),
        priorityId: createForm.priority?.id ?? "",
        size: createForm.size,
        sprintId: createForm.sprint?.id ?? "",
        relatedUserStoryId: createForm.relatedUserStory?.id ?? "", // FIXME
        stepsToRecreate: createForm.stepsToRecreate, // FIXME
        reviewerId: createForm.reviewer.id,
      },
    });
    onIssueAdded(issueId);

    // Invalidation is done on the parent component
  };

  const checkTitleLimit = useCharacterLimit("Issue name", 80);

  // #region Page Context
  const pageContext = useContext(PageContext);
  const context = {
    ...pageContext,
    pageName: "Issues",
    popupName: "Create an Issue",
    "Issue name Field": createForm.name,
    "Issue description Field": createForm.description,
    "Steps to recreate Field": createForm.stepsToRecreate,
  };
  // #endregion

  return (
    <PageContext.Provider value={context}>
      <Popup
        show={showPopup}
        saveText="Create Issue"
        saving={isPending}
        dismiss={async () => {
          if (isModified()) {
            const confirmation = await confirm(
              "Are you sure?",
              "Your changes will be discarded.",
              "Discard changes",
              "Keep Editing",
            );
            if (!confirmation) return;
          }
          setShowPopup(false);
        }}
        size="large"
        sidebarClassName="basis-[210px]"
        sidebar={
          <>
            <h3 className="text-lg font-semibold">User Story</h3>
            {/* FIMXE User Story Picker */}
            <UserStoryPicker
              userStory={createForm.relatedUserStory}
              onChange={(userStory) => {
                setCreateForm({ ...createForm, relatedUserStory: userStory });
              }}
            />

            <h3 className="mt-4 text-lg font-semibold">Sprint</h3>
            <SprintPicker
              sprintId={createForm.sprint?.id}
              onChange={(sprint) => setCreateForm({ ...createForm, sprint })}
            />

            <div className="mt-4 flex gap-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Priority</h3>
                <PriorityPicker
                  priority={createForm.priority}
                  onChange={(priority) =>
                    setCreateForm({ ...createForm, priority })
                  }
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Size</h3>
                <SizePicker
                  currentSize={
                    createForm.size === "" ? undefined : createForm.size
                  }
                  callback={(size) => setCreateForm({ ...createForm, size })}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center">
              <h3 className="mr-1 text-lg font-semibold">Reviewer</h3>
              <MoreInformation
                size="small"
                label="The reviewer is the only person allowed to modify the status of this issue"
              />
            </div>
            <UserPicker
              className="h-10"
              placeholder="Unassigned"
              onChange={(newUser) =>
                setCreateForm({
                  ...createForm,
                  reviewer: newUser,
                })
              }
              selectedOption={createForm.reviewer}
            />

            <BacklogTagList
              tags={createForm.tags}
              onChange={(tags) => setCreateForm({ ...createForm, tags })}
            />
          </>
        }
        title={
          <h1 className="mb-4 text-3xl">
            <span className="font-bold">Create an issue</span>
          </h1>
        }
        editMode={true}
        setEditMode={async (editMode) => {
          if (!editMode) await handleCreateIssue();
        }}
        disablePassiveDismiss={isModified()}
      >
        <InputTextField
          id="issue-name-field"
          label="Issue name"
          value={createForm.name}
          onChange={(e) => {
            if (checkTitleLimit(e.target.value)) {
              setCreateForm({ ...createForm, name: e.target.value });
            }
          }}
          placeholder="Short summary of the issue..."
          containerClassName="mb-4"
        />
        <InputTextAreaField
          id="issue-description-field"
          label="Issue description"
          value={createForm.description}
          onChange={(e) =>
            setCreateForm({ ...createForm, description: e.target.value })
          }
          placeholder="Explain the issue in detail..."
          className="h-36 min-h-36"
          containerClassName="mb-4"
        />
        <InputTextAreaField
          id="issue-steps-field"
          chatPosition="right"
          label="Steps To Recreate"
          value={createForm.stepsToRecreate}
          onChange={(e) =>
            setCreateForm({ ...createForm, stepsToRecreate: e.target.value })
          }
          placeholder="Describe the steps to recreate the issue..."
          className="h-36 min-h-36"
        />
      </Popup>
    </PageContext.Provider>
  );
}
