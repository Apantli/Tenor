"use client";

import React, { useState } from "react";
import Popup from "~/app/_components/Popup";
import InputTextField from "~/app/_components/inputs/InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import { generateRandomTagColor } from "~/utils/colorUtils";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import DropdownColorPicker from "~/app/_components/inputs/DropdownColorPicker";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onTagAdded: (tagId: string) => void;
}

export default function CreateItemTagPopup({ showPopup, setShowPopup }: Props) {
  const confirm = useConfirmation();
  const utils = api.useUtils();

  // REACT
  const { projectId } = useParams();
  const { alert } = useAlert();

  const [form, setForm] = useState<{
    name: string;
    color: string;
  }>({
    name: "",
    color: generateRandomTagColor(),
  });

  // TRPC
  const { mutateAsync: createBacklogTag, isPending: creatingBacklogTag } =
    api.settings.createBacklogTag.useMutation();

  // GENERAL
  const isModified = () => {
    if (form.name !== "") return true;
    return false;
  };

  // HANDLES
  const handleDismiss = () => {
    setShowPopup(false);
  };

  const handleCreateTag = async () => {
    if (form.name === "") {
      alert("Oops", "Please enter a name for the list.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    await createBacklogTag({
      projectId: projectId as string,
      tag: {
        name: form.name,
        color: form.color,
        deleted: false,
      },
    });

    setShowPopup(false);
    await utils.settings.getBacklogTags.invalidate({
      projectId: projectId as string,
    });
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
            loading={creatingBacklogTag}
            onClick={async () => {
              if (!creatingBacklogTag) await handleCreateTag();
            }}
          >
            Create Tag
          </PrimaryButton>
        </div>
      }
      title={
        <>
          <h1 className="mb-4 text-3xl">
            <span className="font-bold">Create Tag</span>
          </h1>
        </>
      }
    >
      <div className="flex flex-col justify-start gap-4">
        <InputTextField
          type="text"
          placeholder="Enter a tag name (e.g., 'Bug', 'Feature', 'UI')..."
          label="Tag name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <DropdownColorPicker
          value={form.color}
          onChange={(color) => setForm({ ...form, color })}
          label="Tag color"
        />
      </div>
    </Popup>
  );
}
