"use client";

import React, {
  useState,
  useMemo,
  type ChangeEventHandler,
  useEffect,
} from "react";
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";
import { cn } from "~/lib/utils";
import { type ClassNameValue } from "tailwind-merge";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import UpArrowIcon from "@mui/icons-material/ArrowUpwardOutlined";
import DownArrowIcon from "@mui/icons-material/ArrowDownwardOutlined";
import CrossIcon from "@mui/icons-material/Close";
import CrossFilterIcon from "@mui/icons-material/FilterListOff";

interface Column<T> {
  label: string;
  width: number;
  sortable?: boolean;
  filterable?: "list" | "search-only";
  render?: (row: T) => React.ReactNode;
}

export type TableColumns<T> = Record<keyof T, Column<T>>;

interface TableOptions<I> {
  label: string;
  action: (ids: I[]) => void;
  icon: React.JSX.Element;
}

interface TableProps<I, T> {
  data: T[];
  columns: TableColumns<T>;
  multiselect?: boolean;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean;
  onDelete?: (ids: I[]) => void;
  className?: ClassNameValue;
}

interface TableFilterProps<T> {
  column: Column<T>;
  filters: Record<string, string>;
  columnKey: keyof T;
  data: T[];
  setFilter: (key: keyof T, value: string) => void;
  clearFilter: (key: keyof T) => void;
}

// eslint-disable-next-line
function TableFilter<T extends Record<string, any>>({
  column,
  filters,
  columnKey,
  data,
  setFilter,
  clearFilter,
}: TableFilterProps<T>) {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (column.filterable === "search-only") {
      setSearchValue(filters[columnKey as string] ?? "");
    }
  }, [filters[columnKey as string]]);

  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
    if (column.filterable === "search-only") {
      if (e.target.value === "") {
        clearFilter(columnKey);
      } else {
        setFilter(columnKey, e.target.value);
      }
    }
  };

  const filteredData = data.filter((row) => {
    if (searchValue !== "" && !String(row[columnKey]).includes(searchValue)) {
      return false;
    }
    return true;
  });
  // eslint-disable-next-line
  const uniqueData = [...new Set(filteredData.map((row) => row[columnKey]))];

  return (
    <DropdownItem className="flex w-52 flex-col">
      <span className="mb-2 text-sm text-gray-500">Filter by value</span>
      {column.filterable === "list" && (
        <div>
          {filters[columnKey as string] === undefined && (
            <>
              <input
                type="text"
                className="w-full rounded-t-md border border-app-border px-2 py-1 text-sm outline-none"
                placeholder="Search..."
                value={searchValue}
                onChange={handleUpdateSearch}
              />
              <div className="flex max-h-20 flex-col overflow-y-scroll rounded-b-lg border border-t-0 border-app-border">
                {uniqueData.map((item, i) => (
                  <DropdownButton
                    key={i}
                    className="border-b border-app-border px-2 py-1 last:border-none"
                    onClick={() => setFilter(columnKey, item)}
                  >
                    {item}
                  </DropdownButton>
                ))}
                {uniqueData.length === 0 && (
                  <span className="w-full px-2 py-1 text-sm text-gray-500">
                    No items found
                  </span>
                )}
              </div>
            </>
          )}
          {filters[columnKey as string] !== undefined && (
            <DropdownButton
              className="flex w-full items-center justify-between rounded-lg border border-app-border px-2 py-1"
              onClick={() => clearFilter(columnKey)}
            >
              {filters[columnKey as string]}
              <CrossIcon />
            </DropdownButton>
          )}
        </div>
      )}
      {column.filterable === "search-only" && (
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
            placeholder="Keyword..."
            value={searchValue}
            onChange={handleUpdateSearch}
          />
          {searchValue !== "" && (
            <button
              className="absolute right-2"
              onClick={() => clearFilter(columnKey)}
            >
              <CrossIcon />
            </button>
          )}
        </div>
      )}
    </DropdownItem>
  );
}

export default function Table<
  I extends string | number,
  // eslint-disable-next-line
  T extends Record<string, any> & { id: I },
