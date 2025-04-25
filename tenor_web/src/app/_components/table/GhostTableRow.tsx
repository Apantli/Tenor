import React from "react";
import { cn } from "~/lib/utils";
import AiIcon from "@mui/icons-material/AutoAwesome";
import AcceptIcon from "@mui/icons-material/Check";
import RejectIcon from "@mui/icons-material/Close";

import {
  filterVisibleColumns,
  type TableColumns,
  type TableOptions,
  type DeleteOptions,
} from "./Table";

interface GhostTableRowProps<I, T> {
  value: T;
  columns: TableColumns<T>;
  multiselect?: boolean;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean | DeleteOptions;
  columnWidths: number[];
  onAccept?: () => void;
  onReject?: () => void;
}

function GhostTableRow<
  I extends string | number,
  // eslint-disable-next-line
  T extends Record<string, any> & { id: I },
>({
  value,
  columns,
  multiselect,
  extraOptions,
  deletable,
  columnWidths,
  onAccept,
  onReject,
}: GhostTableRowProps<I, T>) {
  const showThreeDots = extraOptions !== undefined || deletable !== undefined;
  const columnEntries = React.useMemo(
    () => filterVisibleColumns(Object.entries(columns)),
    [columns],
  );
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnWidths.map((width) => `${width}px`).join(" ") +
    (showThreeDots ? ` 1fr ${((extraOptions?.length ?? 0) + 1) * 30}px` : "");

  return (
    <div
      className={cn(
        "z-0 grid min-w-fit origin-top items-center gap-2 rounded-lg border-b border-app-border bg-app-primary py-2 pl-2 text-white transition",
      )}
      style={{ gridTemplateColumns }}
    >
      {multiselect && <div></div>}
      {columnEntries.map(([key, column]) => {
        if (column.hiddenOnGhost)
          return (
            <div
              key={key}
              className="flex animate-pulse items-center justify-start"
            >
              <AiIcon fontSize="small" htmlColor="white" />
            </div>
          );
        return (
          <div key={key} className="w-full truncate">
            {column.render
              ? column.render(
                  value,
                  [], // selection
                  true, // isGhost
                )
              : value[key]}
          </div>
        );
      })}
      <div></div> {/* 1fr */}
      <div className="flex items-center gap-2">
        <button className="cursor-pointer" onClick={onReject}>
          <RejectIcon htmlColor="white" fontSize="small" />
        </button>
        <button className="cursor-pointer" onClick={onAccept}>
          <AcceptIcon htmlColor="white" fontSize="small" />
        </button>
      </div>
    </div>
  );
}

export default GhostTableRow;
