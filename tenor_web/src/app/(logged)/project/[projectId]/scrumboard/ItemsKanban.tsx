"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../../../../_components/popups/UserStoryDetailPopup";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/helpers/utils";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useFormatAnyScrumId } from "~/app/_hooks/scrumIdHooks";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import AssignableCardColumn from "~/app/_components/cards/AssignableCardColumn";
import {
  useInvalidateQueriesAllStatuses,
  useInvalidateQueriesBacklogItemDetails,
  useInvalidateQueriesBacklogItems,
} from "~/app/_hooks/invalidateHooks";
import IssueDetailPopup from "../../../../_components/popups/IssueDetailPopup";
import type { KanbanCard } from "~/lib/types/kanbanTypes";
import {
  type AnyBacklogItemType,
  type Permission,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import useQueryIdForPopup from "~/app/_hooks/useQueryIdForPopup";
import type { AdvancedSearchFilters } from "~/app/_hooks/useAdvancedSearchFilters";
import { emptyRole } from "~/lib/defaultValues/roles";
import { checkPermissions } from "~/lib/defaultValues/permission";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import StatusDetailPopup from "../settings/tags-scrumboard/StatusDetailPopup";
import MoveLeftIcon from "@mui/icons-material/ArrowBackIos";
import MoveRightIcon from "@mui/icons-material/ArrowForwardIos";
import EditIcon from "@mui/icons-material/EditOutlined";

interface Props {
  filter: string;
  advancedFilters: AdvancedSearchFilters;
}

export default function ItemsKanban({ filter, advancedFilters }: Props) {
  // #region HOOKS
  const { projectId } = useParams();
  const utils = api.useUtils();
  const formatAnyScrumId = useFormatAnyScrumId();
  const invalidateQueriesBacklogItems = useInvalidateQueriesBacklogItems();
  const invalidateQueriesBacklogItemDetails =
    useInvalidateQueriesBacklogItemDetails();
  const invalidateQueriesAllStatuses = useInvalidateQueriesAllStatuses();
  // #endregion

  // #region TRPC
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
  const { mutateAsync: modifyBacklogItemTags } =
    api.backlogItems.modifyBacklogItemTags.useMutation();
  const { mutateAsync: reorderStatus } =
    api.settings.reorderStatusTypes.useMutation();
  // #endregion

  // #region REACT
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
  const [statusEditMode, setStatusEditMode] = useState(false);
  // #endregion

  // #region UTILITY
  const getCorrectFormatter = (itemType: AnyBacklogItemType) => {
    return (scrumId: number) => {
      return formatAnyScrumId(scrumId, itemType);
    };
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
        switch (item?.cardType) {
          case "US":
            await modifyUserStoryTags({
              projectId: projectId as string,
              userStoryId: item.id,
              statusId: columnId,
            });
            break;

          case "IS":
            await modifyIssuesTags({
              projectId: projectId as string,
              issueId: item.id,
              statusId: columnId,
            });
            break;

          case "IT":
            await modifyBacklogItemTags({
              projectId: projectId as string,
              backlogItemId: item.id,
              statusId: columnId,
            });
            break;
        }
      }),
    );

    if (updateOperationsInProgress == 1) {
      setTimeout(() => {
        setLastDraggedItemId(null);
      }, 1500);

      for (const itemType of ["US", "IS", "IT"] as const) {
        const itemsOfType = itemIds.filter(
          (itemId) =>
            itemsAndColumnsData.cardItems[itemId]?.cardType === itemType,
        );
        if (itemsOfType.length > 0) {
          await invalidateQueriesBacklogItems(projectId as string, itemType);
        }
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

  const moveStatus = async (statusId: string, dir: 1 | -1) => {
    const statuses = itemsAndColumnsData?.columns;
    if (!statuses) return;

    const statusIndex = statuses.findIndex((status) => status.id === statusId);
    const newIndex = statusIndex + dir;

    if (newIndex < 0 || newIndex >= statuses.length) return;

    // Swap statusIndex and newIndex;
    const otherStatus = statuses[newIndex]!;
    statuses[newIndex] = statuses[statusIndex]!;
    statuses[statusIndex] = otherStatus;

    await utils.kanban.getBacklogItemsForKanban.cancel({
      projectId: projectId as string,
    });

    utils.kanban.getBacklogItemsForKanban.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          cardItems: oldData.cardItems,
          columns: statuses.map((status, index) => ({
            ...status,
            orderIndex: index,
          })),
        };
      },
    );

    await reorderStatus({
      projectId: projectId as string,
      statusIds: statuses.map((status) => status.id),
    });

    await invalidateQueriesAllStatuses(projectId as string);
  };
  // #endregion

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
                    const formatter = getCorrectFormatter(
                      item.cardType as AnyBacklogItemType,
                    );
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
                      <div className="flex w-full justify-between gap-2">
                        <div className="flex flex-1 items-center gap-3 overflow-hidden">
                          <div
                            className="h-5 w-5 shrink-0 rounded-full"
                            style={{
                              borderColor: `${column.color}90`,
                              borderWidth: "1.4px",
                              backgroundColor: `${column.color}3E`,
                            }}
                          ></div>
                          <h1 className="flex-1 truncate text-2xl font-medium">
                            {column.name}
                          </h1>
                        </div>
                        {permission >= permissionNumbers.write && (
                          <div className="flex shrink-0 gap-1">
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
                                <CheckNone fontSize="medium" />
                              ) : (
                                <CheckAll fontSize="medium" />
                              )}
                            </button>
                            <button
                              className="rounded-lg px-1 text-app-text transition hover:text-app-primary"
                              onClick={() => {
                                setShowStatusPopup(true);
                                setSelectedStatusId(column.id);
                              }}
                              data-tooltip-id="tooltip"
                              data-tooltip-content="Edit status"
                              data-tooltip-delay-show={500}
                            >
                              <EditIcon fontSize="medium" />
                            </button>
                            <div className="ml-2 flex gap-0">
                              {column.orderIndex != 0 && (
                                <button
                                  className="rounded-lg text-app-text transition hover:text-app-primary"
                                  onClick={() => moveStatus(column.id, -1)}
                                  data-tooltip-id="tooltip"
                                  data-tooltip-content="Move left"
                                  data-tooltip-delay-show={500}
                                >
                                  <MoveLeftIcon fontSize="small" />
                                </button>
                              )}
                              {column.orderIndex !==
                                itemsAndColumnsData.columns.length - 1 && (
                                <button
                                  className="rounded-lg text-app-text transition hover:text-app-primary"
                                  onClick={() => moveStatus(column.id, 1)}
                                  data-tooltip-id="tooltip"
                                  data-tooltip-content="Move right"
                                  data-tooltip-delay-show={500}
                                >
                                  <MoveRightIcon fontSize="small" />
                                </button>
                              )}
                            </div>
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
          editMode={statusEditMode}
          setEditMode={setStatusEditMode}
          setShowPopup={(show) => {
            if (!show) {
              setTimeout(() => setStatusEditMode(false), 200);
            }
            setShowStatusPopup(show);
          }}
          showPopup={showStatusPopup}
          statusId={selectedStatusId}
        />
      )}
    </>
  );
}
