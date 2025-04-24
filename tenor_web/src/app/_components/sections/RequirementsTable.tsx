import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Tag } from "~/lib/types/firebaseSchemas";
import type { RequirementCol } from "~/server/api/routers/requirements";
import { api } from "~/trpc/react";
import Table, { type TableColumns } from "../table/Table";
import { cn } from "~/lib/utils";
import Popup, { usePopupVisibilityState } from "../Popup";
import PrimaryButton from "../buttons/PrimaryButton";
import InputTextField from "../inputs/InputTextField";
import InputTextAreaField from "../inputs/InputTextAreaField";
import { useAlert } from "~/app/_hooks/useAlert";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import RequirementTypePicker from "../specific-pickers/RequirementTypePicker";
import RequirementFocusPicker from "../specific-pickers/RequirementFocusPicker";
import SearchBar from "../SearchBar";
import { UseFormatForAssignReqTypeScrumId } from "~/app/_hooks/requirementHook";
import DeleteButton from "../buttons/DeleteButton";
import Markdown from "react-markdown";
import LoadingSpinner from "../LoadingSpinner";
import useConfirmation from "~/app/_hooks/useConfirmation";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function RequirementsTable() {
  const { projectId } = useParams();

  const utils = api.useUtils();
  const [renderSmallPopup, showSmallPopup, setShowSmallPopup] =
    usePopupVisibilityState();
  const [requirementEdited, setRequirementEdited] =
    useState<RequirementCol | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });
  const [editingRequirement, setEditingRequirement] = useState(false);

  useEffect(() => {
    if (requirementEdited) {
      setEditForm({
        name: requirementEdited.name ?? "",
        description: requirementEdited.description,
      });
    }
  }, [requirementEdited]);

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

  const confirm = useConfirmation();

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

  const handleEditRequirement = async (
    requirement: RequirementCol,
    checkValues = true,
  ) => {
    let { name, description } = editForm;
    const { priorityId, requirementTypeId, requirementFocusId, scrumId } =
      requirement;
    if (checkValues) {
      if (!name) {
        alert("Oops...", "Requirement Name must have a value.", {
          type: "error",
          duration: 5000, // time in ms (5 seconds)
        });
        return;
      }
      if (
        !priorityId?.id ||
        !requirementTypeId?.id ||
        !requirementFocusId?.id
      ) {
        alert("Oops...", "All properties must have a value.", {
          type: "error",
          duration: 5000, // time in ms (5 seconds)
        });
        return;
      }
    }

    if (!name || !description) {
      name = requirement.name ?? "";
      description = requirement.description;
    }
    // Unwrap values
    const unwrappedPriorityId = priorityId.id;
    const unwrappedRequirementTypeId = requirementTypeId.id;
    const unwrappedRequirementFocusId = requirementFocusId.id;

    const newRequirement = {
      projectId: projectId as string,
      name,
      description,
      priorityId: unwrappedPriorityId ?? "",
      requirementTypeId: unwrappedRequirementTypeId ?? "",
      requirementFocusId: unwrappedRequirementFocusId ?? "",
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

  const { mutateAsync: deleteRequirement } =
    api.requirements.deleteRequirement.useMutation();

  useEffect(() => {
    if (requirements) {
      const query = searchValue.toLowerCase();

      const filtered = requirements.fixedData.filter((req) => {
        const name = req.name?.toLowerCase() ?? "";
        const description = req.description.toLowerCase();

        // Asegúrate de que este hook devuelve un string consistente
        const formattedScrumText = UseFormatForAssignReqTypeScrumId(
          req.requirementTypeId.name,
          req.scrumId,
        ).toLowerCase();

        return (
          name.includes(query) ||
          description.includes(query) ||
          formattedScrumText.includes(query)
        );
      });
      setRequirementsData(filtered);
    }
  }, [requirements, searchValue]);

  const table = useMemo(() => {
    if (requirements == undefined || isLoadingRequirements) {
      return (
        <div className="flex h-full w-full flex-1 items-start justify-center p-10">
          <LoadingSpinner color="primary" />
        </div>
      );
    }

    const tableColumns: TableColumns<RequirementCol> = {
      id: { visible: false },
      scrumId: {
        label: "Id",
        width: 80,
        sortable: true,
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
        sortable: true,
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
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.priorityId?.name ?? "";
        },
        sorter(a, b) {
          if (!a.priorityId && !b.priorityId) return 0;
          if (!a.priorityId) return -1;
          if (!b.priorityId) return 1;
          return a.priorityId?.name.localeCompare(b.priorityId?.name);
        },
        render(row) {
          return (
            <PriorityPicker
              priority={row.priorityId}
              onChange={async (tag: Tag) => {
                setRequirementsData((prevData) =>
                  prevData.map((item) =>
                    item.id === row.id ? { ...item, priorityId: tag } : item,
                  ),
                );
                await handleEditRequirement(
                  {
                    ...row,
                    priorityId: tag,
                  },
                  false,
                );
              }}
            />
          );
        },
      },
      requirementTypeId: {
        label: "Req. Type",
        width: 220,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.requirementTypeId?.name ?? "";
        },
        sorter(a, b) {
          if (!a.requirementTypeId && !b.requirementTypeId) return 0;
          if (!a.requirementTypeId) return -1;
          if (!b.requirementTypeId) return 1;
          return a.requirementTypeId?.name.localeCompare(
            b.requirementTypeId?.name,
          );
        },
        render(row) {
          return (
            <RequirementTypePicker
              type={row.requirementTypeId}
              onChange={async (requirementTypeId) => {
                setRequirementsData((prevData) =>
                  prevData.map((item) =>
                    item.id === row.id
                      ? { ...item, requirementTypeId: requirementTypeId }
                      : item,
                  ),
                );
                await handleEditRequirement(
                  {
                    ...row,
                    requirementTypeId: requirementTypeId,
                  },
                  false,
                );
              }}
            />
          );
        },
      },
      requirementFocusId: {
        label: "Req. Focus",
        width: 250,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.requirementFocusId?.name ?? "";
        },
        sorter(a, b) {
          if (!a.requirementFocusId && !b.requirementFocusId) return 0;
          if (!a.requirementFocusId) return -1;
          if (!b.requirementFocusId) return 1;
          return a.requirementFocusId?.name.localeCompare(
            b.requirementFocusId?.name,
          );
        },
        render(row) {
          return (
            <RequirementFocusPicker
              focus={row.requirementFocusId}
              onChange={async (requirementFocusId) => {
                setRequirementsData((prevData) =>
                  prevData.map((item) =>
                    item.id === row.id
                      ? { ...item, requirementFocusId: requirementFocusId }
                      : item,
                  ),
                );
                await handleEditRequirement(
                  {
                    ...row,
                    requirementFocusId: requirementFocusId,
                  },
                  false,
                );
              }}
            />
          );
        },
      },
    };

    const handleDelete = async (
      ids: string[],
      callback: (del: boolean) => void,
    ) => {
      const confirmMessage =
        ids.length > 1 ? "Delete requirements?" : "Delete requirement?";
      if (
        !(await confirm(
          `Are you sure you want to ${confirmMessage}`,
          "This action cannot be undone",
          "Delete",
        ))
      ) {
        callback(false);
        return;
      }
      callback(true); // call the callback as soon as posible

      const newData = requirementsData.filter((item) => !ids.includes(item.id));

      await utils.requirements.getRequirementsTableFriendly.cancel({
        projectId: params.projectId as string,
      });
      utils.requirements.getRequirementsTableFriendly.setData(
        { projectId: params.projectId as string },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            fixedData: newData,
          };
        },
      );

      //Deletes in database
      await Promise.all(
        ids.map((id) =>
          deleteRequirement({
            projectId: params.projectId as string,
            requirementId: id,
          }),
        ),
      );
      await refetchRequirements();
      return true;
    };

    return (
      <Table
        className={cn("w-full", heightOfContent)}
        data={requirementsData}
        columns={tableColumns}
        onDelete={handleDelete}
        emptyMessage="No requirements found"
        multiselect
        deletable
      />
    );
  }, [requirementsData, isLoadingRequirements]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full justify-between">
        <h2 className="content-center text-3xl font-semibold">Requirements</h2>
        <div className="flex w-3/4 items-center justify-end gap-2">
          <div className="w-1/3 p-2">
            <SearchBar
              placeholder="Find a requirement by title or id..."
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
      {table}
      {renderSmallPopup && (
        <Popup
          show={showSmallPopup}
          reduceTopPadding={requirementEdited === null}
          size="small"
          className="h-[700px] w-[600px]"
          setEditMode={
            requirementEdited !== null
              ? async () => {
                  if (editingRequirement) {
                    setEditingRequirement(false);
                    await handleEditRequirement(requirementEdited);
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
                    requirementEdited ? editForm.name : newRequirement.name
                  }
                  onChange={(e) => {
                    if (requirementEdited) {
                      setEditForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                    } else {
                      handleChange(e);
                    }
                  }}
                  name="name"
                  placeholder="Requirement title"
                />
                <InputTextAreaField
                  label="Description"
                  html-rows="4"
                  className="min-h-[120px] w-full resize-none"
                  value={
                    requirementEdited
                      ? editForm.description
                      : newRequirement.description
                  }
                  onChange={
                    requirementEdited
                      ? (e) => {
                          setEditForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }));
                        }
                      : handleChange
                  }
                  name="description"
                />
                {requirementEdited === null && (
                  <div className="flex gap-2 pt-4">
                    <div className="w-36 space-y-2">
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
                    <div className="w-36 space-y-2">
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
                    <div className="w-36 space-y-2">
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
                <div className="mt-4 text-lg">
                  <Markdown>{requirementEdited.description}</Markdown>
                </div>
                <br />
                <div className="flex gap-2 pt-4">
                  <div className="w-36 space-y-2">
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
                  <div className="w-36 space-y-2">
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
                  <div className="w-36 space-y-2">
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
