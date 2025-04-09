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
        "grid min-w-fit items-center gap-2 border-b border-app-border p-2 transition",
        { "bg-gray-100": selection.has(value.id) },
      )}
      style={{ gridTemplateColumns }}
    >
      {multiselect && (
        <InputCheckbox
          checked={selection.has(value.id)}
          onChange={() => toggleSelect(value.id)}
        />
      )}
      {columnEntries.map(([key, column]) => (
        <div key={key} className="w-full truncate">
          {column.render ? column.render(value) : value[key]}
        </div>
      ))}
      {showThreeDots && (
        <>
          <div></div>
          <Dropdown
            label={<span className="font-bold text-app-light">• • •</span>}
            className="flex h-full w-full items-center justify-start text-sm font-semibold transition"
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
