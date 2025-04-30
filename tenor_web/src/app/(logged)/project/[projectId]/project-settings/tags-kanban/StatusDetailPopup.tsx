"use client";

import React, { useState, useEffect } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { generateRandomColor } from "~/app/_components/BacklogTagList";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import DropdownColorPicker from "~/app/_components/inputs/DropdownColorPicker";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import HelpIcon from "@mui/icons-material/Help";

interface Props {
  showPopup: boolean;
  statusId: string;
  setShowPopup: (show: boolean) => void;
}

export default function StatusDetailPopup({
  showPopup,
  setShowPopup,
  statusId,
}: Props) {
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { predefinedAlerts } = useAlert();

  const { projectId } = useParams();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    color: string;
    orderIndex: number;
    marksTaskAsDone: boolean;
  }>({
    name: "",
    color: generateRandomColor(),
    orderIndex: 0,
    marksTaskAsDone: false,
  });

  const [colorChanged, setColorChanged] = useState(false);

  const {
    data: statusDetail,
    isLoading,
    refetch,
    error,
  } = api.settings.getStatusTypeById.useQuery({
    projectId: projectId as string,
    statusId: statusId,
  });

  const { mutateAsync: modifyStatus, isPending: modifyingStatus } =
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
    const updatedStatus = {
      ...updatedData,
      name: form.name,
      color: form.color,
      marksTaskAsDone: form.marksTaskAsDone,
      orderIndex: form.orderIndex,
    };
    await utils.settings.getStatusTypeById.cancel({
      projectId: projectId as string,
      statusId: statusId,
    });
    utils.settings.getStatusTypeById.setData(
      { projectId: projectId as string, statusId: statusId },
      (oldData) => {
        if (!oldData) return;
        return { ...oldData, ...updatedStatus };
      },
    );
    await modifyStatus({
      projectId: projectId as string,
      statusId: statusId,
      status: {
        name: form.name,
        color: form.color,
        marksTaskAsDone: form.marksTaskAsDone,
        orderIndex: form.orderIndex,
        deleted: false,
      },
    });

    await utils.settings.getStatusTypes.invalidate({
      projectId: projectId as string,
    });
    await refetch();
  };

  const handleColorChange = async (color: string) => {
    setForm({ ...form, color });
    setColorChanged(true);

    if (!editMode && statusDetail) {
      const updatedData = {
        ...statusDetail,
        color: color,
      };
      await handleSave(updatedData);
    }
  };

  const handleDelete = async () => {
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
      await utils.settings.getStatusTypes.invalidate({
        projectId: projectId as string,
      });
      setShowPopup(false);
    }
  };

  return (
    <Popup
      show={showPopup}
      size="small"
      className="max-h-[450px] min-w-[500px]"
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
      editMode={isLoading ? undefined : editMode}
      setEditMode={async (isEditing) => {
        setEditMode(isEditing);
        if (!statusDetail) return;
        if (!isEditing) {
          const updatedData = {
            ...statusDetail,
            name: form.name,
            color: form.color,
          };
          await handleSave(updatedData);
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
            placeholder="E.g., Todo, In Progress, Done, QA Testing, Blocked..."
            value={form.name}
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
              checked={form.marksTaskAsDone}
              onChange={(value) => setForm({ ...form, marksTaskAsDone: value })}
              className="mb-1 mr-2 cursor-pointer"
            />
            <button
              onClick={() =>
                setForm({ ...form, marksTaskAsDone: !form.marksTaskAsDone })
              }
            >
              Marks tasks as resolved
            </button>
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
              checked={form.marksTaskAsDone}
              onChange={(value) => setForm({ ...form, marksTaskAsDone: value })}
              className="mb-1 mr-2 cursor-pointer"
            />
            <button
              onClick={() =>
                setForm({ ...form, marksTaskAsDone: !form.marksTaskAsDone })
              }
            >
              Marks tasks as resolved
            </button>
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
