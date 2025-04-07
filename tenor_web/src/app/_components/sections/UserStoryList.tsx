"use client";

import PillComponent from "~/app/_components/PillComponent";
import Table, { type TableColumns } from "~/app/_components/table/Table";
import type { Size, Tag } from "~/lib/types/firebaseSchemas";
import { useEffect, useState, type ChangeEventHandler } from "react";
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
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scumIdHooks";
import { UserStorySchema } from "~/lib/types/zodFirebaseSchema";
import PriorityPicker from "../specific-pickers/PriorityPicker";

export const heightOfContent = "h-[calc(100vh-285px)]";

export default function UserStoryList() {
  // Hooks
  const params = useParams();
  const [userStoryData, setUserStoryData] = useState<UserStoryCol[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const [selectedUS, setSelectedUS] = useState<string>("");
  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [renderNewStory, showNewStory, setShowNewStory] =
    usePopupVisibilityState();

  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const formatEpicScrumId = useFormatEpicScrumId();

  // TRPC
  const utils = api.useUtils();
  const {
    data: userStories,
    isLoading: isLoadingUS,
    refetch: refetchUS,
  } = api.userStories.getUserStoriesTableFriendly.useQuery({
    projectId: params.projectId as string,
  });
  const { mutateAsync: updateUserStoryTags } =
    api.userStories.modifyUserStoryTags.useMutation();

  // Handles
  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
    if (!userStories) {
      return;
    }
    const searchValue = e.target.value.toLowerCase();
    const filteredData = userStories.filter(
      (userStory) =>
        userStory.title.toLowerCase().includes(searchValue) ||
        formatUserStoryScrumId(userStory.scrumId).includes(searchValue),
    );
    setUserStoryData(filteredData.sort((a, b) => (a.id < b.id ? -1 : 1)));
  };

  useEffect(() => {
    if (userStories) {
      setUserStoryData(userStories);
    }
  }, [userStories]);

  // Function to get the US table or message instead
  const getTable = () => {
    if (userStories == undefined || isLoadingUS) {
      return <span>Loading...</span>;
    }

    if (userStoryData?.length == 0) {
      return <span>No User stories found</span>;
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
      epicId: {
        label: "Epic",
        width: 100,
        sortable: true,
        filterable: "search-only",
        render(row) {
          // FIXME: The actual epic scrum id should be sent to the client, along the normal id
          return <span>{formatEpicScrumId(row.epicId)}</span>;
        },
      },
      priority: {
        label: "Priority",
        width: 140,
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

            const newData = [...userStoryData, userStoryRow].sort((a, b) =>
              a.scrumId < b.scrumId ? -1 : 1,
            );

            // Uses optimistic update to update the priority of the user story
            await utils.userStories.getUserStoriesTableFriendly.cancel({
              projectId: params.projectId as string,
            });

            utils.userStories.getUserStoriesTableFriendly.setData(
              { projectId: params.projectId as string },
              newData,
            );

            // UseEffect atomatically updates the data

            // Update the priority in the database
            await updateUserStoryTags({
              projectId: params.projectId as string,
              userStoryId: row.id,
              priorityTag: tag.id,
            });

            await refetchUS();
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

            const newData = [...userStoryData, userStoryRow].sort((a, b) =>
              a.scrumId < b.scrumId ? -1 : 1,
            );

            // Uses optimistic update to update the size of the user story
            await utils.userStories.getUserStoriesTableFriendly.cancel({
              projectId: params.projectId as string,
            });
            utils.userStories.getUserStoriesTableFriendly.setData(
              { projectId: params.projectId as string },
              newData,
            );

            // UseEffect atomatically updates the data

            // Update the size in the database
            await updateUserStoryTags({
              projectId: params.projectId as string,
              userStoryId: row.id,
              size: size,
            });

            await refetchUS();
          };

          return (
            <SizePillComponent
              currentSize={row.size}
              callback={handleSizeChange}
            />
          );
        },
      },
      sprintId: {
        label: "Sprint",
        width: 100,
        sortable: true,
        filterable: "list",
        render(row) {
          return (
            <span>
              {row.sprintId == 0 ? "No Sprint" : "Sprint " + row.sprintId}
            </span>
          );
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

    return (
      <Table
        className={cn("w-full", heightOfContent)}
        data={userStoryData}
        columns={tableColumns}
        multiselect
        deletable
        onDelete={(ids) => console.log("Deleted", ids)} // TODO: Implement delete
      />
    );
  };

  const onUserStoryAdded = async (userStoryId: string) => {
    await refetchUS();
    setShowNewStory(false);
    setSelectedUS(userStoryId);
    setShowDetail(true);
  };

  return (
    <>
      <div className="flex w-[calc(100%-300px)] flex-col items-start gap-3">
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
