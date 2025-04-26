import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { usePopupVisibilityState } from "../Popup";
import { ChangeEventHandler, useEffect, useMemo, useState } from "react";
import Table, { type TableColumns } from "../table/Table";
import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";
import LoadingSpinner from "../LoadingSpinner";
import { IssueCol } from "~/server/api/routers/issues";
import {
  useFormatIssueScrumId,
  useFormatTaskIssueId,
} from "~/app/_hooks/scrumIdHooks";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import { duration } from "@mui/material";
import { useAlert } from "~/app/_hooks/useAlert";
import { SizePillComponent } from "../specific-pickers/SizePillComponent";
import UserStoryPicker from "../specific-pickers/UserStoryPicker";
import { ExistingUserStory } from "~/lib/types/detailSchemas";
import PrimaryButton from "../buttons/PrimaryButton";
import IssueDetailPopup from "~/app/(logged)/project/[projectId]/issues/IssueDetailPopup";
import CreateIssuePopup from "~/app/(logged)/project/[projectId]/issues/CreateIssuePopup";
import SearchBar from "../SearchBar";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function IssuesTable() {
  const [renderNewStory, showNewStory, setShowNewStory] =
    usePopupVisibilityState();
  const [selectedIS, setSelectedIS] = useState<string>("");
  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();

  const onIssueAdded = async (userStoryId: string) => {
    // await refetchUS();
    setShowNewStory(false);
    // setSelectedUS(userStoryId);
    // setShowDetail(true);
  };
  const { projectId } = useParams();

  const { issueId } = useParams();

  const utils = api.useUtils();

  const [searchValue, setSearchValue] = useState("");

  const { mutateAsync: updateIssue } = api.issues.modifyIssue.useMutation();
  const { mutateAsync: updateIssueTags } =
    api.issues.modifyIssuesTags.useMutation();

  const formattedScrumId = useFormatTaskIssueId();

  const { mutateAsync: updateAssignUserStorie } =
    api.issues.modifyIssuesRelatedUserStory.useMutation();

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

  // Handles
  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
  };

  const filteredData = (issues ?? []).filter((issue) => {
    const lowerSearchValue = searchValue.toLowerCase();
    return (
      issue.name.toLowerCase().includes(lowerSearchValue) ||
      formattedScrumId(issue.scrumId).toLowerCase().includes(lowerSearchValue)
    );
  });

  const issueData = filteredData.sort((a, b) =>
    a.scrumId < b.scrumId ? -1 : 1,
  );

  const handleSave = async (updatedData: IssueCol) => {
    const updatedIssue = {
      name: updatedData.name,
      description: updatedData.description,
      priorityId: updatedData?.priority?.id,
      size: updatedData?.size,
      relatedUserStoryId: updatedData?.relatedUserStory?.id ?? "",
      tagIds:
        updatedData?.tags
          .map((tag) => tag.id)
          .filter((tag) => tag !== undefined) ?? [],
      stepsToRecreate: updatedData?.stepsToRecreate ?? "",
      sprintId: updatedData?.sprint?.id ?? "",
    };

    // Optimistically update the query data
    utils.issues.getIssuesTableFriendly.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          ...updatedData,
        };
      },
    );

    await updateIssue({
      projectId: projectId as string,
      issueId: issueId as string,
      issueData: updatedIssue,
    });

    await refetchIssues();
  };
  const table = useMemo(() => {
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
        width: 200,
        sortable: true,
        filterable: "list",
        render(row) {
          const handleUserStoryChange = async (
            row: IssueCol,
            userStory?: ExistingUserStory,
          ) => {
            if (!projectId || !row?.id) return;

            try {
              await updateAssignUserStorie({
                projectId: projectId as string,
                issueId: row.id,
                relatedUserStoryId: userStory?.id ?? "", // puede venir vacío si se remueve
              });

              // Refetch o invalidate para reflejar los cambios
              await refetchIssues();
              await utils.issues.getIssueDetail.invalidate({
                projectId: projectId as string,
                issueId: row.id,
              });

              console.log("User story updated");
            } catch (error) {
              console.log("Failed to update user story");
              console.error("Error updating user story:", error);
            }
          };
          console.log("row", row);
          return (
            <UserStoryPicker
              userStory={row.relatedUserStory}
              onChange={(userStory) => {
                handleUserStoryChange(row, userStory).catch((err) => {
                  console.error("Failed to update user story:", err);
                });
              }}
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
        tableKey="issues-table"
      />
    );
  }, [issueData, isLoadingIssues]);

  return (
    <div className="flex flex-1 flex-col items-start gap-3">
      <div className="flex w-full justify-between">
        <h1 className="text-3xl font-semibold">Issues</h1>
        <div className="flex w-3/4 items-center justify-end gap-2">
          <div className="w-1/3 p-2">
            <SearchBar
              placeholder="Find a issue by title or id..."
              searchValue={searchValue}
              handleUpdateSearch={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <PrimaryButton onClick={() => setShowNewStory(true)}>
            + New Issue
          </PrimaryButton>
        </div>
      </div>

      {table}

      {renderDetail && (
        <IssueDetailPopup
          showDetail={showDetail}
          setShowDetail={setShowDetail}
          issueId={selectedIS}
        />
      )}

      {renderNewStory && (
        <CreateIssuePopup
          onIssueAdded={onIssueAdded}
          showPopup={showNewStory}
          setShowPopup={setShowNewStory}
        />
      )}
    </div>
  );
}
