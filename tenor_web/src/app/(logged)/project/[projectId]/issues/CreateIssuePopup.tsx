"use client";

import React, { useState } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { useParams } from "next/navigation";
import EpicPicker from "~/app/_components/specific-pickers/EpicPicker";
import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import type { ExistingEpic, UserStoryPreview } from "~/lib/types/detailSchemas";
import PriorityPicker from "~/app/_components/specific-pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import { SizePillComponent } from "~/app/_components/specific-pickers/SizePillComponent";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onIssueAdded: (issueId: string) => void;
}

export default function CreateUserStoryPopup({
  showPopup,
  setShowPopup,
  onIssueAdded,
}: Props) {
  const { projectId } = useParams();

  const { mutateAsync: createIssue, isPending } =
    api.issues.createIssue.useMutation();

  const utils = api.useUtils();

  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    acceptanceCriteria: string;
    tags: Tag[];
    priority?: Tag;
    size?: Size;
    epic?: ExistingEpic;
    dependencies: UserStoryPreview[];
    requiredBy: UserStoryPreview[];
  }>({
    name: "",
    description: "",
    acceptanceCriteria: "",
    tags: [],
    priority: undefined,
    size: undefined,
    epic: undefined,
    dependencies: [],
    requiredBy: [],
  });

  const confirm = useConfirmation();
  const { alert } = useAlert();

  const isModified = () => {
    if (createForm.name !== "") return true;
    if (createForm.description !== "") return true;
    if (createForm.acceptanceCriteria !== "") return true;
    if (createForm.size !== undefined) return true;
    if (createForm.epic !== undefined) return true;
    if (createForm.dependencies.length > 0) return true;
    if (createForm.requiredBy.length > 0) return true;
    if (createForm.tags.length > 0) return true;
    return false;
  };

  const handleCreateIssue = async () => {
    if (createForm.name === "") {
      alert("Oops", "Please enter a name for the Issue.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    const { issueId } = await createIssue({
      projectId: projectId as string,
      issueData: {
        name: createForm.name,
        description: createForm.description,
        // acceptanceCriteria: createForm.acceptanceCriteria,
        tagIds: createForm.tags
          .map((tag) => tag.id)
          .filter((val) => val !== undefined),
        priorityId: createForm.priority?.id,
        size: createForm.size,
        relatedUserStoryId: "", // FIXME
        stepsToRecreate: "", // FIXME
      },
    });
    onIssueAdded(issueId);

    // FIXME
    // await utils.userStories.getUserStoriesTableFriendly.invalidate();
    // await utils.userStories.getAllUserStoryPreviews.invalidate();
    // await utils.sprints.getUserStoryPreviewsBySprint.invalidate();
  };

  return (
    <Popup
      show={showPopup}
      saveText="Create story"
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
          <h3 className="text-lg font-semibold">Epic</h3>
          <EpicPicker
            epic={createForm.epic}
            onChange={(epic) => {
              setCreateForm({ ...createForm, epic });
            }}
          />

          <div className="mt-4 flex gap-2">
            <div className="flex-1 overflow-hidden">
              <h3 className="text-lg font-semibold">Priority</h3>
              <PriorityPicker
                priority={createForm.priority}
                onChange={(priority) =>
                  setCreateForm({ ...createForm, priority })
                }
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="text-lg font-semibold">Size</h3>
              <SizePillComponent
                currentSize={createForm.size}
                callback={(size) => setCreateForm({ ...createForm, size })}
              />
            </div>
          </div>

          <BacklogTagList
            tags={createForm.tags}
            onChange={(tags) => setCreateForm({ ...createForm, tags })}
          />
        </>
      }
      title={
        <h1 className="mb-4 text-3xl">
          <span className="font-bold">Create a user story</span>
        </h1>
      }
      editMode={true}
      setEditMode={async (editMode) => {
        if (!editMode) await handleCreateUserStory();
      }}
      disablePassiveDismiss={isModified()}
    >
      <InputTextField
        label="Story name"
        value={createForm.name}
        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
        placeholder="Short summary of the story..."
        className="mb-4"
      />
      <InputTextAreaField
        label="Story description"
        value={createForm.description}
        onChange={(e) =>
          setCreateForm({ ...createForm, description: e.target.value })
        }
        placeholder="Explain the story in detail..."
        className="mb-4 h-36 min-h-36"
      />
      <InputTextAreaField
        label="Acceptance Criteria"
        value={createForm.acceptanceCriteria}
        onChange={(e) =>
          setCreateForm({ ...createForm, acceptanceCriteria: e.target.value })
        }
        placeholder="Describe the work that needs to be done..."
        className="h-36 min-h-36"
      />
    </Popup>
  );
}
