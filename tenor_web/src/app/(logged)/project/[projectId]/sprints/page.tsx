"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import SearchBar from "~/app/_components/inputs/search/SearchBar";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../../../../_components/popups/UserStoryDetailPopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/helpers/utils";
import SprintCardColumn from "./SprintCardColumn";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useFormatAnyScrumId } from "~/app/_hooks/scrumIdHooks";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import {
  useInvalidateQueriesBacklogItemDetails,
  useInvalidateQueriesBacklogItems,
} from "~/app/_hooks/invalidateHooks";
import BacklogItemCardColumn from "~/app/_components/cards/BacklogItemCardColumn";
import IssueDetailPopup from "../../../../_components/popups/IssueDetailPopup";
import ColumnsIcon from "@mui/icons-material/ViewWeek";
import { permissionNumbers } from "~/lib/types/firebaseSchemas";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import CreateSprintPopup from "./CreateSprintPopup";
import { useGetPermission } from "~/app/_hooks/useGetPermission";
import { type KanbanItemCard } from "~/lib/types/kanbanTypes";
import AdvancedSearch from "~/app/_components/inputs/search/AdvancedSearch";
import useAdvancedSearchFilters from "~/app/_hooks/useAdvancedSearchFilters";
import CreateBacklogItemPopup from "~/app/_components/popups/CreateBacklogitemPopup";
import { getSearchableNameByType } from "~/lib/helpers/searchableNames";
import { sortByItemTypeAndScrumId } from "~/lib/helpers/sort";
import usePersistentState from "~/app/_hooks/usePersistentState";
import SidebarToggleIcon from "~/app/_components/SidebarToggleIcon";
import { useWindowRect } from "~/app/_hooks/windowHooks";
import BacklogItemDetailPopup from "~/app/_components/popups/BacklogItemDetailPopup";
import LeftArrow from "@mui/icons-material/West";
import RightArrow from "@mui/icons-material/East";

const noSprintId = "noSprintId";

