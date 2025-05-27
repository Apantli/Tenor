"use client";

import React, { useState } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { useParams } from "next/navigation";
import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import type { UserStoryPreview } from "~/lib/types/detailSchemas";
import PriorityPicker from "~/app/_components/specific-pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import { SizePillComponent } from "~/app/_components/specific-pickers/SizePillComponent";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import UserStoryPicker from "~/app/_components/specific-pickers/UserStoryPicker";

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

  const { mutateAsync: createIssue, isPending } =
    api.issues.createIssue.useMutation();

  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    stepsToRecreate: string;
    tags: Tag[];
    priority?: Tag;
    size?: Size;
    relatedUserStory?: UserStoryPreview;
  }>({
    name: "",
    description: "",
    stepsToRecreate: "",
    tags: [],
    priority: undefined,
    size: undefined,
    relatedUserStory: undefined,
  });

  const confirm = useConfirmation();
  const { alert } = useAlert();

  const isModified = () => {
    if (createForm.name !== "") return true;
    if (createForm.description !== "") return true;
    if (createForm.stepsToRecreate !== "") return true;
    if (createForm.tags.length > 0) return true;
    if (createForm.priority !== undefined) return true;
    if (createForm.size !== undefined) return true;
    if (createForm.relatedUserStory !== undefined) return true;
    return false;
  };

  const handleCreateIssue = async () => {
    if (createForm.name === "") {
      alert("Oops...", "Please enter a name for the Issue.", {
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
        tagIds: createForm.tags
          .map((tag) => tag.id)
          .filter((val) => val !== undefined),
        priorityId: createForm.priority?.id ?? "",
        size: createForm.size,
        relatedUserStoryId: createForm.relatedUserStory?.id ?? "", // FIXME
        stepsToRecreate: createForm.stepsToRecreate, // FIXME
      },
    });
    onIssueAdded(issueId);

    // Invalidation is done on the parent component
  };

  return (
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
        label="Issue name"
        value={createForm.name}
        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
        placeholder="Short summary of the issue..."
        containerClassName="mb-4"
      />
      <InputTextAreaField
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
  );
}
