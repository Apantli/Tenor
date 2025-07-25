"use client";

import React, { useContext, useState } from "react";
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
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";
import { PageContext } from "~/app/_hooks/usePageContext";

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
  const { predefinedAlerts } = useAlert();

  const checkTitleLimit = useCharacterLimit("Title", 80);

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
      predefinedAlerts.requirementNameError();
      return;
    }

    if (createForm.requirementType?.id === undefined) {
      predefinedAlerts.requirementTypeError();
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
    } catch {
      predefinedAlerts.requirementNameError();
    } finally {
      setIsSubmitting(false);
    }
  };

  // #region Page Context
  const pageContext = useContext(PageContext);
  const context = {
    ...pageContext,
    pageName: "Requirements",
    popupName: "New Requirement",
    pageDescription: "Manage the requirements for your project",
    "Requirement title Field": createForm.name,
    "Requirement description field": createForm.description,
    "Page instructions":
      "Write the name and description of the requirement considering the context of the project",
  };
  // #endregion

  return (
    <PageContext.Provider value={context}>
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
        className="h-[500px] w-[650px]"
        title={<h1 className="text-2xl font-bold">New Requirement</h1>}
        disablePassiveDismiss={isModified()}
        footer={
          <PrimaryButton
            onClick={async () => {
              await handleCreateRequirement();
            }}
            disabled={isPending || isSubmitting}
            data-cy="create-requirement-button"
          >
            Create Requirement
          </PrimaryButton>
        }
      >
        <div className="wrap-properly pt-4">
          <InputTextField
            id="requirement-title"
            label="Title"
            containerClassName="mb-4"
            value={createForm.name}
            onChange={(e) => {
              if (checkTitleLimit(e.target.value)) {
                setCreateForm({ ...createForm, name: e.target.value });
              }
            }}
            name="name"
            placeholder="Briefly describe the requirement..."
            data-cy="requirement-name-input"
          />
          <InputTextAreaField
            id="requirement-description"
            chatPosition="right"
            label="Description"
            className="min-h-[120px] w-full"
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
    </PageContext.Provider>
  );
}
