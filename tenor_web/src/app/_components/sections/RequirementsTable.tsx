import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  permissionNumbers,
  type Permission,
  type Tag,
  type WithId,
} from "~/lib/types/firebaseSchemas";
import type { requirementsRouter } from "~/server/api/routers/requirements";
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
import AiGeneratorDropdown from "../ai/AiGeneratorDropdown";
import useGhostTableStateManager from "~/app/_hooks/useGhostTableStateManager";
import type { inferRouterOutputs } from "@trpc/server";
import AiIcon from "@mui/icons-material/AutoAwesome";

import {
  useInvalidateQueriesAllRequirements,
  useInvalidateQueriesRequirementDetails,
} from "~/app/_hooks/invalidateHooks";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import TertiaryButton from "../buttons/TertiaryButton";
import { checkPermissions, emptyRole, noTag } from "~/lib/defaultProjectValues";
import type { RequirementCol } from "~/lib/types/columnTypes";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function RequirementsTable() {
  const { projectId } = useParams();

  const utils = api.useUtils();
  const [renderSmallPopup, showSmallPopup, setShowSmallPopup] =
    usePopupVisibilityState();
  const [requirementEdited, setRequirementEdited] =
    useState<RequirementCol | null>(null);
  const [ghostRequirementEdited, setGhostRequirementEdited] =
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
    } else if (ghostRequirementEdited) {
      setEditForm({
        name: ghostRequirementEdited.name ?? "",
        description: ghostRequirementEdited.description,
      });
    }
  }, [requirementEdited, ghostRequirementEdited]);

  //Hooks
  const params = useParams();
  const [requirementsData, setRequirementsData] = useState<RequirementCol[]>(
    [],
  );
  const generatedRequirements =
    useRef<
      WithId<
        inferRouterOutputs<
          typeof requirementsRouter
        >["generateRequirements"][number]
      >[]
    >();

  const [searchValue, setSearchValue] = useState("");
  const invalidateAllRequirements = useInvalidateQueriesAllRequirements();
  const invalidateRequirementDetails = useInvalidateQueriesRequirementDetails();

  // New requirement values
  const defaultRequirement = {
    name: "",
    description: "",
    priority: undefined as Tag | undefined,
    requirementType: undefined as Tag | undefined,
    requirementFocus: undefined as Tag | undefined,
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
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: params.projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["backlog"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  const { mutateAsync: createOrModifyRequirement, isPending } =
    api.requirements.createOrModifyRequirement.useMutation();
  const { mutateAsync: deleteRequirement } =
    api.requirements.deleteRequirement.useMutation();
  const { mutateAsync: generateRequirements } =
    api.requirements.generateRequirements.useMutation();

  const handleCreateRequirement = async () => {
    if (!newRequirement.name) {
      alert("Oops...", "Requirement Name must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    if (
      !newRequirement.priority?.id ||
      !newRequirement.requirementType?.id ||
      !newRequirement.requirementFocus?.id
    ) {
      alert("Oops...", "All Properties must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    const response = await createOrModifyRequirement({
      projectId: projectId as string,
      requirementData: {
        ...newRequirement,
        scrumId: -1,
        priorityId: newRequirement.priority.id,
        requirementTypeId: newRequirement.requirementType.id,
        requirementFocusId: newRequirement.requirementFocus.id,
      },
    });

    await invalidateAllRequirements(projectId as string);

    setNewRequirement(defaultRequirement);

    setShowSmallPopup(false);
    console.log(response);
  };

  const handleEditRequirement = async (
    requirement: RequirementCol,
    checkValues = true,
  ) => {
    let { name, description } = editForm;
    const { priority, requirementType, requirementFocus, scrumId } =
      requirement;
    if (checkValues) {
      if (!name) {
        alert("Oops...", "Requirement name must have a value.", {
          type: "error",
          duration: 5000, // time in ms (5 seconds)
        });
        return;
      }
      if (!priority?.id || !requirementType?.id || !requirementFocus?.id) {
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

    const newRequirement = {
      projectId: projectId as string,
      name,
      description,
      priorityId: priority.id ?? "",
      requirementTypeId: requirementType.id ?? "",
      requirementFocusId: requirementFocus.id ?? "",
      scrumId: scrumId,
      deleted: false,
    };

    await utils.requirements.getRequirementTable.cancel({
      projectId: projectId as string,
    });
    await utils.requirements.getRequirement.cancel({
      projectId: projectId as string,
      requirementId: requirement.id,
    });

    await createOrModifyRequirement({
      projectId: projectId as string,
      requirementId: requirement.id,
      requirementData: newRequirement,
    });

    await invalidateAllRequirements(projectId as string);
    await invalidateRequirementDetails(projectId as string, [requirement.id]);
  };

  // TRPC
  const {
    data: requirements,
    isLoading: isLoadingRequirements,
    refetch: refetchRequirements,
  } = api.requirements.getRequirementTable.useQuery({
    projectId: params.projectId as string,
  });

  useEffect(() => {
    if (requirements) {
      const query = searchValue.toLowerCase();
      console.log("Query: ", requirements);
      const filtered = requirements
        .filter((requirement) => {
          const name = requirement.name?.toLowerCase() ?? "";
          const description = requirement.description.toLowerCase();

          // Asegúrate de que este hook devuelve un string consistente
          const formattedScrumText = UseFormatForAssignReqTypeScrumId(
            requirement.requirementType.name,
            requirement.scrumId,
          ).toLowerCase();

          return (
            name.includes(query) ||
            description.includes(query) ||
            formattedScrumText.includes(query)
          );
        })
        .sort((a, b) => {
          // Flipped to show the latest requirements first (also makes AI generated ones appear at the top after getting accepted)
          if (a.scrumId === -1 && b.scrumId === -1) return 0;
          if (a.scrumId === -1) return -1;
          if (b.scrumId === -1) return 1;

          return a.scrumId < b.scrumId ? 1 : -1;
        });
      setRequirementsData(filtered);
    }
  }, [requirements, searchValue]);

  const {
    beginLoading,
    finishLoading,
    generating,
    ghostData,
    ghostRows,
    setGhostRows,
    onAccept,
    onAcceptAll,
    onReject,
    onRejectAll,
    updateGhostRow,
  } = useGhostTableStateManager<RequirementCol, string>(
    async (acceptedIds) => {
      const accepted =
        generatedRequirements.current?.filter((req) =>
          acceptedIds.includes(req.id),
        ) ?? [];
      const acceptedRows = ghostData?.filter((ghost) =>
        acceptedIds.includes(ghost.id),
      );

      await utils.requirements.getRequirementTable.cancel({
        projectId: params.projectId as string,
      });

      // FIXME: I'm a little confused how the data is being stored here, might have issues with some of the tags
      utils.requirements.getRequirementTable.setData(
        { projectId: params.projectId as string },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.concat(acceptedRows ?? []);
        },
      );

      // Add the new requirements to the database
      for (const req of accepted.reverse()) {
        await createOrModifyRequirement({
          projectId: params.projectId as string,
          requirementData: {
            ...req,
            scrumId: 0,
            priorityId: req.priority.id ?? "",
            requirementTypeId: req.requirementType.id ?? "",
            requirementFocusId: req.requirementFocus.id ?? "",
          },
        });
      }

      await refetchRequirements();
    },
    (removedIds) => {
      const newGeneratedRequirements = generatedRequirements.current?.filter(
        (req) => !removedIds.includes(req.id),
      );
      generatedRequirements.current = newGeneratedRequirements;
    },
  );

  const deleteRequirements = async (ids: string[]) => {
    const confirmMessage =
      ids.length > 1
        ? "delete these requirements?"
        : "delete this requirement?";
    if (
      !(await confirm(
        `Are you sure you want to ${confirmMessage}`,
        "This action cannot be undone",
        "Delete",
      ))
    ) {
      return false;
    }

    const newData = requirementsData.filter((item) => !ids.includes(item.id));

    await utils.requirements.getRequirementTable.cancel({
      projectId: params.projectId as string,
    });
    utils.requirements.getRequirementTable.setData(
      { projectId: params.projectId as string },
      (prev) => {
        if (!prev) return prev;
        return newData;
      },
    );

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
        hiddenOnGhost: true,
        render(row, _, isGhost) {
          return (
            <button
              className="flex w-full items-center truncate text-left text-app-text underline-offset-4 hover:text-app-primary hover:underline disabled:opacity-70 disabled:hover:text-app-text disabled:hover:no-underline"
              onClick={() => {
                if (isGhost) {
                  setRequirementEdited(null);
                  setGhostRequirementEdited(row);
                } else {
                  setRequirementEdited(row);
                  setGhostRequirementEdited(null);
                }

                setEditingRequirement(false);
                setShowSmallPopup(true);
              }}
              disabled={row.scrumId === -1}
            >
              {row.scrumId !== -1 ? (
                UseFormatForAssignReqTypeScrumId(
                  row.requirementType.name,
                  row.scrumId,
                )
              ) : (
                <div className="h-6 w-[calc(100%-40px)] animate-pulse rounded-md bg-slate-500/50"></div>
              )}
            </button>
          );
        },
      },
      name: {
        label: "Title",
        width: 450,
        sortable: true,
        render(row, _, isGhost) {
          return (
            <button
              className="w-full items-center truncate text-left text-app-text underline-offset-4 hover:text-app-primary hover:underline disabled:animate-pulse disabled:opacity-70 disabled:hover:text-app-text disabled:hover:no-underline"
              onClick={() => {
                if (isGhost) {
                  setRequirementEdited(null);
                  setGhostRequirementEdited(row);
                } else {
                  setRequirementEdited(row);
                  setGhostRequirementEdited(null);
                }
                setEditingRequirement(false);
                setShowSmallPopup(true);
              }}
              disabled={!isGhost && row.scrumId === -1}
            >
              {row.name}
            </button>
          );
        },
      },
      description: {
        visible: false,
      },
      priority: {
        label: "Priority",
        width: 120,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.priority?.name ?? "";
        },
        sorter(a, b) {
          if (!a.priority && !b.priority) return 0;
          if (!a.priority) return -1;
          if (!b.priority) return 1;
          return a.priority?.name.localeCompare(b.priority?.name);
        },
        render(row, _, isGhost) {
          const handleGhostPriorityChange = (tag: Tag) => {
            updateGhostRow(row.id, (oldData) => ({
              ...oldData,
              priorityId: tag,
            }));
            generatedRequirements.current = generatedRequirements.current?.map(
              (req) => {
                if (req.id === row.id) {
                  return {
                    ...req,
                    priorityId: tag.id ?? "",
                  };
                }
                return req;
              },
            );
          };

          return (
            <PriorityPicker
              disabled={permission < permissionNumbers.write}
              priority={row.priority}
              onChange={async (tag: Tag) => {
                if (isGhost) {
                  handleGhostPriorityChange(tag);
                  return;
                }

                setRequirementsData((prevData) =>
                  prevData.map((item) =>
                    item.id === row.id ? { ...item, priorityId: tag } : item,
                  ),
                );
                await handleEditRequirement(
                  {
                    ...row,
                    priority: tag,
                  },
                  false,
                );
              }}
            />
          );
        },
      },
      requirementType: {
        label: "Req. Type",
        width: 220,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.requirementType?.name ?? "";
        },
        sorter(a, b) {
          if (!a.requirementType && !b.requirementType) return 0;
          if (!a.requirementType) return -1;
          if (!b.requirementType) return 1;
          return a.requirementType?.name.localeCompare(b.requirementType?.name);
        },
        render(row, _, isGhost) {
          const handleGhostReqTypeChange = (tag: Tag) => {
            updateGhostRow(row.id, (oldData) => ({
              ...oldData,
              requirementType: tag,
            }));
            generatedRequirements.current = generatedRequirements.current?.map(
              (req) => {
                if (req.id === row.id) {
                  return {
                    ...req,
                    requirementType: tag,
                  };
                }
                return req;
              },
            );
          };

          return (
            <RequirementTypePicker
              disabled={permission < permissionNumbers.write}
              type={row.requirementType}
              onChange={async (requirementTypeId) => {
                if (isGhost) {
                  handleGhostReqTypeChange(requirementTypeId);
                  return;
                }

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
                    requirementType: requirementTypeId,
                  },
                  false,
                );
              }}
            />
          );
        },
      },
      requirementFocus: {
        label: "Req. Focus",
        width: 250,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.requirementFocus?.name ?? "";
        },
        sorter(a, b) {
          if (!a.requirementFocus && !b.requirementFocus) return 0;
          if (!a.requirementFocus) return -1;
          if (!b.requirementFocus) return 1;
          return a.requirementFocus?.name.localeCompare(
            b.requirementFocus?.name,
          );
        },
        render(row, _, isGhost) {
          const handleGhostFocusChange = (tag: Tag) => {
            updateGhostRow(row.id, (oldData) => ({
              ...oldData,
              requirementFocusId: tag,
            }));
            generatedRequirements.current = generatedRequirements.current?.map(
              (req) => {
                if (req.id === row.id) {
                  return {
                    ...req,
                    requirementFocus: tag,
                  };
                }
                return req;
              },
            );
          };

          return (
            <RequirementFocusPicker
              disabled={permission < permissionNumbers.write}
              focus={row.requirementFocus}
              onChange={async (requirementFocusId) => {
                if (isGhost) {
                  handleGhostFocusChange(requirementFocusId);
                  return;
                }

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
                    requirementFocus: requirementFocusId,
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

      await utils.requirements.getRequirementTable.cancel({
        projectId: params.projectId as string,
      });
      utils.requirements.getRequirementTable.setData(
        { projectId: params.projectId as string },
        (prev) => {
          if (!prev) return prev;
          return newData;
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
        multiselect={permission >= permissionNumbers.write}
        deletable={permission >= permissionNumbers.write}
        tableKey="requirements-table"
        ghostData={ghostData}
        ghostRows={ghostRows}
        setGhostRows={setGhostRows}
        acceptGhosts={onAccept}
        rejectGhosts={onReject}
        ghostLoadingEstimation={5000}
        rowClassName="h-12"
      />
    );
  }, [requirementsData, isLoadingRequirements, ghostData, ghostRows]);

  const handleGenerate = async (amount: number, prompt: string) => {
    beginLoading(amount);

    const generatedData = await generateRequirements({
      projectId: params.projectId as string,
      amount,
      prompt,
    });
    generatedRequirements.current = generatedData.map((req, i) => ({
      ...req,
      id: i.toString(),
    }));

    const tableData: RequirementCol[] = generatedData.map((req, i) => ({
      id: i.toString(),
      scrumId: -1,
      name: req.name,
      description: req.description,
      priority: req.priority ?? noTag,
      requirementType: req.requirementType ?? noTag,
      requirementFocus: req.requirementFocus ?? noTag,
    }));

    // New requirement focus might have been created, so we need to invalidate the query
    await utils.requirements.getRequirementFocuses.invalidate({
      projectId: params.projectId as string,
    });

    finishLoading(tableData);
  };

  useNavigationGuard(
    async () => {
      if ((generatedRequirements?.current?.length ?? 0) > 0) {
        return !(await confirm(
          "Are you sure?",
          "You have unsaved AI generated requirements. To save them, please accept them first.",
          "Discard",
          "Keep editing",
        ));
      } else if (generating) {
        return !(await confirm(
          "Are you sure?",
          "You are currently generating requirements. If you leave now, the generation will be cancelled.",
          "Discard",
          "Keep editing",
        ));
      }
      return false;
    },
    generating || (generatedRequirements.current?.length ?? 0) > 0,
    "Are you sure you want to leave? You have unsaved AI generated requirements. To save them, please accept them first.",
  );

  const requirementEditedData = requirementEdited ?? ghostRequirementEdited;

  return (
    <div className="flex flex-col gap-2 lg:mx-10 xl:mx-20">
      <div className="mb-3 flex w-full flex-col justify-between">
        <h1 className="content-center text-3xl font-semibold">Requirements</h1>
        <div className="mt-3 flex flex-1 grow items-center justify-end gap-1">
          <div className="flex-1">
            <SearchBar
              placeholder="Find a requirement by title or id..."
              searchValue={searchValue}
              handleUpdateSearch={(e) => setSearchValue(e.target.value)}
            />
          </div>
          {permission >= permissionNumbers.write && (
            <div className="flex items-center gap-1">
              <PrimaryButton
                onClick={() => {
                  setEditingRequirement(false);
                  setRequirementEdited(null);
                  setNewRequirement(defaultRequirement);
                  setShowSmallPopup(true);
                }}
                data-cy="add-requirement-button"
              >
                + Add Requirement
              </PrimaryButton>
              <AiGeneratorDropdown
                singularLabel="requirement"
                pluralLabel="requirements"
                className="w-[350px]"
                onGenerate={handleGenerate}
                alreadyGenerated={(ghostData?.length ?? 0) > 0}
                disabled={generating}
                onAcceptAll={onAcceptAll}
                onRejectAll={onRejectAll}
              />
            </div>
          )}
        </div>
      </div>
      {table}
      {renderSmallPopup && (
        <Popup
          show={showSmallPopup}
          reduceTopPadding={requirementEditedData === null}
          size="small"
          className="h-[700px] w-[600px]"
          disablePassiveDismiss
          dismiss={async () => {
            const {
              name,
              description,
              priority,
              requirementType,
              requirementFocus,
            } = newRequirement;
            const allFields = [
              name,
              description,
              priority,
              requirementType,
              requirementFocus,
            ];
            if (
              allFields.some((field) => field !== "" && field !== undefined)
            ) {
              const confirmation = await confirm(
                "Are you sure?",
                "Your changes will be discarded.",
                "Discard changes",
                "Keep Editing",
              );
              if (!confirmation) return;
            }
            setShowSmallPopup(false);
          }}
          setEditMode={
            permission < permissionNumbers.write
              ? undefined
              : requirementEditedData !== null
                ? async () => {
                    const { name } = editForm;
                    const { priority, requirementType, requirementFocus } =
                      requirementEditedData;
                    if (editingRequirement) {
                      if (!name) {
                        alert(
                          "Oops...",
                          "Requirement name must have a value.",
                          {
                            type: "error",
                            duration: 5000, // time in ms (5 seconds)
                          },
                        );
                        return;
                      }
                      if (
                        !priority?.id ||
                        !requirementType?.id ||
                        !requirementFocus?.id
                      ) {
                        alert("Oops...", "All properties must have a value.", {
                          type: "error",
                          duration: 5000, // time in ms (5 seconds)
                        });
                        return;
                      }

                      setEditingRequirement(false);

                      if (ghostRequirementEdited) {
                        updateGhostRow(
                          ghostRequirementEdited.id,
                          (oldData) => ({
                            ...oldData,
                            name: editForm.name,
                            description: editForm.description,
                          }),
                        );
                        setGhostRequirementEdited((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            name: editForm.name,
                            description: editForm.description,
                          };
                        });
                        generatedRequirements.current =
                          generatedRequirements.current?.map((req) => {
                            if (req.id === ghostRequirementEdited.id) {
                              return {
                                ...req,
                                name: editForm.name,
                                description: editForm.description,
                              };
                            }
                            return req;
                          });
                        return;
                      }

                      setRequirementEdited((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          name: editForm.name,
                          description: editForm.description,
                        };
                      });
                      await handleEditRequirement(requirementEditedData);
                    } else {
                      setEditingRequirement(true);
                    }
                  }
                : () => {}
          }
          editMode={
            permission < permissionNumbers.write
              ? undefined
              : requirementEditedData
                ? editingRequirement
                : undefined
          }
          title={
            <h1 className="text-2xl">
              <strong>
                {requirementEditedData ? (
                  <h1 className="font-semibold">
                    <span>
                      {UseFormatForAssignReqTypeScrumId(
                        requirementEditedData.requirementType.name,
                        requirementEditedData.scrumId,
                      )}
                      :{" "}
                    </span>
                    <span className="font-normal">
                      {requirementEditedData.name}
                    </span>
                  </h1>
                ) : (
                  <h1>New Requirement</h1>
                )}
              </strong>{" "}
            </h1>
          }
          footer={
            <div className="flex gap-2" data-cy="requirement-popup-footer">
              {requirementEditedData ? (
                requirementEdited ? (
                  // FIXME add delete functionality (NEW PR)
                  permission < permissionNumbers.write ? null : (
                    <DeleteButton
                      onClick={async () => {
                        if (
                          requirementEdited &&
                          (await deleteRequirements([requirementEdited.id]))
                        ) {
                          setShowSmallPopup(false);
                          setRequirementEdited(null);
                        }
                      }}
                    >
                      Delete
                    </DeleteButton>
                  )
                ) : (
                  ghostRequirementEdited && (
                    <div className="flex items-center gap-2">
                      <AiIcon
                        className="animate-pulse text-app-secondary"
                        data-tooltip-id="tooltip"
                        data-tooltip-content="This is a generated requirement. It will not get saved until you accept it."
                      />
                      <TertiaryButton
                        onClick={() => {
                          onReject([ghostRequirementEdited.id]);
                          setShowSmallPopup(false);
                          setTimeout(
                            () => setGhostRequirementEdited(null),
                            300,
                          );
                        }}
                      >
                        Reject
                      </TertiaryButton>
                      <PrimaryButton
                        className="bg-app-secondary hover:bg-app-hover-secondary"
                        onClick={async () => {
                          setShowSmallPopup(false);
                          setTimeout(
                            () => setGhostRequirementEdited(null),
                            300,
                          );
                          await onAccept([ghostRequirementEdited.id]);
                        }}
                      >
                        Accept
                      </PrimaryButton>
                    </div>
                  )
                )
              ) : (
                <PrimaryButton
                  onClick={async () => {
                    await handleCreateRequirement();
                  }}
                  loading={isPending}
                  data-cy="create-requirement-button"
                >
                  Create Requirement
                </PrimaryButton>
              )}
            </div>
          }
        >
          {" "}
          <div className="flex flex-col gap-4">
            {!requirementEditedData || editingRequirement ? (
              <div className="pt-4">
                <InputTextField
                  label="Title"
                  containerClassName="mb-4"
                  value={
                    requirementEditedData ? editForm.name : newRequirement.name
                  }
                  onChange={(e) => {
                    if (requirementEditedData) {
                      setEditForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                    } else {
                      handleChange(e);
                    }
                  }}
                  name="name"
                  placeholder="Briefly describe the requirement..."
                  data-cy="requirement-name-input"
                />
                <InputTextAreaField
                  label="Description"
                  html-rows="4"
                  className="min-h-[120px] w-full resize-none"
                  value={
                    requirementEditedData
                      ? editForm.description
                      : newRequirement.description
                  }
                  onChange={
                    requirementEditedData
                      ? (e) => {
                          setEditForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }));
                        }
                      : handleChange
                  }
                  name="description"
                  placeholder="What is this requirement about..."
                  data-cy="requirement-description-input"
                />
                {requirementEdited === null &&
                  ghostRequirementEdited === null && (
                    <div className="flex gap-2 pt-4">
                      <div className="w-36 space-y-2">
                        <label className="font-semibold">Priority</label>
                        <PriorityPicker
                          disabled={permission < permissionNumbers.write}
                          priority={newRequirement.priority}
                          onChange={async (priority) => {
                            setNewRequirement((prev) => ({
                              ...prev,
                              priority: priority,
                            }));
                          }}
                        />
                      </div>
                      <div className="w-36 space-y-2">
                        <label className="font-semibold">Type</label>
                        <RequirementTypePicker
                          disabled={permission < permissionNumbers.write}
                          type={newRequirement.requirementType}
                          onChange={async (type) => {
                            setNewRequirement((prev) => ({
                              ...prev,
                              requirementType: type,
                            }));
                          }}
                        />
                      </div>
                      <div className="w-36 space-y-2">
                        <label className="font-semibold">Focus</label>
                        <RequirementFocusPicker
                          disabled={permission < permissionNumbers.write}
                          focus={newRequirement.requirementFocus}
                          onChange={async (focus) => {
                            setNewRequirement((prev) => ({
                              ...prev,
                              requirementFocus: focus,
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
                  {requirementEditedData.description !== "" ? (
                    <Markdown>{requirementEditedData.description}</Markdown>
                  ) : (
                    <p className="italic text-gray-500">
                      No description provided.
                    </p>
                  )}
                </div>
                <br />
                <div className="flex gap-2 pt-4">
                  <div className="w-36 space-y-2">
                    <label className="font-semibold">Priority</label>
                    <PriorityPicker
                      disabled={permission < permissionNumbers.write}
                      priority={
                        requirementEditedData
                          ? requirementEditedData.priority
                          : newRequirement.priority
                      }
                      onChange={async (priority) => {
                        if (ghostRequirementEdited) {
                          updateGhostRow(
                            ghostRequirementEdited.id,
                            (oldData) => ({
                              ...oldData,
                              priority: priority,
                            }),
                          );
                          setGhostRequirementEdited((prev) => ({
                            ...prev!,
                            priority: priority,
                          }));
                          generatedRequirements.current =
                            generatedRequirements.current?.map((req) => {
                              if (req.id === ghostRequirementEdited.id) {
                                return {
                                  ...req,
                                  priorityId: priority,
                                };
                              }
                              return req;
                            });
                          return;
                        }

                        if (!requirementEdited) {
                          setNewRequirement((prev) => ({
                            ...prev,
                            priority: priority,
                          }));
                        } else {
                          setRequirementEdited((prev) => ({
                            ...prev!,
                            priority: priority,
                          }));
                          await handleEditRequirement({
                            ...requirementEdited,
                            priority,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="w-36 space-y-2">
                    <label className="font-semibold">Type</label>
                    <RequirementTypePicker
                      disabled={permission < permissionNumbers.write}
                      type={
                        requirementEditedData
                          ? requirementEditedData.requirementType
                          : newRequirement.requirementType
                      }
                      onChange={async (type) => {
                        if (ghostRequirementEdited) {
                          updateGhostRow(
                            ghostRequirementEdited.id,
                            (oldData) => ({
                              ...oldData,
                              requirementTypeId: type,
                            }),
                          );
                          setGhostRequirementEdited((prev) => ({
                            ...prev!,
                            requirementType: type,
                          }));
                          generatedRequirements.current =
                            generatedRequirements.current?.map((req) => {
                              if (req.id === ghostRequirementEdited.id) {
                                return {
                                  ...req,
                                  requirementType: type,
                                };
                              }
                              return req;
                            });
                          return;
                        }

                        if (!requirementEdited) {
                          setNewRequirement((prev) => ({
                            ...prev,
                            requirementType: type,
                          }));
                        } else {
                          setRequirementEdited((prev) => ({
                            ...prev!,
                            requirementType: type,
                          }));
                          await handleEditRequirement({
                            ...requirementEdited,
                            requirementType: type,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="w-36 space-y-2">
                    <label className="font-semibold">Focus</label>
                    <RequirementFocusPicker
                      disabled={permission < permissionNumbers.write}
                      focus={
                        requirementEditedData
                          ? requirementEditedData.requirementFocus
                          : newRequirement.requirementFocus
                      }
                      onChange={async (focus) => {
                        if (ghostRequirementEdited) {
                          updateGhostRow(
                            ghostRequirementEdited.id,
                            (oldData) => ({
                              ...oldData,
                              requirementFocus: focus,
                            }),
                          );
                          setGhostRequirementEdited((prev) => ({
                            ...prev!,
                            requirementFocus: focus,
                          }));
                          generatedRequirements.current =
                            generatedRequirements.current?.map((req) => {
                              if (req.id === ghostRequirementEdited.id) {
                                return {
                                  ...req,
                                  requirementFocus: focus,
                                };
                              }
                              return req;
                            });
                          return;
                        }

                        if (!requirementEdited) {
                          setNewRequirement((prev) => ({
                            ...prev,
                            requirementFocus: focus,
                          }));
                        } else {
                          setRequirementEdited((prev) => ({
                            ...prev!,
                            requirementFocus: focus,
                          }));
                          await handleEditRequirement({
                            ...requirementEdited,
                            requirementFocus: focus,
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
