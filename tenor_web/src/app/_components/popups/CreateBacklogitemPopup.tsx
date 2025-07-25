"use client";

import React, { useState, useContext } from "react";
import Popup from "~/app/_components/Popup";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import type { Size, Sprint, Tag, WithId } from "~/lib/types/firebaseSchemas";
import PriorityPicker from "~/app/_components/inputs/pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import { SizePicker } from "~/app/_components/inputs/pickers/SizePicker";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { useInvalidateQueriesAllGenericBacklogItems } from "~/app/_hooks/invalidateHooks";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";
import { SprintPicker } from "../inputs/pickers/SprintPicker";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import { PageContext } from "~/app/_hooks/usePageContext";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onItemAdded: (itemId: string) => void;
}

export default function CreateBacklogItemPopup({
  showPopup,
  setShowPopup,
  onItemAdded,
}: Props) {
  // #region Hooks
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();
  const confirm = useConfirmation();
  const invalidateQueriesAllGenericBacklogItems =
    useInvalidateQueriesAllGenericBacklogItems();

  // #endregion

  // #region TRPC
  const { mutateAsync: createBacklogItem, isPending } =
    api.backlogItems.createBacklogItem.useMutation();
  // #endregion

  // #region React
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    tags: Tag[];
    priority?: Tag;
    size?: Size | "";
    sprint?: WithId<Sprint>;
  }>({
    name: "",
    description: "",
    tags: [],
    priority: undefined,
    size: undefined,
    sprint: undefined,
  });
  // #endregion

  // #region Utils
  const isModified = () => {
    if (createForm.name !== "") return true;
    if (createForm.description !== "") return true;
    if (createForm.size !== undefined) return true;
    if (createForm.priority !== undefined) return true;
    if (createForm.sprint !== undefined) return true;
    if (createForm.tags.length > 0) return true;
    return false;
  };

  const handleCreateBacklogItem = async () => {
    if (createForm.name === "") {
      predefinedAlerts.backlogItemNameError();
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting || isPending) return;

    try {
      setIsSubmitting(true);

      const { id: backlogItemId } = await createBacklogItem({
        projectId: projectId as string,
        backlogItemData: {
          name: createForm.name,
          description: createForm.description,
          tagIds: createForm.tags
            .map((tag) => tag.id)
            .filter((val) => val !== undefined),
          priorityId: createForm.priority?.id,
          size: createForm.size,
          sprintId: createForm.sprint?.id ?? "",
        },
      });

      onItemAdded(backlogItemId);

      await invalidateQueriesAllGenericBacklogItems(projectId as string);

      // Close the popup
      setShowPopup(false);
    } catch (error) {
      predefinedAlerts.backlogItemCreateError();
      console.error("Error creating backlog item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkTitleLimit = useCharacterLimit("Backlog item title", 80);
  // #endregion

  // #region Page Context
  const pageContext = useContext(PageContext);
  const context = {
    ...pageContext,
    popupName: "Backlog Item",
    pageDescription: "Create a backlog item for your project",
    "Backlog item name Field": createForm.name,
    "Backlog item description Field": createForm.description,
    "Page instructions":
      "Write the name and description of the backlog item considering the context of the project",
  };
  // #endregion
  return (
    <PageContext.Provider value={context}>
      <Popup
        show={showPopup}
        saveText="Create item"
        saving={isPending || isSubmitting}
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
        size="large"
        sidebarClassName="basis-[210px]"
        sidebar={
          <>
            <h3 className="mt-4 text-lg font-semibold">Sprint</h3>
            <SprintPicker
              sprintId={createForm.sprint?.id}
              onChange={(sprint) => setCreateForm({ ...createForm, sprint })}
            />

            <div className="mt-4 flex gap-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Priority</h3>
                <PriorityPicker
                  priority={createForm.priority}
                  onChange={(priority) =>
                    setCreateForm({ ...createForm, priority })
                  }
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Size</h3>
                <SizePicker
                  currentSize={
                    createForm.size === "" ? undefined : createForm.size
                  }
                  callback={(size) => setCreateForm({ ...createForm, size })}
                />
              </div>
            </div>

            <BacklogTagList
              tags={createForm.tags}
              onChange={(tags) => setCreateForm({ ...createForm, tags })}
            />
          </>
        }
        title={
          <h1 className="mb-4 text-3xl">
            <span className="font-bold">Create a backlog item</span>
          </h1>
        }
        editMode={true}
        setEditMode={async (editMode) => {
          if (!editMode && !isPending && !isSubmitting)
            await handleCreateBacklogItem();
        }}
        disablePassiveDismiss={isModified()}
      >
        <InputTextField
          id="item-name-field"
          label="Item name"
          value={createForm.name}
          onChange={(e) => {
            if (checkTitleLimit(e.target.value)) {
              setCreateForm({ ...createForm, name: e.target.value });
            }
          }}
          placeholder="Short summary of the item..."
          containerClassName="mb-4"
        />
        <InputTextAreaField
          id="item-description-field"
          label="Item description"
          value={createForm.description}
          onChange={(e) =>
            setCreateForm({ ...createForm, description: e.target.value })
          }
          placeholder="Explain the item in detail..."
          containerClassName="mb-4"
          className="h-[45vh] max-h-[50vh]"
        />
      </Popup>
    </PageContext.Provider>
  );
}
