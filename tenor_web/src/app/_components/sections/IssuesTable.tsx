import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { usePopupVisibilityState } from "../Popup";
import { useEffect, useMemo, useState} from "react";
import Table, { type TableColumns } from "../table/Table";
import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import { IssueCol } from "~/server/api/routers/issues";
import { useFormatIssueScrumId } from "~/app/_hooks/scrumIdHooks";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import { duration } from "@mui/material";
import { useAlert } from "~/app/_hooks/useAlert";
import { SizePillComponent } from "../specific-pickers/SizePillComponent";
import UserStoryPicker from "../specific-pickers/UserStoryPicker";
import { ExistingUserStory } from "~/lib/types/detailSchemas";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function IssuesTable() {
  const { projectId } = useParams();

  const utils = api.useUtils();

  const [searchValue, setSearchValue] = useState("");
  const [renderSmallPopup, showSamllPopup, setShowSmallPopup] = usePopupVisibilityState();
  const [issueEdited, setIssueEdited] = useState<IssueCol | null>(null);
  const [editForm, setEditForm] = useState({name: "", description: "",})

  // Hooks
  const params = useParams();
  
  // TRPC
  const {
    data: issues,
    isLoading: isLoadingIssues,
    refetch: refetchIssues,
  } = api.issues.getIssuesTableFriendly.useQuery({
    projectId: params.projectId as string,
  });

  const filteredData = (issues ?? []).filter((issue) => {
    const lowerSearchValue = searchValue.toLowerCase();
    return (
      issue.name.toLowerCase().includes(lowerSearchValue) ||
      issue.description.toLowerCase().includes(lowerSearchValue)
    );
  });

  const issueData = filteredData.sort((a, b) => 
    a.scrumId < b.scrumId ? -1 : 1
  )

  const { alert } = useAlert();
  const { mutateAsync: updateIssueTags } = api.issues.modifyIssuesTags.useMutation();

  const { mutateAsync: updateAssignUserStorie } = api.issues.modifyIssuesRelatedUserStory.useMutation();

  const table = useMemo(() => {

    if (issues === undefined || isLoadingIssues) {
      return (
        <div className="flex h-full w-full flex-1 items-start justify-center p-10">
          <LoadingSpinner color="primary" />
        </div>
      )
    }

    const tableColumns: TableColumns<IssueCol> = {
      id: { visible: false },
      scrumId: {
        label: "Id",
        width: 80,
        sortable: true,
        render(row) {
          const formattedScrumId = useFormatIssueScrumId();
          return (
          <button className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline">
            {formattedScrumId(Number(row.scrumId))}
          </button>
          );
        },
      },
      name: {
        label: "Title",
        width: 500,
        sortable: true,
        render(row) {
          return (
            <button className="truncate text-left underline-offset-4 hover:text-app-primary hover:underline">
              {row.name}
            </button>
          );
        }
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
          )
        }
       },
      relatedUserStory: {
        label: "Assigned user story",
        width: 200,
        sortable: true,
        filterable: "list",
        render(row) {
          console.log("row", row);
          const handleUserStoryChange = async (userStory?: ExistingUserStory) => {
            if (!userStory) return;

            const rowIndex = issueData.indexOf(row);
            if (!issueData[rowIndex] || issueData[rowIndex].relatedUserStory?.id === userStory.id) {
              return; // No update needed
            }
            const [issueRow] = issueData.splice(rowIndex, 1);
            if (!issueRow) {
              return; // Typescript _needs_ this, but it should never happen
            }
            issueRow.relatedUserStory = userStory;

            const newData = [...issueData, issueRow];

            // Uses optimistic update to update the related user story of the issue
            await utils.issues.getIssuesTableFriendly.cancel({
              projectId: projectId as string,
            });
            utils.issues.getIssuesTableFriendly.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the related user story in the database
            await updateAssignUserStorie({
              projectId: projectId as string,
              issueId: row.id,
              relatedUserStoryId: userStory.id,
            });

            await refetchIssues();
            await utils.issues.getIssueDetail.invalidate({
              projectId: projectId as string,
              issueId: row.id,
            });
          };

          console.log(handleUserStoryChange);
          return (
            <UserStoryPicker 
              userStory={row.relatedUserStory}
              onChange={(userStory) => {
                handleUserStoryChange(userStory);
              }
              }
            />
          );
        },
      },
      size: {
        label: "Size",
        width: 120,
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
    };
    return (
      <Table 
        className={cn("w-full", heightOfContent)}
        data={issueData}
        columns={tableColumns}
        emptyMessage="No issues found"
        multiselect
        deletable
      />
    );
  }, [issueData, isLoadingIssues]);

  return (
    <div className="flex flex-col gap-2">
      {table}
    </div>
  )
}