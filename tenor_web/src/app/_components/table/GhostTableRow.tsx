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
  className?: string;
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
  className,
}: GhostTableRowProps<I, T>) {
  const columnEntries = React.useMemo(
    () => filterVisibleColumns(Object.entries(columns)),
    [columns],
  );
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnWidths.map((width) => `${width}px`).join(" ") +
    ` 1fr 80px`;

  return (
    <div
      className={cn(
        "z-0 grid min-w-fit origin-top items-center gap-2 border-b border-app-border py-2 pl-2 text-gray-800 transition",
        className,
      )}
      style={{ gridTemplateColumns }}
    >
      {multiselect && <div></div>}
      {columnEntries.map(([key, column]) => {
        if (column.hiddenOnGhost)
          return (
            <div
              key={key}
              className="flex animate-pulse items-center justify-start text-app-secondary"
            >
              <AiIcon fontSize="small" />
            </div>
          );
        return (
          <div key={key} className="w-full truncate text-slate-500">
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
      <div className="flex items-center justify-end gap-2 pr-3 text-app-primary">
        <button className="cursor-pointer" onClick={onReject}>
          <RejectIcon fontSize="small" />
        </button>
        <button className="cursor-pointer" onClick={onAccept}>
          <AcceptIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}

export default GhostTableRow;
