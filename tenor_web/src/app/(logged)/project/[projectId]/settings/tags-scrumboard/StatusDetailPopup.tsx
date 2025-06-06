"use client";

import React, { useState, useEffect } from "react";
import Popup from "~/app/_components/Popup";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { generateRandomTagColor } from "~/lib/helpers/colorUtils";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import DropdownColorPicker from "~/app/_components/inputs/pickers/DropdownColorPicker";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import HelpIcon from "@mui/icons-material/Help";
import { useInvalidateQueriesAllStatuses } from "~/app/_hooks/invalidateHooks";
import DeleteButton from "~/app/_components/inputs/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import useValidateStatusTag from "~/app/_hooks/useValidateStatus";

interface Props {
  showPopup: boolean;
  statusId: string;
  setShowPopup: (show: boolean) => void;
  disabled?: boolean;
  editMode: boolean;
  setEditMode: (isEditing: boolean) => void;
}

export default function StatusDetailPopup({
  showPopup,
  setShowPopup,
  statusId,
  disabled = false,
  editMode,
  setEditMode,
}: Props) {
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { predefinedAlerts } = useAlert();
  const invalidateQueriesAllStatuses = useInvalidateQueriesAllStatuses();
  const validateStatusTag = useValidateStatusTag();

  const { projectId } = useParams();
  const [form, setForm] = useState<{
    name: string;
    color: string;
    orderIndex: number;
    marksTaskAsDone: boolean;
  }>({
    name: "",
    color: generateRandomTagColor(),
    orderIndex: 0,
    marksTaskAsDone: false,
  });

  const {
    data: statusDetail,
    isLoading,
    refetch,
    error,
  } = api.settings.getStatusType.useQuery({
    projectId: projectId as string,
    statusId: statusId,
  });

  const { mutateAsync: modifyStatus } =
    api.settings.modifyStatusType.useMutation();
  const { mutateAsync: deleteStatus } =
    api.settings.deleteStatusType.useMutation();

  const isModified = () => {
    if (!statusDetail) return false;
    if (form.name !== statusDetail.name) return true;
    if (form.color !== statusDetail.color) return true;
    if (form.marksTaskAsDone !== statusDetail.marksTaskAsDone) return true;
    if (form.orderIndex !== statusDetail.orderIndex) return true;
    return false;
  };

  const handleDismiss = () => {
    setShowPopup(false);
  };

  useEffect(() => {
    if (!statusDetail) return;
    setForm({
      name: statusDetail.name,
      color: statusDetail.color,
      orderIndex: statusDetail.orderIndex,
      marksTaskAsDone: statusDetail.marksTaskAsDone,
    });
  }, [statusDetail]);

  useEffect(() => {
    if (error) {
      setShowPopup(false);
      predefinedAlerts.unexpectedError();
    }
  }, [error]);

  const handleSave = async (updatedData: NonNullable<typeof statusDetail>) => {
    if (
      !validateStatusTag({
        tagName: form.name,
        id: statusDetail?.id,
      })
    ) {
      return;
    }

    setEditMode(false);

    await utils.settings.getStatusTypes.cancel({
      projectId: projectId as string,
    });

    utils.settings.getStatusTypes.setData(
      { projectId: projectId as string },
      (oldData) => {
        if (!oldData) return [];
        return oldData.map((s) => {
          if (s.id === statusId) {
            return { ...s, ...updatedData };
          }
          return s;
        });
      },
    );

    await utils.settings.getStatusType.cancel({
      projectId: projectId as string,
      statusId: statusId,
    });

    utils.settings.getStatusType.setData(
      { projectId: projectId as string, statusId: statusId },
      (oldData) => {
        if (!oldData) return;
        return { ...oldData, ...updatedData };
      },
    );

    await modifyStatus({
      projectId: projectId as string,
      statusId: statusId,
      status: {
        ...updatedData,
        deleted: false,
      },
    });

    await invalidateQueriesAllStatuses(projectId as string);
    await refetch();
  };

  const handleColorChange = async (color: string) => {
    setForm({ ...form, color });

    if (!editMode && statusDetail) {
      const updatedData = {
        ...statusDetail,
        color: color,
      };
      await handleSave(updatedData);
    }
  };

  const handleMarksTaskAsDoneChange = async (value: boolean) => {
    setForm({ ...form, marksTaskAsDone: value });
    if (statusDetail) {
      const updatedData = {
        ...statusDetail,
        marksTaskAsDone: value,
      };
      await handleSave(updatedData);
    }
  };

  const handleDelete = async () => {
    if (statusDetail && ["Todo", "Doing", "Done"].includes(statusDetail.name)) {
      predefinedAlerts.statusNameNotEditableError();
      return;
    }

    if (
      await confirm(
        "Are you sure?",
        "This action will delete the status.",
        "Delete",
        "Cancel",
      )
    ) {
      await deleteStatus({
        projectId: projectId as string,
        statusId: statusId,
      });
      await invalidateQueriesAllStatuses(projectId as string);
      setShowPopup(false);
    }
  };

  return (
    <Popup
      show={showPopup}
      size="small"
      className="min-h-[300px] w-[500px]"
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
        !isLoading &&
        !disabled && (
          <DeleteButton onClick={handleDelete}>Delete Status</DeleteButton>
        )
      }
      title={
        <>
          {!isLoading && statusDetail && !editMode && (
            <h1 className="mb-4 text-3xl">
              <span className="font-bold">Status: </span>
              <span className="font-normal">{statusDetail.name}</span>
            </h1>
          )}
          {editMode && (
            <h1 className="mb-4 text-3xl">
              <span className="font-bold">Edit Status</span>
            </h1>
          )}
        </>
      }
      editMode={!disabled ? (isLoading ? undefined : editMode) : undefined}
      setEditMode={async (isEditing) => {
        if (!statusDetail) return;
        if (!isEditing) {
          const updatedData = {
            ...statusDetail,
            name: form.name,
            color: form.color,
          };
          await handleSave(updatedData);
        } else {
          setEditMode(true);
        }
      }}
      disablePassiveDismiss={editMode && isModified()}
    >
      {editMode && (
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-sm font-semibold">Status name</span>
          </div>
          <InputTextField
            type="text"
            placeholder="E.g., Todo, In Progress..."
            value={form.name}
            disableAI={true}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div>
            <span className="text-sm font-semibold">Status color</span>
            <div className="mt-2">
              <DropdownColorPicker
                value={form.color}
                onChange={(color) => handleColorChange(color)}
                label=""
              />
            </div>
          </div>
          <div className="mt-2 flex items-baseline">
            <InputCheckbox
              disabled={disabled}
              checked={form.marksTaskAsDone}
              onChange={(value) => setForm({ ...form, marksTaskAsDone: value })}
              className={`m-0 mr-2 ${!disabled ? "cursor-pointer" : "cursor-default"}`}
            />
            <button
              disabled={disabled}
              onClick={() =>
                setForm({ ...form, marksTaskAsDone: !form.marksTaskAsDone })
              }
            >
              Marks tasks as resolved
            </button>
            <HelpIcon
              className="ml-[3px] text-gray-500"
              data-tooltip-id="tooltip"
              data-tooltip-content="Tasks moved to this status will be considered as a completed task"
              data-tooltip-place="top-start"
              style={{ width: "15px" }}
            />
          </div>
        </div>
      )}
      {!editMode && !isLoading && statusDetail && (
        <div className="flex flex-col gap-2">
          <div className="mt-2">
            <span className="text-sm font-semibold">Status color</span>
            <div className="mt-2">
              <DropdownColorPicker
                value={form.color}
                onChange={(color) => handleColorChange(color)}
                label=""
                disabled={!editMode}
              />
            </div>
          </div>
          <div className="mt-2 flex items-baseline">
            <InputCheckbox
              disabled={disabled}
              checked={form.marksTaskAsDone}
              onChange={handleMarksTaskAsDoneChange}
              className={`mb-1 mr-2 ${!disabled ? "cursor-pointer" : "cursor-default"}`}
            />
            <button disabled={disabled}>Marks tasks as resolved</button>
            <HelpIcon
              className="ml-[3px] text-gray-500"
              data-tooltip-id="tooltip"
              data-tooltip-content="Tasks moved to this status list will be considered as a completed task"
              data-tooltip-place="top-start"
              style={{ width: "15px" }}
            />
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
