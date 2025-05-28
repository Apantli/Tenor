"use client";

import React, { useEffect, useState } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import DeleteButton from "~/app/_components/inputs/buttons/DeleteButton";
import Markdown from "react-markdown";
import { UseFormatForAssignReqTypeScrumId } from "~/app/_hooks/requirementHook";
import PriorityPicker from "~/app/_components/inputs/pickers/PriorityPicker";
import RequirementTypePicker from "~/app/_components/inputs/pickers/RequirementTypePicker";
import RequirementFocusPicker from "~/app/_components/inputs/pickers/RequirementFocusPicker";
import AiIcon from "@mui/icons-material/AutoAwesome";
import TertiaryButton from "~/app/_components/inputs/buttons/TertiaryButton";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import type { RequirementCol } from "~/lib/types/columnTypes";
import type { Tag } from "~/lib/types/firebaseSchemas";
import {
  useInvalidateQueriesAllRequirements,
  useInvalidateQueriesRequirementDetails,
} from "~/app/_hooks/invalidateHooks";
import type { AIGeneratedRequirement } from "./RequirementsTable";
import { cn } from "~/lib/utils";

interface Props {
  requirementId: string;
  showDetail: boolean;
  setRequirementId: (requirementId: string) => void;
  requirementData?: RequirementCol;
  setRequirementData?: (data: RequirementCol | undefined) => void;
  onAccept?: () => void;
  onReject?: () => void;
  canWrite: boolean;
  generatedRequirements?: AIGeneratedRequirement[];
  updateGeneratedRequirement?: (
    id: string,
    data: AIGeneratedRequirement,
  ) => void;
}

