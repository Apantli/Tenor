import React from "react";
import { cn } from "~/lib/utils";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import CardColumn from "./CardColumn";
import { KanbanCard } from "~/lib/types/kanbanTypes";

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
  setShowDetail: (showDetail: boolean) => void;
  assignSelectionToColumn: (columnId: string) => Promise<void>;
  lastDraggedItemId: string | null;
  renderCard: (item: KanbanCard) => React.ReactNode;
  header: React.ReactNode;
}

export default function AssignableCardColumn({
  column,
  items,
  selectedItems,
  setSelectedItems,
  setDetailItemId,
  setShowDetail,
  assignSelectionToColumn,
  lastDraggedItemId,
  renderCard,
  header,
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
        cards={
          column.itemIds
            .map((itemId) => items[itemId])
            .filter((val) => val !== undefined) ?? []
        }
        selection={selectedItems}
        setSelection={setSelectedItems}
        setDetailId={setDetailItemId}
        setShowDetail={setShowDetail}
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
        <PrimaryButton
          className="w-full"
          onClick={() => assignSelectionToColumn(column.id)}
        >
          Move to column
        </PrimaryButton>
      </div>
    </div>
  );
}
