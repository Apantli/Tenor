"use client";

import React, { useState, useMemo, useRef } from "react";
import { cn } from "~/lib/utils";
import { type ClassNameValue } from "tailwind-merge";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

export interface VisibleColumn<T> {
  label: string;
  width: number;
  sortable?: boolean;
  filterable?: "list" | "search-only";
  sorter?: (a: T, b: T) => number;
  filterValue?: (row: T) => string;
  render?: (row: T) => React.ReactNode;
}

export type Column<T> = VisibleColumn<T> | { visible: false };

export type TableColumns<T> = Record<keyof T, Column<T>>;

export function filterVisibleColumns<T>(
  columns: [string, Column<T>][],
): [string, VisibleColumn<T>][] {
  return columns.filter(([, col]) => "label" in col) as [
    string,
    VisibleColumn<T>,
  ][];
}

export interface TableOptions<I> {
  label: string;
  action: (ids: I[]) => void;
  icon: React.JSX.Element;
}

export interface DeleteOptions {
  deleteText: string;
  deleteIcon?: React.JSX.Element;
}

interface TableProps<I, T> {
  data: T[];
  columns: TableColumns<T>;
  multiselect?: boolean;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean | DeleteOptions;
  onDelete?: (ids: I[]) => void;
  className?: ClassNameValue;
  emptyMessage?: string;
}

// TODO: Make columns width be resizable on runtime by user
// TODO: Make pills work in sorting & filter (needs custom sorting function)
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
  emptyMessage,
}: TableProps<I, T>) {
  const [sortColumnKey, setSortColumnKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selection, setSelection] = useState<Set<I>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedData = useMemo(() => {
    if (!sortColumnKey) return data;

    const sorted = [...data].sort((a, b) => {
      if (!("label" in columns[sortColumnKey])) return 0;

      // Check if the column has a custom sorter function
      if (columns[sortColumnKey]?.sorter) {
        return (
          columns[sortColumnKey].sorter(a, b) *
          (sortDirection === "asc" ? 1 : -1)
        );
      } else {
        const aValue = a[sortColumnKey];
        const bValue = b[sortColumnKey];
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [data, sortColumnKey, sortDirection]);

  const includeRow = (row: T, columnKey: keyof T, value?: string) => {
    if (!("label" in columns[columnKey])) return;

    const filterValue = value ?? filters[columnKey as string];
    if (filterValue === undefined) return true;

    if (
      columns[columnKey]?.filterable === "search-only" &&
      !String(columns[columnKey].filterValue?.(row) ?? row[columnKey])
        .toLowerCase()
        .includes(filterValue.toLowerCase())
    ) {
      return false;
    } else if (
      columns[columnKey]?.filterable === "list" &&
      String(columns[columnKey].filterValue?.(row) ?? row[columnKey]) !==
        filterValue
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
    <div className={cn("w-full overflow-x-hidden", className)}>
      <div
        className="flex h-full flex-col overflow-x-scroll text-lg"
        ref={scrollContainerRef}
      >
        <TableHeader
          columns={columns}
          sortColumnKey={sortColumnKey}
          sortDirection={sortDirection}
          filters={filters}
          multiselect={multiselect}
          filteredData={filteredData}
          selection={selection}
          setSelection={setSelection}
          toggleSelectAll={toggleSelectAll}
          handleToggleSorting={handleToggleSorting}
          stopSorting={stopSorting}
          clearFilter={clearFilter}
          setFilter={setFilter}
          extraOptions={extraOptions}
          deletable={deletable}
          onDelete={onDelete}
        />
        {filteredData.map((value) => (
          <TableRow
            key={value.id}
            value={value}
            columns={columns}
            multiselect={multiselect}
            selection={selection}
            toggleSelect={toggleSelect}
            extraOptions={extraOptions}
            deletable={deletable}
            onDelete={onDelete}
            scrollContainerRef={scrollContainerRef}
          />
        ))}
        {filteredData.length === 0 && emptyMessage && (
          <div className="flex w-full items-center justify-center border-b border-app-border p-3 text-gray-500">
            <span className="text-base">{emptyMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
