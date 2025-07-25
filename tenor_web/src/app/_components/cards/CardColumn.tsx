import React, { useRef } from "react";
import LoadingSpinner from "../LoadingSpinner";
import SelectableCard from "./SelectableCard";
import useShiftKey from "~/app/_hooks/useShiftKey";
import useClickOutside from "~/app/_hooks/useClickOutside";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/helpers/utils";
import { useDroppable } from "@dnd-kit/react";
import type { KanbanCard } from "~/lib/types/kanbanTypes";
import NoCardsIcon from "@mui/icons-material/FormatListBulleted";

interface Props {
  selection: Set<string>;
  setSelection: (newSelection: Set<string>) => void;
  setDetailId: (detailId: string) => void;
  header?: React.ReactNode;
  className: ClassNameValue;

  cards: KanbanCard[];
  renderCard: (item: KanbanCard) => React.ReactNode;
  isLoading?: boolean;

  dndId: string;
  lastDraggedItemId: string | null;

  disabled?: boolean;
  disableDropping?: boolean;

  noCardsMessage?: string; // Optional message to show when there are no cards. If empty, no message will be shown.
}

export default function CardColumn({
  selection,
  setSelection,
  setDetailId,
  cards,
  renderCard,
  isLoading,
  header,
  className,
  dndId,
  lastDraggedItemId,
  disabled = false,
  disableDropping = false,
  noCardsMessage = "",
}: Props) {
  const shiftClick = useShiftKey();
  const lastSelectedCard = useRef<number>();
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside([ref.current], () => {
    lastSelectedCard.current = undefined;
  });

  const { ref: refDnd, isDropTarget } = useDroppable({
    id: dndId,
    disabled: disabled || disableDropping,
  });

  return (
    <div
      className={cn(
        "flex h-full w-full flex-1 flex-col overflow-hidden rounded-lg bg-sprint-column-background transition-colors",
        className,
        {
          "bg-sprint-column-background-hovered": isDropTarget && !disabled,
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
      {(cards.length !== 0 || isLoading) && (
        <div className="flex h-full flex-1 flex-col gap-2 overflow-y-auto p-6 pt-2">
          {cards.map((cardInfo) => (
            <SelectableCard
              disabled={disabled}
              lastDraggedItemId={lastDraggedItemId}
              key={cardInfo.id}
              dndId={cardInfo.id}
              cardType={cardInfo.cardType}
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
                    .filter(
                      (card) => card.scrumId >= min && card.scrumId <= max,
                    )
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
              }}
            >
              {renderCard(cardInfo)}
            </SelectableCard>
          ))}
        </div>
      )}
      {cards.length === 0 && !isLoading && noCardsMessage && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <span className="-mb-10 text-[100px] text-gray-500">
            <NoCardsIcon fontSize="inherit" />
          </span>
          <h1 className="mb-5 text-3xl font-semibold text-gray-500">
            {noCardsMessage}
          </h1>
        </div>
      )}
    </div>
  );
}
