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
import { useFormatUserStoryScrumId } from "~/app/_hooks/scrumIdHooks";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import type { inferRouterOutputs } from "@trpc/server";
import { useAlert } from "~/app/_hooks/useAlert";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import ItemCardRender from "~/app/_components/cards/ItemCardRender";
import AssignableCardColumn from "~/app/_components/cards/AssignableCardColumn";

export type UserStories = inferRouterOutputs<
  typeof sprintsRouter
>["getUserStoryPreviewsBySprint"]["userStories"];

export default function TasksKanban() {
  const { projectId } = useParams();

  const { data: itemsAndColumnsData, isLoading } =
    api.kanban.getTasksForKanban.useQuery({
      projectId: projectId as string,
    });
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
  let dndOperationsInProgress = 0;

  // Similar but not equal to assignSelectionToSprint
  const handleDragEnd = async (userStoryId: string, sprintId: string) => {
    // handling...
    dndOperationsInProgress++;
    console.log("Drag end", userStoryId, sprintId, dndOperationsInProgress);
    dndOperationsInProgress--;
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
          <div className="flex h-full grow flex-col overflow-x-hidden">
            <div className="flex h-full w-full flex-1 gap-4 overflow-x-scroll">
              {isLoading && (
                <div className="flex h-full w-full items-center justify-center">
                  <LoadingSpinner color="primary" />
                </div>
              )}
              {itemsAndColumnsData?.columns.map((column) => (
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
                  renderCard={(item) => <ItemCardRender item={item} />}
                  header={<h2>Header</h2>}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {(source) => {
            const itemId = source.id as string;
            if (!itemId) return null;
            const draggingItem = itemsAndColumnsData?.items[itemId];
            if (!draggingItem) return null;
            return <ItemCardRender item={draggingItem} showBackground={true} />;
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
