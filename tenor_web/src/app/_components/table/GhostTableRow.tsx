import React from "react";
import { cn } from "~/lib/helpers/utils";
import AiIcon from "@mui/icons-material/AutoAwesome";
import { filterVisibleColumns, type TableColumns } from "./Table";

interface GhostTableRowProps<T> {
  value: T;
  columns: TableColumns<T>;
  multiselect?: boolean;
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
  columnWidths,
  onAccept,
  onReject,
  className,
}: GhostTableRowProps<T>) {
  const columnEntries = React.useMemo(
    () => filterVisibleColumns(Object.entries(columns)),
    [columns],
  );
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnWidths.map((width) => `${width}px`).join(" ") +
    ` 1fr 120px`;

  return (
    <div
      className={cn(
        "z-0 grid min-w-fit origin-top items-center gap-3 border-b border-app-border bg-slate-100/80 pl-2 text-gray-800 transition",
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
          <div key={key} className="w-full truncate text-app-text">
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
      <div className="sticky right-0 flex h-10 w-full items-center justify-end gap-2 pr-3 text-app-primary">
        <button
          className="p-1 text-sm text-app-text underline underline-offset-4"
          onClick={onReject}
        >
          Reject
        </button>
        <button
          className="rounded-md bg-app-secondary p-1 text-sm text-white transition hover:bg-app-hover-secondary"
          onClick={onAccept}
        >
          Accept
        </button>
        <div className="bg-slate-100/80_ absolute left-0 top-0 -z-10 h-full w-full bg-slate-100"></div>
        <div className="absolute left-[-20px] top-0 -z-10 h-full w-[20px] bg-gradient-to-r from-transparent to-slate-100"></div>
      </div>
    </div>
  );
}

export default GhostTableRow;