export default function ProjectSprints() {
  // #region Hooks
  const utils = api.useUtils();
  const { projectId } = useParams();
  const permission = useGetPermission({ flags: ["backlog"] });

  const formatAnyScrumId = useFormatAnyScrumId(projectId as string);
  const invalidateQueriesBacklogItemDetails =
    useInvalidateQueriesBacklogItemDetails();
  const invalidateQueriesBacklogItems = useInvalidateQueriesBacklogItems();

  const { isTablet } = useWindowRect();

  const [advancedFilters, setAdvancedFilters] =
    useAdvancedSearchFilters("sprints");
  const [renderDetail, showDetail, detailItemId, setDetailItemId] =
    useQueryIdForPopup("id");
  const [renderSmallPopup, showSmallPopup, setShowSmallPopup] =
    usePopupVisibilityState();
  const [renderNewBacklogItem, showNewBacklogItem, setShowNewBacklogItem] =
    usePopupVisibilityState();
  const [showBacklog, setShowBacklog] = usePersistentState(true, "showBacklog");
  const [hoveringBacklog, setHoveringBacklog] = useState(false);
  // #endregion

  // #region TRPC
  const { data: backlogItemsBySprint, isLoading } =
    api.sprints.getBacklogItemPreviewsBySprint.useQuery({
      projectId: projectId as string,
    });
  const { mutateAsync: assignItemsToSprint } =
    api.sprints.assignItemsToSprint.useMutation();
  // #endregion

  // #region React
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastDraggedBacklogItemId, setLastDraggedBacklogItemId] = useState<
    string | null
  >(null);
  const [searchValue, setSearchValue] = useState("");
  const [sprintSearchValue, setSprintSearchValue] = useState("");

  useEffect(() => {
    setLastDraggedBacklogItemId(null);
  }, [sprintSearchValue]);
  // #endregion

  // #region Utils
  const filteredUnassignedItems =
    backlogItemsBySprint?.unassignedItemIds.filter((itemId) => {
      const item = backlogItemsBySprint?.backlogItems[itemId];
      if (!item) return false;

      const tagsList = item.tags.map((tag) => "Tag:" + tag.name).join(" ");

      const itemTypeName = getSearchableNameByType(item.itemType);
      const fullItemName = `${formatAnyScrumId(item.scrumId, item.itemType)}: ${item.name} ${tagsList} Size:${item.size} ${itemTypeName}`;
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

        // FIXME: Make this its own hook so that it can be reusable and consistent
        const tagsList = item.tags.map((tag) => "Tag:" + tag.name).join(" ");
        const itemTypeName = getSearchableNameByType(item.itemType);
        const fullItemName = `${formatAnyScrumId(item.scrumId, item.itemType)}: ${item.name} ${tagsList} Size:${item.size} ${itemTypeName}`;

        return fullItemName
          .toLowerCase()
          .includes(sprintSearchValue.toLowerCase());
      });

      return hasMatchingItem;
    }) ?? [];

  const availableToBeAssignedTo =
    selectedItems.size > 0 &&
    Array.from(selectedItems).every(
      (selectedId) =>
        backlogItemsBySprint?.backlogItems[selectedId]?.sprintId !== "",
    );

  // Check if all unassigned items are selected
  const allUnassignedSelected =
    filteredUnassignedItems.length > 0 &&
    filteredUnassignedItems.every((itemId) => selectedItems.has(itemId));

  const cancelBacklogItemsPreviewQuery = async () => {
    await utils.sprints.getBacklogItemPreviewsBySprint.cancel({
      projectId: projectId as string,
    });
  };

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

        const sprints = oldData.sprints.map((sprint) => {
          if (sprint.sprint.id === sprintId) {
            const sortedItemIds = [...sprint.backlogItemIds, ...itemIds].sort(
              sortByItemTypeAndScrumId(items),
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
          ].sort(sortByItemTypeAndScrumId(items));
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
        itemType: items[itemId]!.itemType,
      })),
    });

    // Cancel previous fetches for the sprint data
    await cancelBacklogItemsPreviewQuery();

    await invalidateQueriesBacklogItems(projectId as string, "US");
    await invalidateQueriesBacklogItems(projectId as string, "IS");
    await invalidateQueriesBacklogItems(projectId as string, "IT");
    await invalidateQueriesBacklogItemDetails(
      projectId as string,
      itemIds.map((id) => ({
        itemId: id,
        itemType: items[id]!.itemType,
      })),
    );
  };

  const onItemAdded = async (_backlogItemId: string) => {
    setShowNewBacklogItem(false);
    // setUserStoryId(userStoryId); // TODO: Implement when detail popup is ready
  };

  const hiddenWithoutBacklog = {
    hidden: !showBacklog,
  };
  // #endregion

  // #region Drag and Drop Utils
  const [dndOperationsInProgress, setDndOperationsInProgress] = useState(0);

  useEffect(() => {
    // Only fetch again if this is the last operation. Prevents buggy behavior in UI
    if (dndOperationsInProgress == 0) {
      setLastDraggedBacklogItemId(null);
      void invalidateQueriesBacklogItems(projectId as string, "US");
      void invalidateQueriesBacklogItems(projectId as string, "IS");
      void invalidateQueriesBacklogItems(projectId as string, "IT");
    }
  }, [dndOperationsInProgress]);

  // Similar but not equal to assignSelectionToSprint
  const handleDragEnd = async (itemId: string, sprintId: string) => {
    if (sprintId == noSprintId) {
      sprintId = "";
    }
    const items = backlogItemsBySprint?.backlogItems;
    if (!items || items[itemId]?.sprintId === sprintId) return;

    setDndOperationsInProgress((prev) => prev + 1);
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

        const sprints = oldData.sprints.map((sprint) => {
          if (sprint.sprint.id === sprintId) {
            const sortedBacklogItemIds = [
              ...sprint.backlogItemIds,
              itemId,
            ].sort(sortByItemTypeAndScrumId(items));
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
          ].sort(sortByItemTypeAndScrumId(items));
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
        itemType: items[itemId]!.itemType,
      })),
    });

    // Cancel previous fetches for the sprint data
    await cancelBacklogItemsPreviewQuery();

    await invalidateQueriesBacklogItemDetails(
      projectId as string,
      itemIds.map((id) => ({
        itemId: id,
        itemType: items[id]!.itemType,
      })),
    );

    // Update the operations in progress count
    setTimeout(() => {
      setLastDraggedBacklogItemId(null);
    }, 1500);
    setTimeout(() => {
      setDndOperationsInProgress((prev) => prev - 1);
    }, 3000);
  };
  // #endregion

  // #region Scroll control
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const { rect: windowRect } = useWindowRect();

  const pointerPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const SCROLL_EDGE_THRESHOLD = 100;
  const BASE_SCROLL_AMOUNT = 20;

  const startScrollLoop = () => {
    const loop = () => {
      if (!scrollRef.current) return;

      const containerRect = scrollRef.current.getBoundingClientRect();
      const { x, y } = pointerPosition.current;

      const distanceFromLeft = x - containerRect.left;
      const distanceFromRight = containerRect.right - x;
      const inside = y > (windowRect?.height ?? 100) * 0.9;

      if (inside) {
        if (distanceFromLeft < SCROLL_EDGE_THRESHOLD) {
          if (scrollRef.current.scrollLeft > 0) {
            const speedFactor = Math.max(
              0,
              Math.min(
                1,
                (SCROLL_EDGE_THRESHOLD - distanceFromLeft) /
                  SCROLL_EDGE_THRESHOLD,
              ),
            );
            const scrollAmount = BASE_SCROLL_AMOUNT * speedFactor;
            scrollRef.current.scrollLeft -= scrollAmount;
          }
        } else if (distanceFromRight < SCROLL_EDGE_THRESHOLD) {
          const speedFactor = Math.max(
            0,
            Math.min(
              1,
              (SCROLL_EDGE_THRESHOLD - distanceFromRight) /
                SCROLL_EDGE_THRESHOLD,
            ),
          );
          const scrollAmount = BASE_SCROLL_AMOUNT * speedFactor;
          scrollRef.current.scrollLeft += scrollAmount;
        }
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
  };

  const stopScrollLoop = () => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };
  // #endregion

  return (
    <>
      <DragDropProvider
        onDragStart={() => {
          setDragging(true);
          startScrollLoop();
          if (!scrollRef.current) return;
          scrollRef.current.style.pointerEvents = "none";
          scrollRef.current.style.overflowX = "hidden";
        }}
        onDragEnd={async (event) => {
          setDragging(false);
          stopScrollLoop();
          if (scrollRef.current) {
            scrollRef.current.style.overflowX = "auto";
            scrollRef.current.style.pointerEvents = "auto";
          }
          if (permission < permissionNumbers.write) return;
          const { operation, canceled } = event;
          const { source, target } = operation;

          if (!source || canceled || !target) {
            return;
          }

          await handleDragEnd(source.id as string, target.id as string);
        }}
        onDragMove={(e) => {
          pointerPosition.current = {
            x: e.to?.x ?? 0,
            y: e.to?.y ?? 0,
          };

          if (showBacklog && (e.to?.x ?? 1000) < 500) {
            setHoveringBacklog(true);
          } else {
            setHoveringBacklog(false);
          }

          if ((e.to?.x ?? 1000) < 100 && !showBacklog) {
            setShowBacklog(true);
          } else if ((e.to?.x ?? 0) > 426 && showBacklog && isTablet) {
            setShowBacklog(false);
          }
        }}
      >
        <div className="relative flex h-full overflow-hidden">
          <div
            className={cn(
              "z-[100] flex shrink-0 basis-[426px] touch-none flex-col overflow-hidden border-r-2 bg-white pb-10 pl-5 pr-5 pt-10 xl:relative",
              {
                "w-auto basis-[90px] pl-7": !showBacklog,
                "absolute left-0 z-[100] h-full w-[426px] min-w-[426px]":
                  showBacklog,
              },
            )}
          >
            <div className="flex w-full justify-between pb-5">
              <div
                className={cn("flex items-center gap-4", {
                  relative: !showBacklog,
                })}
              >
                <SidebarToggleIcon
                  flipped
                  setSidebarShown={setShowBacklog}
                  sidebarShown={showBacklog}
                  label="backlog"
                />
                {showBacklog && (
                  <h1 className={cn("text-3xl font-semibold")}>Backlog</h1>
                )}
                {!showBacklog && (
                  <h1 className="absolute -left-[13px] top-[40px] break-words font-medium text-gray-600">
                    Backlog
                  </h1>
                )}
              </div>
              {permission >= permissionNumbers.write && showBacklog && (
                <PrimaryButton onClick={() => setShowNewBacklogItem(true)}>
                  + Add Item
                </PrimaryButton>
              )}
            </div>
            <div
              className={cn(
                "flex w-full items-center gap-3 pb-4",
                hiddenWithoutBacklog,
              )}
            >
              <SearchBar
                searchValue={searchValue}
                handleUpdateSearch={(e) => setSearchValue(e.target.value)}
                placeholder="Search by title or tag..."
              ></SearchBar>
            </div>

            <BacklogItemCardColumn
              advancedFilters={advancedFilters}
              disabled={permission < permissionNumbers.write}
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
              className={cn(hiddenWithoutBacklog)}
              noCardsMessage="No items here"
              header={
                <div className="flex items-center justify-between pb-2 pr-1">
                  <span className="text-xl font-medium">Unassigned items</span>
                  {permission >= permissionNumbers.write && (
                    <button
                      className={cn(
                        "rounded-lg px-1 text-app-text transition hover:text-app-primary",
                        {
                          "text-app-secondary":
                            filteredUnassignedItems.length > 0 &&
                            allUnassignedSelected,
                        },
                      )}
                      onClick={toggleSelectAllUnassigned}
                      data-tooltip-id="tooltip"
                      data-tooltip-content="Toggle select all"
                      data-tooltip-delay-show={500}
                    >
                      {allUnassignedSelected ? (
                        <CheckNone fontSize="medium" />
                      ) : (
                        <CheckAll fontSize="medium" />
                      )}
                    </button>
                  )}
                </div>
              }
            />
            <div
              className={cn(
                "pointer-events-none absolute bottom-0 left-0 flex w-full p-3 opacity-0 transition",
                {
                  "pointer-events-auto opacity-100": availableToBeAssignedTo,
                },
                hiddenWithoutBacklog,
              )}
            >
              <PrimaryButton
                className="mx-5 mb-10 flex-1"
                onClick={() => assignSelectionToSprint("")}
              >
                Unassign selection
              </PrimaryButton>
            </div>
          </div>
          {/* Small screen cover */}
          {showBacklog && (
            <div
              className="absolute left-0 top-0 z-[99] h-full w-full bg-black/10 xl:hidden"
              onClick={() => setShowBacklog(false)}
              data-cy="dismiss-sidebar"
            />
          )}
          <div
            className={cn(
              "ml-5 flex grow flex-col overflow-x-hidden pb-10 pr-10 pt-10",
              {
                "pl-[90px] xl:pl-0": showBacklog,
              },
            )}
          >
            <div className="flex w-full justify-between gap-5 pb-4">
              <h1 className="text-3xl font-semibold">Sprints</h1>
              <div className="flex flex-1 items-center justify-end gap-3">
                <div className="flex w-full max-w-[500px] gap-2">
                  <SearchBar
                    searchValue={sprintSearchValue}
                    handleUpdateSearch={(e) =>
                      setSprintSearchValue(e.target.value)
                    }
                    placeholder="Find a sprint or item by title or id..."
                  />
                  <AdvancedSearch
                    hideSprint
                    advancedFilters={advancedFilters}
                    setAdvancedFilters={setAdvancedFilters}
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
            <div className="relative flex-1 overflow-hidden">
              <div
                className={cn(
                  "z-[0] flex h-full w-full gap-4 overflow-x-auto",
                  {
                    "pr-[calc(100vw-535px)]":
                      (backlogItemsBySprint?.sprints.length ?? 0) > 0,
                    "pr-[calc(100vw-870px)]":
                      (backlogItemsBySprint?.sprints.length ?? 0) > 0 &&
                      showBacklog,
                  },
                )}
                ref={scrollRef}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute bottom-0 left-0 z-[20] flex h-[80px] w-full items-center justify-between bg-app-primary/80 px-10 text-white opacity-0 transition",
                    {
                      "opacity-100":
                        dragging &&
                        (scrollRef?.current?.clientWidth ?? 0) <
                          400 * (backlogItemsBySprint?.sprints.length ?? 0),
                    },
                  )}
                >
                  <LeftArrow />
                  <span>Drag along here to scroll</span>
                  <RightArrow />
                </div>
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
                    scrollRef={scrollRef}
                    advancedFilters={advancedFilters}
                    disabled={permission < permissionNumbers.write}
                    disableDropping={showBacklog && hoveringBacklog}
                    allSprints={backlogItemsBySprint?.sprints.map(
                      (sprint) => sprint.sprint,
                    )}
                    lastDraggedBacklogItemId={lastDraggedBacklogItemId}
                    assignSelectionToSprint={assignSelectionToSprint}
                    column={column}
                    backlogItems={backlogItemsBySprint?.backlogItems ?? {}}
                    key={column.sprint.id}
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems}
                    setDetailItemId={setDetailItemId}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {(source) => {
            const itemId = source.id as string;
            if (!itemId) return null;
            const draggingItem = backlogItemsBySprint?.backlogItems[itemId];
            if (!draggingItem) return null;
            const item: KanbanItemCard = {
              ...draggingItem,
              columnId: draggingItem.sprintId,
              assigneeIds: [],
              priorityId: undefined,
              sprintId: draggingItem.sprintId,
              cardType: draggingItem.itemType ?? "US",
              reviewerId: undefined,
            };
            return (
              <ItemCardRender
                item={item}
                showBackground={true}
                scrumIdFormatter={(scrumId: number) =>
                  formatAnyScrumId(scrumId, item.cardType)
                }
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>

      {renderDetail &&
        backlogItemsBySprint?.backlogItems[detailItemId]?.itemType === "US" && (
          <UserStoryDetailPopup
            setUserStoryId={setDetailItemId}
            showDetail={showDetail}
            userStoryId={detailItemId}
          />
        )}
      {renderDetail &&
        backlogItemsBySprint?.backlogItems[detailItemId]?.itemType === "IS" && (
          <IssueDetailPopup
            setDetailId={setDetailItemId}
            showDetail={showDetail}
            issueId={detailItemId}
          />
        )}
      {renderDetail &&
        backlogItemsBySprint?.backlogItems[detailItemId]?.itemType === "IT" && (
          <BacklogItemDetailPopup
            setDetailId={setDetailItemId}
            showDetail={showDetail}
            backlogItemId={detailItemId}
          />
        )}
      {renderSmallPopup && (
        <CreateSprintPopup
          setShowSmallPopup={setShowSmallPopup}
          showSmallPopup={showSmallPopup}
          otherSprints={backlogItemsBySprint?.sprints?.map(
            (sprint) => sprint.sprint,
          )}
        />
      )}
      {renderNewBacklogItem && (
        <CreateBacklogItemPopup
          onItemAdded={onItemAdded}
          showPopup={showNewBacklogItem}
          setShowPopup={setShowNewBacklogItem}
        />
      )}
    </>
  );
}
