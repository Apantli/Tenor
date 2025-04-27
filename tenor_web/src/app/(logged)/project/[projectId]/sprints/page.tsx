"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SearchBar from "~/app/_components/SearchBar";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import Popup, { usePopupVisibilityState } from "~/app/_components/Popup";
import UserStoryCardColumn from "~/app/_components/cards/UserStoryCardColumn";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/utils";
import SprintCardColumn from "./SprintCardColumn";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { Timestamp } from "firebase/firestore";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { DatePicker } from "~/app/_components/DatePicker";
import { useFormatUserStoryScrumId } from "~/app/_hooks/scrumIdHooks";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import type { inferRouterOutputs } from "@trpc/server";
import { useAlert } from "~/app/_hooks/useAlert";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import { useInvalidateQueriesAllUserStories, useInvalidateQueriesUserStoriesDetails } from "~/app/_hooks/invalidateHooks";

export type UserStories = inferRouterOutputs<
  typeof sprintsRouter
>["getUserStoryPreviewsBySprint"]["userStories"];

const noSprintId = "noSprintId";

// FIXME: Use the general AssignableCardColumn instead of specific columns

export default function ProjectSprints() {
  const { projectId } = useParams();
  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();
  const invalidateQueriesUserStoriesDetails = useInvalidateQueriesUserStoriesDetails();

  const { data: userStoriesBySprint, isLoading } =
    api.sprints.getUserStoryPreviewsBySprint.useQuery({
      projectId: projectId as string,
    });
  const [selectedUserStories, setSelectedUserStories] = useState<Set<string>>(
    new Set(),
  );
  // Drag and drop state
  const [lastDraggedUserStoryId, setLastDraggedUserStoryId] = useState<
    string | null
  >(null);

  const { data: defaultSprintDuration, isLoading: isLoadingSprintDuration } =
    api.settings.fetchDefaultSprintDuration.useQuery({
      projectId: projectId as string,
    });

  let defaultSprintInitialDate: Date | null = null;
  let defaultSprintEndDate: Date | null = null;
  // update values once loaded
  useEffect(() => {
    if (
      !isLoadingSprintDuration &&
      defaultSprintDuration !== undefined &&
      userStoriesBySprint != undefined
    ) {
      for (const sprint of userStoriesBySprint?.sprints ?? []) {
        if (
          defaultSprintInitialDate == null ||
          sprint.sprint.endDate > defaultSprintInitialDate
        ) {
          defaultSprintInitialDate = sprint.sprint.endDate;
        }
      }

      // Set defaultSprintInitialDate to one day after the latest sprint endDate
      if (defaultSprintInitialDate != null) {
        defaultSprintInitialDate = new Date(
          defaultSprintInitialDate.getTime() + 24 * 60 * 60 * 1000,
        );
      } else {
        defaultSprintInitialDate = new Date();
      }

      defaultSprintEndDate = new Date(
        (defaultSprintInitialDate ?? new Date()).getTime() +
          defaultSprintDuration * 24 * 60 * 60 * 1000,
      );
      setNewSprintStartDate(defaultSprintInitialDate);
      setNewSprintEndDate(defaultSprintEndDate);
    }
  }, [isLoadingSprintDuration, defaultSprintDuration, userStoriesBySprint]);

  const [searchValue, setSearchValue] = useState("");

  const filteredUnassignedStories =
    userStoriesBySprint?.unassignedUserStoryIds.filter((userStoryId) => {
      const userStory = userStoriesBySprint?.userStories[userStoryId];
      if (!userStory) return false;

      const tagsList = userStory.tags.map((tag) => "Tag:" + tag.name).join(" ");
      const fullUserStoryName = `${formatUserStoryScrumId(userStory.scrumId)}: ${userStory.name} ${tagsList} Size:${userStory.size}`;
      return fullUserStoryName
        .toLowerCase()
        .includes(searchValue.toLowerCase());
    }) ?? [];

  const { mutateAsync: createSprint, isPending } =
    api.sprints.createOrModifySprint.useMutation();
  const utils = api.useUtils();
  const [renderSmallPopup, showSmallPopup, setShowSmallPopup] =
    usePopupVisibilityState();

  const cancelUserStoryPreviewQuery = async () => {
    await utils.sprints.getUserStoryPreviewsBySprint.cancel({
      projectId: projectId as string,
    });
  };

  const { mutateAsync: assignUserStoriesToSprint } =
    api.sprints.assignUserStoriesToSprint.useMutation();

  // New sprint variables
  const [newSprintDescription, setNewSprintDescription] = useState("");
  const [newSprintStartDate, setNewSprintStartDate] = useState<Date | null>(
    null,
  );
  const [newSprintEndDate, setNewSprintEndDate] = useState<Date | null>(null);

  const { alert } = useAlert();
  const handleCreateSprint = async () => {
    if (newSprintStartDate === null || newSprintEndDate === null) return;

    // Validate dates
    if (newSprintStartDate >= newSprintEndDate) {
      alert("Oops...", "Dates are invalid.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    for (const sprint of userStoriesBySprint?.sprints ?? []) {
      if (
        (sprint.sprint.startDate <= newSprintStartDate &&
          sprint.sprint.endDate >= newSprintStartDate) ||
        (sprint.sprint.startDate <= newSprintEndDate &&
          sprint.sprint.endDate >= newSprintEndDate) ||
        (newSprintStartDate <= sprint.sprint.startDate &&
          newSprintEndDate >= sprint.sprint.startDate) ||
        (newSprintStartDate <= sprint.sprint.endDate &&
          newSprintEndDate >= sprint.sprint.endDate)
      ) {
        alert(
          "Oops...",
          `Dates collide with Sprint number ${sprint.sprint.number}.`,
          {
            type: "error",
            duration: 5000,
          },
        );
        return;
      }
    }

    const response = await createSprint({
      projectId: projectId as string,
      number: -1,
      description: newSprintDescription,
      startDate: Timestamp.fromDate(newSprintStartDate),
      endDate: Timestamp.fromDate(newSprintEndDate),
      // updatedData.dueDate ? Timestamp.fromDate(updatedData.dueDate) : null,
      userStoryIds: [],
      genericItemIds: [],
      issueIds: [],
    });
    await utils.sprints.getUserStoryPreviewsBySprint.invalidate({
      projectId: projectId as string,
    });

    setNewSprintDescription("");
    setNewSprintStartDate(defaultSprintInitialDate);
    setNewSprintEndDate(defaultSprintEndDate);

    setShowSmallPopup(false);
  };

  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [detailUserStoryId, setDetailUserStoryId] = useState("");

  // Check if all unassigned user stories are selected
  const allUnassignedSelected = filteredUnassignedStories.every((userStoryId) =>
    selectedUserStories.has(userStoryId),
  );

  const toggleSelectAllUnassigned = () => {
    const newSelection = new Set(selectedUserStories);
    if (allUnassignedSelected) {
      filteredUnassignedStories.forEach((userStoryId) => {
        newSelection.delete(userStoryId);
      });
    } else {
      filteredUnassignedStories.forEach((userStoryId) => {
        newSelection.add(userStoryId);
      });
    }
    setSelectedUserStories(newSelection);
  };

  const assignSelectionToSprint = async (sprintId: string) => {
    setLastDraggedUserStoryId(null);
    const userStoryIds = Array.from(selectedUserStories);
    const userStories = userStoriesBySprint?.userStories;
    if (!userStories) return;

    // Cancel previous fetches for the sprint data
    await cancelUserStoryPreviewQuery();

    utils.sprints.getUserStoryPreviewsBySprint.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return undefined;

        const sortByScrumId = (a: string, b: string) => {
          const storyA = userStories[a];
          const storyB = userStories[b];
          return (storyA?.scrumId ?? 0) - (storyB?.scrumId ?? 0);
        };

        const sprints = oldData.sprints.map((sprint) => {
          if (sprint.sprint.id === sprintId) {
            const sortedUserStoryIds = [
              ...sprint.userStoryIds,
              ...userStoryIds,
            ].sort(sortByScrumId);
            return {
              ...sprint,
              userStoryIds: sortedUserStoryIds,
            };
          } else {
            return {
              ...sprint,
              userStoryIds: sprint.userStoryIds.filter(
                (userStoryId) => !userStoryIds.includes(userStoryId),
              ),
            };
          }
        });

        let newUnassignedUserStoryIds = [];
        if (sprintId === "") {
          newUnassignedUserStoryIds = [
            ...oldData.unassignedUserStoryIds,
            ...userStoryIds,
          ].sort(sortByScrumId);
        } else {
          newUnassignedUserStoryIds = oldData.unassignedUserStoryIds.filter(
            (userStoryId) => !userStoryIds.includes(userStoryId),
          );
        }

        const updatedUserStories = Object.fromEntries(
          Object.entries(oldData.userStories).map(([id, userStory]) => {
            if (userStoryIds.includes(id)) {
              return [
                id,
                {
                  ...userStory,
                  sprintId: sprintId,
                },
              ];
            }
            return [id, userStory];
          }),
        );

        return {
          sprints,
          unassignedUserStoryIds: newUnassignedUserStoryIds,
          userStories: updatedUserStories,
        };
      },
    );
    setSelectedUserStories(new Set());

    await assignUserStoriesToSprint({
      projectId: projectId as string,
      sprintId,
      userStoryIds,
    });

    // Cancel previous fetches for the sprint data
    await cancelUserStoryPreviewQuery();
    await invalidateQueriesAllUserStories(projectId as string);
    await invalidateQueriesUserStoriesDetails(projectId as string, userStoryIds);
  };

  const availableToBeAssignedTo =
    selectedUserStories.size > 0 &&
    Array.from(selectedUserStories).every(
      (selectedUserStoryId) =>
        userStoriesBySprint?.userStories[selectedUserStoryId]?.sprintId !== "",
    );

  //// Drag and drop operations
  let dndOperationsInProgress = 0;

  // Similar but not equal to assignSelectionToSprint
  const handleDragEnd = async (userStoryId: string, sprintId: string) => {
    if (sprintId == noSprintId) {
      sprintId = "";
    }
    const userStories = userStoriesBySprint?.userStories;
    if (!userStories || userStories[userStoryId]?.sprintId === sprintId) return;

    dndOperationsInProgress += 1;
    // Cancel previous fetches for the sprint data
    await cancelUserStoryPreviewQuery();

    setLastDraggedUserStoryId(userStoryId);
    const userStoryIds = [userStoryId];

    utils.sprints.getUserStoryPreviewsBySprint.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return undefined;

        const sortByScrumId = (a: string, b: string) => {
          const storyA = userStories[a];
          const storyB = userStories[b];
          return (storyA?.scrumId ?? 0) - (storyB?.scrumId ?? 0);
        };

        const sprints = oldData.sprints.map((sprint) => {
          if (sprint.sprint.id === sprintId) {
            const sortedUserStoryIds = [
              ...sprint.userStoryIds,
              userStoryId,
            ].sort(sortByScrumId);
            return {
              ...sprint,
              userStoryIds: sortedUserStoryIds,
            };
          } else {
            return {
              ...sprint,
              userStoryIds: sprint.userStoryIds.filter(
                (oldUserStoryId) => oldUserStoryId !== userStoryId,
              ),
            };
          }
        });

        let newUnassignedUserStoryIds = [];
        if (sprintId === "") {
          newUnassignedUserStoryIds = [
            ...oldData.unassignedUserStoryIds,
            ...userStoryIds,
          ].sort(sortByScrumId);
        } else {
          newUnassignedUserStoryIds = oldData.unassignedUserStoryIds.filter(
            (userStoryId) => !userStoryIds.includes(userStoryId),
          );
        }

        const updatedUserStories = Object.fromEntries(
          Object.entries(oldData.userStories).map(([id, userStory]) => {
            if (userStoryIds.includes(id)) {
              return [
                id,
                {
                  ...userStory,
                  sprintId: sprintId,
                },
              ];
            }
            return [id, userStory];
          }),
        );

        return {
          sprints,
          unassignedUserStoryIds: newUnassignedUserStoryIds,
          userStories: updatedUserStories,
        };
      },
    );
    setSelectedUserStories(new Set());

    await assignUserStoriesToSprint({
      projectId: projectId as string,
      sprintId,
      userStoryIds,
    });

    // Cancel previous fetches for the sprint data
    await cancelUserStoryPreviewQuery();

    // Only fetch again if this is the last operation
    if (dndOperationsInProgress == 1) {
      await invalidateQueriesAllUserStories(projectId as string);
      await invalidateQueriesUserStoriesDetails(projectId as string, userStoryIds);
    }

    // Mark operation as finished
    dndOperationsInProgress -= 1;
  };

  return (
    <>
      <DragDropProvider
        onDragEnd={async (event) => {
          const { operation, canceled } = event;
          const { source, target } = operation;

          if (!source || canceled || !target) {
            return;
          }

          await handleDragEnd(source.id as string, target.id as string);
        }}
      >
        <div className="flex h-full overflow-hidden">
          <div className="relative flex h-full w-[407px] min-w-[407px] flex-col overflow-hidden border-r-2 pr-5">
            <div className="flex w-full justify-between pb-4">
              <h1 className="text-3xl font-semibold">Product Backlog</h1>
              <PrimaryButton onClick={() => {}}>+ Add Item</PrimaryButton>
            </div>

            <div className="flex w-full items-center gap-3 pb-4">
              <SearchBar
                searchValue={searchValue}
                handleUpdateSearch={(e) => setSearchValue(e.target.value)}
                placeholder="Search by title or tag..."
              ></SearchBar>
            </div>

            <UserStoryCardColumn
              lastDraggedUserStoryId={lastDraggedUserStoryId}
              dndId={noSprintId}
              userStories={
                filteredUnassignedStories
                  .map(
                    (userStoryId) =>
                      userStoriesBySprint?.userStories[userStoryId],
                  )
                  .filter((val) => val !== undefined) ?? []
              }
              isLoading={isLoading}
              selection={selectedUserStories}
              setSelection={setSelectedUserStories}
              setDetailId={setDetailUserStoryId}
              setShowDetail={setShowDetail}
              header={
                <div className="flex items-center justify-between pb-2 pr-1">
                  <span className="text-xl font-medium">Unassigned items</span>
                  <button
                    className={cn("rounded-lg px-1 text-app-text transition", {
                      "text-app-secondary":
                        filteredUnassignedStories.length > 0 &&
                        allUnassignedSelected,
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
            <div
              className={cn(
                "pointer-events-none absolute bottom-0 left-0 flex w-full p-3 opacity-0 transition",
                {
                  "pointer-events-auto opacity-100": availableToBeAssignedTo,
                },
              )}
            >
              <PrimaryButton
                className="mr-5 flex-1"
                onClick={() => assignSelectionToSprint("")}
              >
                Unassign selection
              </PrimaryButton>
            </div>
          </div>
          <div className="ml-5 flex h-full grow flex-col overflow-x-hidden">
            <div className="flex w-full justify-between gap-5 pb-4">
              <h1 className="text-3xl font-semibold">Sprints</h1>
              <PrimaryButton
                onClick={() => {
                  setShowSmallPopup(true);
                }}
              >
                + Add Sprint
              </PrimaryButton>
            </div>
            <div className="flex w-full flex-1 gap-4 overflow-x-auto">
              {isLoading && (
                <div className="flex h-full w-full items-center justify-center">
                  <LoadingSpinner color="primary" />
                </div>
              )}
              {userStoriesBySprint?.sprints.map((column) => (
                <SprintCardColumn
                  lastDraggedUserStoryId={lastDraggedUserStoryId}
                  assignSelectionToSprint={assignSelectionToSprint}
                  column={column}
                  userStories={userStoriesBySprint.userStories}
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

        <DragOverlay>
          {(source) => {
            const userStoryId = source.id as string;
            if (!userStoryId) return null;
            const draggingUserStory =
              userStoriesBySprint?.userStories[userStoryId];
            if (!draggingUserStory) return null;
            const item = {
              ...draggingUserStory,
              columnId: draggingUserStory.sprintId,
            };
            return (
              <ItemCardRender
                item={item}
                showBackground={true}
                scrumIdFormatter={formatUserStoryScrumId}
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>

      {renderDetail && (
        <UserStoryDetailPopup
          setShowDetail={setShowDetail}
          showDetail={showDetail}
          userStoryId={detailUserStoryId}
        />
      )}
      {renderSmallPopup && (
        <Popup
          show={showSmallPopup}
          reduceTopPadding
          size="small"
          className="min-h-[400px] min-w-[500px]"
          dismiss={() => setShowSmallPopup(false)}
          footer={
            <div className="flex gap-2">
              <PrimaryButton
                onClick={async () => {
                  await handleCreateSprint();
                }}
                loading={isPending}
              >
                Create Sprint
              </PrimaryButton>
            </div>
          }
        >
          {" "}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl">
              <strong>New Sprint</strong>{" "}
            </h1>
            <InputTextAreaField
              height={15}
              label="Sprint description"
              value={newSprintDescription}
              onChange={(e) => setNewSprintDescription(e.target.value)}
              placeholder="Your sprint description"
              className="h-[200px] w-full"
            />
            <div className="flex w-full justify-center gap-4">
              <div className="w-full">
                <h3 className="text-sm font-semibold">Start date</h3>
                <DatePicker
                  selectedDate={newSprintStartDate}
                  placeholder="Select date"
                  className="w-full"
                  onChange={(e) => {
                    setNewSprintStartDate(e);
                  }}
                />
              </div>
              <div className="w-full">
                <h3 className="text-sm font-semibold">End date</h3>
                <DatePicker
                  selectedDate={newSprintEndDate}
                  placeholder="Select date"
                  className="w-full"
                  onChange={(e) => {
                    setNewSprintEndDate(e);
                  }}
                />
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}
