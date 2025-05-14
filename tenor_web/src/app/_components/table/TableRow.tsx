import React, { useMemo, useState } from "react";
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
  ghostsShown?: boolean;
  disableSelection?: boolean;
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
  ghostsShown,
  disableSelection,
}: TableRowProps<I, T>) {
  const showThreeDots = extraOptions !== undefined || deletable !== undefined;
  const columnEntries = useMemo(
    () => filterVisibleColumns(Object.entries(columns)),
    [columns],
  );
  const addedSpace = ghostsShown ? "120px" : "50px";
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnWidths.map((width) => `${width}px`).join(" ") +
    (showThreeDots ? ` 1fr ${addedSpace}` : "");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDelete = async () => {
    onDelete?.([value.id], (del) => {
      if (del) {
        const newSelection = selection;
        newSelection.delete(value.id);
        setSelection(newSelection);
      }
    });
  };

  const isSelected = selection.has(value.id);

  return (
    <div
      className={cn(
        "grid min-w-fit items-center gap-3 border-b border-app-border pl-2",
        {
          "bg-gray-100": isSelected,
        },
        className,
      )}
      style={{ gridTemplateColumns, zIndex: dropdownOpen ? 1000 : "auto" }}
    >
      {multiselect && (
        <InputCheckbox
          checked={selection.has(value.id)}
          onChange={() => toggleSelect(value.id)}
          disabled={disableSelection}
        />
      )}
      {columnEntries.map(([key, column]) => (
        <div key={key} className="w-full truncate py-2">
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
          <div className="sticky right-0 flex h-10 w-full items-center justify-end pr-3">
            <Dropdown
              label={
                <span className="flex w-full items-center justify-center px-1 font-bold text-app-light">
                  • • •
                </span>
              }
              className="flex h-full items-center justify-end text-sm font-semibold transition"
              menuClassName="font-normal whitespace-nowrap"
              scrollContainer={scrollContainerRef}
              setOpenState={setDropdownOpen}
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
                    <span className="text-app-fail">
                      {deletable.deleteText}
                    </span>
                    <span className="text-app-fail">
                      {deletable.deleteIcon ?? <DeleteIcon />}
                    </span>
                  </DropdownButton>
                )}
            </Dropdown>
            <div
              className={cn(
                "absolute left-0 top-0 -z-10 h-full w-full bg-white",
                {
                  "bg-gray-100": isSelected,
                },
              )}
            ></div>
            <div
              className={cn(
                "absolute left-[-20px] top-0 -z-10 h-full w-[20px] bg-gradient-to-r from-transparent to-white",
                {
                  "to-gray-100": isSelected,
                },
              )}
            ></div>
          </div>
        </>
      )}
    </div>
  );
}

export default TableRow;
