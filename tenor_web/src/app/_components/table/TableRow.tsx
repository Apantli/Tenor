import React from "react";
import Dropdown, { DropdownButton } from "../Dropdown";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import { cn } from "~/lib/utils";

import {
  filterVisibleColumns,
  type TableColumns,
  type TableOptions,
  type DeleteOptions,
} from "./Table";

interface TableRowProps<I, T> {
  value: T;
  columns: TableColumns<T>;
  multiselect?: boolean;
  selection: Set<I>;
  toggleSelect: (id: I) => void;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean | DeleteOptions;
  onDelete?: (ids: I[]) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

function TableRow<
  I extends string | number,
  // eslint-disable-next-line
  T extends Record<string, any> & { id: I },
>({
  value,
  columns,
  multiselect,
  selection,
  toggleSelect,
  extraOptions,
  deletable,
  onDelete,
  scrollContainerRef,
}: TableRowProps<I, T>) {
  const showThreeDots = extraOptions !== undefined || deletable !== undefined;
  const columnEntries = React.useMemo(
    () => filterVisibleColumns(Object.entries(columns)),
    [columns],
  );
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnEntries.map(([, column]) => `${column.width}px`).join(" ") +
    (showThreeDots ? ` 1fr ${((extraOptions?.length ?? 0) + 1) * 30}px` : "");

  return (
    <div
      className={cn(
        "grid w-fit min-w-full items-center gap-2 border-b border-app-border p-2 transition",
        { "bg-gray-100": selection.has(value.id) },
      )}
      style={{ gridTemplateColumns }}
    >
      {multiselect && (
        <input
          type="checkbox"
          className="w-4"
          checked={selection.has(value.id)}
          onChange={() => toggleSelect(value.id)}
        ></input>
      )}
      {columnEntries.map(([key, column]) => (
        <div key={key} className="flex items-center">
          {column.render ? column.render(value) : value[key]}
        </div>
      ))}
      {showThreeDots && (
        <>
          <Dropdown
            label={<span className="font-bold text-app-light">• • •</span>}
            className="flex h-full w-12 items-center justify-start pl-5 text-sm font-semibold transition"
            menuClassName="font-normal whitespace-nowrap"
            scrollContainer={scrollContainerRef}
          >
            {extraOptions?.map((option, i) => (
              <DropdownButton
                key={i}
                className="flex items-center justify-between gap-8"
                onClick={() => option.action([value.id])}
              >
                <span>{option.label}</span>
                {option.icon}
              </DropdownButton>
            ))}
            {deletable === true && (
              <DropdownButton
                className="flex items-center justify-between gap-8"
                onClick={() => onDelete?.([value.id])}
              >
                <span className="text-app-fail">Delete</span>
                <DeleteIcon htmlColor="red" />
              </DropdownButton>
            )}
            {deletable &&
              typeof deletable === "object" &&
              "deleteText" in deletable && (
                <DropdownButton
                  className="flex items-center justify-between gap-8"
                  onClick={() => onDelete?.([value.id])}
                >
                  <span className="text-app-fail">{deletable.deleteText}</span>
                  <span className="text-app-fail">
                    {deletable.deleteIcon ?? <DeleteIcon />}
                  </span>
                </DropdownButton>
              )}
          </Dropdown>
        </>
      )}
    </div>
  );
}

export default TableRow;
