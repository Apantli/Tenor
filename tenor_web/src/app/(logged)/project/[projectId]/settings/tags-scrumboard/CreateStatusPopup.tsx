"use client";

import React, { useState } from "react";
import Popup from "~/app/_components/Popup";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { generateRandomTagColor } from "~/utils/helpers/colorUtils";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { useInvalidateQueriesAllStatuses } from "~/app/_hooks/invalidateHooks";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import DropdownColorPicker from "~/app/_components/inputs/pickers/DropdownColorPicker";
import HelpIcon from "@mui/icons-material/Help";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onStatusAdded: (statusId: string) => void;
}

export default function CreateStatusPopup({ showPopup, setShowPopup }: Props) {
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const invalidateQueriesAllStatuses = useInvalidateQueriesAllStatuses();

  // REACT
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();

  const [form, setForm] = useState<{
    name: string;
    color: string;
    marksTaskAsDone: boolean;
  }>({
    name: "",
    color: generateRandomTagColor(),
    marksTaskAsDone: false,
  });

  // TRPC
  const { mutateAsync: createStatus, isPending: creatingStatus } =
    api.settings.createStatusType.useMutation();

  // GENERAL
  const isModified = () => {
    if (form.name !== "") return true;
    return false;
  };

  // HANDLES
  const handleDismiss = () => {
    setShowPopup(false);
  };

  const handleCreateStatus = async () => {
    if (form.name === "") {
      predefinedAlerts.statusNameError();
      return;
    }

    // Normalize the input for case-insensitive comparison
    const normalizedName = form.name.toLowerCase().trim();
    const protectedNames = ["todo", "doing", "done"];

    if (protectedNames.some((name) => normalizedName === name)) {
      predefinedAlerts.statusNameReservedError(form.name);
      return;
    }

    const existingStatuses = await utils.settings.getStatusTypes.fetch({
      projectId: projectId as string,
    });

    const statusAlreadyExists = existingStatuses?.some(
      (status) =>
        status.name.toLowerCase().trim() === normalizedName && !status.deleted,
    );

    if (statusAlreadyExists) {
      predefinedAlerts.existingStatusError(form.name);
      return;
    }

    await createStatus({
      projectId: projectId as string,
      tagData: {
        name: form.name,
        color: form.color,
        marksTaskAsDone: form.marksTaskAsDone,
        deleted: false,
        orderIndex: 0,
      },
    });

    setShowPopup(false);
    await invalidateQueriesAllStatuses(projectId as string);
  };

  return (
    <Popup
      reduceTopPadding
      show={showPopup}
      size="small"
      className="min-h-[400px] min-w-[500px]"
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
            loading={creatingStatus}
            onClick={async () => {
              if (!creatingStatus) await handleCreateStatus();
            }}
          >
            Create status
          </PrimaryButton>
        </div>
      }
      title={
        <>
          <h1 className="mb-4 text-3xl">
            <span className="font-bold">Create new status</span>
          </h1>
        </>
      }
    >
      <div className="flex flex-col justify-start gap-4">
        <InputTextField
          type="text"
          placeholder="E.g., Todo, In Progress..."
          label="Status name"
          value={form.name}
          disableAI={true}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <DropdownColorPicker
          value={form.color}
          onChange={(color) => setForm({ ...form, color })}
          label="Status color"
        />

        <div className="mt-1 flex items-baseline">
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
            data-tooltip-content="Tasks moved to this status will be considered as a completed task"
            data-tooltip-place="top-start"
            style={{ width: "15px" }}
          />
        </div>
      </div>
    </Popup>
  );
}