export default function RequirementDetailPopup({
  requirementId,
  showDetail,
  setRequirementId,
  requirementData,
  setRequirementData,
  onAccept,
  onReject,
  canWrite,
  updateGeneratedRequirement,
}: Props) {
  const { projectId } = useParams();
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const invalidateAllRequirements = useInvalidateQueriesAllRequirements();
  const invalidateRequirementDetails = useInvalidateQueriesRequirementDetails();

  const {
    data: fetchedRequirement,
    isLoading,
    refetch,
  } = api.requirements.getRequirement.useQuery(
    {
      projectId: projectId as string,
      requirementId,
    },
    {
      enabled: !requirementData && requirementId !== "",
    },
  );

  const requirementDetail = requirementData ?? fetchedRequirement;
  const isGhost = requirementData !== undefined;

  const { mutateAsync: createOrModifyRequirement } =
    api.requirements.createOrModifyRequirement.useMutation();
  const { mutateAsync: deleteRequirement, isPending: isDeleting } =
    api.requirements.deleteRequirement.useMutation();

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  const { alert } = useAlert();

  useEffect(() => {
    if (!requirementDetail) return;
    if (!editMode) {
      setEditForm({
        name: requirementDetail.name ?? "",
        description: requirementDetail.description,
      });
    }
  }, [requirementDetail, editMode]);

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
    setRequirementId("");
  };

  const isModified = () => {
    if (editForm.name !== (requirementDetail?.name ?? "")) return true;
    if (editForm.description !== requirementDetail?.description) return true;
    return false;
  };

  const handleSave = async (
    updatedData: NonNullable<typeof requirementDetail>,
    saveEditForm = false,
  ) => {
    const finalData =
      saveEditForm && editMode
        ? {
            ...updatedData,
            name: editForm.name,
            description: editForm.description,
          }
        : updatedData;

    // This means we're editing a ghost requirement
    if (isGhost) {
      setRequirementData?.(finalData);
      updateGeneratedRequirement?.(finalData.id, {
        ...finalData,
        priority: finalData.priority,
        requirementType: finalData.requirementType,
        requirementFocus: finalData.requirementFocus,
      });
      return;
    }

    const newRequirement = {
      projectId: projectId as string,
      name: finalData.name ?? "",
      description: finalData.description,
      priorityId: finalData.priority?.id ?? "",
      requirementTypeId: finalData.requirementType.id ?? "",
      requirementFocusId: finalData.requirementFocus?.id ?? "",
      scrumId: finalData.scrumId,
      deleted: false,
    };

    await utils.requirements.getRequirementTable.cancel({
      projectId: projectId as string,
    });
    await utils.requirements.getRequirement.cancel({
      projectId: projectId as string,
      requirementId: requirementId,
    });

    await createOrModifyRequirement({
      projectId: projectId as string,
      requirementId: requirementId,
      requirementData: newRequirement,
    });

    await invalidateAllRequirements(projectId as string);
    await invalidateRequirementDetails(projectId as string, [requirementId]);

    if (!editMode || saveEditForm) {
      await refetch();
    }
  };

  const handleDelete = async () => {
    if (
      await confirm(
        "Are you sure you want to delete this requirement?",
        "This action cannot be undone.",
        "Delete",
      )
    ) {
      await deleteRequirement({
        projectId: projectId as string,
        requirementId: requirementId,
      });
      await invalidateAllRequirements(projectId as string);
      await dismissPopup();
    }
  };

  const handleTypeChange = async (type: Tag) => {
    if (!requirementDetail) return;
    await handleSave({ ...requirementDetail, requirementType: type });
  };

  const handlePriorityChange = async (priority: Tag) => {
    if (!requirementDetail) return;
    await handleSave({ ...requirementDetail, priority });
  };

  const handleFocusChange = async (focus: Tag) => {
    if (!requirementDetail) return;
    await handleSave({ ...requirementDetail, requirementFocus: focus });
  };

  return (
    <Popup
      show={showDetail}
      reduceTopPadding={!requirementDetail || !canWrite}
      size="small"
      className={cn("h-[380px] max-h-[700px] w-[600px]", {
        "h-[380px]": editMode,
      })}
      disablePassiveDismiss={editMode && isModified()}
      dismiss={dismissPopup}
      setEditMode={
        !canWrite || !requirementDetail
          ? undefined
          : async () => {
              if (editMode) {
                if (!editForm.name) {
                  alert("Oops...", "The requirement must have a name.", {
                    type: "error",
                    duration: 5000,
                  });
                  return;
                }

                setEditMode(false);
                await handleSave(requirementDetail, true);
              } else {
                setEditMode(true);
              }
            }
      }
      editMode={!canWrite ? undefined : editMode}
      title={
        isLoading ? (
          <></>
        ) : (
          <h1 className="text-2xl">
            <strong>
              {requirementDetail ? (
                <h1 className="font-semibold">
                  <span>
                    {UseFormatForAssignReqTypeScrumId(
                      requirementDetail.requirementType.name,
                      requirementDetail.scrumId,
                    )}
                    :{" "}
                  </span>
                  <span className="font-normal">{requirementDetail.name}</span>
                </h1>
              ) : (
                <h1>Requirement</h1>
              )}
            </strong>
          </h1>
        )
      }
      footerClassName="ml-0"
      footer={
        !isLoading &&
        requirementDetail && (
          <div
            className="flex w-full flex-col gap-6 px-2"
            data-cy="requirement-popup-footer"
          >
            <div className="flex w-full gap-4">
              <div className="w-36 space-y-1">
                <label className="font-semibold">Type</label>
                <RequirementTypePicker
                  disabled={!canWrite}
                  type={requirementDetail.requirementType}
                  onChange={handleTypeChange}
                />
              </div>
              <div className="w-36 space-y-1">
                <label className="font-semibold">Priority</label>
                <PriorityPicker
                  disabled={!canWrite}
                  priority={requirementDetail.priority}
                  onChange={handlePriorityChange}
                />
              </div>
              <div className="w-36 space-y-1">
                <label className="font-semibold">Focus</label>
                <RequirementFocusPicker
                  disabled={!canWrite}
                  focus={requirementDetail.requirementFocus}
                  onChange={handleFocusChange}
                />
              </div>
            </div>
            {canWrite &&
              (isGhost ? (
                <div className="ml-auto flex items-center gap-2">
                  <AiIcon
                    className="animate-pulse text-app-secondary"
                    data-tooltip-id="tooltip"
                    data-tooltip-content="This is a generated requirement. It will not get saved until you accept it."
                  />
                  <TertiaryButton onClick={onReject}>Reject</TertiaryButton>
                  <PrimaryButton
                    className="bg-app-secondary hover:bg-app-hover-secondary"
                    onClick={onAccept}
                  >
                    Accept
                  </PrimaryButton>
                </div>
              ) : (
                <DeleteButton
                  className="ml-auto"
                  onClick={handleDelete}
                  loading={isDeleting}
                >
                  Delete requirement
                </DeleteButton>
              ))}
          </div>
        )
      }
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {editMode ? (
            <div className="pt-4">
              <InputTextField
                id="requirement-title"
                label="Title"
                containerClassName="mb-4"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({
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
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                name="description"
                placeholder="What is this requirement about..."
                data-cy="requirement-description-input"
              />
            </div>
          ) : (
            <div>
              <div className="mt-4 text-lg">
                {requirementDetail?.description !== "" ? (
                  <Markdown>{requirementDetail?.description ?? ""}</Markdown>
                ) : (
                  <p className="italic text-gray-500">
                    No description provided.
                  </p>
                )}
              </div>
              <br />
            </div>
          )}
        </div>
      )}
    </Popup>
  );
}
