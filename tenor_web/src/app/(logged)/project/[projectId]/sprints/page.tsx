"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SearchBar from "~/app/_components/SearchBar";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import UserStoryCardColumn from "~/app/_components/cards/UserStoryCardColumn";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/utils";
import SprintCardColumn from "./SprintCardColumn";
import LoadingSpinner from "~/app/_components/LoadingSpinner";

export default function ProjectSprints() {
  const { projectId } = useParams();

  const { data: userStoriesBySprint, isLoading } =
    api.sprints.getUserStoryPreviewsBySprint.useQuery({
      projectId: projectId as string,
    });
  const [selectedUserStories, setSelectedUserStories] = useState<Set<string>>(
    new Set(),
  );

  if (userStoriesBySprint) {
    userStoriesBySprint.sprints = [
      {
        sprint: {
          id: "1",
          description:
            "In this sprint we focus on working in Login and Register features.",
          number: 1,
          startDate: new Date(),
          endDate: new Date(),
        },
        userStories: [
          {
            id: "1",
            sprintId: "1",
            name: "Login feature",
            scrumId: 99,
            size: "S",
            tags: [],
          },
        ],
      },
      {
        sprint: {
          id: "2",
          description:
            "In this sprint we focus on working in Login and Register features.",
          number: 2,
          startDate: new Date(),
          endDate: new Date(),
        },
        userStories: [
          {
            id: "2",
            sprintId: "2",
            name: "Login feature",
            scrumId: 98,
            size: "S",
            tags: [],
          },
        ],
      },
      {
        sprint: {
          id: "3",
          description:
            "In this sprint we focus on working in Login and Register features.",
          number: 3,
          startDate: new Date(),
          endDate: new Date(),
        },
        userStories: [
          {
            id: "3",
            sprintId: "3",
            name: "Login feature",
            scrumId: 97,
            size: "S",
            tags: [],
          },
        ],
      },
      {
        sprint: {
          id: "4",
          description:
            "In this sprint we focus on working in Login and Register features.",
          number: 4,
          startDate: new Date(),
          endDate: new Date(),
        },
        userStories: [
          {
            id: "4",
            sprintId: "4",
            name: "Login feature",
            scrumId: 96,
            size: "S",
            tags: [],
          },
        ],
      },
    ];
  }

  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [detailUserStoryId, setDetailUserStoryId] = useState("");

  // Check if all unassigned user stories are selected
  const allUnassignedSelected =
    userStoriesBySprint?.unassignedUserStories.every((userStory) =>
      selectedUserStories.has(userStory.id),
    );

  const toggleSelectAllUnassigned = () => {
    if (!userStoriesBySprint?.unassignedUserStories) return;
    const newSelection = new Set(selectedUserStories);
    if (allUnassignedSelected) {
      userStoriesBySprint.unassignedUserStories.forEach((userStory) => {
        newSelection.delete(userStory.id);
      });
    } else {
      userStoriesBySprint.unassignedUserStories.forEach((userStory) => {
        newSelection.add(userStory.id);
      });
    }
    setSelectedUserStories(newSelection);
  };

  return (
    <>
      <div className="flex h-full overflow-hidden">
        <div className="flex h-full w-[420px] min-w-[420px] flex-col overflow-hidden border-r-2 pr-5">
          <div className="flex w-full justify-between pb-4">
            <h1 className="text-3xl font-semibold">Product Backlog</h1>
            <PrimaryButton onClick={() => {}}>+ Add Item</PrimaryButton>
          </div>

          <div className="flex w-full items-center gap-3 pb-4">
            <SearchBar
              searchValue={""}
              handleUpdateSearch={() => {}}
              placeholder="Search by title or tag..."
            ></SearchBar>
          </div>

          <UserStoryCardColumn
            userStories={userStoriesBySprint?.unassignedUserStories ?? []}
            isLoading={isLoading}
            selection={selectedUserStories}
            setSelection={setSelectedUserStories}
            setDetailId={setDetailUserStoryId}
            setShowDetail={setShowDetail}
            header={
              <div className="flex items-center justify-between pb-2 pr-1">
                <span>Unassigned items</span>
                <button
                  className={cn("rounded-lg px-1 text-app-text transition", {
                    "text-app-secondary": allUnassignedSelected,
                  })}
                  onClick={toggleSelectAllUnassigned}
                >
                  {allUnassignedSelected ? (
                    <CheckNone fontSize="small" />
                  ) : (
                    <CheckAll fontSize="small" />
                  )}
                </button>
              </div>
            }
          />
        </div>
        <div className="ml-5 flex h-full grow flex-col overflow-x-hidden">
          <div className="flex w-full justify-between gap-5 pb-4">
            <h1 className="text-3xl font-semibold">Sprints</h1>
            <PrimaryButton onClick={() => {}}>+ Add Sprint</PrimaryButton>
          </div>
          <div className="flex w-full flex-1 gap-4 overflow-x-scroll">
            {isLoading && (
              <div className="flex h-full w-full items-center justify-center">
                <LoadingSpinner color="primary" />
              </div>
            )}
            {userStoriesBySprint?.sprints.map((column) => (
              <SprintCardColumn
                column={column}
                key={column.sprint.id}
                selectedUserStories={selectedUserStories}
                setSelectedUserStories={setSelectedUserStories}
                setDetailUserStoryId={setDetailUserStoryId}
                setShowDetail={setShowDetail}
              />
            ))}
          </div>
        </div>
      </div>
      {renderDetail && (
        <UserStoryDetailPopup
          setShowDetail={setShowDetail}
          showDetail={showDetail}
          userStoryId={detailUserStoryId}
        />
      )}
    </>
  );
}
