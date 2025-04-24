import React from "react";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import { cn } from "~/lib/utils";

import { type DeleteOptions, type TableOptions } from "./Table";
import AcceptIcon from "@mui/icons-material/Check";
import RejectIcon from "@mui/icons-material/Close";

interface TableActionsProps<I> {
  selection: Set<I>;
  setSelection: React.Dispatch<React.SetStateAction<Set<I>>>;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean | DeleteOptions;
  onDelete?: (ids: I[], callback: (del: boolean) => void) => void;
  showGhostActions?: boolean;
  onAcceptAllGhosts?: () => void;
  onRejectAllGhosts?: () => void;
}

function TableActions<I extends string | number>({
  selection,
  setSelection,
  extraOptions,
  deletable,
  onDelete,
  showGhostActions,
  onAcceptAllGhosts,
  onRejectAllGhosts,
}: TableActionsProps<I>) {
  return (
    <div
      className={cn(
        "pointer-events-none flex items-center justify-end gap-3 opacity-0 transition",
        {
          "pointer-events-auto opacity-100":
            selection.size > 0 || showGhostActions,
        },
      )}
    >
      {selection.size > 0 &&
        extraOptions?.map((option, i) => (
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
      {deletable === true && selection.size > 0 && (
        <button
          data-tooltip-id="tooltip"
          data-tooltip-content={`Delete selected (${selection.size})`}
          data-tooltip-place="top-start"
          data-tooltip-hidden={selection.size === 0}
          className="text-gray-500 transition hover:text-app-fail"
          onClick={async () => {
            onDelete?.(Array.from(selection), (del) => {
              if (del) {
                setSelection(new Set());
              }
            });
          }}
        >
          <DeleteIcon />
        </button>
      )}
      {selection.size > 0 &&
        deletable &&
        typeof deletable === "object" &&
        "deleteText" in deletable && (
          <button
            data-tooltip-id="tooltip"
            data-tooltip-content={`${deletable.deleteText} selected (${selection.size})`}
            data-tooltip-place="top-start"
            data-tooltip-hidden={selection.size === 0}
            className="text-gray-500 transition hover:text-app-fail"
            onClick={() => {
              onDelete?.(Array.from(selection), (del) => {
                if (del) {
                  setSelection(new Set());
                }
              });
            }}
          >
            {deletable.deleteIcon ?? <DeleteIcon />}
          </button>
        )}
      {showGhostActions && (
        <>
          <button
            data-tooltip-id="tooltip"
            data-tooltip-content="Reject all"
            className="text-gray-500 transition hover:text-app-fail"
            onClick={onAcceptAllGhosts}
          >
            <RejectIcon fontSize="small" />
          </button>
          <button
            data-tooltip-id="tooltip"
            data-tooltip-content="Accept all"
            className="text-gray-500 transition hover:text-app-primary"
            onClick={onRejectAllGhosts}
          >
            <AcceptIcon fontSize="small" />
          </button>
        </>
      )}
    </div>
  );
}

export default TableActions;