>({
  data,
  columns,
  multiselect,
  extraOptions,
  deletable,
  onDelete,
  className,
}: TableProps<I, T>) {
  const [sortColumnKey, setSortColumnKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selection, setSelection] = useState<Set<I>>(new Set());

  const showThreeDots = extraOptions !== undefined || deletable === true;
  const optionCount =
    Object.entries(extraOptions ?? {}).length + (deletable ? 1 : 0);

  const sortedData = useMemo(() => {
    if (!sortColumnKey) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortColumnKey];
      const bValue = b[sortColumnKey];

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortColumnKey, sortDirection]);

  const includeRow = (row: T, columnKey: keyof T, value?: string) => {
    const filterValue = value ?? filters[columnKey as string];
    if (filterValue === undefined) return true;

    if (
      columns[columnKey]?.filterable === "search-only" &&
      !String(row[columnKey]).toLowerCase().includes(filterValue.toLowerCase())
    ) {
      return false;
    } else if (
      columns[columnKey]?.filterable === "list" &&
      String(row[columnKey]) !== filterValue
    ) {
      return false;
    }
    return true;
  };

  const filteredData = useMemo(() => {
    return sortedData.filter((row) => {
      for (const key in filters) {
        if (!includeRow(row, key)) {
          return false;
        }
      }
      return true;
    });
  }, [sortedData, filters]);

  const columnEntries = useMemo(() => Object.entries(columns), [columns]);
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnEntries.map(([, column]) => `${column.width}px`).join(" ") +
    (showThreeDots ? " 1fr 50px" : "");

  const toggleSelectAll = () => {
    if (selection.size < filteredData.length && filteredData.length !== 0) {
      setSelection(new Set(filteredData.map((value) => value.id)));
    } else {
      setSelection(new Set());
    }
  };

  const toggleSelect = (id: I) => {
    const newSelection = new Set(selection);
    if (selection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelection(newSelection);
  };

  const handleToggleSorting = (
    columnKey: keyof T,
    direction: "asc" | "desc",
  ) => {
    if (columnKey === sortColumnKey && direction === sortDirection) {
      stopSorting();
    } else {
      setSortColumnKey(columnKey);
      setSortDirection(direction);
    }
  };

  const stopSorting = () => {
    setSortColumnKey(null);
    setSortDirection("asc");
  };

  // eslint-disable-next-line
  const setFilter = (columnKey: keyof T, value: any) => {
    const stringValue = String(value);
    const newFilters = { ...filters, [columnKey]: stringValue };
    setFilters(newFilters);

    const selectedRows = data.filter((row) => selection.has(row.id));

    const newSelection = new Set(selection);
    for (const row of selectedRows) {
      if (!includeRow(row, columnKey, stringValue)) {
        newSelection.delete(row.id);
      }
    }
    setSelection(newSelection);
  };

  const clearFilter = (columnKey: keyof T) => {
    delete filters[columnKey as string];
    setFilters({ ...filters });
  };

  return (
    <div className={cn("flex h-full flex-col overflow-x-scroll", className)}>
      {/* TABLE HEADER */}
      <div
        className="sticky top-0 z-[100] grid w-fit min-w-full gap-2 border-b border-app-border bg-white p-2"
        style={{ gridTemplateColumns }}
      >
        {/* Checkbox */}
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
        {/* Columns */}
        {columnEntries.map(([key, column]) => (
          <div
            key={key}
            className="flex items-center justify-between pr-4 text-gray-500"
          >
            <span>{column.label}</span>
            {(!!column.sortable || column.filterable) && (
              <div className="flex items-center justify-end gap-4">
                {sortColumnKey === key && sortDirection === "asc" && (
                  <button onClick={stopSorting}>
                    <UpArrowIcon />
                  </button>
                )}
                {sortColumnKey === key && sortDirection === "desc" && (
                  <button onClick={stopSorting}>
                    <DownArrowIcon />
                  </button>
                )}
                {filters[key] !== undefined && (
                  <button onClick={() => clearFilter(key)}>
                    <CrossFilterIcon />
                  </button>
                )}
                <Dropdown label="• • •">
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
                      data={data}
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
        {/* Action items */}
        {showThreeDots && (
          <>
            <div></div>
            <div
              className={cn(
                "pointer-events-none flex items-center justify-end gap-3 opacity-0 transition",
                {
                  "pointer-events-auto opacity-100": selection.size > 0,
                },
              )}
            >
              {extraOptions?.map((option, i) => (
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
              {deletable && (
                <button
                  data-tooltip-id="tooltip"
                  data-tooltip-content={`Delete selected (${selection.size})`}
                  data-tooltip-place="top-start"
                  data-tooltip-hidden={selection.size === 0}
                  className="text-gray-500 transition hover:text-app-fail"
                  onClick={() => onDelete?.(Array.from(selection))}
                >
                  <DeleteIcon />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* TABLE ROWS */}
      {filteredData.map((value, index1) => (
        <div
          key={index1}
          className={cn(
            "grid w-fit min-w-full gap-2 border-b border-app-border p-2 transition",
            { "bg-gray-100": selection.has(value.id) },
          )}
          style={{ gridTemplateColumns }}
        >
          {/* Checkbox */}
          {multiselect && (
            <input
              type="checkbox"
              className="w-4"
              checked={selection.has(value.id)}
              onChange={() => toggleSelect(value.id)}
            ></input>
          )}
          {/* Columns */}
          {columnEntries.map(([key, column], index2) => (
            <div key={index2} className="text-lg">
              {column.render ? column.render(value) : value[key]}
            </div>
          ))}
          {/* Action menu */}
          {showThreeDots && (
            <>
              <div></div>
              <Dropdown
                label="• • •"
                className="flex h-full items-center justify-end text-sm font-semibold transition"
                menuClassName="font-normal whitespace-nowrap"
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
                {deletable && (
                  <DropdownButton
                    className="flex items-center justify-between gap-8"
                    onClick={() => onDelete?.([value.id])}
                  >
                    <span className="text-app-fail">Delete</span>
                    <DeleteIcon htmlColor="red" />
                  </DropdownButton>
                )}
              </Dropdown>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
