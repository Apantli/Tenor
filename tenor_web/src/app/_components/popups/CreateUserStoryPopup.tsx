"use client";

import React, { useContext, useState } from "react";
import Popup from "~/app/_components/Popup";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useParams } from "next/navigation";
import DependencyListUserStory from "../inputs/DependencyListUserStory";
import EpicPicker from "~/app/_components/inputs/pickers/EpicPicker";
import type { Size, Sprint, Tag, WithId } from "~/lib/types/firebaseSchemas";
import type { ExistingEpic, UserStoryPreview } from "~/lib/types/detailSchemas";
import PriorityPicker from "~/app/_components/inputs/pickers/PriorityPicker";
import BacklogTagList from "~/app/_components/BacklogTagList";
import { SizePicker } from "~/app/_components/inputs/pickers/SizePicker";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { useInvalidateQueriesAllUserStories } from "~/app/_hooks/invalidateHooks";
import { TRPCClientError } from "@trpc/client";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";
import { SprintPicker } from "../inputs/pickers/SprintPicker";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import { PageContext } from "~/app/_hooks/usePageContext";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  onUserStoryAdded: (userStoryId: string) => void;
}

export default function CreateUserStoryPopup({
  showPopup,
  setShowPopup,
  onUserStoryAdded,
}: Props) {
  const { projectId } = useParams();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();

  const { mutateAsync: createUserStory, isPending } =
    api.userStories.createUserStory.useMutation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    acceptanceCriteria: string;
    tags: Tag[];
    priority?: Tag;
    size?: Size | "";
    epic?: ExistingEpic;
    sprint?: WithId<Sprint>;
    dependencies: UserStoryPreview[];
    requiredBy: UserStoryPreview[];
  }>({
    name: "",
    description: "",
    acceptanceCriteria: "",
    tags: [],
    priority: undefined,
    size: undefined,
    epic: undefined,
    sprint: undefined,
    dependencies: [],
    requiredBy: [],
  });

  const confirm = useConfirmation();
  const { predefinedAlerts } = useAlert();

  const isModified = () => {
    if (createForm.name !== "") return true;
    if (createForm.description !== "") return true;
    if (createForm.acceptanceCriteria !== "") return true;
    if (createForm.size !== undefined) return true;
    if (createForm.epic !== undefined) return true;
    if (createForm.priority !== undefined) return true;
    if (createForm.sprint !== undefined) return true;
    if (createForm.dependencies.length > 0) return true;
    if (createForm.requiredBy.length > 0) return true;
    if (createForm.tags.length > 0) return true;
    return false;
  };

  const handleCreateUserStory = async () => {
    if (createForm.name === "") {
      predefinedAlerts.userStoryNameError();
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting || isPending) return;

    try {
      setIsSubmitting(true);

      const { id: userStoryId } = await createUserStory({
        projectId: projectId as string,
        userStoryData: {
          name: createForm.name,
          description: createForm.description,
          acceptanceCriteria: createForm.acceptanceCriteria,
          tagIds: createForm.tags
            .map((tag) => tag.id)
            .filter((val) => val !== undefined),
          priorityId: createForm.priority?.id,
          size: createForm.size,
          epicId: createForm.epic?.id ?? "",
          sprintId: createForm.sprint?.id ?? "",
          requiredByIds: createForm.requiredBy.map((us) => us.id),
          dependencyIds: createForm.dependencies.map((us) => us.id),
        },
      });

      onUserStoryAdded(userStoryId);

      await invalidateQueriesAllUserStories(projectId as string);

      // Close the popup
      setShowPopup(false);
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.data?.code === "BAD_REQUEST"
      ) {
        predefinedAlerts.cyclicDependency();
        return;
      }
      predefinedAlerts.userStoryCreateError();
      console.error("Error creating user story:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkTitleLimit = useCharacterLimit("User story title", 80);

  // #region Page Context
  const pageContext = useContext(PageContext);
  const context = {
    ...pageContext,
    pageName: "User Stories",
    popupName: "Create User Story",
    "User story name Field": createForm.name,
    "User story description field": createForm.description,
    "User story acceptance criteria field": createForm.acceptanceCriteria,
  };
  // #endregion

  return (
    <PageContext.Provider value={context}>
      <Popup
        show={showPopup}
        saveText="Create story"
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
            <h3 className="text-lg font-semibold">Epic</h3>
            <EpicPicker
              epic={createForm.epic}
              onChange={(epic) => {
                setCreateForm({ ...createForm, epic });
              }}
            />

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

            <DependencyListUserStory
              label="Dependencies"
              userStories={createForm.dependencies}
              onChange={(dependencies) =>
                setCreateForm({ ...createForm, dependencies })
              }
            />
            <DependencyListUserStory
              label="Required by"
              userStories={createForm.requiredBy}
              onChange={(requiredBy) =>
                setCreateForm({ ...createForm, requiredBy })
              }
            />
          </>
        }
        title={
          <h1 className="mb-4 text-3xl">
            <span className="font-bold">Create a user story</span>
          </h1>
        }
        editMode={true}
        setEditMode={async (editMode) => {
          if (!editMode && !isPending && !isSubmitting)
            await handleCreateUserStory();
        }}
        disablePassiveDismiss={isModified()}
      >
        <InputTextField
          id="story-name-field"
          label="Story name"
          value={createForm.name}
          onChange={(e) => {
            if (checkTitleLimit(e.target.value)) {
              setCreateForm({ ...createForm, name: e.target.value });
            }
          }}
          placeholder="Short summary of the story..."
          containerClassName="mb-4"
        />
        <InputTextAreaField
          id="story-description-field"
          label="Story description"
          value={createForm.description}
          onChange={(e) =>
            setCreateForm({ ...createForm, description: e.target.value })
          }
          placeholder="Explain the story in detail..."
          containerClassName="mb-4"
        />
        <InputTextAreaField
          id="story-criteria-field"
          chatPosition="right"
          label="Acceptance Criteria"
          value={createForm.acceptanceCriteria}
          onChange={(e) =>
            setCreateForm({ ...createForm, acceptanceCriteria: e.target.value })
          }
          placeholder="Describe the work that needs to be done..."
          className="h-36 min-h-36"
        />
      </Popup>
    </PageContext.Provider>
  );
}
