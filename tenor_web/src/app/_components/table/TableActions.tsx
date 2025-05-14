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
  // FIXME: This is not currently being used, but it might be useful in the future
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        "pointer-events-none flex w-full items-center justify-end gap-2 opacity-0 transition",
        {
          "pointer-events-auto opacity-100":
            selection.size > 0 || showGhostActions,
        },
      )}
    >
      {!showGhostActions && deletable === true && selection.size > 0 && (
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
      {!showGhostActions &&
        selection.size > 0 &&
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
        <div className="flex items-center gap-2">
          <button
            className="rounded-md bg-app-fail p-1 text-sm text-white transition hover:bg-app-hover-fail"
            onClick={onRejectAllGhosts}
            data-tooltip-id="tooltip"
            data-tooltip-content="Reject all"
          >
            Reject
          </button>
          <button
            className="rounded-md bg-app-secondary p-1 text-sm text-white transition hover:bg-app-hover-secondary"
            onClick={onAcceptAllGhosts}
            data-tooltip-id="tooltip"
            data-tooltip-content="Accept all"
          >
            Accept
          </button>
        </div>
      )}
    </div>
  );
}

export default TableActions;
