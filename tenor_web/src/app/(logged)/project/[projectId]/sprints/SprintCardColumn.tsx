import type { inferRouterOutputs } from "@trpc/server";
import React from "react";
import UserStoryCardColumn from "~/app/_components/cards/UserStoryCardColumn";
import { cn } from "~/lib/utils";
import type sprintsRouter from "~/server/api/routers/sprints";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import Dropdown, { DropdownButton } from "~/app/_components/Dropdown";

interface Props {
  column: inferRouterOutputs<
    typeof sprintsRouter
  >["getUserStoryPreviewsBySprint"]["sprints"][number];
  selectedUserStories: Set<string>;
  setSelectedUserStories: (newSelection: Set<string>) => void;
  setDetailUserStoryId: (detailId: string) => void;
  setShowDetail: (showDetail: boolean) => void;
}

export default function SprintCardColumn({
  column,
  selectedUserStories,
  setSelectedUserStories,
  setDetailUserStoryId,
  setShowDetail,
}: Props) {
  const allSelected = column.userStories.every((userStory) =>
    selectedUserStories.has(userStory.id),
  );

  const toggleSelectAll = () => {
    const newSelection = new Set(selectedUserStories);
    if (allSelected) {
      column.userStories.forEach((userStory) => {
        newSelection.delete(userStory.id);
      });
    } else {
      column.userStories.forEach((userStory) => {
        newSelection.add(userStory.id);
      });
    }
    setSelectedUserStories(newSelection);
  };

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  });

  // Check there's selected user stories and none of them are in this sprint
  const availableToBeAssignedTo =
    selectedUserStories.size > 0 &&
    Array.from(selectedUserStories).every(
      (userStoryId) =>
        !column.userStories.some((userStory) => userStory.id === userStoryId),
    );

  return (
    <div
      className="relative h-full w-96 min-w-96 overflow-hidden rounded-lg"
      key={column.sprint.id}
    >
      <UserStoryCardColumn
        userStories={column.userStories}
        selection={selectedUserStories}
        setSelection={setSelectedUserStories}
        setDetailId={setDetailUserStoryId}
        setShowDetail={setShowDetail}
        header={
          <div className="flex flex-col items-start pr-1">
            <div className="flex w-full justify-between">
              <h1 className="text-2xl font-medium">
                Sprint {column.sprint.number}
              </h1>
              <div className="flex gap-2">
                <button
                  className={cn("rounded-lg px-1 text-app-text transition", {
                    "text-app-secondary": allSelected,
                  })}
                  onClick={toggleSelectAll}
                >
                  {allSelected ? (
                    <CheckNone fontSize="small" />
                  ) : (
                    <CheckAll fontSize="small" />
                  )}
                </button>
                <Dropdown label={"• • •"}>
                  <DropdownButton>Something</DropdownButton>
                </Dropdown>
              </div>
            </div>
            <span className="mb-4 text-lg text-gray-600">
              {dateFormatter.format(column.sprint.startDate)} -{" "}
              {dateFormatter.format(column.sprint.endDate)}
            </span>
            <p className="mb-2">
              In this sprint we focus on working in Login and Register features.
            </p>
            <hr className="mb-2 w-full border border-app-border" />
          </div>
        }
      />
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 flex h-full w-full items-center justify-center bg-app-secondary text-white opacity-0 transition",
          {
            "pointer-events-auto cursor-pointer opacity-30 hover:opacity-50":
              availableToBeAssignedTo,
          },
        )}
      >
        <h1 className="text-center text-3xl">
          Click to assign selected user stories
        </h1>
      </div>
    </div>
  );
}
