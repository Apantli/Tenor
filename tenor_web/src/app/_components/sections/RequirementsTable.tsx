import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Size, Tag } from "~/lib/types/firebaseSchemas";
import { RequirementCol } from "~/server/api/routers/requirements";
import { api } from "~/trpc/react";
import Table, { TableColumns } from "../table/Table";
import PillComponent from "../PillComponent";
import { cn } from "~/lib/utils";
import Popup, { usePopupVisibilityState } from "../Popup";
import PrimaryButton from "../buttons/PrimaryButton";
import PillPickerComponent from "../PillPickerComponent";
import InputTextField from "../inputs/InputTextField";
import InputTextAreaField from "../inputs/InputTextAreaField";
import { useAlert } from "~/app/_hooks/useAlert";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import RequirementTypePicker from "../specific-pickers/RequirementTypePicker";
import RequirementFocusPicker from "../specific-pickers/RequirementFocusPicker";
import SearchBar from "../SearchBar";
import EditIcon from "@mui/icons-material/Edit";
import { set } from "node_modules/cypress/types/lodash";
import { Label } from "recharts";
import { UseFormatForAssignReqTypeScrumId } from "~/app/_hooks/requirementHook";
import TagComponent from "../TagComponent";
import DeleteButton from "../buttons/DeleteButton";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function RequirementsTable() {
  const { projectId } = useParams();

  const utils = api.useUtils();
  const [renderSmallPopup, showSmallPopup, setShowSmallPopup] =
    usePopupVisibilityState();
  const [requirementEdited, setRequirementEdited] =
    useState<RequirementCol | null>(null);
  const [editingRequirement, setEditingRequirement] = useState(false);

  //Hooks
  const params = useParams();
  const [requirementsData, setRequirementsData] = useState<RequirementCol[]>(
    [],
  );

  const [searchValue, setSearchValue] = useState("");

  // New requirement values
  const defaultRequirement = {
    name: "",
    description: "",
    priorityId: undefined as Tag | undefined,
    requirementTypeId: undefined as Tag | undefined,
    requirementFocusId: undefined as Tag | undefined,
  };
  const [newRequirement, setNewRequirement] = useState(defaultRequirement);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNewRequirement((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { alert } = useAlert();
  const { mutateAsync: createOrModifyRequirement, isPending } =
    api.requirements.createOrModifyRequirement.useMutation();
  const handleCreateRequirement = async () => {
    const {
      priorityId,
      requirementTypeId,
      requirementFocusId,
      name,
      description,
    } = newRequirement;

    if (!name) {
      alert("Oops...", "Requirement Name must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    if (!priorityId?.id || !requirementTypeId?.id || !requirementFocusId?.id) {
      alert("Oops...", "All Properties must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    // Unwrap values
    const unwrappedPriorityId = priorityId.id;
    const unwrappedRequirementTypeId = requirementTypeId.id;
    const unwrappedRequirementFocusId = requirementFocusId.id;

    const response = await createOrModifyRequirement({
      projectId: projectId as string,
      name,
      description,
      priorityId: unwrappedPriorityId,
      requirementTypeId: unwrappedRequirementTypeId,
      requirementFocusId: unwrappedRequirementFocusId,
      scrumId: -1,
      deleted: false,
    });

    await utils.requirements.getRequirementsTableFriendly.invalidate({
      projectId: projectId as string,
    });

    setNewRequirement(defaultRequirement);

    setShowSmallPopup(false);
    console.log(response);
  };

  const handleEditRequirement = async (requirement: RequirementCol) => {
    const {
      priorityId,
      requirementTypeId,
      requirementFocusId,
      name,
      description,
      scrumId,
    } = requirement;
    if (!name) {
      alert("Oops...", "Requirement Name must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }
    if (!priorityId?.id || !requirementTypeId?.id || !requirementFocusId?.id) {
      alert("Oops...", "All Properties must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }
    // Unwrap values
    const unwrappedPriorityId = priorityId.id;
    const unwrappedRequirementTypeId = requirementTypeId.id;
    const unwrappedRequirementFocusId = requirementFocusId.id;

    const newRequirement = {
      projectId: projectId as string,
      name,
      description,
      priorityId: unwrappedPriorityId,
      requirementTypeId: unwrappedRequirementTypeId,
      requirementFocusId: unwrappedRequirementFocusId,
      scrumId,
      deleted: false,
    };

    await utils.requirements.getRequirement.cancel({
      projectId: projectId as string,
      requirementId: requirement.id,
    });

    const response = await createOrModifyRequirement(newRequirement);

    await utils.requirements.getRequirementsTableFriendly.invalidate({
      projectId: projectId as string,
    });

    console.log(response);
  };

  // TRPC
  const {
    data: requirements,
    isLoading: isLoadingRequirements,
    refetch: refetchRequirements,
  } = api.requirements.getRequirementsTableFriendly.useQuery({
    projectId: params.projectId as string,
  });

  useEffect(() => {
    if (requirements) {
      setRequirementsData(requirements.fixedData);
    }
  }, [requirements]);

  const getTable = () => {
    if (requirements == undefined || isLoadingRequirements) {
      return <div>Loading...</div>;
    }

    if (requirementsData?.length == 0) {
      return <div>No Requirements found</div>;
    }

    const tableColumns: TableColumns<RequirementCol> = {
      id: { visible: false },
      scrumId: {
        label: "Id",
        width: 80,
        sortable: false,
        render(row) {
          return (
            <button
              className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
              onClick={() => {
                setEditingRequirement(false);
                setRequirementEdited(row);
                setShowSmallPopup(true);
              }}
            >
              {UseFormatForAssignReqTypeScrumId(
                row.requirementTypeId.name,
                row.scrumId,
              )}
            </button>
          );
        },
      },
      name: {
        label: "Title",
        width: 450,
        sortable: false,
        render(row) {
          return (
            <button
              className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
              onClick={() => {
                setEditingRequirement(false);
                setRequirementEdited(row);
                setShowSmallPopup(true);
              }}
            >
              {row.name}
            </button>
          );
        },
      },
      description: {
        visible: false,
      },
      priorityId: {
        label: "Priority",
        width: 120,
        render(row) {
          return (
            <span className="flex w-32 justify-start">
              <PriorityPicker
                priority={row.priorityId}
                // FIXME: Change value in DB
                onChange={async (tag: Tag) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id ? { ...item, priorityId: tag } : item,
                    ),
                  );
                  await handleEditRequirement({
                    ...row,
                    priorityId: tag,
                  });
                }}
              />
            </span>
          );
        },
      },
      requirementTypeId: {
        label: "Req. Type",
        width: 220,
        render(row) {
          return (
            <span className="flex w-full justify-start">
              <RequirementTypePicker
                type={row.requirementTypeId}
                // FIXME: Change value in DB
                onChange={async (requirementTypeId) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id
                        ? { ...item, requirementTypeId: requirementTypeId }
                        : item,
                    ),
                  );
                  await handleEditRequirement({
                    ...row,
                    requirementTypeId: requirementTypeId,
                  });
                }}
              />
            </span>
          );
        },
      },
      requirementFocusId: {
        label: "Req. Focus",
        width: 250,
        render(row) {
          return (
            <span className="flex w-full justify-start">
              <RequirementFocusPicker
                focus={row.requirementFocusId}
                // FIXME: Change value in DB
                onChange={async (requirementFocusId) => {
                  setRequirementsData((prevData) =>
                    prevData.map((item) =>
                      item.id === row.id
                        ? { ...item, requirementFocusId: requirementFocusId }
                        : item,
                    ),
                  );
                  await handleEditRequirement({
                    ...row,
                    requirementFocusId: requirementFocusId,
                  });
                }}
              />
            </span>
          );
        },
      },
    };

    return (
      <Table
        className={cn("w-full", heightOfContent)}
        data={requirementsData}
        columns={tableColumns}
        multiselect
        deletable
        onDelete={(ids) => console.log("Deleted", ids)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full justify-between">
        <h2 className="text-3xl font-semibold">Requirements</h2>
        <div className="flex w-3/4 items-center justify-end gap-2">
          <div className="w-1/3 p-2">
            <SearchBar
              placeholder="Search..."
              searchValue={searchValue}
              handleUpdateSearch={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <PrimaryButton
            onClick={() => {
              setEditingRequirement(false);
              setRequirementEdited(null);
              setNewRequirement(defaultRequirement);
              setShowSmallPopup(true);
            }}
          >
            + Add Requirement
          </PrimaryButton>
        </div>
      </div>
      {getTable()}
      {renderSmallPopup && (
        <Popup
          show={showSmallPopup}
          reduceTopPadding
          size="small"
          className="h-[700px] w-[600px]"
          setEditMode={
            requirementEdited !== null
              ? async () => {
                  if (editingRequirement) {
                    await handleEditRequirement(requirementEdited);
                    setEditingRequirement(false);
                  } else {
                    setEditingRequirement(true);
                  }
                }
              : () => {}
          }
          editMode={requirementEdited ? editingRequirement : undefined}
          dismiss={() => {
            setShowSmallPopup(false);
          }}
          title={
            <h1 className="text-2xl">
              <strong>
                {requirementEdited ? (
                  <h1 className="font-semibold">
                    {UseFormatForAssignReqTypeScrumId(
                      requirementEdited.requirementTypeId.name,
                      requirementEdited.scrumId,
                    )}
                    :{" "}
                    <span className="font-normal">
                      {requirementEdited.name}
                    </span>
                  </h1>
                ) : (
                  <h1>New Requirement</h1>
                )}
              </strong>{" "}
            </h1>
          }
          footer={
            <div className="flex gap-2">
              {requirementEdited ? (
                // FIXME add delete functionality (NEW PR)
                <DeleteButton
                  onClick={async () => {
                    console.log("Deleting");
                  }}
                >
                  Delete
                </DeleteButton>
              ) : (
                <PrimaryButton
                  onClick={async () => {
                    await handleCreateRequirement();
                    setShowSmallPopup(false);
                  }}
                  loading={isPending}
                >
                  Create Requirement
                </PrimaryButton>
              )}
            </div>
          }
        >
          {" "}
          <div className="flex flex-col gap-4">
            {!requirementEdited || editingRequirement ? (
              <div>
                <InputTextField
                  label="Title"
                  className="mb-4 h-12"
                  value={
                    requirementEdited
                      ? requirementEdited.name
                      : newRequirement.name
                  }
                  onChange={
                    requirementEdited
                      ? (e) => {
                          setRequirementEdited((prev) => ({
                            ...prev!,
                            name: e.target.value,
                          }));
                        }
                      : handleChange
                  }
                  name="name"
                  placeholder="Requirement title"
                />
                <InputTextAreaField
                  label="Description"
                  html-rows="4"
                  className="min-h-[120px] w-full resize-none"
                  value={
                    requirementEdited
                      ? requirementEdited.description
                      : newRequirement.description
                  }
                  onChange={
                    requirementEdited
                      ? (e) => {
                          setRequirementEdited((prev) => ({
                            ...prev!,
                            description: e.target.value,
                          }));
                        }
                      : handleChange
                  }
                  name="description"
                />
                {requirementEdited === null && (
                  <div className="flex gap-2 pt-4">
                    <div className="w-full space-y-2">
                      <label className="text-sm font-semibold">Priority</label>
                      <PriorityPicker
                        priority={newRequirement.priorityId}
                        onChange={async (priority) => {
                          setNewRequirement((prev) => ({
                            ...prev,
                            priorityId: priority,
                          }));
                        }}
                      />
                    </div>
                    <div className="w-full space-y-2">
                      <label className="text-sm font-semibold">Type</label>
                      <RequirementTypePicker
                        type={newRequirement.requirementTypeId}
                        onChange={async (type) => {
                          setNewRequirement((prev) => ({
                            ...prev,
                            requirementTypeId: type,
                          }));
                        }}
                      />
                    </div>
                    <div className="w-full space-y-2">
                      <label className="text-sm font-semibold">Focus</label>
                      <RequirementFocusPicker
                        focus={newRequirement.requirementFocusId}
                        onChange={async (focus) => {
                          setNewRequirement((prev) => ({
                            ...prev,
                            requirementFocusId: focus,
                          }));
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg">{requirementEdited.description}</p>
                <br />
                <div className="flex gap-2 pt-4">
                  <div className="w-full space-y-2">
                    <label className="text-sm font-semibold">Priority</label>
                    <PriorityPicker
                      priority={
                        requirementEdited
                          ? requirementEdited.priorityId
                          : newRequirement.priorityId
                      }
                      onChange={async (priority) => {
                        if (!requirementEdited) {
                          setNewRequirement((prev) => ({
                            ...prev,
                            priorityId: priority,
                          }));
                        } else {
                          setRequirementEdited((prev) => ({
                            ...prev!,
                            priorityId: priority,
                          }));
                          await handleEditRequirement({
                            ...requirementEdited,
                            priorityId: priority,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="w-[160px] space-y-2">
                    <label className="text-sm font-semibold">Type</label>
                    <RequirementTypePicker
                      type={
                        requirementEdited
                          ? requirementEdited.requirementTypeId
                          : newRequirement.requirementTypeId
                      }
                      onChange={async (type) => {
                        if (!requirementEdited) {
                          setNewRequirement((prev) => ({
                            ...prev,
                            requirementTypeId: type,
                          }));
                        } else {
                          setRequirementEdited((prev) => ({
                            ...prev!,
                            requirementTypeId: type,
                          }));
                          await handleEditRequirement({
                            ...requirementEdited,
                            requirementTypeId: type,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="w-full space-y-2">
                    <label className="text-sm font-semibold">Focus</label>
                    <RequirementFocusPicker
                      focus={
                        requirementEdited
                          ? requirementEdited.requirementFocusId
                          : newRequirement.requirementFocusId
                      }
                      onChange={async (focus) => {
                        if (!requirementEdited) {
                          setNewRequirement((prev) => ({
                            ...prev,
                            requirementFocusId: focus,
                          }));
                        } else {
                          setRequirementEdited((prev) => ({
                            ...prev!,
                            requirementFocusId: focus,
                          }));
                          await handleEditRequirement({
                            ...requirementEdited,
                            requirementFocusId: focus,
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Popup>
      )}
    </div>
  );
}
