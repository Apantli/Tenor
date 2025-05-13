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
import InputCheckbox from "../inputs/InputCheckbox";

interface TableRowProps<I, T> {
  value: T;
  columns: TableColumns<T>;
  multiselect?: boolean;
  selection: Set<I>;
  setSelection: React.Dispatch<React.SetStateAction<Set<I>>>;
  toggleSelect: (id: I) => void;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean | DeleteOptions;
  onDelete?: (ids: I[], callback: (del: boolean) => void) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  columnWidths: number[];
  className?: string;
  rowIndex?: number;
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
  setSelection,
  toggleSelect,
  extraOptions,
  deletable,
  onDelete,
  scrollContainerRef,
  columnWidths,
  className,
  rowIndex,
}: TableRowProps<I, T>) {
  const showThreeDots = extraOptions !== undefined || deletable !== undefined;
  const columnEntries = React.useMemo(
    () => filterVisibleColumns(Object.entries(columns)),
    [columns],
  );
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnWidths.map((width) => `${width}px`).join(" ") +
    (showThreeDots ? ` 1fr 110px` : "");

  const handleDelete = async () => {
    onDelete?.([value.id], (del) => {
      if (del) {
        const newSelection = selection;
        newSelection.delete(value.id);
        setSelection(newSelection);
      }
    });
  };

  return (
    <div
      className={cn(
        "grid min-w-fit items-center gap-3 border-b border-app-border p-2 transition",
        {
          "bg-gray-100": selection.has(value.id),
        },
        className,
      )}
      style={{ gridTemplateColumns, zIndex: 1000 - (rowIndex ?? 0) }}
    >
      {multiselect && (
        <InputCheckbox
          checked={selection.has(value.id)}
          onChange={() => toggleSelect(value.id)}
        />
      )}
      {columnEntries.map(([key, column]) => (
        <div key={key} className="w-full truncate">
          {column.render
            ? column.render(
                value,
                selection.has(value.id)
                  ? (Array.from(selection) as string[])
                  : [value.id as string],
                false,
              )
            : value[key]}
        </div>
      ))}
      {showThreeDots && (
        <>
          <div></div>
          <Dropdown
            label={
              <span className="flex w-full items-center justify-end pr-3 font-bold text-app-light">
                • • •
              </span>
            }
            className="sticky right-4 flex h-full w-full items-center justify-end text-sm font-semibold transition"
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
                onClick={handleDelete}
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
                  onClick={handleDelete}
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
