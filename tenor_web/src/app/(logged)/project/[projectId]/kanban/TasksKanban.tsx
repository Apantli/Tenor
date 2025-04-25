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
import SprintCardColumn from "../sprints/SprintCardColumn";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { Timestamp } from "firebase/firestore";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { DatePicker } from "~/app/_components/DatePicker";
import {
  useFormatTaskScrumId,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import type { inferRouterOutputs } from "@trpc/server";
import { useAlert } from "~/app/_hooks/useAlert";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import AssignableCardColumn from "~/app/_components/cards/AssignableCardColumn";
import Dropdown, { DropdownButton } from "~/app/_components/Dropdown";

export type UserStories = inferRouterOutputs<
  typeof sprintsRouter
>["getUserStoryPreviewsBySprint"]["userStories"];

export default function TasksKanban() {
  const { projectId } = useParams();
  const utils = api.useUtils();
  const formatTaskScrumId = useFormatTaskScrumId();

  const { data: itemsAndColumnsData, isLoading } =
    api.kanban.getTasksForKanban.useQuery({
      projectId: projectId as string,
    });

  const cancelGetTasksForKanbanQuery = async () => {
    await utils.kanban.getTasksForKanban.cancel({
      projectId: projectId as string,
    });
  };

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  // Drag and drop state
  const [lastDraggedItemId, setLastDraggedItemId] = useState<string | null>(
    null,
  );

  // const [renderDetail, showDetail, setShowDetail] = usePopupVisibilityState();
  const [detaiItemId, setDetaiItemId] = useState("");

  const assignSelectionToColumn = async (columnId: string) => {
    // Assign here
  };

  //// Drag and drop operations
  let updateOperationsInProgress = 0;

  // Similar but not equal to assignSelectionToSprint
  const handleDragEnd = async (itemId: string, columnId: string) => {
    if (itemsAndColumnsData == undefined) return;
    if (columnId === itemsAndColumnsData.items[itemId]?.columnId) return;
    console.log("Drag end", itemId, columnId, updateOperationsInProgress);
    await moveItemsToColumn([itemId], columnId);
  };

  const moveItemsToColumn = async (itemIds: string[], columnId: string) => {
    if (itemsAndColumnsData == undefined) return;
    updateOperationsInProgress += 1;
    const items = itemsAndColumnsData.items;
    await cancelGetTasksForKanbanQuery();

    utils.kanban.getTasksForKanban.setData(
      {
        projectId: projectId as string,
      },
      (oldData) => {
        if (!oldData) return undefined;

        const sortByScrumId = (a: string, b: string) => {
          const itemA = items[a];
          const itemB = items[b];
          return (itemA?.scrumId ?? 0) - (itemB?.scrumId ?? 0);
        };

        const columns = oldData.columns.map((column) => {
          if (column.id === columnId) {
            const sortedItemIds = [...column.itemIds, ...itemIds].sort(
              sortByScrumId,
            );
            return {
              ...column,
              itemIds: sortedItemIds,
            };
          } else {
            return {
              ...column,
              itemIds: column.itemIds.filter(
                (userStoryId) => !itemIds.includes(userStoryId),
              ),
            };
          }
        });

        const updatedItems = Object.fromEntries(
          Object.entries(oldData.items).map(([id, userStory]) => {
            if (itemIds.includes(id)) {
              return [
                id,
                {
                  ...userStory,
                  columnId: columnId,
                },
              ];
            }
            return [id, userStory];
          }),
        );

        return {
          columns,
          items: updatedItems,
        };
      },
    );

    setSelectedItems(new Set());

    // TODO: Assign in backend
    // await assignSelectionToColumn(columnId);

    if (updateOperationsInProgress == 1) {
      await utils.kanban.getTasksForKanban.invalidate({
        projectId: projectId as string,
      });
      // TODO: Invalidate queries for items
      // await utils.userStories.getUserStoriesTableFriendly.invalidate({
      //   projectId: projectId as string,
      // });
      // await Promise.all(
      //   userStoryIds.map(async (userStoryId) => {
      //     await utils.userStories.getUserStoryDetail.invalidate({
      //       projectId: projectId as string,
      //       userStoryId,
      //     });
      //   }),
      // );
    }

    updateOperationsInProgress--;
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
          <div className="flex h-full w-full flex-1 gap-4 overflow-x-scroll">
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
                  column.itemIds.forEach((userStoryId) => {
                    newSelection.delete(userStoryId);
                  });
                } else {
                  column.itemIds.forEach((userStoryId) => {
                    newSelection.add(userStoryId);
                  });
                }
                setSelectedItems(newSelection);
              };

              return (
                <AssignableCardColumn
                  lastDraggedItemId={lastDraggedItemId}
                  assignSelectionToColumn={assignSelectionToColumn}
                  column={column}
                  items={itemsAndColumnsData.items}
                  key={column.id}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  setDetailItemId={setDetaiItemId}
                  setShowDetail={() => {
                    console.log("Show detail");
                  }}
                  renderCard={(item) => (
                    <ItemCardRender
                      item={item}
                      scrumIdFormatter={formatTaskScrumId}
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
            const draggingItem = itemsAndColumnsData?.items[itemId];
            if (!draggingItem) return null;
            return (
              <ItemCardRender
                item={draggingItem}
                showBackground={true}
                scrumIdFormatter={formatTaskScrumId}
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>

      {/* {renderDetail && (
        <UserStoryDetailPopup
          setShowDetail={setShowDetail}
          showDetail={showDetail}
          userStoryId={detailUserStoryId}
        />
      )} */}
    </>
  );
}
