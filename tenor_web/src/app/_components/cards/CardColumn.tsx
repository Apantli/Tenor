import React, { useRef } from "react";
import LoadingSpinner from "../LoadingSpinner";
import SelectableCard from "./SelectableCard";
import useShiftKey from "~/app/_hooks/useShiftKey";
import useClickOutside from "~/app/_hooks/useClickOutside";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import { useDroppable } from "@dnd-kit/react";
import { CardItem } from "~/server/api/routers/kanban";

interface Props {
  selection: Set<string>;
  setSelection: (newSelection: Set<string>) => void;
  setDetailId: (detailId: string) => void;
  setShowDetail: (showDetail: boolean) => void;
  header?: React.ReactNode;
  className: ClassNameValue;

  cards: CardItem[];
  renderCard: (item: CardItem) => React.ReactNode;
  isLoading?: boolean;

  dndId: string;
  lastDraggedItemId: string | null;
}

export default function CardColumn({
  selection,
  setSelection,
  setDetailId,
  setShowDetail,
  cards,
  renderCard,
  isLoading,
  header,
  className,
  dndId,
  lastDraggedItemId,
}: Props) {
  const shiftClick = useShiftKey();
  const lastSelectedCard = useRef<number>();
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => {
    lastSelectedCard.current = undefined;
  });

  const { ref: refDnd, isDropTarget } = useDroppable({ id: dndId });

  return (
    <div
      className={cn(
        "flex h-full w-full flex-1 flex-col overflow-hidden rounded-lg bg-sprint-column-background transition-colors",
        className,
        {
          "bg-sprint-column-background-hovered": isDropTarget,
        },
      )}
      // Merging refs to avoid a new div
      ref={(el) => {
        if (ref.current !== el) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
        refDnd(el);
      }}
    >
      {isLoading && (
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      )}
      {!isLoading && header !== undefined && (
        <div className="px-6 pt-6">{header}</div>
      )}
      <div className="flex h-full flex-1 flex-col gap-2 overflow-y-auto p-6 pt-2">
        {cards.map((cardInfo) => (
          <SelectableCard
            lastDraggedItemId={lastDraggedItemId}
            key={cardInfo.id}
            dndId={cardInfo.id}
            showCheckbox={selection.size > 0}
            selected={selection.has(cardInfo.id)}
            onChange={(selected) => {
              let cardsInRange = [cardInfo.id];
              if (shiftClick) {
                const min = Math.min(
                  lastSelectedCard.current ?? Infinity,
                  cardInfo.scrumId,
                );
                const max = Math.max(
                  lastSelectedCard.current ?? -Infinity,
                  cardInfo.scrumId,
                );
                cardsInRange = cards
                  .filter((card) => card.scrumId >= min && card.scrumId <= max)
                  .map((card) => card.id);
              }

              const newSelection = new Set(selection);
              if (selected) {
                cardsInRange.forEach((id) => newSelection.add(id));
              } else {
                cardsInRange.forEach((id) => newSelection.delete(id));
              }
              setSelection(newSelection);
              lastSelectedCard.current = cardInfo.scrumId;
            }}
            onClick={() => {
              setDetailId(cardInfo.id);
              setShowDetail(true);
            }}
          >
            {renderCard(cardInfo)}
          </SelectableCard>
        ))}
      </div>
    </div>
  );
}
