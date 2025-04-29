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
import Markdown from "react-markdown";

interface Props {
  showPopup: boolean;
  tagId: string;
  setShowPopup: (show: boolean) => void;
}

export default function ItemTagDetailPopup({
  showPopup,
  setShowPopup,
  tagId,
}: Props) {
  const confirm = useConfirmation();
  const utils = api.useUtils();
  const { predefinedAlerts } = useAlert();

  // REACT
  const { projectId } = useParams();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    color: string;
  }>({
    name: "",
    color: generateRandomColor(),
  });

  // Track color change when is not in edit mode
  const [colorChanged, setColorChanged] = useState(false);

  // TRPC
  const {
    data: tagDetail,
    isLoading,
    refetch,
    error,
  } = api.settings.getBacklogTagById.useQuery({
    projectId: projectId as string,
    tagId: tagId,
  });

  const { mutateAsync: modifyBacklogTag, isPending: modifyingBacklogTag } =
    api.settings.modifyBacklogTag.useMutation();
  const { mutateAsync: deleteTag } =
    api.settings.deleteBacklogTag.useMutation();

  // GENERAL
  const isModified = () => {
    if (!tagDetail) return false;
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
    if (!tagDetail) return;
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

  const handleSave = async (updatedData: NonNullable<typeof tagDetail>) => {
    const updateTag = {
      ...updatedData,
      name: form.name,
      color: form.color,
    };
    await utils.settings.getBacklogTagById.cancel({
      projectId: projectId as string,
      tagId: tagId,
    });
    utils.settings.getBacklogTagById.setData(
      { projectId: projectId as string, tagId: tagId },
      (oldData) => {
        if (!oldData) return;
        return { ...oldData, ...updateTag };
      },
    );

    await modifyBacklogTag({
      projectId: projectId as string,
      tagId: tagId,
      tag: {
        name: form.name,
        color: form.color,
        deleted: false,
      },
    });

    await utils.settings.getBacklogTags.invalidate({
      projectId: projectId as string,
    });
    await refetch();
    setColorChanged(false);
  };

  const handleColorChange = async (color: string) => {
    setForm({ ...form, color });
    setColorChanged(true);

    if (!editMode && tagDetail) {
      const updatedData = {
        ...tagDetail,
        color: color,
      };
      await handleSave(updatedData);
    }
  };

  const handleDelete = async () => {
    if (
      await confirm(
        "Are you sure?",
        "This action will delete the tag.",
        "Delete",
        "Cancel",
      )
    ) {
      await deleteTag({
        projectId: projectId as string,
        tagId: tagId,
      });
      await utils.settings.getBacklogTags.invalidate({
        projectId: projectId as string,
      });
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
          <DeleteButton onClick={handleDelete}>Delete Tag</DeleteButton>
        )
      }
      title={
        <>
          {!isLoading && tagDetail && !editMode && (
            <h1 className="mb-4 text-3xl">
              <span className="font-bold">Tag: </span>
              <span className="font-normal">{tagDetail.name}</span>
            </h1>
          )}
          {editMode && (
            <h1 className="mb-4 text-3xl">
              <span className="font-bold">Edit Tag</span>
            </h1>
          )}
        </>
      }
      editMode={isLoading ? undefined : editMode}
      setEditMode={async (isEditing) => {
        setEditMode(isEditing);
        if (!tagDetail) return;
        if (!isEditing) {
          const updatedData = {
            ...tagDetail,
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
            <span className="text-sm font-semibold">Tag name</span>
          </div>
          <InputTextField
            type="text"
            placeholder="Enter a tag name (e.g., 'Bug', 'Feature', 'UI')..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="mt-4">
            <span className="text-sm font-semibold">Tag color</span>
            <DropdownColorPicker
              value={form.color}
              onChange={(color) => handleColorChange(color)}
              label=""
            />
          </div>
        </div>
      )}
      {!editMode && !isLoading && tagDetail && (
        <div className="flex flex-col justify-start gap-4">
          <div className="mt-2">
            <span className="text-sm font-semibold">Tag color</span>
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
