import React, { useEffect, useRef, type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import InputCheckbox from "../inputs/InputCheckbox";
import { useDraggable } from "@dnd-kit/react";
import { accentColorByCardType } from "~/utils/helpers/colorUtils";

interface Props {
  selected: boolean;
  onChange?: (selected: boolean) => void;
  showCheckbox?: boolean;
  dndId: string;
  lastDraggedItemId: string | null;
  cardType?: "US" | "IS" | "IT" | "US-TS" | "IS-TS" | "IT-TS";
  disabled?: boolean;
}

export default function SelectableCard({
  selected,
  children,
  onChange,
  showCheckbox,
  dndId,
  lastDraggedItemId: lastDraggedItemId,
  cardType,
  disabled = false,
  ...props
}: Props & PropsWithChildren & React.HTMLProps<HTMLDivElement>) {
  const { ref: setNodeRef, isDragging } = useDraggable({
    id: dndId,
    disabled: disabled || selected || showCheckbox, // Don't allow dragging if selection in progress
  });
  const [highlightDropped, setHighlightDropped] = React.useState(false);
  const [isDropping, setIsDropping] = React.useState(
    lastDraggedItemId === null ? false : true,
  );

  const cardRef = useRef<HTMLDivElement>(null);

  // Effect to scroll the card into view when it's the last dragged item
  useEffect(() => {
    setTimeout(() => {
      setIsDropping(false);
    }, 200); // This should be the same as the drop animation
    if (lastDraggedItemId === dndId && cardRef.current) {
      // Focus the element
      cardRef.current.focus();

      // Scroll into view with smooth behavior
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });

      setTimeout(() => {
        setIsDropping(false);
        setHighlightDropped(true);
      }, 200);
      setTimeout(() => {
        setHighlightDropped(false);
      }, 500);
    }
  }, [lastDraggedItemId, dndId]);

  const accentColor =
    accentColorByCardType[
      (cardType ?? "US") as keyof typeof accentColorByCardType
    ];

  return (
    <div
      className={cn(
        "group relative flex h-fit w-full cursor-pointer select-none rounded-lg border border-app-border bg-white p-2 pb-3 shadow-xl transition-all duration-100",
        {
          "ring-2 ring-app-secondary": selected,
          "opacity-60": isDragging,
          "bg-slate-200": highlightDropped, // Highlight when last dragged,
          "opacity-0": isDropping,
        },
      )}
      tabIndex={0} // Make the div focusable
      ref={(el) => {
        if (cardRef.current !== el) {
          (cardRef as React.MutableRefObject<HTMLDivElement | null>).current =
            el;
        }
        setNodeRef(el);
      }}
      {...props}
    >
      <div className="absolute left-[-1px] top-[-1px] h-[calc(100%+2px)] w-[calc(100%+2px)] overflow-hidden rounded-lg border border-transparent">
        <div
          className={cn("absolute bottom-0 left-0 h-2 w-full", accentColor)}
        ></div>
      </div>
      {!disabled && (
        <div
          className={cn(
            "shrink-0 grow basis-0 overflow-hidden py-2 opacity-0 transition-all group-hover:basis-6 group-hover:opacity-100",
            {
              "basis-6 opacity-100":
                (selected || showCheckbox) &&
                !isDragging &&
                !isDropping &&
                !disabled,
            },
          )}
        >
          <InputCheckbox
            disabled={disabled}
            checked={selected}
            onChange={(val) => onChange?.(val)}
            className="h-6 w-6 cursor-auto rounded-full"
          />
        </div>
      )}
      <div className="min-h-8 min-w-full px-2 py-2 pr-5">{children}</div>
    </div>
  );
}
