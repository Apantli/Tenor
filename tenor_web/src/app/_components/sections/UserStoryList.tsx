"use client";

import Table, { type TableColumns } from "~/app/_components/table/Table";
import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import { useState, type ChangeEventHandler } from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SearchBar from "~/app/_components/SearchBar";
import type { UserStoryCol } from "~/server/api/routers/userStories";
import { cn } from "~/lib/utils";
import { usePopupVisibilityState } from "../Popup";
import UserStoryDetailPopup from "~/app/(logged)/project/[projectId]/user-stories/UserStoryDetailPopup";
import { SizePillComponent } from "../specific-pickers/SizePillComponent";
import CreateUserStoryPopup from "~/app/(logged)/project/[projectId]/user-stories/CreateUserStoryPopup";
import {
  useFormatEpicScrumId,
  useFormatSprintNumber,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import PriorityPicker from "../specific-pickers/PriorityPicker";
import useConfirmation from "~/app/_hooks/useConfirmation";
import LoadingSpinner from "../LoadingSpinner";
import {
  useInvalidateQueriesAllUserStories,
  useInvalidateQueriesUserStoriesDetails,
} from "~/app/_hooks/invalidateHooks";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function UserStoryList() {
  // Hooks
  const { projectId } = useParams();
  const [searchValue, setSearchValue] = useState("");

  const [selectedUS, setSelectedUS] = useState<string>("");
  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [renderNewStory, showNewStory, setShowNewStory] =
    usePopupVisibilityState();

  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const formatEpicScrumId = useFormatEpicScrumId();
  const formatSprintNumber = useFormatSprintNumber();
  const confirm = useConfirmation();

  const invalidateQuerieUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();

  // TRPC
  const utils = api.useUtils();
  const { data: userStories, isLoading: isLoadingUS } =
    api.userStories.getUserStoriesTableFriendly.useQuery({
      projectId: projectId as string,
    });
  const { mutateAsync: updateUserStoryTags } =
    api.userStories.modifyUserStoryTags.useMutation();
  const { mutateAsync: deleteUserStory } =
    api.userStories.deleteUserStory.useMutation();

  // Handles
  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
  };

  const filteredData = (userStories ?? []).filter((userStory) => {
    const lowerSearchValue = searchValue.toLowerCase();
    return (
      userStory.title.toLowerCase().includes(lowerSearchValue) ||
      formatUserStoryScrumId(userStory.scrumId).includes(lowerSearchValue)
    );
  });

  const userStoryData = filteredData.sort((a, b) =>
    a.scrumId < b.scrumId ? -1 : 1,
  );

  // Function to get the US table or message instead
  const getTable = () => {
    if (userStories == undefined || isLoadingUS) {
      return (
        <div className="flex h-full w-full flex-1 items-start justify-center p-10">
          <LoadingSpinner color="primary" />
        </div>
      );
    }

    // TODO: Add correct leading 0 to ids (which depends on max id). Currently hardcoded
    const tableColumns: TableColumns<UserStoryCol> = {
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
                setSelectedUS(row.id);
                setShowDetail(true);
              }}
            >
              {formatUserStoryScrumId(row.scrumId)}
            </button>
          );
        },
      },
      title: {
        label: "Title",
        width: 220,
        sortable: true,
        render(row) {
          return (
            <button
              className="w-full truncate text-left underline-offset-4 hover:text-app-primary hover:underline"
              onClick={() => {
                setSelectedUS(row.id);
                setShowDetail(true);
              }}
            >
              {row.title}
            </button>
          );
        },
      },
      epicScrumId: {
        label: "Epic",
        width: 100,
        sortable: true,
        filterable: "search-only",
        filterValue(row) {
          return formatEpicScrumId(row.epicScrumId);
        },
        render(row) {
          return <span>{formatEpicScrumId(row.epicScrumId)}</span>;
        },
      },
      priority: {
        label: "Priority",
        width: 100,
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
            const rowIndex = userStoryData.indexOf(row);
            if (
              !userStoryData[rowIndex] ||
              userStoryData[rowIndex].priority?.id === tag.id
            ) {
              return; // No update needed
            }
            const [userStoryRow] = userStoryData.splice(rowIndex, 1);
            if (!userStoryRow) {
              return; // Typescript _needs_ this, but it should never happen
            }
            userStoryRow.priority = tag;

            const newData = [...userStoryData, userStoryRow];

            // Uses optimistic update to update the priority of the user story
            await utils.userStories.getUserStoriesTableFriendly.cancel({
              projectId: projectId as string,
            });

            utils.userStories.getUserStoriesTableFriendly.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the priority in the database
            await updateUserStoryTags({
              projectId: projectId as string,
              userStoryId: row.id,
              priorityId: tag.id,
            });

            await invalidateQueriesAllUserStories(projectId as string);
            await invalidateQuerieUserStoriesDetails(projectId as string, [
              row.id,
            ]);
          };

          return (
            <PriorityPicker
              priority={row.priority}
              onChange={handlePriorityChange}
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
            const rowIndex = userStoryData.indexOf(row);
            if (!userStoryData[rowIndex]) {
              return; // No update needed
            }
            const [userStoryRow] = userStoryData.splice(rowIndex, 1);
            if (!userStoryRow) {
              return; // Typescript _needs_ this, but it should never happen
            }
            userStoryRow.size = size;

            const newData = [...userStoryData, userStoryRow];

            // Uses optimistic update to update the size of the user story
            await utils.userStories.getUserStoriesTableFriendly.cancel({
              projectId: projectId as string,
            });
            utils.userStories.getUserStoriesTableFriendly.setData(
              { projectId: projectId as string },
              newData,
            );

            // Update the size in the database
            await updateUserStoryTags({
              projectId: projectId as string,
              userStoryId: row.id,
              size: size,
            });

            await invalidateQueriesAllUserStories(projectId as string);
            await invalidateQuerieUserStoriesDetails(projectId as string, [
              row.id,
            ]);
          };

          return (
            <SizePillComponent
              currentSize={row.size}
              callback={handleSizeChange}
            />
          );
        },
      },
      sprintNumber: {
        label: "Sprint",
        width: 100,
        sortable: true,
        filterable: "list",
        filterValue(row) {
          return formatSprintNumber(row.sprintNumber).toString();
        },
        render(row) {
          return <span>{formatSprintNumber(row.sprintNumber)}</span>;
        },
      },
      taskProgress: {
        label: "Task progress",
        width: 110,
        render(row) {
          return (
            <span className="flex justify-start gap-1">
              <span>{row.taskProgress[0] ?? 0}</span>
              <span>/</span>
              <span>{row.taskProgress[1] ?? "?"}</span>
            </span>
          );
        },
      },
    };

    const handleDelete = async (
      ids: string[],
      callback: (del: boolean) => void,
    ) => {
      const confirmMessage = ids.length > 1 ? "user stories" : "user story";
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

      const newData = userStoryData.filter(
        (userStory) => !ids.includes(userStory.id),
      );

      // Uses optimistic update to update the size of the user story
      await utils.userStories.getUserStoriesTableFriendly.cancel({
        projectId: projectId as string,
      });
      utils.userStories.getUserStoriesTableFriendly.setData(
        { projectId: projectId as string },
        newData,
      );

      // Deletes in database
      await Promise.all(
        ids.map((id) =>
          deleteUserStory({
            projectId: projectId as string,
            userStoryId: id,
          }),
        ),
      );
      await invalidateQueriesAllUserStories(projectId as string);
      return true;
    };

    return (
      <Table
        emptyMessage="No user stories found"
        className={cn("w-[calc(100vw-500px)] overflow-auto", heightOfContent)}
        data={userStoryData}
        columns={tableColumns}
        onDelete={handleDelete}
        multiselect
        deletable
        tableKey="user-stories-table"
      />
    );
  };

  const onUserStoryAdded = async (userStoryId: string) => {
    await invalidateQueriesAllUserStories(projectId as string);
    setShowNewStory(false);
    setSelectedUS(userStoryId);
    setShowDetail(true);
  };

  return (
    <>
      <div className="flex flex-1 flex-col items-start gap-3">
        <h1 className="text-3xl font-semibold">User Stories</h1>

        <div className="flex w-full items-center gap-3 pb-2">
          <SearchBar
            searchValue={searchValue}
            handleUpdateSearch={handleUpdateSearch}
            placeholder="Find a user story by title or Id..."
          ></SearchBar>
          <PrimaryButton onClick={() => setShowNewStory(true)}>
            + New Story
          </PrimaryButton>
        </div>

        {getTable()}

        {renderDetail && (
          <UserStoryDetailPopup
            showDetail={showDetail}
            setShowDetail={setShowDetail}
            userStoryId={selectedUS}
          />
        )}

        {renderNewStory && (
          <CreateUserStoryPopup
            onUserStoryAdded={onUserStoryAdded}
            showPopup={showNewStory}
            setShowPopup={setShowNewStory}
          />
        )}
      </div>
    </>
  );
}
