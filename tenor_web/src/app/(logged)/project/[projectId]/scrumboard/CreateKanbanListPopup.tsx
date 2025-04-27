"use client";

import React, { useState } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import {
  generateRandomColor,
} from "~/app/_components/BacklogTagList";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import {
  useInvalidateQueriesItemStatus,
} from "~/app/_hooks/invalidateHooks";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import InputCheckbox from "~/app/_components/inputs/InputCheckbox";
import DropdownColorPicker from "~/app/_components/inputs/DropdownColorPicker";
import HelpIcon from "@mui/icons-material/Help";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onListAdded: (listId: string) => void;
}

// A kanban list is a status
export default function CreateKanbanListPopup({
  showPopup,
  setShowPopup,
}: Props) {
  const confirm = useConfirmation();
  const invalidateQueriesKanbanLists = useInvalidateQueriesItemStatus();

  // REACT
  const { projectId } = useParams();
  const { alert } = useAlert();

  const [form, setForm] = useState<{
    name: string;
    color: string;
    marksTaskAsDone: boolean;
  }>({
    name: "",
    color: generateRandomColor(), // TODO: Test this
    marksTaskAsDone: false,
  });

  // TRPC
  const { mutateAsync: createList, isPending: creatingList } =
    api.kanban.createStatusList.useMutation();

  // GENERAL
  const isModified = () => {
    if (form.name !== "") return true;
    return false;
  };

  // HANDLES
  const handleDismiss = () => {
    setShowPopup(false);
  };

  const handleCreateList = async () => {
    if (form.name === "") {
      alert("Oops", "Please enter a name for the list.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    await createList({
      projectId: projectId as string,
      name: form.name,
      color: form.color,
      marksTaskAsDone: form.marksTaskAsDone,
    });

    setShowPopup(false);
    await invalidateQueriesKanbanLists(projectId as string);
  };

  return (
    <Popup
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
            loading={creatingList}
            onClick={async () => {
              if (!creatingList) await handleCreateList();
            }}
          >
            Create list
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col justify-start gap-4">
        <h1 className="text-2xl">
          <strong>Create new list</strong>{" "}
        </h1>
        <InputTextField
          type="text"
          placeholder="Write the state your list represents..."
          label="List name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <DropdownColorPicker
          value={form.color}
          onChange={(color) => setForm({ ...form, color })}
          label="List color"
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
            data-tooltip-content="Tasks moved to this status list will be considered as a completed task"
            data-tooltip-place="top-start"
            style={{ width: "15px" }}
          />
        </div>
      </div>
    </Popup>
  );
}
