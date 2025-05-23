import React from "react";
import { cn } from "~/lib/utils";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import CardColumn from "./CardColumn";
import type { KanbanCard } from "~/lib/types/kanbanTypes";
// import type { Tag } from "~/lib/types/firebaseSchemas";
import { type RegexItem } from "~/app/(logged)/project/[projectId]/scrumboard/AdvancedSearch";

// WithId<BasicInfo> change into only needed info...

export interface ItemColumn {
  id: string;
  itemIds: string[];
}

interface Props {
  column: ItemColumn; // Can extend
  items: Record<string, KanbanCard>;
  selectedItems: Set<string>;
  setSelectedItems: (newSelection: Set<string>) => void;
  setDetailItemId: (detailId: string) => void;
  assignSelectionToColumn: (columnId: string) => Promise<void>;
  lastDraggedItemId: string | null;
  renderCard: (item: KanbanCard) => React.ReactNode;
  header: React.ReactNode;
  disabled?: boolean;
  filter: string;
  regex: RegexItem[];
}

export default function AssignableCardColumn({
  column,
  items,
  selectedItems,
  setSelectedItems,
  setDetailItemId,
  assignSelectionToColumn,
  lastDraggedItemId,
  renderCard,
  header,
  disabled = false,
  filter,
  // regex,
}: Props) {
  // Check there's selected items and none of them are in this column
  const availableToBeAssignedTo =
    selectedItems.size > 0 &&
    Array.from(selectedItems).every(
      (selectedItem) =>
        !column.itemIds.some((itemId) => itemId === selectedItem),
    );

  return (
    <div
      className="relative h-full w-96 min-w-96 overflow-hidden rounded-lg"
      key={column.id}
    >
      <CardColumn
        disabled={disabled}
        cards={
          column.itemIds
            .map((itemId: string) => items[itemId])
            .filter((val: KanbanCard | undefined): val is KanbanCard => {
              if (val === undefined) return false;
              // check for filters
              if (
                filter &&
                !val.name.toLowerCase().includes(filter.toLowerCase())
              )
                return false;
              return true;
            }) ?? []
        }
        selection={selectedItems}
        setSelection={setSelectedItems}
        setDetailId={setDetailItemId}
        renderCard={renderCard}
        header={header}
        className={cn({ "pb-10": availableToBeAssignedTo })}
        dndId={column.id}
        lastDraggedItemId={lastDraggedItemId}
      />
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 flex w-full items-center justify-center p-3 text-center text-white opacity-0 transition",
          {
            "pointer-events-auto opacity-100": availableToBeAssignedTo,
          },
        )}
      >
        {!disabled && (
          <PrimaryButton
            className="w-full"
            onClick={() => assignSelectionToColumn(column.id)}
          >
            Move to column
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
