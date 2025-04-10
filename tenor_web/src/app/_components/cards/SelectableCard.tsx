import React, { type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import InputCheckbox from "../inputs/InputCheckbox";
import { useDraggable } from "@dnd-kit/react";

interface Props {
  selected: boolean;
  onChange?: (selected: boolean) => void;
  showCheckbox?: boolean;
  dndId: string;
}

// TODO: Add warnings about dragging and dropping

export default function SelectableCard({
  selected,
  children,
  onChange,
  showCheckbox,
  dndId,
  ...props
}: Props & PropsWithChildren & React.HTMLProps<HTMLDivElement>) {
  const { ref: setNodeRef, isDragging } = useDraggable({
    id: dndId,
    disabled: selected || showCheckbox, // Don't allow dragging if selection in progress
  });

  return (
    <div
      className={cn(
        "group relative flex w-full cursor-pointer select-none rounded-lg border border-app-border bg-white p-2 py-2 shadow-xl transition duration-100",
        {
          "ring-2 ring-app-secondary": selected,
          "opacity-60": isDragging,
        },
      )}
      {...props}
      ref={setNodeRef}
    >
      <div
        className={cn(
          "shrink-0 grow basis-0 overflow-hidden py-2 opacity-0 transition-all group-hover:basis-6 group-hover:opacity-100",
          {
            "basis-6 opacity-100": (selected || showCheckbox) && !isDragging,
          },
        )}
      >
        <InputCheckbox
          checked={selected}
          onChange={(val) => onChange?.(val)}
          className="h-6 w-6 cursor-auto rounded-full"
        />
      </div>
      <div className="min-h-8 min-w-full px-2 py-2 pr-5">{children}</div>
    </div>
  );
}
