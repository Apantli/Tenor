import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { api } from "~/trpc/react";
import Popup from "~/app/_components/Popup";
import { useState } from "react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useEffect } from "react";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useAlert } from "~/app/_hooks/useAlert";
import { useFormatEpicScrumId } from "~/app/_hooks/scumIdHooks";
import CollapsableSearchBar from "../CollapsableSearchBar";

export const ProjectEpics = ({ projectId }: { projectId: string }) => {
  const { mutateAsync: createEpic, isPending: creatingEpic } =
    api.epics.createOrModifyEpic.useMutation();

  // Make a copy to show the loading state
  const { mutateAsync: deleteEpic, isPending: deletingEpic } =
    api.epics.createOrModifyEpic.useMutation();

  const utils = api.useUtils();
  const formatEpicScrumId = useFormatEpicScrumId();

  const [showSmallPopup, setShowSmallPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editEpic, setEditEpic] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [selectedEpic, setSelectedEpic] = useState<number | null>(null);

  const { data: epics } = api.epics.getProjectEpicsOverview.useQuery(
    {
      projectId: projectId,
    },
    { enabled: !!projectId },
  );
  const filteredEpics = epics?.filter((epic) =>
    (epic.name + epic.name + formatEpicScrumId(epic.scrumId))
      .toLowerCase()
      .includes(searchText.toLowerCase()),
  );

  const { data: epic, isLoading: epicLoading } = api.epics.getEpic.useQuery(
    {
      projectId: projectId,
      epicId: selectedEpic ?? 0,
    },
    {
      enabled: !!selectedEpic,
    },
  );

  useEffect(() => {
    if (selectedEpic && epic) {
      setEditEpicName(epic.name || "");
      setEditEpicDescription(epic.description || "");
    }
  }, [selectedEpic, epic]);

  const [newEpicName, setNewEpicName] = useState("");
  const [newEpicDescription, setNewEpicDescription] = useState("");
  const [editEpicName, setEditEpicName] = useState("");
  const [editEpicDescription, setEditEpicDescription] = useState("");

  const confirm = useConfirmation();
  const { alert } = useAlert();

  const isNewEpicModified = () => {
    if (newEpicName !== "") return true;
    if (newEpicDescription !== "") return true;

    return false;
  };

  const isEditEpicModified = () => {
    if (editEpicName !== epic?.name) return true;
    if (editEpicDescription !== epic.description) return true;
    return false;
  };

  const handleCreateDismiss = () => {
    setShowSmallPopup(false);
    setNewEpicName("");
    setNewEpicDescription("");
  };

  const handleEditDismiss = () => {
    setShowEditPopup(false);
    setSelectedEpic(null);
    setEditEpic(false);
    setEditEpicName("");
    setEditEpicDescription("");
  };

  const handleCreateEpic = async () => {
    if (newEpicName === "") {
      alert("Oops", "Please enter a name for the epic.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    if (!creatingEpic) {
      await createEpic({
        projectId: projectId,
        name: newEpicName,
        description: newEpicDescription,
        scrumId: -1,
      });
      await utils.epics.getProjectEpicsOverview.invalidate();
      handleCreateDismiss();
    }
  };
  return (
    <>
      <div className="flex flex-row justify-between gap-2 border-b-2 pb-2">
        <h1 className="text-3xl font-semibold">Epics</h1>
        <CollapsableSearchBar
          searchText={searchText}
          setSearchText={setSearchText}
        ></CollapsableSearchBar>
        <PrimaryButton
          className={
            "h-full w-full max-w-[120px] self-center hover:cursor-pointer"
          }
          onClick={() => setShowSmallPopup(true)}
        >
          + New Epic
        </PrimaryButton>
      </div>
      <div className="flex h-[calc(100vh-250px)] flex-col gap-4 overflow-y-scroll">
        {filteredEpics?.map((epic) => (
          <div
            onClick={() => {
              setSelectedEpic(epic.scrumId);
              setShowEditPopup(true);
            }}
            key={epic.scrumId}
            className="border-b-2 py-3 hover:cursor-pointer"
          >
            <div className="flex flex-col gap-y-2">
              <h3 className="text-xl font-semibold">
                {formatEpicScrumId(epic.scrumId)}
              </h3>
              <p className="text-xl">{epic.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Popup to create epic */}
      <Popup
        show={showSmallPopup}
        size="small"
        className="min-h-[400px] min-w-[500px]"
        dismiss={async () => {
          if (isNewEpicModified()) {
            const confirmation = await confirm(
              "Are you sure?",
              "Your changes will be discarded.",
              "Discard changes",
              "Keep Editing",
            );
            if (!confirmation) return;
          }
          handleCreateDismiss();
        }}
        disablePassiveDismiss={isNewEpicModified()}
        footer={
          <div className="flex gap-2">
            <PrimaryButton
              loading={creatingEpic}
              onClick={async () => {
                if (!creatingEpic) await handleCreateEpic();
              }}
            >
              Create epic
            </PrimaryButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl">
            <strong>EP:</strong>{" "}
          </h1>
          <InputTextField
            type="text"
            placeholder="Your epic name"
            label="Epic name"
            value={newEpicName}
            onChange={(e) => setNewEpicName(e.target.value)}
          />
          <InputTextAreaField
            label="Epic description"
            value={newEpicDescription}
            onChange={(e) => setNewEpicDescription(e.target.value)}
            placeholder="Your epic description"
            className="h-auto w-full"
          />
        </div>
      </Popup>

      {/* Popup to view, modify, or delete epic */}
      <Popup
        show={showEditPopup}
        className="min-h-[400px] min-w-[500px]"
        editMode={editEpic}
        size="small"
        setEditMode={async (editing) => {
          if (editing) {
            setEditEpic(!editEpic);
            return;
          }

          if (epic?.scrumId) {
            if (!creatingEpic) {
              if (editEpicName === "") {
                alert("Oops", "Please enter a name for the epic.", {
                  type: "error",
                  duration: 5000,
                });
                return;
              }
              await createEpic({
                projectId: projectId,
                scrumId: epic?.scrumId,
                name: editEpicName,
                description: editEpicDescription,
              });
              await utils.epics.invalidate();
            }
          } else {
            console.log("Warning: epic not found");
          }
          setEditEpic(!editEpic);
        }}
        saving={creatingEpic}
        disablePassiveDismiss={isEditEpicModified()}
        footer={
          <div className="flex gap-2">
            {editEpic && (
              <>
                <DeleteButton
                  loading={deletingEpic}
                  onClick={async () => {
                    const confirmation = await confirm(
                      "Confirm deletion?",
                      "This is irreversible.",
                      "Delete permanently",
                      "Cancel",
                    );
                    if (!confirmation) return;
                    if (!epic?.scrumId) {
                      console.log("Warning: epic not found");
                      return;
                    }
                    if (!deletingEpic) {
                      await deleteEpic({
                        projectId: projectId,
                        scrumId: epic?.scrumId,
                        name: editEpicName,
                        description: editEpicDescription,
                        deleted: true,
                      });
                      await utils.epics.invalidate();
                      handleEditDismiss();
                    }
                  }}
                >
                  Delete epic
                </DeleteButton>
              </>
            )}
            {!editEpic && (
              <PrimaryButton
                className="mt-32"
                // FIXME: set filted for user stories related to epic
                onClick={() => handleEditDismiss()}
              >
                {" "}
                View user stories{" "}
              </PrimaryButton>
            )}
          </div>
        }
        dismiss={async () => {
          if (isEditEpicModified()) {
            const confirmation = await confirm(
              "Are you sure?",
              "Your changes will be discarded.",
              "Discard changes",
              "Keep Editing",
            );
            if (!confirmation) return;
          }
          handleEditDismiss();
        }}
      >
        {epicLoading ? (
          <div className="flex flex-col items-center gap-y-7">
            <h3 className="text-2xl font-bold">Loading...</h3>
            <LoadingSpinner color="dark" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-baseline gap-x-2">
              <div className="flex flex-row gap-x-2">
                <h1 className="mb-5 text-2xl">
                  <strong>EP{epic?.scrumId}:</strong>{" "}
                </h1>
                {!editEpic && <p className="mr-5 text-2xl">{epic?.name}</p>}
              </div>
              {editEpic && (
                <InputTextField
                  label="Epic name"
                  type="text"
                  placeholder="Your epic name"
                  value={editEpicName}
                  onChange={(e) => setEditEpicName(e.target.value)}
                />
              )}
            </div>

            {editEpic ? (
              <InputTextAreaField
                label="Epic description"
                value={editEpicDescription}
                onChange={(e) => setEditEpicDescription(e.target.value)}
                placeholder="Your epic descriptions"
                className="h-auto w-full"
              />
            ) : (
              <p>{epic?.description}</p>
            )}
          </div>
        )}
      </Popup>
    </>
  );
};
