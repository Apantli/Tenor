import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
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
import PrimaryButton from "../buttons/PrimaryButton";
import SearchBar from "../SearchBar";
import { UseFormatForAssignReqTypeScrumId } from "~/app/_hooks/requirementHook";
import LoadingSpinner from "../LoadingSpinner";
import useConfirmation from "~/app/_hooks/useConfirmation";
import AiGeneratorDropdown from "../ai/AiGeneratorDropdown";
import useGhostTableStateManager from "~/app/_hooks/useGhostTableStateManager";
import type { inferRouterOutputs } from "@trpc/server";
import { useInvalidateQueriesAllRequirements } from "~/app/_hooks/invalidateHooks";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";
import type { RequirementCol } from "~/lib/types/columnTypes";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import { usePopupVisibilityState } from "../Popup";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import RequirementTypePicker from "../specific-pickers/RequirementTypePicker";
import RequirementFocusPicker from "../specific-pickers/RequirementFocusPicker";
import CreateRequirementPopup from "~/app/(logged)/project/[projectId]/requirements/CreateRequirementPopup";
import RequirementDetailPopup from "~/app/(logged)/project/[projectId]/requirements/RequirementDetailPopup";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function RequirementsTable() {
  const { projectId } = useParams();
  const utils = api.useUtils();

  // Popup states
  const [renderCreatePopup, showCreatePopup, setShowCreatePopup] =
    usePopupVisibilityState();
  const [
    renderDetailPopup,
    showDetailPopup,
    selectedReq,
    setRequirementId,
    setShowDetailPopup,
  ] = useQueryIdForPopup("id");

  const [selectedGhostReq, setSelectedGhostReq] = useState<string>("");
  const [searchValue, setSearchValue] = useState("");

  // Hooks
  const generatedRequirements =
    useRef<
      WithId<
        inferRouterOutputs<
          typeof requirementsRouter
        >["generateRequirements"][number]
      >[]
    >();

  const invalidateAllRequirements = useInvalidateQueriesAllRequirements();
  const confirm = useConfirmation();

  // API Hooks
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  const permission: Permission = useMemo(() => {
    return checkPermissions({ flags: ["backlog"] }, role ?? emptyRole);
  }, [role]);

  const { data: defaultRequirementType } =
    api.requirements.getDefaultRequirementType.useQuery(
      { projectId: projectId as string },
      { enabled: permission >= permissionNumbers.write },
    );

  const {
    data: requirementsData,
    isLoading: isLoadingRequirements,
    refetch: refetchRequirements,
  } = api.requirements.getRequirementTable.useQuery({
    projectId: projectId as string,
  });

  const { mutateAsync: createOrModifyRequirement } =
    api.requirements.createOrModifyRequirement.useMutation();
  const { mutateAsync: deleteRequirement } =
    api.requirements.deleteRequirement.useMutation();
  const { mutateAsync: generateRequirements } =
    api.requirements.generateRequirements.useMutation();

  // Ghost table state management
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
        projectId: projectId as string,
      });

      utils.requirements.getRequirementTable.setData(
        { projectId: projectId as string },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.concat(acceptedRows ?? []);
        },
      );

      // Add the new requirements to the database
      for (const req of accepted.reverse()) {
        await createOrModifyRequirement({
          projectId: projectId as string,
          requirementData: {
            ...req,
            scrumId: 0,
            priorityId: req.priority?.id ?? "",
            requirementTypeId: req.requirementType.id ?? "",
            requirementFocusId: req.requirementFocus?.id ?? "",
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

  // Filtering logic
  const query = searchValue.toLowerCase();
  const filteredRequirements = requirementsData
    ?.filter((requirement) => {
      const name = requirement.name?.toLowerCase() ?? "";
      const description = requirement.description.toLowerCase();
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
      if (a.scrumId === -1 && b.scrumId === -1) return 0;
      if (a.scrumId === -1) return -1;
      if (b.scrumId === -1) return 1;
      return a.scrumId < b.scrumId ? 1 : -1;
    });

  // Handlers
  const setRequirementsData = async (
    updater: (
      oldData: RequirementCol[] | undefined,
    ) => RequirementCol[] | undefined,
  ) => {
    await utils.requirements.getRequirementTable.cancel({
      projectId: projectId as string,
    });
    utils.requirements.getRequirementTable.setData(
      { projectId: projectId as string },
      updater,
    );
  };

  const handleEditRequirement = async (
    requirement: RequirementCol,
    checkValues = true,
  ) => {
    const {
      name,
      description,
      priority,
      requirementType,
      requirementFocus,
      scrumId,
    } = requirement;

    if (checkValues && !name) {
      return;
    }

    const newRequirement = {
      projectId: projectId as string,
      name: name ?? "",
      description,
      priorityId: priority?.id ?? "",
      requirementTypeId: requirementType.id ?? "",
      requirementFocusId: requirementFocus?.id ?? "",
      scrumId: scrumId,
      deleted: false,
    };

    await createOrModifyRequirement({
      projectId: projectId as string,
      requirementId: requirement.id,
      requirementData: newRequirement,
    });

    await invalidateAllRequirements(projectId as string);
  };

  /*
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

    const newData = requirementsData?.filter((item) => !ids.includes(item.id));

    await utils.requirements.getRequirementTable.cancel({
      projectId: projectId as string,
    });
    utils.requirements.getRequirementTable.setData(
      { projectId: projectId as string },
      () => newData,
    );

    await Promise.all(
      ids.map((id) =>
        deleteRequirement({
          projectId: projectId as string,
          requirementId: id,
        }),
      ),
    );
    await refetchRequirements();
    return true;
  };
  */

  const handleGenerate = async (amount: number, prompt: string) => {
    beginLoading(amount);

    const generatedData = await generateRequirements({
      projectId: projectId as string,
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
      priority: req.priority ?? undefined,
      requirementType: req.requirementType ?? { id: "", name: "" },
      requirementFocus: req.requirementFocus ?? undefined,
    }));

    // New requirement focus might have been created, so we need to invalidate the query
    await utils.requirements.getRequirementFocuses.invalidate({
      projectId: projectId as string,
    });

    finishLoading(tableData);
  };

  const onRequirementAdded = async (requirementId: string) => {
    await invalidateAllRequirements(projectId as string);
    setShowCreatePopup(false);
    setSelectedGhostReq("");
    setRequirementId(requirementId);
  };

  // Navigation guard
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

  // Table configuration
  const table = useMemo(() => {
    if (filteredRequirements == undefined || isLoadingRequirements) {
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
                  setSelectedGhostReq(row.id);
                  setShowDetailPopup(true);
                } else {
                  setSelectedGhostReq("");
                  setRequirementId(row.id);
                }
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
                  setSelectedGhostReq(row.id);
                  setShowDetailPopup(true);
                } else {
                  setSelectedGhostReq("");
                  setRequirementId(row.id);
                }
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
              priority: tag,
            }));
            generatedRequirements.current = generatedRequirements.current?.map(
              (req) => {
                if (req.id === row.id) {
                  return {
                    ...req,
                    priority: tag,
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

                await setRequirementsData(
                  (prevData) =>
                    prevData?.map((item) =>
                      item.id === row.id ? { ...item, priority: tag } : item,
                    ) ?? [],
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
              onChange={async (requirementType) => {
                if (isGhost) {
                  handleGhostReqTypeChange(requirementType);
                  return;
                }

                await setRequirementsData(
                  (prevData) =>
                    prevData?.map((item) =>
                      item.id === row.id
                        ? { ...item, requirementType: requirementType }
                        : item,
                    ) ?? [],
                );
                await handleEditRequirement(
                  {
                    ...row,
                    requirementType: requirementType,
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
              requirementFocus: tag,
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
              onChange={async (requirementFocus) => {
                if (isGhost) {
                  handleGhostFocusChange(requirementFocus);
                  return;
                }

                await setRequirementsData(
                  (prevData) =>
                    prevData?.map((item) =>
                      item.id === row.id
                        ? { ...item, requirementFocus: requirementFocus }
                        : item,
                    ) ?? [],
                );
                await handleEditRequirement(
                  {
                    ...row,
                    requirementFocus: requirementFocus,
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
        ids.length > 1 ? "delete requirements?" : "delete requirement?";
      if (
        !(await confirm(
          `Are you sure you want to ${confirmMessage}`,
          "This action cannot be undone.",
          "Delete",
        ))
      ) {
        callback(false);
        return;
      }
      callback(true);

      const newData = requirementsData?.filter(
        (item) => !ids.includes(item.id),
      );

      await utils.requirements.getRequirementTable.cancel({
        projectId: projectId as string,
      });
      utils.requirements.getRequirementTable.setData(
        { projectId: projectId as string },
        () => newData,
      );

      await Promise.all(
        ids.map((id) =>
          deleteRequirement({
            projectId: projectId as string,
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
        data={filteredRequirements ?? []}
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
  }, [
    filteredRequirements,
    isLoadingRequirements,
    ghostData,
    ghostRows,
    permission,
  ]);

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
                onClick={() => setShowCreatePopup(true)}
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

      {renderCreatePopup && (
        <CreateRequirementPopup
          showPopup={showCreatePopup}
          setShowPopup={setShowCreatePopup}
          onRequirementAdded={onRequirementAdded}
          defaultRequirementType={defaultRequirementType}
        />
      )}

      {renderDetailPopup && (
        <RequirementDetailPopup
          requirementId={selectedReq}
          showDetail={showDetailPopup}
          setRequirementId={(newId) => {
            setRequirementId(newId);
            if (newId === "" && selectedGhostReq !== "") {
              setShowDetailPopup(false);
              setTimeout(() => setSelectedGhostReq(""), 300);
            }
          }}
          requirementData={
            selectedGhostReq !== ""
              ? ghostData?.find((req) => req.id === selectedGhostReq)
              : undefined
          }
          setRequirementData={(updatedDetail) => {
            if (!selectedGhostReq || !updatedDetail) return;
            updateGhostRow(selectedGhostReq, () => updatedDetail);
          }}
          canWrite={permission >= permissionNumbers.write}
          generatedRequirements={generatedRequirements.current}
          updateGeneratedRequirement={(
            id,
            data: WithId<
              inferRouterOutputs<
                typeof requirementsRouter
              >["generateRequirements"][number]
            >,
          ) => {
            generatedRequirements.current = generatedRequirements.current?.map(
              (req) => (req.id === id ? data : req),
            );
          }}
          onAccept={async () => {
            setShowDetailPopup(false);
            setTimeout(() => setSelectedGhostReq(""), 300);
            await onAccept([selectedGhostReq]);
          }}
          onReject={() => {
            setShowDetailPopup(false);
            setTimeout(() => {
              onReject([selectedGhostReq]);
              setSelectedGhostReq("");
            }, 300);
          }}
        />
      )}
    </div>
  );
}
