"use client";

import React, { useState } from "react";
import Popup from "~/app/_components/Popup";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import type { Tag } from "~/lib/types/firebaseSchemas";
import { useInvalidateQueriesAllRequirements } from "~/app/_hooks/invalidateHooks";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import RequirementTypePicker from "~/app/_components/inputs/pickers/RequirementTypePicker";
import PriorityPicker from "~/app/_components/inputs/pickers/PriorityPicker";
import RequirementFocusPicker from "~/app/_components/inputs/pickers/RequirementFocusPicker";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onRequirementAdded: (requirementId: string) => void;
  defaultRequirementType?: Tag;
}

export default function CreateRequirementPopup({
  showPopup,
  setShowPopup,
  onRequirementAdded,
  defaultRequirementType,
}: Props) {
  const { projectId } = useParams();
  const invalidateAllRequirements = useInvalidateQueriesAllRequirements();

  const { mutateAsync: createOrModifyRequirement, isPending } =
    api.requirements.createOrModifyRequirement.useMutation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    priority?: Tag;
    requirementType?: Tag;
    requirementFocus?: Tag;
  }>({
    name: "",
    description: "",
    priority: undefined,
    requirementType: defaultRequirementType,
    requirementFocus: undefined,
  });

  const confirm = useConfirmation();
  const { alert } = useAlert();

  const isModified = () => {
    if (createForm.name !== "") return true;
    if (createForm.description !== "") return true;
    if (createForm.priority !== undefined) return true;
    if (createForm.requirementType?.id !== defaultRequirementType?.id)
      return true;
    if (createForm.requirementFocus !== undefined) return true;
    return false;
  };

  const handleCreateRequirement = async () => {
    if (!createForm.name) {
      alert("Oops...", "The requirement must have a name.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    if (createForm.requirementType?.id === undefined) {
      alert("Oops...", "The requirement must have a type.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting || isPending) return;

    try {
      setIsSubmitting(true);

      const result = await createOrModifyRequirement({
        projectId: projectId as string,
        requirementData: {
          name: createForm.name,
          description: createForm.description,
          scrumId: -1,
          priorityId: createForm.priority?.id ?? "",
          requirementTypeId: createForm.requirementType.id,
          requirementFocusId: createForm.requirementFocus?.id ?? "",
        },
      });

      onRequirementAdded(result.id ?? "");

      await invalidateAllRequirements(projectId as string);

      // Reset form
      setCreateForm({
        name: "",
        description: "",
        priority: undefined,
        requirementType: defaultRequirementType,
        requirementFocus: undefined,
      });

      // Close the popup
      setShowPopup(false);
    } catch (error) {
      alert("Error", "Failed to create requirement. Please try again.", {
        type: "error",
        duration: 5000,
      });
      console.error("Error creating requirement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popup
      reduceTopPadding
      show={showPopup}
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
      size="small"
      className="h-[500px] max-h-[700px] w-[650px]"
      title={<h1 className="text-2xl font-bold">New Requirement</h1>}
      disablePassiveDismiss={isModified()}
      footer={
        <PrimaryButton
          onClick={async () => {
            if (isModified()) {
              await handleCreateRequirement();
            } else {
              setShowPopup(false);
            }
          }}
          disabled={isPending || isSubmitting}
          data-cy="create-requirement-button"
        >
          Create Requirement
        </PrimaryButton>
      }
    >
      <div className="pt-4">
        <InputTextField
          id="requirement-title"
          label="Title"
          containerClassName="mb-4"
          value={createForm.name}
          onChange={(e) =>
            setCreateForm((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          name="name"
          placeholder="Briefly describe the requirement..."
          data-cy="requirement-name-input"
        />
        <InputTextAreaField
          id="requirement-description"
          chatPosition="right"
          label="Description"
          className="min-h-[120px] w-full resize-none"
          containerClassName="mb-4"
          value={createForm.description}
          onChange={(e) =>
            setCreateForm((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          name="description"
          placeholder="What is this requirement about..."
          data-cy="requirement-description-input"
        />
        <div className="flex w-full gap-2">
          <div className="w-36 space-y-2">
            <label className="font-semibold">Type</label>
            <RequirementTypePicker
              type={createForm.requirementType}
              onChange={(type) => {
                setCreateForm((prev) => ({
                  ...prev,
                  requirementType: type,
                }));
              }}
            />
          </div>
          <div className="w-36 space-y-2">
            <label className="font-semibold">Priority</label>
            <PriorityPicker
              priority={createForm.priority}
              onChange={(priority) => {
                setCreateForm((prev) => ({
                  ...prev,
                  priority: priority,
                }));
              }}
            />
          </div>
          <div className="w-36 space-y-2">
            <label className="font-semibold">Focus</label>
            <RequirementFocusPicker
              focus={createForm.requirementFocus}
              onChange={(focus) => {
                setCreateForm((prev) => ({
                  ...prev,
                  requirementFocus: focus,
                }));
              }}
            />
          </div>
        </div>
      </div>
    </Popup>
  );
}
