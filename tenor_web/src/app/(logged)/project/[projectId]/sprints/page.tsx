"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SearchBar from "~/app/_components/SearchBar";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import Popup, { usePopupVisibilityState } from "~/app/_components/Popup";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/utils";
import SprintCardColumn from "./SprintCardColumn";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { Timestamp } from "firebase/firestore";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { DatePicker } from "~/app/_components/DatePicker";
import {
  useFormatIssueScrumId,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import type { inferRouterOutputs } from "@trpc/server";
import { useAlert } from "~/app/_hooks/useAlert";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import {
  useInvalidateQueriesBacklogItemDetails,
  useInvalidateQueriesBacklogItems,
} from "~/app/_hooks/invalidateHooks";
import BacklogItemCardColumn from "~/app/_components/cards/BacklogItemCardColumn";
import IssueDetailPopup from "../issues/IssueDetailPopup";
import ColumnsIcon from "@mui/icons-material/ViewWeek";
import {
  type Permission,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";

export type BacklogItems = inferRouterOutputs<
  typeof sprintsRouter
>["getBacklogItemPreviewsBySprint"]["backlogItems"];

const noSprintId = "noSprintId";

// FIXME: Use the general AssignableCardColumn instead of specific columns

export default function ProjectSprints() {
  const { projectId } = useParams();

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["backlog"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const formatIssueScrumId = useFormatIssueScrumId();
  const invalidateQueriesBacklogItemDetails =
    useInvalidateQueriesBacklogItemDetails();
  const invalidateQueriesBacklogItems = useInvalidateQueriesBacklogItems();

  const { data: backlogItemsBySprint, isLoading } =
    api.sprints.getBacklogItemPreviewsBySprint.useQuery({
      projectId: projectId as string,
    });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  // Drag and drop state
  const [lastDraggedBacklogItemId, setLastDraggedBacklogItemId] = useState<
    string | null
  >(null);

  const { data: scrumSettings, isLoading: isLoadingSprintDuration } =
    api.settings.fetchScrumSettings.useQuery({
      projectId: projectId as string,
    });

  let defaultSprintInitialDate: Date | undefined = undefined;
  let defaultSprintEndDate: Date | undefined = undefined;
  // update values once loaded
  useEffect(() => {
    if (
      !isLoadingSprintDuration &&
      scrumSettings !== undefined &&
      backlogItemsBySprint != undefined
    ) {
      for (const sprint of backlogItemsBySprint?.sprints ?? []) {
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
          scrumSettings.sprintDuration * 24 * 60 * 60 * 1000,
      );
      setNewSprintStartDate(defaultSprintInitialDate);
      setNewSprintEndDate(defaultSprintEndDate);
    }
  }, [isLoadingSprintDuration, scrumSettings, backlogItemsBySprint]);

  const [searchValue, setSearchValue] = useState("");
  const [sprintSearchValue, setSprintSearchValue] = useState("");

  const filteredUnassignedItems =
    backlogItemsBySprint?.unassignedItemIds.filter((itemId) => {
      const item = backlogItemsBySprint?.backlogItems[itemId];
      if (!item) return false;

      const tagsList = item.tags.map((tag) => "Tag:" + tag.name).join(" ");
      let formatter = formatUserStoryScrumId;
      if (item.itemType === "IS") {
        formatter = formatIssueScrumId;
      }
      const itemTypeName =
        item.itemType === "US"
          ? "Type:Story Type:UserStory Type:User Story"
          : "Type:Issue Type:Bug";
      const fullItemName = `${formatter(item.scrumId)}: ${item.name} ${tagsList} Size:${item.size} ${itemTypeName}`;
      return fullItemName.toLowerCase().includes(searchValue.toLowerCase());
    }) ?? [];

  const filteredSprints =
    backlogItemsBySprint?.sprints.filter((sprint) => {
      if (!sprintSearchValue) return true;

      const sprintNumber = `Sprint ${sprint.sprint.number}`;
      if (sprintNumber.toLowerCase().includes(sprintSearchValue.toLowerCase()))
        return true;

      if (
        sprint.sprint.description
          ?.toLowerCase()
          .includes(sprintSearchValue.toLowerCase())
      )
        return true;

      const formatDateRange = (startDate: Date, endDate: Date) => {
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        const startMonth = months[startDate.getMonth()];
        const startDay =
          startDate.getDate() < 10
            ? `0${startDate.getDate()}`
            : `${startDate.getDate()}`;

        const endMonth = months[endDate.getMonth()];
        const endDay =
          endDate.getDate() < 10
            ? `0${endDate.getDate()}`
            : `${endDate.getDate()}`;

        return `${startMonth} ${startDay} - ${endMonth} ${endDay}`.toLowerCase();
      };

      const dateRange = formatDateRange(
        sprint.sprint.startDate,
        sprint.sprint.endDate,
      );
      if (dateRange.toLowerCase().includes(sprintSearchValue.toLowerCase()))
        return true;

      const hasMatchingItem = sprint.backlogItemIds.some((id) => {
        const item = backlogItemsBySprint?.backlogItems[id];
        if (!item) return false;

        const tagsList = item.tags.map((tag) => "Tag:" + tag.name).join(" ");
        let formatter = formatUserStoryScrumId;
        if (item.itemType === "IS") {
          formatter = formatIssueScrumId;
        }
        const itemTypeName =
          item.itemType === "US"
            ? "Type:Story Type:UserStory Type:User Story"
            : "Type:Issue Type:Bug";
        const fullItemName = `${formatter(item.scrumId)}: ${item.name} ${tagsList} Size:${item.size} ${itemTypeName}`;

        return fullItemName
          .toLowerCase()
          .includes(sprintSearchValue.toLowerCase());
      });

      return hasMatchingItem;
    }) ?? [];

  const { mutateAsync: createSprint, isPending } =
    api.sprints.createOrModifySprint.useMutation();
  const utils = api.useUtils();
  const [renderSmallPopup, showSmallPopup, setShowSmallPopup] =
    usePopupVisibilityState();

  const cancelBacklogItemsPreviewQuery = async () => {
    await utils.sprints.getBacklogItemPreviewsBySprint.cancel({
      projectId: projectId as string,
    });
  };

  const { mutateAsync: assignItemsToSprint } =
    api.sprints.assignItemsToSprint.useMutation();

  // New sprint variables
  const [newSprintDescription, setNewSprintDescription] = useState("");
  const [newSprintStartDate, setNewSprintStartDate] = useState<
    Date | undefined
  >(undefined);
  const [newSprintEndDate, setNewSprintEndDate] = useState<Date | undefined>(
    undefined,
  );

  const { alert } = useAlert();
  const handleCreateSprint = async () => {
    if (newSprintStartDate === undefined || newSprintEndDate === undefined)
      return;

    // Validate dates
    if (newSprintStartDate >= newSprintEndDate) {
      alert("Oops...", "Dates are invalid.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    for (const sprint of backlogItemsBySprint?.sprints ?? []) {
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

    await createSprint({
      projectId: projectId as string,
      sprintData: {
        number: -1,
        description: newSprintDescription,
        startDate: Timestamp.fromDate(newSprintStartDate),
        endDate: Timestamp.fromDate(newSprintEndDate),
        // updatedData.dueDate ? Timestamp.fromDate(updatedData.dueDate) : null,
        userStoryIds: [],
        genericItemIds: [],
        issueIds: [],
      },
    });
    await utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
      projectId: projectId as string,
    });

    setNewSprintDescription("");
    setNewSprintStartDate(defaultSprintInitialDate);
    setNewSprintEndDate(defaultSprintEndDate);

    setShowSmallPopup(false);
  };

  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [detailItemId, setDetailItemId] = useState("");

  // Check if all unassigned items are selected
  const allUnassignedSelected = filteredUnassignedItems.every((itemId) =>
    selectedItems.has(itemId),
  );

  const toggleSelectAllUnassigned = () => {
    const newSelection = new Set(selectedItems);
    if (allUnassignedSelected) {
      filteredUnassignedItems.forEach((itemId) => {
        newSelection.delete(itemId);
      });
    } else {
      filteredUnassignedItems.forEach((itemId) => {
        newSelection.add(itemId);
      });
    }
    setSelectedItems(newSelection);
  };

  const assignSelectionToSprint = async (sprintId: string) => {
    setLastDraggedBacklogItemId(null);
    const itemIds = Array.from(selectedItems);
    const items = backlogItemsBySprint?.backlogItems;
    if (!items) return;

    // Cancel previous fetches for the sprint data
    await cancelBacklogItemsPreviewQuery();

    utils.sprints.getBacklogItemPreviewsBySprint.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return undefined;

        const sortByScrumId = (a: string, b: string) => {
          const itemA = items[a];
          const itemB = items[b];
          if (itemA?.scrumId === itemB?.scrumId) {
            return itemA?.itemType === "US" ? -1 : 1;
          }
          return (itemA?.scrumId ?? 0) - (itemB?.scrumId ?? 0);
        };

        const sprints = oldData.sprints.map((sprint) => {
          if (sprint.sprint.id === sprintId) {
            const sortedItemIds = [...sprint.backlogItemIds, ...itemIds].sort(
              sortByScrumId,
            );
            return {
              ...sprint,
              backlogItemIds: sortedItemIds,
            };
          } else {
            return {
              ...sprint,
              backlogItemIds: sprint.backlogItemIds.filter(
                (itemId) => !itemIds.includes(itemId),
              ),
            };
          }
        });

        let newUnassignedItemIds = [];
        if (sprintId === "") {
          newUnassignedItemIds = [
            ...oldData.unassignedItemIds,
            ...itemIds,
          ].sort(sortByScrumId);
        } else {
          newUnassignedItemIds = oldData.unassignedItemIds.filter(
            (itemId) => !itemIds.includes(itemId),
          );
        }

        const updatedBacklogItems = Object.fromEntries(
          Object.entries(oldData.backlogItems).map(([id, item]) => {
            if (itemIds.includes(id)) {
              return [
                id,
                {
                  ...item,
                  sprintId: sprintId,
                },
              ];
            }
            return [id, item];
          }),
        );

        return {
          sprints,
          unassignedItemIds: newUnassignedItemIds,
          backlogItems: updatedBacklogItems,
        };
      },
    );
    setSelectedItems(new Set());

    await assignItemsToSprint({
      projectId: projectId as string,
      sprintId,
      items: itemIds.map((itemId) => ({
        id: itemId,
        itemType: items[itemId]!.itemType as "US" | "IS",
      })),
    });

    // Cancel previous fetches for the sprint data
    await cancelBacklogItemsPreviewQuery();

    await invalidateQueriesBacklogItems(projectId as string, "US");
    await invalidateQueriesBacklogItems(projectId as string, "IS");
    await invalidateQueriesBacklogItemDetails(
      projectId as string,
      itemIds.map((id) => ({
        itemId: id,
        itemType: items[id]!.itemType as "US" | "IS",
      })),
    );
  };

  const availableToBeAssignedTo =
    selectedItems.size > 0 &&
    Array.from(selectedItems).every(
      (selectedId) =>
        backlogItemsBySprint?.backlogItems[selectedId]?.sprintId !== "",
    );

  //// Drag and drop operations
  let dndOperationsInProgress = 0;

  // Similar but not equal to assignSelectionToSprint
  const handleDragEnd = async (itemId: string, sprintId: string) => {
    if (sprintId == noSprintId) {
      sprintId = "";
    }
    const items = backlogItemsBySprint?.backlogItems;
    if (!items || items[itemId]?.sprintId === sprintId) return;

    dndOperationsInProgress += 1;
    // Cancel previous fetches for the sprint data
    await cancelBacklogItemsPreviewQuery();

    setLastDraggedBacklogItemId(itemId);
    const itemIds = [itemId];

    utils.sprints.getBacklogItemPreviewsBySprint.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return undefined;

        const sortByScrumId = (a: string, b: string) => {
          const itemA = items[a];
          const itemB = items[b];
          if (itemA?.scrumId === itemB?.scrumId) {
            return itemA?.itemType === "US" ? -1 : 1;
          }
          return (itemA?.scrumId ?? 0) - (itemB?.scrumId ?? 0);
        };

        const sprints = oldData.sprints.map((sprint) => {
          if (sprint.sprint.id === sprintId) {
            const sortedBacklogItemIds = [
              ...sprint.backlogItemIds,
              itemId,
            ].sort(sortByScrumId);
            return {
              ...sprint,
              backlogItemIds: sortedBacklogItemIds,
            };
          } else {
            return {
              ...sprint,
              backlogItemIds: sprint.backlogItemIds.filter(
                (oldId) => oldId !== itemId,
              ),
            };
          }
        });

        let newUnassignedItemIds = [];
        if (sprintId === "") {
          newUnassignedItemIds = [
            ...oldData.unassignedItemIds,
            ...itemIds,
          ].sort(sortByScrumId);
        } else {
          newUnassignedItemIds = oldData.unassignedItemIds.filter(
            (itemId) => !itemIds.includes(itemId),
          );
        }

        const updatedBacklogItems = Object.fromEntries(
          Object.entries(oldData.backlogItems).map(([id, item]) => {
            if (itemIds.includes(id)) {
              return [
                id,
                {
                  ...item,
                  sprintId: sprintId,
                },
              ];
            }
            return [id, item];
          }),
        );

        return {
          sprints,
          unassignedItemIds: newUnassignedItemIds,
          backlogItems: updatedBacklogItems,
        };
      },
    );
    setSelectedItems(new Set());

    await assignItemsToSprint({
      projectId: projectId as string,
      sprintId,
      items: itemIds.map((itemId) => ({
        id: itemId,
        itemType: items[itemId]!.itemType as "US" | "IS",
      })),
    });

    // Cancel previous fetches for the sprint data
    await cancelBacklogItemsPreviewQuery();

    // Only fetch again if this is the last operation
    if (dndOperationsInProgress == 1) {
      setLastDraggedBacklogItemId(null);
      await invalidateQueriesBacklogItems(projectId as string, "US");
      await invalidateQueriesBacklogItems(projectId as string, "IS");
      await invalidateQueriesBacklogItemDetails(
        projectId as string,
        itemIds.map((id) => ({
          itemId: id,
          itemType: items[id]!.itemType as "US" | "IS",
        })),
      );
    }

    // Mark operation as finished
    dndOperationsInProgress -= 1;
  };

  useEffect(() => {
    setLastDraggedBacklogItemId(null);
  }, [sprintSearchValue]);

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
          <div className="relative flex h-full w-[407px] min-w-[407px] flex-col gap-0 overflow-hidden border-r-2 pr-5">
            <div className="flex w-full justify-between pb-2">
              <h1 className="text-3xl font-semibold">Product Backlog</h1>
              {permission >= permissionNumbers.write && (
                <PrimaryButton onClick={() => {}}>+ Add Item</PrimaryButton>
              )}
            </div>

            <div className="flex w-full items-center gap-3 pb-4">
              <SearchBar
                searchValue={searchValue}
                handleUpdateSearch={(e) => setSearchValue(e.target.value)}
                placeholder="Search by title or tag..."
              ></SearchBar>
            </div>

            <BacklogItemCardColumn
              lastDraggedBacklogItemId={lastDraggedBacklogItemId}
              dndId={noSprintId}
              backlogItems={
                filteredUnassignedItems
                  .map((itemId) => backlogItemsBySprint?.backlogItems[itemId])
                  .filter((val) => val !== undefined) ?? []
              }
              isLoading={isLoading}
              selection={selectedItems}
              setSelection={setSelectedItems}
              setDetailId={setDetailItemId}
              setShowDetail={setShowDetail}
              header={
                <div className="flex items-center justify-between pb-2 pr-1">
                  <span className="text-xl font-medium">Unassigned items</span>
                  <button
                    className={cn("rounded-lg px-1 text-app-text transition", {
                      "text-app-secondary":
                        filteredUnassignedItems.length > 0 &&
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
              <div className="flex flex-1 items-center justify-end gap-3">
                <div style={{ width: "500px" }}>
                  <SearchBar
                    searchValue={sprintSearchValue}
                    handleUpdateSearch={(e) =>
                      setSprintSearchValue(e.target.value)
                    }
                    placeholder="Find a sprint or item by title or id..."
                  />
                </div>
                {permission >= permissionNumbers.write && (
                  <PrimaryButton
                    onClick={() => {
                      setShowSmallPopup(true);
                    }}
                  >
                    + Add Sprint
                  </PrimaryButton>
                )}
              </div>
            </div>
            <div className="flex w-full flex-1 gap-4 overflow-x-auto">
              {isLoading && (
                <div className="flex h-full w-full items-center justify-center">
                  <LoadingSpinner color="primary" />
                </div>
              )}
              {!isLoading && backlogItemsBySprint?.sprints.length === 0 && (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="flex flex-col items-center gap-5">
                    <span className="-mb-10 text-[100px] text-gray-500">
                      <ColumnsIcon fontSize="inherit" />
                    </span>
                    <h1 className="mb-5 text-3xl font-semibold text-gray-500">
                      No sprints yet
                    </h1>
                    {permission >= permissionNumbers.write && (
                      <PrimaryButton
                        onClick={() => {
                          setShowSmallPopup(true);
                        }}
                      >
                        Create your first sprint
                      </PrimaryButton>
                    )}
                  </div>
                </div>
              )}
              {filteredSprints.map((column) => (
                <SprintCardColumn
                  lastDraggedBacklogItemId={lastDraggedBacklogItemId}
                  assignSelectionToSprint={assignSelectionToSprint}
                  column={column}
                  backlogItems={backlogItemsBySprint?.backlogItems ?? {}}
                  key={column.sprint.id}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  setDetailItemId={setDetailItemId}
                  setShowDetail={setShowDetail}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {(source) => {
            const itemId = source.id as string;
            if (!itemId) return null;
            const draggingItem = backlogItemsBySprint?.backlogItems[itemId];
            if (!draggingItem) return null;
            const item = {
              ...draggingItem,
              columnId: draggingItem.sprintId,
            };
            return (
              <ItemCardRender
                item={{ ...item, cardType: item.itemType as "US" | "IS" }}
                showBackground={true}
                scrumIdFormatter={() =>
                  item.itemType === "US"
                    ? formatUserStoryScrumId(item.scrumId)
                    : formatIssueScrumId(item.scrumId)
                }
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>

      {renderDetail &&
        backlogItemsBySprint?.backlogItems[detailItemId]?.itemType === "US" && (
          <UserStoryDetailPopup
            setShowDetail={setShowDetail}
            showDetail={showDetail}
            userStoryId={detailItemId}
          />
        )}
      {renderDetail &&
        backlogItemsBySprint?.backlogItems[detailItemId]?.itemType === "IS" && (
          <IssueDetailPopup
            setShowDetail={setShowDetail}
            showDetail={showDetail}
            issueId={detailItemId}
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
              placeholder="Explain what will be done in this sprint..."
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
