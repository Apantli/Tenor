import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Permission, Tag, WithId } from "~/lib/types/firebaseSchemas";
import type {
  RequirementCol,
  requirementsRouter,
} from "~/server/api/routers/requirements";
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
import { inferRouterOutputs } from "@trpc/server";
import AiIcon from "@mui/icons-material/AutoAwesome";

import {
  useInvalidateQueriesAllRequirements,
  useInvalidateQueriesRequirementDetails,
} from "~/app/_hooks/invalidateHooks";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import TertiaryButton from "../buttons/TertiaryButton";

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
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: params.projectId as string,
  });
  const permission: Permission = useMemo(() => {
    if (!role) return 0 as Permission;
    return role.backlog as Permission;
  }, [role]);

  const { mutateAsync: createOrModifyRequirement, isPending } =
    api.requirements.createOrModifyRequirement.useMutation({
      onError: (error) => {
        alert(
          "Oops...",
          "You do not have permission to create or modify requirements.",
          {
            type: "error",
            duration: 5000,
          },
        );
      },
    });
  const { mutateAsync: generateRequirements } =
    api.requirements.generateRequirements.useMutation({
      onError: (error) => {
        alert(
          "Oops...",
          "You do not have permission to generate requirements.",
          {
            type: "error",
            duration: 5000,
          },
        );
      },
    });

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
    const { priorityId, requirementTypeId, requirementFocusId, scrumId } =
      requirement;
    if (checkValues) {
      if (!name) {
        alert("Oops...", "Requirement name must have a value.", {
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
      scrumId: scrumId!,
      deleted: false,
    };

    await utils.requirements.getRequirementsTableFriendly.cancel({
      projectId: projectId as string,
    });
    await utils.requirements.getRequirement.cancel({
      projectId: projectId as string,
      requirementId: requirement.id,
    });

    const response = await createOrModifyRequirement(newRequirement);

    await invalidateAllRequirements(projectId as string);
    await invalidateRequirementDetails(projectId as string, [requirement.id]);
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
    api.requirements.deleteRequirement.useMutation({
      onError: (error) => {
        alert(
          "Oops...",
          `You do not have permission to delete this requirement. ${error.message}`,
          {
            type: "error",
            duration: 5000,
          },
        );
      },
    });
  useEffect(() => {
    if (requirements) {
      const query = searchValue.toLowerCase();

      const filtered = requirements.fixedData
        .filter((req) => {
          const name = req.name?.toLowerCase() ?? "";
          const description = req.description.toLowerCase();

          // Asegúrate de que este hook devuelve un string consistente
          const formattedScrumText = UseFormatForAssignReqTypeScrumId(
            req.requirementTypeId.name,
            req.scrumId!,
          ).toLowerCase();

          return (
            name.includes(query) ||
            description.includes(query) ||
            formattedScrumText.includes(query)
          );
        })
        .sort((a, b) => {
          // Flipped to show the latest requirements first (also makes AI generated ones appear at the top after getting accepted)
          if (a.scrumId === undefined && b.scrumId === undefined) return 0;
          if (a.scrumId === undefined) return -1;
          if (b.scrumId === undefined) return 1;

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

      await utils.requirements.getRequirementsTableFriendly.cancel({
        projectId: params.projectId as string,
      });

      // FIXME: I'm a little confused how the data is being stored here, might have issues with some of the tags
      utils.requirements.getRequirementsTableFriendly.setData(
        { projectId: params.projectId as string },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            fixedData: oldData.fixedData.concat(acceptedRows ?? []),
          };
        },
      );

      // Add the new requirements to the database
      for (const req of accepted.reverse()) {
        await createOrModifyRequirement({
          projectId: params.projectId as string,
          name: req.name,
          description: req.description,
          priorityId: req.priorityId!.id!,
          requirementTypeId: req.requirementTypeId!.id!,
          requirementFocusId: req.requirementFocusId!.id!,
          scrumId: -1,
          deleted: false,
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
              disabled={row.scrumId === undefined}
            >
              {row.scrumId ? (
                UseFormatForAssignReqTypeScrumId(
                  row.requirementTypeId.name,
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
              disabled={!isGhost && row.scrumId === undefined}
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
                    priorityId: tag,
                  };
                }
                return req;
              },
            );
          };

          return (
            <PriorityPicker
              priority={row.priorityId}
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
        render(row, _, isGhost) {
          const handleGhostReqTypeChange = (tag: Tag) => {
            updateGhostRow(row.id, (oldData) => ({
              ...oldData,
              requirementTypeId: tag,
            }));
            generatedRequirements.current = generatedRequirements.current?.map(
              (req) => {
                if (req.id === row.id) {
                  return {
                    ...req,
                    requirementTypeId: tag,
                  };
                }
                return req;
              },
            );
          };

          return (
            <RequirementTypePicker
              type={row.requirementTypeId}
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
                    requirementFocusId: tag,
                  };
                }
                return req;
              },
            );
          };

          return (
            <RequirementFocusPicker
              focus={row.requirementFocusId}
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
        deletable={permission >= 2}
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

    const tableData = generatedData.map((req, i) => ({
      id: i.toString(),
      scrumId: undefined,
      name: req.name,
      description: req.description,
      priorityId: req.priorityId!,
      requirementTypeId: req.requirementTypeId!,
      requirementFocusId: req.requirementFocusId!,
    }));

    // New requirement focus might have been created, so we need to invalidate the query
    await utils.requirements.getRequirementFocusTags.invalidate({
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
          {permission >= 2 && (
            <div className="flex items-center gap-1">
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
          setEditMode={
            permission < 2
              ? undefined
              : requirementEditedData !== null
                ? async () => {
                    if (editingRequirement) {
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
            permission < 2
              ? undefined
              : requirementEditedData
                ? editingRequirement
                : undefined
          }
          dismiss={() => {
            setShowSmallPopup(false);
          }}
          title={
            <h1 className="text-2xl">
              <strong>
                {requirementEditedData ? (
                  <h1 className="font-semibold">
                    {requirementEditedData.scrumId && (
                      <span>
                        {UseFormatForAssignReqTypeScrumId(
                          requirementEditedData.requirementTypeId.name,
                          requirementEditedData.scrumId,
                        )}
                        :{" "}
                      </span>
                    )}
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
            <div className="flex gap-2">
              {requirementEditedData ? (
                requirementEdited ? (
                  // FIXME add delete functionality (NEW PR)
                  permission < 2 ? null : (
                    <DeleteButton
                      onClick={async () => {
                        console.log("Deleting");
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
                  className="h-12"
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
                  placeholder="Requirement title"
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
                />
                {requirementEdited === null &&
                  ghostRequirementEdited === null && (
                    <div className="flex gap-2 pt-4">
                      <div className="w-36 space-y-2">
                        <label className="font-semibold">Priority</label>
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
                        <label className="font-semibold">Type</label>
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
                        <label className="font-semibold">Focus</label>
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
                      priority={
                        requirementEditedData
                          ? requirementEditedData.priorityId
                          : newRequirement.priorityId
                      }
                      onChange={async (priority) => {
                        if (ghostRequirementEdited) {
                          updateGhostRow(
                            ghostRequirementEdited.id,
                            (oldData) => ({
                              ...oldData,
                              priorityId: priority,
                            }),
                          );
                          setGhostRequirementEdited((prev) => ({
                            ...prev!,
                            priorityId: priority,
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
                    <label className="font-semibold">Type</label>
                    <RequirementTypePicker
                      type={
                        requirementEditedData
                          ? requirementEditedData.requirementTypeId
                          : newRequirement.requirementTypeId
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
                            requirementTypeId: type,
                          }));
                          generatedRequirements.current =
                            generatedRequirements.current?.map((req) => {
                              if (req.id === ghostRequirementEdited.id) {
                                return {
                                  ...req,
                                  requirementTypeId: type,
                                };
                              }
                              return req;
                            });
                          return;
                        }

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
                    <label className="font-semibold">Focus</label>
                    <RequirementFocusPicker
                      focus={
                        requirementEditedData
                          ? requirementEditedData.requirementFocusId
                          : newRequirement.requirementFocusId
                      }
                      onChange={async (focus) => {
                        if (ghostRequirementEdited) {
                          updateGhostRow(
                            ghostRequirementEdited.id,
                            (oldData) => ({
                              ...oldData,
                              requirementFocusId: focus,
                            }),
                          );
                          setGhostRequirementEdited((prev) => ({
                            ...prev!,
                            requirementFocusId: focus,
                          }));
                          generatedRequirements.current =
                            generatedRequirements.current?.map((req) => {
                              if (req.id === ghostRequirementEdited.id) {
                                return {
                                  ...req,
                                  requirementFocusId: focus,
                                };
                              }
                              return req;
                            });
                          return;
                        }

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
