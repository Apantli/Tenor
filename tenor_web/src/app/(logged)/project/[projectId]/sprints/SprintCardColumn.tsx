import type { inferRouterOutputs } from "@trpc/server";
import React from "react";
import { cn } from "~/lib/utils";
import type { sprintsRouter } from "~/server/api/routers/sprints";
import CheckAll from "@mui/icons-material/DoneAll";
import CheckNone from "@mui/icons-material/RemoveDone";
import Dropdown, { DropdownButton } from "~/app/_components/Dropdown";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { type BacklogItems } from "./page";
import BacklogItemCardColumn from "~/app/_components/cards/BacklogItemCardColumn";
interface Props {
  column: inferRouterOutputs<
    typeof sprintsRouter
  >["getBacklogItemPreviewsBySprint"]["sprints"][number];
  backlogItems: BacklogItems;
  selectedItems: Set<string>;
  setSelectedItems: (newSelection: Set<string>) => void;
  setDetailItemId: (detailId: string) => void;
  assignSelectionToSprint: (sprintId: string) => Promise<void>;
  lastDraggedBacklogItemId: string | null;
}

export default function SprintCardColumn({
  column,
  backlogItems,
  selectedItems,
  setSelectedItems,
  setDetailItemId,
  assignSelectionToSprint,
  lastDraggedBacklogItemId,
}: Props) {
  const allSelected =
    column.backlogItemIds.length > 0 &&
    column.backlogItemIds.every((itemId) => selectedItems.has(itemId));

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

  return (
    <div
      className="relative h-full w-96 min-w-96 overflow-hidden rounded-lg"
      key={column.sprint.id}
    >
      <BacklogItemCardColumn
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
        className={cn({ "pb-10": availableToBeAssignedTo })}
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
                  <DropdownButton>Edit sprint</DropdownButton>
                </Dropdown>
              </div>
            </div>
            <span className="mb-4 text-lg text-gray-600">
              {dateFormatter.format(column.sprint.startDate)} -{" "}
              {dateFormatter.format(column.sprint.endDate)}
            </span>
            <p className="mb-2">{column.sprint.description}</p>
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
    </div>
  );
}
