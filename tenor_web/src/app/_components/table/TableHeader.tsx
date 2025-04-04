import React from "react";
import Dropdown, { DropdownButton } from "../Dropdown";
import UpArrowIcon from "@mui/icons-material/ArrowUpwardOutlined";
import DownArrowIcon from "@mui/icons-material/ArrowDownwardOutlined";
import CrossIcon from "@mui/icons-material/Close";
import CrossFilterIcon from "@mui/icons-material/FilterListOff";

import {
  type DeleteOptions,
  filterVisibleColumns,
  type TableColumns,
  type TableOptions,
} from "./Table";
import TableFilter from "./TableFilter";
import TableActions from "./TableActions";

interface TableHeaderProps<I, T> {
  columns: TableColumns<T>;
  sortColumnKey: keyof T | null;
  sortDirection: "asc" | "desc";
  filters: Record<string, string>;
  multiselect?: boolean;
  filteredData: T[];
  selection: Set<I>;
  setSelection: React.Dispatch<React.SetStateAction<Set<I>>>;
  toggleSelectAll: () => void;
  handleToggleSorting: (columnKey: keyof T, direction: "asc" | "desc") => void;
  stopSorting: () => void;
  clearFilter: (columnKey: keyof T) => void;
  // eslint-disable-next-line
  setFilter: (columnKey: keyof T, value: any) => void;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean | DeleteOptions;
  onDelete?: (ids: I[]) => void;
}

// eslint-disable-next-line
function TableHeader<I extends string | number, T extends Record<string, any>>({
  columns,
  sortColumnKey,
  sortDirection,
  filters,
  multiselect,
  filteredData,
  selection,
  toggleSelectAll,
  handleToggleSorting,
  stopSorting,
  clearFilter,
  setFilter,
  extraOptions,
  deletable,
  onDelete,
  setSelection,
}: TableHeaderProps<I, T>) {
  const showThreeDots = extraOptions !== undefined || deletable !== undefined;
  const columnEntries = React.useMemo(
    () => filterVisibleColumns(Object.entries(columns)),
    [columns],
  );
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnEntries
      .map(([, column]) => ("width" in column ? `${column.width}px` : ""))
      .join(" ") +
    (showThreeDots ? ` 1fr ${((extraOptions?.length ?? 0) + 1) * 30}px` : "");

  return (
    <div
      className="sticky top-0 z-[60] grid gap-2 border-b border-app-border bg-white px-2"
      style={{ gridTemplateColumns }}
    >
      {multiselect && (
        <input
          type="checkbox"
          className="w-4"
          checked={
            selection.size == filteredData.length && filteredData.length > 0
          }
          onChange={toggleSelectAll}
        ></input>
      )}
      {columnEntries.map(([key, column]) => (
        <div
          key={key}
          className="flex items-center justify-between overflow-hidden pr-4 text-gray-500"
        >
          <span className="text-sm">{column.label}</span>
          {(!!column.sortable || column.filterable) && (
            <div className="flex items-center justify-end gap-2 pl-2">
              {sortColumnKey === key && sortDirection === "asc" && (
                <button onClick={stopSorting} className="text-app-light">
                  <UpArrowIcon />
                </button>
              )}
              {sortColumnKey === key && sortDirection === "desc" && (
                <button onClick={stopSorting} className="text-app-light">
                  <DownArrowIcon />
                </button>
              )}
              {filters[key] !== undefined && (
                <button
                  onClick={() => clearFilter(key)}
                  className="text-app-light"
                >
                  <CrossFilterIcon />
                </button>
              )}
              <Dropdown
                label={
                  <span className="text-nowrap font-bold text-app-light">
                    • • •
                  </span>
                }
              >
                {column.sortable && (
                  <DropdownButton
                    className="flex justify-between gap-8"
                    dontCloseOnClick
                    onClick={() => handleToggleSorting(key, "asc")}
                  >
                    <span>Sort ascending</span>
                    {sortColumnKey === key && sortDirection === "asc" && (
                      <CrossIcon />
                    )}
                    {(sortColumnKey !== key || sortDirection !== "asc") && (
                      <UpArrowIcon />
                    )}
                  </DropdownButton>
                )}
                {column.sortable && (
                  <DropdownButton
                    className="flex justify-between gap-8 border-app-border"
                    dontCloseOnClick
                    onClick={() => handleToggleSorting(key, "desc")}
                  >
                    <span>Sort descending</span>
                    {sortColumnKey === key && sortDirection === "desc" && (
                      <CrossIcon />
                    )}
                    {(sortColumnKey !== key || sortDirection !== "desc") && (
                      <DownArrowIcon />
                    )}
                  </DropdownButton>
                )}
                {column.filterable !== undefined && (
                  <TableFilter
                    column={column}
                    columnKey={key}
                    data={filteredData}
                    filters={filters}
                    clearFilter={clearFilter}
                    setFilter={setFilter}
                  />
                )}
              </Dropdown>
            </div>
          )}
        </div>
      ))}
      {showThreeDots && (
        <>
          <div></div>
          <TableActions
            selection={selection}
            setSelection={setSelection}
            extraOptions={extraOptions}
            deletable={deletable}
            onDelete={onDelete}
          />
        </>
      )}
    </div>
  );
}

export default TableHeader;
