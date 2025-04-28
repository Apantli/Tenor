import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { usePopupVisibilityState } from "../Popup";
import { ChangeEventHandler, useMemo, useState } from "react";
import Table, { type TableColumns } from "../table/Table";
import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import { IssueCol } from "~/server/api/routers/issues";
import {
  useFormatTaskIssueId,
} from "~/app/_hooks/scrumIdHooks";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import { SizePillComponent } from "../specific-pickers/SizePillComponent";
import UserStoryPicker from "../specific-pickers/UserStoryPicker";
import { ExistingUserStory } from "~/lib/types/detailSchemas";
import PrimaryButton from "../buttons/PrimaryButton";
import IssueDetailPopup from "~/app/(logged)/project/[projectId]/issues/IssueDetailPopup";
import CreateIssuePopup from "~/app/(logged)/project/[projectId]/issues/CreateIssuePopup";
import SearchBar from "../SearchBar";
import AssignUsersList from "../specific-pickers/AssignUsersList";
import useConfirmation from "~/app/_hooks/useConfirmation";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function IssuesTable() {
  
  // Hooks
  const { projectId } = useParams();
  const [searchValue, setSearchValue] = useState("");

  const [selectedIS, setSelectedIS] = useState<string>("");
  const [renderNewIssue, showNewIssue, setShowNewIssue] =
    usePopupVisibilityState();
  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();

  const useFormatIssueScrumId = useFormatTaskIssueId();

  const confirm = useConfirmation();

  const onIssueAdded = async (userStoryId: string) => {
    await refetchIssues();
    setShowNewIssue(false);
    setSelectedIS(userStoryId);
    setShowDetail(true);
  };

  // TRPC
  const utils = api.useUtils();
  const {
    data: issues,
    isLoading: isLoadingIssues,
    refetch: refetchIssues,
  } = api.issues.getIssuesTableFriendly.useQuery({
    projectId: projectId as string,
  });
  const { mutateAsync: updateIssueTags } =
    api.issues.modifyIssuesTags.useMutation();

  const { mutateAsync: updateAssignUserStorie } =
    api.issues.modifyIssuesRelatedUserStory.useMutation();

  const { mutateAsync: deleteIssue } = api.issues.deleteIssue.useMutation();

  // Handles
  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
  };

  const filteredData = (issues ?? []).filter((issue) => {
    const lowerSearchValue = searchValue.toLowerCase();
    return (
      issue.name.toLowerCase().includes(lowerSearchValue) ||
      useFormatIssueScrumId(issue.scrumId).toLowerCase().includes(lowerSearchValue)
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
                setShowDetail(true);
              }}
            >
              {useFormatIssueScrumId(row.scrumId)}
            </button>
          );
        },
      },
      name: {
        label: "Title",
        width: 650,
        sortable: true,
        render(row) {
          return (
            <button
              className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
              onClick={() => {
                setSelectedIS(row.id);
                setShowDetail(true);
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
            await utils.issues.getIssuesTableFriendly.cancel({
              projectId: projectId as string,
            });
            utils.issues.getIssuesTableFriendly.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the priority in the database
            await updateIssueTags({
              projectId: projectId as string,
              issueId: row.id,
              priorityId: tag.id,
            });

            await refetchIssues();
            await utils.issues.getIssueDetail.invalidate({
              projectId: projectId as string,
              issueId: row.id,
            });
          };

          return (
            <PriorityPicker
              priority={row.priority}
              onChange={handlePriorityChange}
            />
          );
        },
      },
      relatedUserStory: {
        label: "Assigned user story",
        width: 400,
        render(row) {
          const handleUserStoryChange = async (
            row: IssueCol,
            userStory?: ExistingUserStory,
          ) => {
            if (!projectId || !row?.id) return;

            try {
              
              await utils.issues.getIssuesTableFriendly.cancel({ projectId: projectId as string });

              void utils.issues.getIssuesTableFriendly.setData({ projectId: projectId as string }, (oldData) => {
                if (!oldData) return oldData;
          
                return oldData.map((issue) => {
                  if (issue.id === row.id) {
                    return {
                      ...issue,
                      relatedUserStory: userStory,
                    };
                  }
                  return issue;
                });
              });
          
            
              await updateAssignUserStorie({
                projectId: projectId as string,
                issueId: row.id,
                relatedUserStoryId: userStory?.id ?? "",
              });
          

              await utils.issues.getIssueDetail.invalidate({
                projectId: projectId as string,
                issueId: row.id,
              });
          
            } catch (error) {
              console.error("Failed to update user story:", error);
            }
          };
          console.log("row", row);
          return (
            <UserStoryPicker
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
            await utils.issues.getIssuesTableFriendly.cancel({
              projectId: projectId as string,
            });
            utils.issues.getIssuesTableFriendly.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the size in the database
            await updateIssueTags({
              projectId: projectId as string,
              issueId: row.id,
              size: size,
            });

            await refetchIssues();
            await utils.issues.getIssueDetail.invalidate({
              projectId: projectId as string,
              issueId: row.id,
            });
          };

          return (
            <SizePillComponent
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
          console.log("Assign users:", row.assignUsers);
          return (
            <AssignUsersList 
              users={row.assignUsers}
            />
          );
        },
      },
    };

    const handleDelete = async (ids: string[], callback: (del: boolean) => void) => {
      const confirmMessage = ids.length > 1 ? "issues" : "issue";

      if (
        !(await confirm(
          `Are you sure you want to delete ${ids.length == 1 ? "this " + confirmMessage : ids.length + " " + confirmMessage}?`,
          "This action is not revertible.",
          `Delete ${confirmMessage}`,
        ))
      ) {
        callback(false);
        return;
      }

      callback(true); // call the callback as soon as possible

      const newData = issueData.filter((issue) => !ids.includes(issue.id));

      // Uses optimistic update to update the size of the user story

      await utils.issues.getIssuesTableFriendly.cancel({
        projectId: projectId as string,
      });

      utils.issues.getIssuesTableFriendly.setData(
        { projectId: projectId as string },
        newData,
      );

      // Deltes in database
      await Promise.all(
        ids.map((id) => 
          deleteIssue({
            projectId: projectId as string,
            issueId: id,
          }),
        ),
      );

      await refetchIssues();
      await utils.issues.getIssueDetail.invalidate({
        projectId: projectId as string,
        issueId: ids[0],
      });

      return true;
    }
    return (
      <Table
        className={cn("w-full", heightOfContent)}
        data={issueData}
        columns={tableColumns}
        onDelete={handleDelete}
        emptyMessage="No issues found"
        multiselect
        deletable
        tableKey="issues-table"
      />
    );
  };

  return (
    <div className="flex flex-1 flex-col items-start gap-3">
      <div className="flex w-full justify-between">
        <h1 className="text-3xl font-semibold">Issues</h1>
        <div className="flex w-3/4 items-center justify-end gap-2">
          <div className="w-1/3 p-2">
            <SearchBar
              placeholder="Find a issue by title or id..."
              searchValue={searchValue}
              handleUpdateSearch={handleUpdateSearch}
            />
          </div>
          <PrimaryButton onClick={() => setShowNewIssue(true)}>
            + New Issue
          </PrimaryButton>
        </div>
      </div>

      {getTable()}

      {renderDetail && (
        <IssueDetailPopup
          showDetail={showDetail}
          setShowDetail={setShowDetail}
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
