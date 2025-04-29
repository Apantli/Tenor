"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import UserStoryDetailPopup from "../user-stories/UserStoryDetailPopup";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import { cn } from "~/lib/utils";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import {
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import AssignableCardColumn from "~/app/_components/cards/AssignableCardColumn";
import Dropdown, { DropdownButton } from "~/app/_components/Dropdown";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesAllUserStories,
} from "~/app/_hooks/invalidateHooks";
import IssueDetailPopup from "../issues/IssueDetailPopup";

// TODO: Invalidate correctly
export default function ItemsKanban() {
  // GENERAL
  const { projectId } = useParams();
  const utils = api.useUtils();
  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();

  // TRPC
  const { data: itemsAndColumnsData, isLoading } =
    api.kanban.getBacklogItemsForKanban.useQuery({
      projectId: projectId as string,
    });

  const { mutateAsync: modifyUserStoryTags } =
    api.userStories.modifyUserStoryTags.useMutation();

  const { mutateAsync: modifyIssuesTags } =
    api.issues.modifyIssuesTags.useMutation();

  const cancelGetBacklogItemsForKanbanQuery = async () => {
    await utils.kanban.getBacklogItemsForKanban.cancel({
      projectId: projectId as string,
    });
  };

  // REACT
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastDraggedItemId, setLastDraggedItemId] = useState<string | null>(
    null,
  );

  const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  // Detail item and parent
  const [detailItemId, setDetailItemId] = useState("");
  const detailItem = itemsAndColumnsData?.cardTasks[detailItemId];
  const detailItemType = detailItem?.itemType;

  // UTILITY
  let updateOperationsInProgress = 0;

  const handleDragEnd = async (itemId: string, columnId: string) => {
    setLastDraggedItemId(null);
    if (itemsAndColumnsData == undefined) return;
    if (columnId === itemsAndColumnsData.cardTasks[itemId]?.columnId) return;

    setLastDraggedItemId(itemId);
    await moveItemsToColumn([itemId], columnId);
  };

  const moveItemsToColumn = async (itemIds: string[], columnId: string) => {
    if (itemsAndColumnsData == undefined) return;
    updateOperationsInProgress += 1;
    const cardItems = itemsAndColumnsData.cardTasks;
    await cancelGetBacklogItemsForKanbanQuery();

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

        const columns = oldData.columns.map((column) => {
          if (column.id === columnId) {
            const sortedItemIds = [...column.taskIds, ...itemIds].sort(
              sortByScrumId,
            );
            return {
              ...column,
              taskIds: sortedItemIds,
            };
          } else {
            return {
              ...column,
              taskIds: column.taskIds.filter(
                (itemId) => !itemIds.includes(itemId),
              ),
            };
          }
        });

        const updatedItems = Object.fromEntries(
          Object.entries(oldData.cardTasks).map(([id, item]) => {
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
          cardTasks: updatedItems,
        };
      },
    );

    setSelectedItems(new Set());

    await Promise.all(
      itemIds.map(async (itemId) => {
        const item = itemsAndColumnsData.cardTasks[itemId];
        if (item?.itemType === "US") {
          await modifyUserStoryTags({
            projectId: projectId as string,
            userStoryId: item.id,
            statusId: columnId,
          });
        } else if (item?.itemType === "IS") {
          await modifyIssuesTags({
            projectId: projectId as string,
            issueId: item.id,
            statusId: columnId,
          });
        }
      }),
    );

    if (updateOperationsInProgress == 1) {
      await invalidateQueriesAllTasks(projectId as string);
      await invalidateQueriesAllUserStories(projectId as string);
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
                column.taskIds.length > 0 &&
                column.taskIds.every((itemId) => selectedItems.has(itemId));

              const toggleSelectAll = () => {
                const newSelection = new Set(selectedItems);
                if (allSelected) {
                  column.taskIds.forEach((itemId) => {
                    newSelection.delete(itemId);
                  });
                } else {
                  column.taskIds.forEach((itemId) => {
                    newSelection.add(itemId);
                  });
                }
                setSelectedItems(newSelection);
              };

              const renamedColumn = {
                ...column,
                itemIds: column.taskIds,
              };

              return (
                <AssignableCardColumn
                  lastDraggedItemId={lastDraggedItemId}
                  assignSelectionToColumn={assignSelectionToColumn}
                  column={renamedColumn}
                  items={itemsAndColumnsData.cardTasks}
                  key={column.id}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  setDetailItemId={setDetailItemId}
                  setShowDetail={setShowDetail}
                  renderCard={(item) => (
                    <ItemCardRender
                      item={item}
                      scrumIdFormatter={formatUserStoryScrumId}
                    />
                  )}
                  header={
                    <div className="flex flex-col items-start pr-1">
                      <div className="flex w-full justify-between">
                        <h1 className="text-2xl font-medium">{column.name}</h1>
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
                            <DropdownButton>Edit status</DropdownButton>
                          </Dropdown>
                        </div>
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
            const draggingItem = itemsAndColumnsData?.cardTasks[itemId];
            if (!draggingItem) return null;
            return (
              <ItemCardRender
                item={draggingItem}
                showBackground={true}
                scrumIdFormatter={formatUserStoryScrumId}
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>

      {renderDetail && detailItemType === "US" && (
        <UserStoryDetailPopup
          setShowDetail={setShowDetail}
          showDetail={showDetail}
          userStoryId={detailItemId}
        />
      )}

      {renderDetail && detailItemType === "IS" && (
        <IssueDetailPopup
          setShowDetail={setShowDetail}
          showDetail={showDetail}
          issueId={detailItemId}
        />
      )}
    </>
  );
}
