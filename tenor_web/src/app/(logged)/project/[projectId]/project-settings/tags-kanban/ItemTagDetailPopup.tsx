"use client";

import React, { useState, useEffect } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { generateRandomTagColor } from "~/utils/helpers/colorUtils";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import DropdownColorPicker from "~/app/_components/inputs/DropdownColorPicker";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useInvalidateQueriesAllTags } from "~/app/_hooks/invalidateHooks";

interface TagDetail {
  id: string;
  name: string;
  color: string;
  deleted?: boolean;
}

interface Props {
  showPopup: boolean;
  tagId: string;
  setShowPopup: (show: boolean) => void;
  itemTagType: "ReqFocus" | "BacklogTag" | "ReqType";
}

interface TagTypeConfig {
  title: string;
  namePlaceholder: string;
  nameLabel: string;
  colorLabel: string;
  editTitle: string;
  deleteButtonText: string;
  deleteConfirmTitle: string;
  deleteConfirmMessage: string;
  deleteConfirmButtonText: string;
  emptyNameError: string;
}

export default function ItemTagDetailPopup({
  showPopup,
  setShowPopup,
  tagId,
  itemTagType,
}: Props) {
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { predefinedAlerts } = useAlert();
  const invalidateQueriesAllTags = useInvalidateQueriesAllTags();
  const { alert } = useAlert();

  const tagTypeConfigs: Record<Props["itemTagType"], TagTypeConfig> = {
    BacklogTag: {
      title: "Tag: ",
      namePlaceholder: "E.g., 'Bug', 'Feature'...",
      nameLabel: "Tag name",
      colorLabel: "Tag color",
      editTitle: "Edit Backlog Tag",
      deleteButtonText: "Delete Tag",
      deleteConfirmTitle: "Are you sure?",
      deleteConfirmMessage: "This action will delete the backlog tag.",
      deleteConfirmButtonText: "Delete",
      emptyNameError: "Please enter a name for the backlog tag.",
    },
    ReqFocus: {
      title: "Requirement Focus: ",
      namePlaceholder: "E.g., 'Security', 'Performance'...",
      nameLabel: "Focus name",
      colorLabel: "Focus color",
      editTitle: "Edit Requirement Focus",
      deleteButtonText: "Delete Focus",
      deleteConfirmTitle: "Are you sure?",
      deleteConfirmMessage: "This action will delete the requirement focus.",
      deleteConfirmButtonText: "Delete",
      emptyNameError: "Please enter a name for the requirement focus.",
    },
    ReqType: {
      title: "Requirement Type: ",
      namePlaceholder: "E.g., 'Functional', 'Non-functional'...",
      nameLabel: "Type name",
      colorLabel: "Type color",
      editTitle: "Edit Requirement Type",
      deleteButtonText: "Delete Type",
      deleteConfirmTitle: "Are you sure?",
      deleteConfirmMessage: "This action will delete the requirement type.",
      deleteConfirmButtonText: "Delete",
      emptyNameError: "Please enter a name for the requirement type.",
    },
  };

  const currentConfig = tagTypeConfigs[itemTagType];

  // REACT
  const { projectId } = useParams();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    color: string;
  }>({
    name: "",
    color: generateRandomTagColor(),
  });

  const [colorChanged, setColorChanged] = useState(false);

  // TRPC
  interface TagParams {
    projectId: string;
    tagId: string;
  }

  interface ModifyTagParams extends TagParams {
    tagData: {
      name: string;
      color: string;
      deleted: boolean;
    };
  }

  interface QueryResult {
    data: TagDetail | undefined;
    isLoading: boolean;
    refetch: () => Promise<unknown>;
    error?: unknown;
  }

  interface MutationResult {
    mutateAsync: (params: ModifyTagParams) => Promise<TagDetail>;
    isPending: boolean;
  }

  interface DeleteMutationResult {
    mutateAsync: (params: TagParams) => Promise<{ success: boolean }>;
  }

  let tagQuery: QueryResult;
  let tagModifyMutation: MutationResult;
  let tagDeleteMutation: DeleteMutationResult;

  switch (itemTagType) {
    case "BacklogTag": {
      const query = api.settings.getBacklogTag.useQuery({
        projectId: projectId as string,
        tagId: tagId,
      });
      const modifyMutation = api.settings.modifyBacklogTag.useMutation();
      const deleteMutation = api.settings.deleteBacklogTag.useMutation();

      tagQuery = {
        data: query.data as TagDetail | undefined,
        isLoading: query.isLoading,
        refetch: query.refetch,
        error: query.error,
      };

      tagModifyMutation = {
        mutateAsync: modifyMutation.mutateAsync as unknown as (
          params: ModifyTagParams,
        ) => Promise<TagDetail>,
        isPending: modifyMutation.isPending,
      };

      tagDeleteMutation = {
        mutateAsync: deleteMutation.mutateAsync as unknown as (
          params: TagParams,
        ) => Promise<{ success: boolean }>,
      };
      break;
    }
    case "ReqFocus": {
      const query = api.requirements.getRequirementFocus.useQuery({
        projectId: projectId as string,
        requirementFocusId: tagId,
      });
      const modifyMutation =
        api.requirements.createOrModifyRequirementFocus.useMutation();
      const deleteMutation =
        api.requirements.createOrModifyRequirementFocus.useMutation();

      tagQuery = {
        data: query.data as TagDetail | undefined,
        isLoading: query.isLoading,
        refetch: query.refetch,
        error: query.error,
      };

      tagModifyMutation = {
        mutateAsync: modifyMutation.mutateAsync as unknown as (
          params: ModifyTagParams,
        ) => Promise<TagDetail>,
        isPending: modifyMutation.isPending,
      };

      tagDeleteMutation = {
        mutateAsync: deleteMutation.mutateAsync as unknown as (
          params: TagParams,
        ) => Promise<{ success: boolean }>,
      };
      break;
    }
    case "ReqType": {
      const query = api.requirements.getRequirementType.useQuery({
        projectId: projectId as string,
        requirementTypeId: tagId,
      });
      const modifyMutation =
        api.requirements.createOrModifyRequirementType.useMutation();
      const deleteMutation =
        api.requirements.createOrModifyRequirementType.useMutation();

      tagQuery = {
        data: query.data as TagDetail | undefined,
        isLoading: query.isLoading,
        refetch: query.refetch,
        error: query.error,
      };

      tagModifyMutation = {
        mutateAsync: modifyMutation.mutateAsync as unknown as (
          params: ModifyTagParams,
        ) => Promise<TagDetail>,
        isPending: modifyMutation.isPending,
      };

      tagDeleteMutation = {
        mutateAsync: deleteMutation.mutateAsync as unknown as (
          params: TagParams,
        ) => Promise<{ success: boolean }>,
      };
      break;
    }
  }

  const { data: tagDetail, isLoading, refetch, error } = tagQuery;
  const { mutateAsync: modifyTag } = tagModifyMutation;
  const { mutateAsync: deleteTag } = tagDeleteMutation;

  const isValidTagDetail = (tag: unknown): tag is TagDetail => {
    return (
      tag !== null &&
      typeof tag === "object" &&
      tag !== null &&
      "name" in tag &&
      typeof (tag as Record<string, unknown>).name === "string" &&
      "color" in tag &&
      typeof (tag as Record<string, unknown>).color === "string"
    );
  };

  // GENERAL
  const isModified = () => {
    if (!tagDetail || !isValidTagDetail(tagDetail)) return false;
    if (form.name !== tagDetail.name) return true;
    if (form.color !== tagDetail.color) return true;
    return false;
  };

  // HANDLES
  const handleDismiss = () => {
    setShowPopup(false);
    setColorChanged(false);
  };

  useEffect(() => {
    if (!tagDetail || !isValidTagDetail(tagDetail)) return;
    setForm({
      name: tagDetail.name,
      color: tagDetail.color,
    });
    setColorChanged(false);
  }, [tagDetail]);

  useEffect(() => {
    if (error) {
      setShowPopup(false);
      predefinedAlerts.unexpectedError();
    }
  }, [error]);

  const handleSave = async (updatedData: TagDetail) => {
    if (!isValidTagDetail(updatedData)) return;

    const errorName = currentConfig.emptyNameError;

    if (form.name === "") {
      alert("Oops", errorName, {
        type: "error",
        duration: 5000,
      });
      return;
    }

    if (
      form.name.toLowerCase().trim() ===
        updatedData.name.toLowerCase().trim() &&
      form.color === updatedData.color
    ) {
      setEditMode(false);
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

    const normalizedNewName = form.name.toLowerCase().trim();
    const tagWithSameNameExists = existingTags?.some(
      (tag) =>
        tag.id !== tagId &&
        tag.name.toLowerCase().trim() === normalizedNewName &&
        !tag.deleted,
    );

    if (tagWithSameNameExists) {
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

    const updateTag = {
      ...updatedData,
      name: form.name,
      color: form.color,
    };

    const params: TagParams = {
      projectId: projectId as string,
      tagId: tagId,
    };

    const modifyParams: ModifyTagParams = {
      ...params,
      tagData: {
        name: form.name,
        color: form.color,
        deleted: false,
      },
    };

    switch (itemTagType) {
      case "BacklogTag":
        await utils.settings.getBacklogTag.cancel(params);
        utils.settings.getBacklogTag.setData(params, (oldData) => {
          if (!oldData) return;
          return { ...oldData, ...updateTag };
        });
        break;
      case "ReqFocus":
        await utils.requirements.getRequirementFocus.cancel();
        utils.requirements.getRequirementFocus.setData(
          {
            projectId: projectId as string,
            requirementFocusId: tagId,
          },
          (oldData) => {
            if (!oldData) return;
            return { ...oldData, ...updateTag };
          },
        );
        break;
      case "ReqType":
        await utils.requirements.getRequirementType.cancel();
        utils.requirements.getRequirementType.setData(
          {
            projectId: projectId as string,
            requirementTypeId: tagId,
          },
          (oldData) => {
            if (!oldData) return;
            return { ...oldData, ...updateTag };
          },
        );
        break;
    }

    await modifyTag(modifyParams);

    await invalidateQueriesAllTags(projectId as string);
    await refetch();
    setColorChanged(false);
  };

  const handleColorChange = async (color: string) => {
    setForm({ ...form, color });
    setColorChanged(true);

    if (!editMode && tagDetail && isValidTagDetail(tagDetail)) {
      const updatedData: TagDetail = {
        ...tagDetail,
        color: color,
      };
      await handleSave(updatedData);
    }
  };

  const handleDelete = async () => {
    if (
      await confirm(
        currentConfig.deleteConfirmTitle,
        currentConfig.deleteConfirmMessage,
        currentConfig.deleteConfirmButtonText,
        "Cancel",
      )
    ) {
      const deleteParams: TagParams = {
        projectId: projectId as string,
        tagId: tagId,
      };

      await deleteTag(deleteParams);
      await invalidateQueriesAllTags(projectId as string);
      setShowPopup(false);
    }
  };

  return (
    <Popup
      show={showPopup}
      size="small"
      className="max-h-[400px] min-w-[500px]"
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
        handleDismiss();
      }}
      footer={
        !isLoading && (
          <DeleteButton onClick={handleDelete}>
            {currentConfig.deleteButtonText}
          </DeleteButton>
        )
      }
      title={
        <>
          {!isLoading &&
            tagDetail &&
            !editMode &&
            isValidTagDetail(tagDetail) && (
              <h1 className="mb-4 text-3xl">
                <span className="font-bold">{currentConfig.title}</span>
                <span className="font-normal">{tagDetail.name}</span>
              </h1>
            )}
          {editMode && (
            <h1 className="mb-4 text-3xl">
              <span className="font-bold">{currentConfig.editTitle}</span>
            </h1>
          )}
        </>
      }
      editMode={isLoading ? undefined : editMode}
      setEditMode={async (isEditing) => {
        setEditMode(isEditing);
        if (!tagDetail || !isValidTagDetail(tagDetail)) return;
        if (!isEditing) {
          await handleSave(tagDetail);
        }
      }}
      disablePassiveDismiss={editMode && isModified()}
    >
      {editMode && (
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-sm font-semibold">
              {currentConfig.nameLabel}
            </span>
          </div>
          <InputTextField
            type="text"
            placeholder={currentConfig.namePlaceholder}
            value={form.name}
            disableAI={true}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div>
            <span className="text-sm font-semibold">
              {currentConfig.colorLabel}
            </span>
            <div className="mt-2">
              <DropdownColorPicker
                value={form.color}
                onChange={(color) => handleColorChange(color)}
                label=""
              />
            </div>
          </div>
        </div>
      )}
      {!editMode && !isLoading && tagDetail && isValidTagDetail(tagDetail) && (
        <div className="flex flex-col justify-start gap-4">
          <div className="mt-2">
            <span className="text-sm font-semibold">
              {currentConfig.colorLabel}
            </span>
            <div className="mt-2">
              <DropdownColorPicker
                value={form.color}
                onChange={(color) => handleColorChange(color)}
                label=""
                disabled={!editMode}
              />
            </div>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      )}
    </Popup>
  );
}
