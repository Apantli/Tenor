"use client";

import React, { useState } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { generateRandomTagColor } from "~/utils/helpers/colorUtils";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import DropdownColorPicker from "~/app/_components/inputs/DropdownColorPicker";
import { useInvalidateQueriesAllTags } from "~/app/_hooks/invalidateHooks";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onTagAdded: (tagId: string) => void;
  itemTagType: "ReqFocus" | "BacklogTag" | "ReqType";
}

interface TagTypeConfig {
  title: string;
  namePlaceholder: string;
  nameLabel: string;
  colorLabel: string;
  errorEmptyName: string;
  createButtonText: string;
  modalTitle: string;
}

export default function CreateItemTagPopup({
  showPopup,
  setShowPopup,
  onTagAdded,
  itemTagType,
}: Props) {
  const confirm = useConfirmation();
  const invalidateQueriesAllTags = useInvalidateQueriesAllTags();
  const { projectId } = useParams();
  const { alert } = useAlert();
  const utils = api.useUtils();

  const tagTypeConfigs: Record<Props["itemTagType"], TagTypeConfig> = {
    BacklogTag: {
      title: "Create Backlog Tag",
      namePlaceholder: "E.g., 'Bug', 'Feature'...",
      nameLabel: "Tag name",
      colorLabel: "Tag color",
      errorEmptyName: "Please enter a name for the backlog tag.",
      createButtonText: "Create Backlog Tag",
      modalTitle: "Create Tag",
    },
    ReqFocus: {
      title: "Create Requirement Focus",
      namePlaceholder: "E.g., 'Security', 'Performance'...",
      nameLabel: "Focus name",
      colorLabel: "Focus color",
      errorEmptyName: "Please enter a name for the requirement focus.",
      createButtonText: "Create Focus",
      modalTitle: "Create Requirement Focus",
    },
    ReqType: {
      title: "Create Requirement Type",
      namePlaceholder: "E.g., 'Functional', 'Non-functional'...",
      nameLabel: "Type name",
      colorLabel: "Type color",
      errorEmptyName: "Please enter a name for the requirement type.",
      createButtonText: "Create Requirement Type",
      modalTitle: "Create Requirement Type",
    },
  };

  const currentConfig = tagTypeConfigs[itemTagType];

  const [form, setForm] = useState<{
    name: string;
    color: string;
  }>({
    name: "",
    color: generateRandomTagColor(),
  });

  // TRPC Mutations
  const { mutateAsync: createBacklogTag, isPending: creatingBacklogTag } =
    api.settings.createBacklogTag.useMutation();
  const { mutateAsync: createReqTypeTag, isPending: creatingReqTypeTag } =
    api.requirements.createOrModifyRequirementType.useMutation();
  const { mutateAsync: createReqFocusTag, isPending: creatingReqFocusTag } =
    api.requirements.createOrModifyRequirementFocus.useMutation();

  const isLoading = () => {
    switch (itemTagType) {
      case "BacklogTag":
        return creatingBacklogTag;
      case "ReqType":
        return creatingReqTypeTag;
      case "ReqFocus":
        return creatingReqFocusTag;
      default:
        return false;
    }
  };

  // GENERAL
  const isModified = () => {
    return form.name !== "";
  };

  // HANDLES
  const handleDismiss = () => {
    setShowPopup(false);
  };

  const handleCreateTag = async () => {
    if (form.name === "") {
      alert("Oops...", currentConfig.errorEmptyName, {
        type: "error",
        duration: 5000,
      });
      return;
    }

    let existingTags;
    switch (itemTagType) {
      case "BacklogTag":
        existingTags = await utils.settings.getBacklogTags.fetch({
          projectId: projectId as string,
        });
        break;
      case "ReqType":
        existingTags = await utils.requirements.getRequirementTypes.fetch({
          projectId: projectId as string,
        });
        break;
      case "ReqFocus":
        existingTags = await utils.requirements.getRequirementFocuses.fetch({
          projectId: projectId as string,
        });
        break;
    }

    const normalizedName = form.name.toLowerCase().trim();
    const tagAlreadyExists = existingTags?.some(
      (tag) => tag.name.toLowerCase().trim() === normalizedName && !tag.deleted,
    );

    if (tagAlreadyExists) {
      alert(
        "Duplicate Name",
        `A ${itemTagType === "BacklogTag" ? "tag" : itemTagType === "ReqFocus" ? "focus area" : "requirement type"} with this name already exists.`,
        {
          type: "error",
          duration: 5000,
        },
      );
      return;
    }

    const tagData = {
      projectId: projectId as string,
      tagData: {
        name: form.name,
        color: form.color,
        deleted: false,
      },
    };

    let createdTagId = "";

    try {
      switch (itemTagType) {
        case "BacklogTag":
          const backlogResult = await createBacklogTag(tagData);
          createdTagId = backlogResult.id;
          break;
        case "ReqType":
          const reqTypeResult = await createReqTypeTag(tagData);
          createdTagId = reqTypeResult.id;
          break;
        case "ReqFocus":
          const reqFocusResult = await createReqFocusTag(tagData);
          createdTagId = reqFocusResult.id;
          break;
      }

      onTagAdded(createdTagId);

      setShowPopup(false);
      await invalidateQueriesAllTags(projectId as string);

      setForm({
        name: "",
        color: generateRandomTagColor(),
      });
    } catch {
      alert("Error", `Failed to create ${itemTagType}`, {
        type: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Popup
      show={showPopup}
      size="small"
      className="max-h-[400px] min-w-[500px]"
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
        handleDismiss();
      }}
      disablePassiveDismiss={isModified()}
      footer={
        <div className="flex gap-2">
          <PrimaryButton
            loading={isLoading()}
            onClick={async () => {
              if (!isLoading()) await handleCreateTag();
            }}
          >
            {currentConfig.createButtonText}
          </PrimaryButton>
        </div>
      }
      title={
        <>
          <h1 className="mb-4 text-3xl">
            <span className="font-bold">{currentConfig.modalTitle}</span>
          </h1>
        </>
      }
    >
      <div className="flex flex-col justify-start gap-4">
        <InputTextField
          type="text"
          placeholder={currentConfig.namePlaceholder}
          label={currentConfig.nameLabel}
          value={form.name}
          disableAI={true}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <DropdownColorPicker
          value={form.color}
          onChange={(color) => setForm({ ...form, color })}
          label={currentConfig.colorLabel}
        />
      </div>
    </Popup>
  );
}
