import { api } from "~/trpc/react";
import Popup from "~/app/_components/Popup";
import { useMemo, useRef, useState } from "react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useEffect } from "react";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { useAlert } from "~/app/_hooks/useAlert";
import { useFormatEpicScrumId } from "~/app/_hooks/scrumIdHooks";
import Markdown from "react-markdown";
import DeleteButton from "~/app/_components/inputs/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import { useParams } from "next/navigation";
import {
  type Permission,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import NoEpicsIcon from "@mui/icons-material/FormatListBulleted";
import SearchBar from "~/app/_components/inputs/search/SearchBar";
import SecondaryButton from "~/app/_components/inputs/buttons/SecondaryButton";
import { checkPermissions } from "~/lib/defaultValues/permission";
import { emptyRole } from "~/lib/defaultValues/roles";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";
import SidebarToggleIcon from "~/app/_components/SidebarToggleIcon";
import { cn } from "~/lib/utils";

interface Props {
  setShowEpics: (value: boolean) => void;
  showEpics: boolean;
}

export const ProjectEpics = ({ setShowEpics, showEpics }: Props) => {
  // #region Hooks
  const { projectId } = useParams();
  const utils = api.useUtils();
  const confirm = useConfirmation();
  const { predefinedAlerts } = useAlert();
  const formatEpicScrumId = useFormatEpicScrumId();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // #endregion

  // #region TRPC
  const { mutateAsync: createEpic, isPending: creatingEpic } =
    api.epics.createOrModifyEpic.useMutation();
  const { data: epics, isLoading } = api.epics.getEpics.useQuery(
    { projectId: projectId as string },
    { enabled: !!projectId },
  );

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["backlog"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  // Make a copy to show the loading state
  const { mutateAsync: deleteEpic, isPending: deletingEpic } =
    api.epics.createOrModifyEpic.useMutation();

  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const { data: epic, isLoading: epicLoading } = api.epics.getEpic.useQuery(
    {
      projectId: projectId as string,
      epicId: selectedEpic ?? "",
    },
    {
      enabled: !!selectedEpic,
    },
  );

  // #endregion

  // #region REACT
  const [showSmallPopup, setShowSmallPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editEpic, setEditEpic] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [newEpicName, setNewEpicName] = useState("");
  const [newEpicDescription, setNewEpicDescription] = useState("");
  const [editEpicName, setEditEpicName] = useState("");
  const [editEpicDescription, setEditEpicDescription] = useState("");

  useEffect(() => {
    if (selectedEpic && epic) {
      setEditEpicName(epic.name || "");
      setEditEpicDescription(epic.description || "");
    }
  }, [selectedEpic, epic]);
  // #endregion

  // #region UTILITY
  const filteredEpics = epics?.filter((epic) =>
    (epic.name + epic.name + formatEpicScrumId(epic.scrumId))
      .toLowerCase()
      .includes(searchText.toLowerCase()),
  );

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
    timeoutRef.current = setTimeout(() => {
      setNewEpicName("");
      setNewEpicDescription("");
    }, 300);
  };

  const handleEditDismiss = () => {
    setShowEditPopup(false);
    timeoutRef.current = setTimeout(() => {
      setSelectedEpic(null);
      setEditEpic(false);
      setEditEpicName("");
      setEditEpicDescription("");
    }, 300);
  };

  const handleCreateEpic = async () => {
    if (newEpicName === "") {
      predefinedAlerts.epicNameError();
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

  const checkTitleLimit = useCharacterLimit("Epic name", 80);
  // #endregion

  return (
    <>
      <div className="flex w-full items-center justify-between pb-5 pl-5 pr-0">
        <div
          className={cn("flex items-center gap-4", {
            relative: !showEpics,
          })}
        >
          <SidebarToggleIcon
            flipped
            setSidebarShown={setShowEpics}
            sidebarShown={showEpics}
            label="epics"
          />
          {showEpics && (
            <h1 className={cn("text-3xl font-semibold", {})}>Epics</h1>
          )}
          {!showEpics && (
            <h1 className="absolute -left-[5px] top-[40px] break-words font-medium text-gray-600">
              Epics
            </h1>
          )}
        </div>
        {permission >= permissionNumbers.write && showEpics && (
          <PrimaryButton onClick={() => setShowSmallPopup(true)}>
            + New Epic
          </PrimaryButton>
        )}
      </div>
      {showEpics && (
        <div className="h-full pl-5">
          <div className="flex flex-row justify-between gap-1 border-b-2 pb-5">
            <SearchBar
              searchValue={searchText}
              handleUpdateSearch={(e) => setSearchText(e.target.value)}
              placeholder="Search epics"
            ></SearchBar>
          </div>
          <div className="flex h-full flex-col overflow-y-auto">
            {!isLoading && epics?.length === 0 && (
              <div className="mt-[calc(40vh-230px)] flex w-full items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                  <span className="-mb-10 text-[100px] text-gray-500">
                    <NoEpicsIcon fontSize="inherit" />
                  </span>
                  <h1 className="mb-5 text-3xl font-semibold text-gray-500">
                    No epics yet
                  </h1>
                  {permission >= permissionNumbers.write && (
                    <PrimaryButton
                      onClick={() => {
                        setShowSmallPopup(true);
                      }}
                    >
                      Create your first epic
                    </PrimaryButton>
                  )}
                </div>
              </div>
            )}
            {filteredEpics?.map((epic) => (
              <div
                onClick={() => {
                  clearTimeout(timeoutRef.current!);
                  setSelectedEpic(epic.id);
                  setShowEditPopup(true);
                }}
                key={epic.scrumId}
                className="border-b-2 px-3 py-4 transition hover:cursor-pointer hover:bg-gray-100"
              >
                <div className="flex flex-col gap-y-2">
                  <h3 className="text-xl font-semibold">
                    {formatEpicScrumId(epic.scrumId)}
                  </h3>
                  <p className="text-xl">{epic.name}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex h-[calc(100%-200px)] w-full flex-col items-center justify-center">
                <LoadingSpinner color="primary" />
              </div>
            )}
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
                id="epic-name-field"
                type="text"
                placeholder="Briefly describe your epic..."
                label="Epic name"
                value={newEpicName}
                onChange={(e) => {
                  if (checkTitleLimit(e.target.value)) {
                    setNewEpicName(e.target.value);
                  }
                }}
              />
              <InputTextAreaField
                id="epic-description-field"
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
            className="h-[400px] w-[500px]"
            editMode={
              permission >= permissionNumbers.write ? editEpic : undefined
            }
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
                    predefinedAlerts.epicNameError();
                    return;
                  }

                  await utils.epics.getEpic.cancel({
                    projectId: projectId as string,
                    epicId: epic?.id ?? "",
                  });

                  utils.epics.getEpic.setData(
                    {
                      projectId: projectId as string,
                      epicId: epic?.id ?? "",
                    },
                    (oldData) => {
                      if (!oldData) return oldData;
                      return {
                        ...epic,
                        name: editEpicName,
                        description: editEpicDescription,
                      };
                    },
                  );

                  setEditEpic(!editEpic);

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
                    // FIXME: Implement permission
                    onClick={() => handleEditDismiss()}
                  >
                    Show user stories
                  </SecondaryButton>
                )}

                {permission >= permissionNumbers.write && (
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
            <div className="grow">
              {epicLoading && (
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <LoadingSpinner color="primary" />
                </div>
              )}

              {!epicLoading && editEpic && (
                <div className="flex flex-col gap-4">
                  <InputTextField
                    id="epic-name-field"
                    label="Epic name"
                    type="text"
                    placeholder="Your epic name"
                    value={editEpicName}
                    onChange={(e) => {
                      if (checkTitleLimit(e.target.value)) {
                        setEditEpicName(e.target.value);
                      }
                    }}
                  />
                  <InputTextAreaField
                    id="epic-description-field"
                    label="Epic description"
                    value={editEpicDescription}
                    onChange={(e) => setEditEpicDescription(e.target.value)}
                    placeholder="Your epic description"
                    className="h-auto min-h-24 w-full resize-none"
                  />
                </div>
              )}

              {!epicLoading && !editEpic && (
                <>
                  {epic?.description == "" ? (
                    <p className="text-lg italic text-gray-500">
                      No description provided.
                    </p>
                  ) : (
                    <div className="markdown-content text-lg">
                      <Markdown>{epic?.description ?? ""}</Markdown>
                    </div>
                  )}
                </>
              )}
            </div>
          </Popup>
        </div>
      )}
    </>
  );
};
