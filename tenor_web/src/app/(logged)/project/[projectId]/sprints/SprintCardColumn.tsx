import type { inferRouterOutputs } from "@trpc/server";
import React, { type RefObject, useEffect, useRef } from "react";
import { cn } from "~/lib/helpers/utils";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import BacklogItemCardColumn from "~/app/_components/cards/BacklogItemCardColumn";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import EditSprintPopup from "./EditSprintPopup";
import type { SprintDates } from "./CreateSprintPopup";
import type { AdvancedSearchFilters } from "~/app/_hooks/useAdvancedSearchFilters";
import EditIcon from "@mui/icons-material/EditOutlined";
import type { BacklogItemDetail } from "~/lib/types/detailSchemas";
import { endOfDay, startOfDay } from "~/lib/helpers/parsers";

interface Props {
  column: inferRouterOutputs<
    typeof sprintsRouter
  >["getBacklogItemPreviewsBySprint"]["sprints"][number];
  backlogItems: Record<string, BacklogItemDetail>;
  selectedItems: Set<string>;
  setSelectedItems: (newSelection: Set<string>) => void;
  setDetailItemId: (detailId: string) => void;
  assignSelectionToSprint: (sprintId: string) => Promise<void>;
  lastDraggedBacklogItemId: string | null;
  allSprints: SprintDates[] | undefined;
  disabled?: boolean;
  disableDropping?: boolean;
  advancedFilters: AdvancedSearchFilters;
  scrollRef?: RefObject<HTMLDivElement>;
}

export default function SprintCardColumn({
  column,
  backlogItems,
  selectedItems,
  setSelectedItems,
  setDetailItemId,
  assignSelectionToSprint,
  lastDraggedBacklogItemId,
  allSprints,
  disabled = false,
  disableDropping = false,
  advancedFilters,
  scrollRef,
}: Props) {
  const allSelected =
    column.backlogItemIds.length > 0 &&
    column.backlogItemIds.every((itemId) => selectedItems.has(itemId));

  const [renderEditPopup, showEditPopup, setShowEditPopup] =
    usePopupVisibilityState();

  const toggleSelectAll = () => {
    const newSelection = new Set(selectedItems);
    if (allSelected) {
      column.backlogItemIds.forEach((itemId) => {
        newSelection.delete(itemId);
      });
    } else {
      column.backlogItemIds.forEach((itemId) => {
        newSelection.add(itemId);
      });
    }
    setSelectedItems(newSelection);
  };

  const ref = useRef<HTMLDivElement>(null);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  });

  // Check there's selected user stories and none of them are in this sprint
  const availableToBeAssignedTo =
    selectedItems.size > 0 &&
    Array.from(selectedItems).every(
      (selectedItemId) =>
        !column.backlogItemIds.some((itemId) => itemId === selectedItemId),
    );

  const currentDate = new Date();
  const isCurrentSprint =
    currentDate >= startOfDay(column.sprint.startDate) &&
    currentDate <= endOfDay(column.sprint.endDate);

  useEffect(() => {
    if (!isCurrentSprint || !scrollRef?.current || !ref.current) return;

    const containerRect = scrollRef.current.getBoundingClientRect();
    const targetRect = ref.current.getBoundingClientRect();

    const offsetLeft =
      targetRect.left - containerRect.left + scrollRef.current.scrollLeft;

    scrollRef.current.scrollTo({
      left: offsetLeft,
    });
  }, [isCurrentSprint]);

  return (
    <div
      className="relative h-full w-96 min-w-96 overflow-hidden rounded-lg"
      key={column.sprint.id}
      ref={ref}
    >
      <BacklogItemCardColumn
        advancedFilters={advancedFilters}
        disabled={disabled}
        disableDropping={disableDropping}
        lastDraggedBacklogItemId={lastDraggedBacklogItemId}
        dndId={column.sprint.id}
        backlogItems={
          column.backlogItemIds
            .map((itemId) => backlogItems[itemId])
            .filter((val) => val !== undefined) ?? []
        }
        selection={selectedItems}
        setSelection={setSelectedItems}
        setDetailId={setDetailItemId}
        className={cn({
          "pb-10": availableToBeAssignedTo,
          "border-2 border-app-primary/30": isCurrentSprint,
        })}
        header={
          <div className="flex flex-col items-start pr-1">
            <div className="flex w-full justify-between">
              <h1 className="text-2xl font-medium">
                Sprint {column.sprint.number}
              </h1>
              <div className="flex gap-2">
                <button
                  className={cn(
                    "rounded-lg px-1 text-app-text transition hover:text-app-primary",
                    {
                      "text-app-secondary": allSelected,
                    },
                  )}
                  onClick={toggleSelectAll}
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Toggle select all"
                  data-tooltip-delay-show={500}
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
                    setShowEditPopup(true);
                  }}
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Edit sprint"
                  data-tooltip-delay-show={500}
                >
                  <EditIcon fontSize="medium" />
                </button>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2">
              {isCurrentSprint && (
                <span className="text-lg font-semibold text-app-primary">
                  Current sprint
                </span>
              )}
              <span className="text-lg text-gray-600">
                {dateFormatter.format(column.sprint.startDate)} -{" "}
                {dateFormatter.format(column.sprint.endDate)}
              </span>
            </div>
            <p className="wrap-properly mb-2">{column.sprint.description}</p>
            <hr className="mb-2 w-full border border-app-border" />
          </div>
        }
      />
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 flex w-full items-center justify-center p-3 text-center text-white opacity-0 transition",
          {
            "pointer-events-auto opacity-100": availableToBeAssignedTo,
          },
        )}
      >
        <PrimaryButton
          className="w-full"
          onClick={() => assignSelectionToSprint(column.sprint.id)}
        >
          Move to sprint
        </PrimaryButton>
      </div>
      {renderEditPopup && (
        <EditSprintPopup
          otherSprints={allSprints?.filter(
            (sprint) => sprint.id !== column.sprint.id,
          )}
          sprintId={column.sprint.id}
          showPopup={showEditPopup}
          setShowPopup={setShowEditPopup}
        />
      )}
    </div>
  );
}
