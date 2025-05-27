"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/utils";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import {
  useFormatIssueScrumId,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import AssignableCardColumn from "~/app/_components/cards/AssignableCardColumn";
import Dropdown, { DropdownButton } from "~/app/_components/Dropdown";
import {
  useInvalidateQueriesBacklogItemDetails,
  useInvalidateQueriesBacklogItems,
} from "~/app/_hooks/invalidateHooks";
import IssueDetailPopup from "../issues/IssueDetailPopup";
import type { KanbanCard } from "~/lib/types/kanbanTypes";
import {
  type Permission,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import { checkPermissions, emptyRole } from "~/lib/defaultProjectValues";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import type { AdvancedSearchFilters } from "~/app/_hooks/useAdvancedSearchFilters";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import StatusDetailPopup from "../settings/tags-scrumboard/StatusDetailPopup";

interface Props {
  filter: string;
  advancedFilters: AdvancedSearchFilters;
}

export default function ItemsKanban({ filter, advancedFilters }: Props) {
  // GENERAL
  const { projectId } = useParams();
  const utils = api.useUtils();
  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const formatIssueScrumId = useFormatIssueScrumId();
  const invalidateQueriesBacklogItems = useInvalidateQueriesBacklogItems();
  const invalidateQueriesBacklogItemDetails =
    useInvalidateQueriesBacklogItemDetails();

  // TRPC
  const { data: itemsAndColumnsData, isLoading } =
    api.kanban.getBacklogItemsForKanban.useQuery({
      projectId: projectId as string,
    });
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

  const { mutateAsync: modifyUserStoryTags } =
    api.userStories.modifyUserStoryTags.useMutation();

  const { mutateAsync: modifyIssuesTags } =
    api.issues.modifyIssuesTags.useMutation();

  // REACT
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastDraggedItemId, setLastDraggedItemId] = useState<string | null>(
    null,
  );

  const [renderDetail, showDetail, detailItemId, setDetailItemId] =
    useQueryIdForPopup("id");
  // Detail item and parent
  const detailItem = itemsAndColumnsData?.cardItems[detailItemId];
  const detailItemType = detailItem?.cardType;

  const [renderStatusPopup, showStatusPopup, setShowStatusPopup] =
    usePopupVisibilityState();
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>();

  // UTILITY
  const getCorrectFormatter = (itemType: string) => {
    if (itemType === "US") {
      return formatUserStoryScrumId;
    } else if (itemType === "IS") {
      return formatIssueScrumId;
    }
    return formatUserStoryScrumId;
  };

  let updateOperationsInProgress = 0;

  const handleDragEnd = async (itemId: string, columnId: string) => {
    setLastDraggedItemId(null);
    if (itemsAndColumnsData == undefined) return;
    // Ensure the item exists and the column is different
    const itemBeingDragged = itemsAndColumnsData.cardItems[itemId];
    if (!itemBeingDragged || columnId === itemBeingDragged.columnId) return;

    await moveItemsToColumn([itemId], columnId);
  };

  const moveItemsToColumn = async (itemIds: string[], columnId: string) => {
    if (itemsAndColumnsData == undefined) return;
    updateOperationsInProgress += 1;
    const cardItems = itemsAndColumnsData.cardItems;
    await utils.kanban.getBacklogItemsForKanban.cancel({
      projectId: projectId as string,
    });

    utils.kanban.getBacklogItemsForKanban.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return undefined;

        const sortByScrumId = (a: string, b: string) => {
          const itemA = cardItems[a];
          const itemB = cardItems[b];
          return (itemA?.scrumId ?? 0) - (itemB?.scrumId ?? 0);
        };

        const unorderedColumns = oldData.columns.map((column) => {
          if (column.id === columnId) {
            return {
              ...column,
              itemIds: [...column.itemIds, ...itemIds],
            };
          } else {
            return {
              ...column,
              itemIds: column.itemIds.filter(
                (itemId) => !itemIds.includes(itemId),
              ),
            };
          }
        });

        // sorting
        const columns = unorderedColumns.map((column) => {
          if (column.id === columnId) {
            return {
              ...column,
              itemIds: column.itemIds.sort(sortByScrumId),
            };
          }
          return column;
        });

        const updatedItems = Object.fromEntries(
          Object.entries(oldData.cardItems).map(([id, item]) => {
            if (itemIds.includes(id)) {
              return [
                id,
                {
                  ...item,
                  columnId: columnId,
                },
              ];
            }
            return [id, item];
          }),
        );

        return {
          columns,
          cardItems: updatedItems,
        };
      },
    );

    // Set lastDraggedItemId AFTER optimistic update, only if a single item was moved
    if (itemIds.length === 1) {
      setLastDraggedItemId(itemIds[0] ?? null);
    } else {
      setLastDraggedItemId(null);
    }

    setSelectedItems(new Set());

    await Promise.all(
      itemIds.map(async (itemId) => {
        const item = itemsAndColumnsData.cardItems[itemId];
        if (item?.cardType === "US") {
          await modifyUserStoryTags({
            projectId: projectId as string,
            userStoryId: item.id,
            statusId: columnId,
          });
        } else if (item?.cardType === "IS") {
          await modifyIssuesTags({
            projectId: projectId as string,
            issueId: item.id,
            statusId: columnId,
          });
        }
      }),
    );

    if (updateOperationsInProgress == 1) {
      setTimeout(() => {
        setLastDraggedItemId(null);
      }, 1500);
      const userStories = itemIds.filter(
        (itemId) => itemsAndColumnsData.cardItems[itemId]?.cardType === "US",
      );
      const issues = itemIds.filter(
        (itemId) => itemsAndColumnsData.cardItems[itemId]?.cardType === "IS",
      );
      if (userStories.length > 0) {
        await invalidateQueriesBacklogItems(projectId as string, "US");
      }
      if (issues.length > 0) {
        await invalidateQueriesBacklogItems(projectId as string, "IS");
      }
      await invalidateQueriesBacklogItemDetails(
        projectId as string,
        itemIds.map((itemId) => ({
          itemId: itemId,
          itemType: itemsAndColumnsData.cardItems[itemId]?.cardType ?? "US",
        })),
      );
    }

    updateOperationsInProgress--;
  };

  const assignSelectionToColumn = async (columnId: string) => {
    setLastDraggedItemId(null);
    if (itemsAndColumnsData == undefined) return;

    const itemIds = Array.from(selectedItems);
    if (itemIds.length === 0) return;

    await moveItemsToColumn(itemIds, columnId);
  };

  return (
    <>
      <DragDropProvider
        onDragEnd={async (event) => {
          if (permission < permissionNumbers.write) return;
          const { operation, canceled } = event;
          const { source, target } = operation;

          if (!source || canceled || !target) {
            return;
          }

          await handleDragEnd(source.id as string, target.id as string);
        }}
      >
        <div className="flex h-full grow flex-col overflow-x-hidden">
          <div className="flex h-full w-full flex-1 gap-4 overflow-x-auto">
            {isLoading && (
              <div className="flex h-full w-full items-center justify-center">
                <LoadingSpinner color="primary" />
              </div>
            )}
            {itemsAndColumnsData?.columns.map((column) => {
              const allSelected =
                column.itemIds.length > 0 &&
                column.itemIds.every((itemId) => selectedItems.has(itemId));

              const toggleSelectAll = () => {
                const newSelection = new Set(selectedItems);
                if (allSelected) {
                  column.itemIds.forEach((itemId) => {
                    newSelection.delete(itemId);
                  });
                } else {
                  column.itemIds.forEach((itemId) => {
                    newSelection.add(itemId);
                  });
                }
                setSelectedItems(newSelection);
              };

              const renamedColumn = {
                ...column,
                itemIds: column.itemIds,
              };

              return (
                <AssignableCardColumn
                  filter={filter}
                  advancedFilters={advancedFilters}
                  disabled={permission < permissionNumbers.write}
                  lastDraggedItemId={lastDraggedItemId}
                  assignSelectionToColumn={assignSelectionToColumn}
                  column={renamedColumn}
                  items={itemsAndColumnsData.cardItems}
                  key={column.id}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  setDetailItemId={setDetailItemId}
                  renderCard={(item: KanbanCard) => {
                    const formatter = getCorrectFormatter(item.cardType);
                    return (
                      <ItemCardRender
                        disabled={permission < permissionNumbers.write}
                        item={item}
                        scrumIdFormatter={formatter}
                      />
                    );
                  }}
                  header={
                    <div className="flex flex-col items-start pr-1">
                      <div className="flex w-full justify-between">
                        <h1 className="text-2xl font-medium">{column.name}</h1>
                        {permission >= permissionNumbers.write && (
                          <div className="flex gap-2">
                            <button
                              className={cn(
                                "rounded-lg px-1 text-app-text transition",
                                {
                                  "text-app-secondary": allSelected,
                                },
                              )}
                              onClick={toggleSelectAll}
                            >
                              {allSelected ? (
                                <CheckNone fontSize="small" />
                              ) : (
                                <CheckAll fontSize="small" />
                              )}
                            </button>
                            <Dropdown label={"• • •"}>
                              <DropdownButton
                                onClick={() => {
                                  setShowStatusPopup(true);
                                  setSelectedStatusId(column.id);
                                }}
                              >
                                Edit status
                              </DropdownButton>
                            </Dropdown>
                          </div>
                        )}
                      </div>
                      <hr className="my-2 w-full border border-app-border" />
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {(source) => {
            const itemId = source.id as string;
            if (!itemId) return null;
            const draggingItem = itemsAndColumnsData?.cardItems[itemId];
            if (!draggingItem) return null;
            const formatter = getCorrectFormatter(draggingItem.cardType);
            return (
              <ItemCardRender
                item={draggingItem}
                showBackground={true}
                scrumIdFormatter={formatter}
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>

      {renderDetail && detailItemType === "US" && (
        <UserStoryDetailPopup
          showDetail={showDetail}
          userStoryId={detailItemId}
          setUserStoryId={setDetailItemId}
        />
      )}

      {renderDetail && detailItemType === "IS" && (
        <IssueDetailPopup
          setDetailId={setDetailItemId}
          showDetail={showDetail}
          issueId={detailItemId}
        />
      )}

      {renderStatusPopup && selectedStatusId && (
        <StatusDetailPopup
          setShowPopup={setShowStatusPopup}
          showPopup={showStatusPopup}
          statusId={selectedStatusId}
        />
      )}
    </>
  );
}
