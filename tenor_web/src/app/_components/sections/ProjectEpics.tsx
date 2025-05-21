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
import { useFormatEpicScrumId } from "~/app/_hooks/scrumIdHooks";
import Markdown from "react-markdown";
import SecondaryButton from "../buttons/SecondaryButton";
import SearchBar from "../SearchBar";
import { useParams } from "next/navigation";
import NoEpicsIcon from "@mui/icons-material/FormatListBulleted";

export const ProjectEpics = () => {
  const { projectId } = useParams();
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

  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);

  const { data: epics, isLoading } = api.epics.getEpics.useQuery(
    {
      projectId: projectId as string,
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
      projectId: projectId as string,
      epicId: selectedEpic ?? "",
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
      alert("Oops...", "Please enter a name for the epic.", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    if (!creatingEpic) {
      await createEpic({
        projectId: projectId as string,
        epicData: {
          name: newEpicName,
          description: newEpicDescription,
          scrumId: -1,
        },
      });
      await utils.epics.getEpics.invalidate();
      handleCreateDismiss();
    }
  };
  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex justify-between">
          <h1 className="text-3xl font-semibold">Epics</h1>
          <PrimaryButton onClick={() => setShowSmallPopup(true)}>
            + New Epic
          </PrimaryButton>
        </div>
        <div className="flex flex-row justify-between gap-1 border-b-2 pb-5">
          <SearchBar
            searchValue={searchText}
            handleUpdateSearch={(e) => setSearchText(e.target.value)}
            placeholder="Search epics"
          ></SearchBar>
        </div>
        <div className="flex h-[calc(100vh-230px)] flex-col gap-4 overflow-y-auto">
          {!isLoading && epics?.length === 0 && (
            <div className="mt-[calc(40vh-230px)] flex w-full items-center justify-center">
              <div className="flex flex-col items-center gap-5">
                <span className="-mb-10 text-[100px] text-gray-500">
                  <NoEpicsIcon fontSize="inherit" />
                </span>
                <h1 className="mb-5 text-3xl font-semibold text-gray-500">
                  No epics yet
                </h1>
                <PrimaryButton
                  onClick={() => {
                    setShowSmallPopup(true);
                  }}
                >
                  Create your first epic
                </PrimaryButton>
              </div>
            </div>
          )}
          {filteredEpics?.map((epic) => (
            <div
              onClick={() => {
                setSelectedEpic(epic.id);
                setShowEditPopup(true);
              }}
              key={epic.scrumId}
              className="border-b-2 pb-4 hover:cursor-pointer"
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
      </div>

      {/* Popup to create epic */}
      <Popup
        show={showSmallPopup}
        size="small"
        className="min-h-[400px] min-w-[500px]"
        reduceTopPadding={true}
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
            <strong>Create new epic</strong>{" "}
          </h1>
          <InputTextField
            type="text"
            placeholder="Briefly describe your epic..."
            label="Epic name"
            value={newEpicName}
            onChange={(e) => setNewEpicName(e.target.value)}
          />
          <InputTextAreaField
            label="Epic description"
            value={newEpicDescription}
            onChange={(e) => setNewEpicDescription(e.target.value)}
            placeholder="Explain the purpose of this epic..."
            className="h-auto w-full"
          />
        </div>
      </Popup>

      {/* Popup to view, modify, or delete epic */}
      <Popup
        show={showEditPopup}
        className="h-[400px] min-w-[500px]"
        editMode={editEpic}
        size="small"
        data-cy="popup-detail-epic"
        title={
          <>
            <h1 className="mb-4 text-3xl">
              <span className="font-bold">
                {epic?.scrumId
                  ? formatEpicScrumId(epic.scrumId) + ":"
                  : ""}{" "}
              </span>
              {epic?.name}
            </h1>
          </>
        }
        setEditMode={async (editing) => {
          if (editing) {
            setEditEpic(!editEpic);
            return;
          }

          if (epic?.scrumId) {
            if (!creatingEpic) {
              if (editEpicName === "") {
                alert("Oops...", "Please enter a name for the epic.", {
                  type: "error",
                  duration: 5000,
                });
                return;
              }
              await createEpic({
                projectId: projectId as string,
                epicId: epic?.id,
                epicData: {
                  name: editEpicName,
                  description: editEpicDescription,
                  scrumId: epic?.scrumId,
                },
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
          <div className="flex items-start gap-2">
            {!editEpic && (
              <SecondaryButton
                // FIXME: set filter for user stories related to epic
                onClick={() => handleEditDismiss()}
              >
                Show user stories
              </SecondaryButton>
            )}

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
                    projectId: projectId as string,

                    epicId: epic?.id,

                    epicData: {
                      scrumId: epic?.scrumId,
                      name: editEpicName,
                      description: editEpicDescription,
                      deleted: true,
                    },
                  });
                  await utils.epics.invalidate();
                  handleEditDismiss();
                }
              }}
            >
              Delete epic
            </DeleteButton>
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
        <div className="grow pt-3">
          {epicLoading && (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <LoadingSpinner color="primary" />
            </div>
          )}

          {!epicLoading && editEpic && (
            <>
              <InputTextField
                label="Epic name"
                type="text"
                placeholder="Your epic name"
                value={editEpicName}
                onChange={(e) => setEditEpicName(e.target.value)}
              />
              <InputTextAreaField
                label="Epic description"
                value={editEpicDescription}
                onChange={(e) => setEditEpicDescription(e.target.value)}
                placeholder="Your epic description"
                className="h-auto min-h-24 w-full resize-none"
              />
            </>
          )}

          {!epicLoading && !editEpic && (
            <>
              {epic?.description == "" ? (
                <p className="italic text-gray-500">No description provided.</p>
              ) : (
                <div className="markdown-content text-ld">
                  <Markdown>{epic?.description ?? ""}</Markdown>
                </div>
              )}
            </>
          )}
        </div>
      </Popup>
    </>
  );
};
