import React from "react";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import { cn } from "~/lib/utils";

import { type TableOptions } from "./Table";

interface TableActionsProps<I> {
  selection: Set<I>;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean;
  onDelete?: (ids: I[]) => void;
}

function TableActions<I extends string | number>({
  selection,
  extraOptions,
  deletable,
  onDelete,
}: TableActionsProps<I>) {
  return (
    <div
      className={cn(
        "pointer-events-none flex items-center justify-end gap-3 opacity-0 transition",
        {
          "pointer-events-auto opacity-100": selection.size > 0,
        },
      )}
    >
      {extraOptions?.map((option, i) => (
        <button
          key={i}
          data-tooltip-id="tooltip"
          data-tooltip-content={`${option.label} selected (${selection.size})`}
          data-tooltip-place="top-start"
          data-tooltip-hidden={selection.size === 0}
          className="text-gray-500 transition hover:text-app-primary"
          onClick={() => option.action(Array.from(selection))}
        >
          {option.icon}
        </button>
      ))}
      {deletable && (
        <button
          data-tooltip-id="tooltip"
          data-tooltip-content={`Delete selected (${selection.size})`}
          data-tooltip-place="top-start"
          data-tooltip-hidden={selection.size === 0}
          className="text-gray-500 transition hover:text-app-fail"
          onClick={() => onDelete?.(Array.from(selection))}
        >
          <DeleteIcon />
        </button>
      )}
    </div>
  );
}

export default TableActions;
