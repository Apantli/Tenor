import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { usePopupVisibilityState } from "../Popup";
import { type ChangeEventHandler, useMemo, useState } from "react";
import Table, { type TableColumns } from "../table/Table";
import {
  permissionNumbers,
  type Permission,
  type Size,
  type Tag,
} from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import { useFormatIssueScrumId } from "~/app/_hooks/scrumIdHooks";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import { SizePillComponent } from "../specific-pickers/SizePillComponent";
import UserStoryPicker from "../specific-pickers/UserStoryPicker";
import type { UserStoryPreview } from "~/lib/types/detailSchemas";
import PrimaryButton from "../buttons/PrimaryButton";
import IssueDetailPopup from "~/app/(logged)/project/[projectId]/issues/IssueDetailPopup";
import CreateIssuePopup from "~/app/(logged)/project/[projectId]/issues/CreateIssuePopup";
import SearchBar from "../SearchBar";
import AssignUsersList from "../specific-pickers/AssignUsersList";
import useConfirmation from "~/app/_hooks/useConfirmation";
import {
  useInvalidateQueriesAllIssues,
  useInvalidateQueriesIssueDetails,
} from "~/app/_hooks/invalidateHooks";
import type { IssueCol } from "~/lib/types/columnTypes";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import { useDeleteItemByType } from "~/app/_hooks/itemOperationHooks";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function IssuesTable() {
  // Hooks
  const { projectId } = useParams();
  const [searchValue, setSearchValue] = useState("");

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["issues"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  const [renderNewIssue, showNewIssue, setShowNewIssue] =
    usePopupVisibilityState();
  const [renderDetail, showDetail, selectedIS, setSelectedIS] =
    useQueryIdForPopup("id");

  const formatIssueScrumId = useFormatIssueScrumId();

  const confirm = useConfirmation();
  const deleteItemByType = useDeleteItemByType();
  const invalidateQueriesAllIssues = useInvalidateQueriesAllIssues();
  const invalidateQueriesIssueDetails = useInvalidateQueriesIssueDetails();

  const onIssueAdded = async (issueId: string) => {
    await invalidateQueriesAllIssues(projectId as string);
    await invalidateQueriesIssueDetails(projectId as string, [issueId]);
    setShowNewIssue(false);
    setSelectedIS(issueId);
  };

  // TRPC
  const utils = api.useUtils();
  const { data: issues, isLoading: isLoadingIssues } =
    api.issues.getIssueTable.useQuery({
      projectId: projectId as string,
    });
  const { mutateAsync: updateIssueTags } =
    api.issues.modifyIssuesTags.useMutation();

  const { mutateAsync: updateAssignUserStories } =
    api.issues.modifyIssuesRelatedUserStory.useMutation();

  // Handles
  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
  };

  const filteredData = (issues ?? []).filter((issue) => {
    const lowerSearchValue = searchValue.toLowerCase();
    return (
      issue.name.toLowerCase().includes(lowerSearchValue) ||
      formatIssueScrumId(issue.scrumId).toLowerCase().includes(lowerSearchValue)
    );
  });

  const issueData = filteredData.sort((a, b) =>
    a.scrumId > b.scrumId ? -1 : 1,
  );

  const getTable = () => {
    if (issues === undefined || isLoadingIssues) {
      return (
        <div className="flex h-full w-full flex-1 items-start justify-center p-10">
          <LoadingSpinner color="primary" />
        </div>
      );
    }

    const tableColumns: TableColumns<IssueCol> = {
      id: { visible: false },
      stepsToRecreate: { visible: false },
      tags: { visible: false },
      sprint: { visible: false },
      scrumId: {
        label: "Id",
        width: 80,
        sortable: true,
        render(row) {
          return (
            <button
              className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
              onClick={() => {
                setSelectedIS(row.id);
              }}
            >
              {formatIssueScrumId(row.scrumId)}
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
                setSelectedIS(row.id);
              }}
              data-cy="issue-title-table"
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
          if (!a.priority) return 1;
          if (!b.priority) return -1;
          return a.priority?.name.localeCompare(b.priority?.name) ? -1 : 1;
        },
        render(row) {
          const handlePriorityChange = async (tag: Tag) => {
            const rowIndex = issueData.indexOf(row);
            if (
              !issueData[rowIndex] ||
              issueData[rowIndex].priority?.name === tag.name
            ) {
              return; // No update needed
            }
            const [issueRow] = issueData.splice(rowIndex, 1);
            if (!issueRow) {
              return; // Typescript _needs_ this, but it should never happen
            }
            issueRow.priority = tag;

            const newData = [...issueData, issueRow];

            // Uses optimistic update to update the priority of the user story
            await utils.issues.getIssueTable.cancel({
              projectId: projectId as string,
            });
            utils.issues.getIssueTable.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the priority in the database
            await updateIssueTags({
              projectId: projectId as string,
              issueId: row.id,
              priorityId: tag.id,
            });

            await invalidateQueriesIssueDetails(projectId as string, [row.id]);
            await invalidateQueriesAllIssues(projectId as string);
          };

          return (
            <PriorityPicker
              disabled={permission < permissionNumbers.write}
              priority={row.priority}
              onChange={handlePriorityChange}
            />
          );
        },
      },
      relatedUserStory: {
        label: "Assigned user story",
        width: 350,
        render(row) {
          const handleUserStoryChange = async (
            row: IssueCol,
            userStory?: UserStoryPreview,
          ) => {
            if (!projectId || !row?.id) return;

            try {
              await utils.issues.getIssueTable.cancel({
                projectId: projectId as string,
              });

              utils.issues.getIssueTable.setData(
                { projectId: projectId as string },
                (oldData) => {
                  if (!oldData) return oldData;

                  return oldData.map((issue) => {
                    if (issue.id === row.id) {
                      return {
                        ...issue,
                        relatedUserStory: userStory
                          ? { ...userStory, deleted: false } // Ensure 'deleted' property is added
                          : undefined,
                      };
                    }
                    return issue;
                  });
                },
              );

              await updateAssignUserStories({
                projectId: projectId as string,
                issueId: row.id,
                relatedUserStoryId: userStory?.id ?? "",
              });

              await invalidateQueriesIssueDetails(projectId as string, [
                row.id,
              ]);
              await invalidateQueriesAllIssues(projectId as string);
            } catch (error) {
              console.error("Failed to update user story:", error);
            }
          };
          return (
            <UserStoryPicker
              disabled={permission < permissionNumbers.write}
              userStory={row.relatedUserStory}
              onChange={async (userStory) => {
                await handleUserStoryChange(row, userStory);
              }}
            />
          );
        },
      },
      size: {
        label: "Size",
        width: 100,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return row.size ?? "";
        },
        sorter(a, b) {
          const sizeOrder: Record<Size, number> = {
            XS: 0,
            S: 1,
            M: 2,
            L: 3,
            XL: 4,
            XXL: 5,
          };

          return (sizeOrder[a.size] ?? 99) < (sizeOrder[b.size] ?? 99) ? -1 : 1;
        },
        render(row) {
          const handleSizeChange = async (size: Size) => {
            const rowIndex = issueData.indexOf(row);
            if (!issueData[rowIndex]) {
              return; // No update needed
            }
            const [issueRow] = issueData.splice(rowIndex, 1);
            if (!issueRow) {
              return; // Typescript _needs_ this, but it should never happen
            }
            issueRow.size = size;

            const newData = [...issueData, issueRow];

            // Uses optimistic update to update the size of the user story
            await utils.issues.getIssueTable.cancel({
              projectId: projectId as string,
            });
            utils.issues.getIssueTable.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the size in the database
            await updateIssueTags({
              projectId: projectId as string,
              issueId: row.id,
              size: size,
            });

            await invalidateQueriesIssueDetails(projectId as string, [row.id]);
            await invalidateQueriesAllIssues(projectId as string);
          };

          return (
            <SizePillComponent
              disabled={permission < permissionNumbers.write}
              currentSize={row.size}
              callback={handleSizeChange}
            />
          );
        },
      },
      assignUsers: {
        label: "Assignees",
        width: 120,
        render(row) {
          return <AssignUsersList users={row.assignUsers} />;
        },
      },
    };

    const handleDelete = async (
      ids: string[],
      callback: (del: boolean) => void,
    ) => {
      const confirmMessage = ids.length > 1 ? "issues" : "issue";

      if (
        !(await confirm(
          `Are you sure you want to delete ${ids.length == 1 ? "this " + confirmMessage : ids.length + " " + confirmMessage}?`,
          "This action is not reversible.",
          `Delete ${confirmMessage}`,
        ))
      ) {
        callback(false);
        return;
      }

      callback(true); // call the callback as soon as possible

      const newData = issueData.filter((issue) => !ids.includes(issue.id));

      // Uses optimistic update to update the size of the user story

      await utils.issues.getIssueTable.cancel({
        projectId: projectId as string,
      });

      utils.issues.getIssueTable.setData(
        { projectId: projectId as string },
        newData,
      );

      // Deletes in database
      await Promise.all(
        ids.map((id) =>
          deleteItemByType(projectId as string, "IS", id, undefined),
        ),
      );

      return true;
    };
    return (
      <Table
        className={cn("w-full", heightOfContent)}
        data={issueData}
        columns={tableColumns}
        onDelete={handleDelete}
        emptyMessage="No issues found"
        multiselect={permission >= permissionNumbers.write}
        deletable={permission >= permissionNumbers.write}
        tableKey="issues-table"
        data-cy="issues-table"
      />
    );
  };

  return (
    <div className="flex flex-col gap-2 lg:mx-10 xl:mx-20">
      <div className="mb-3 flex w-full flex-col justify-between">
        <h1 className="content-center text-3xl font-semibold">Issues</h1>
        <div className="mt-3 flex flex-1 grow items-center justify-end gap-1">
          <div className="flex-1">
            <SearchBar
              placeholder="Find a issue by title or id..."
              searchValue={searchValue}
              handleUpdateSearch={handleUpdateSearch}
            />
          </div>
          {permission >= permissionNumbers.write && (
            <PrimaryButton onClick={() => setShowNewIssue(true)}>
              + New Issue
            </PrimaryButton>
          )}
        </div>
      </div>

      {getTable()}

      {renderDetail && (
        <IssueDetailPopup
          showDetail={showDetail}
          setDetailId={setSelectedIS}
          issueId={selectedIS}
        />
      )}

      {renderNewIssue && (
        <CreateIssuePopup
          onIssueAdded={onIssueAdded}
          showPopup={showNewIssue}
          setShowPopup={setShowNewIssue}
        />
      )}
    </div>
  );
}
