"use client";

import dynamic from "next/dynamic";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "~/lib/utils";
import { type ClassNameValue } from "tailwind-merge";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import useClickOutside from "~/app/_hooks/useClickOutside";
import useShiftKey from "~/app/_hooks/useShiftKey";
import GhostTableRow from "./GhostTableRow";
import LoadingGhostTableRow from "./LoadingGhostTableRow";
import LoadingGhostTableRows from "./LoadingGhostTableRows";

export interface VisibleColumn<T> {
  label: string;
  width: number;
  hiddenOnGhost?: boolean;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: "list" | "search-only";
  sorter?: (a: T, b: T) => number;
  filterValue?: (row: T) => string;
  render?: (
    row: T,
    selectionIds: string[],
    isGhost: boolean,
  ) => React.ReactNode;
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
  ghostData?: T[];
  acceptGhosts?: (ids: I[]) => void;
  rejectGhosts?: (ids: I[]) => void;
  ghostRows?: number;
  setGhostRows?: (rows: number | undefined) => void;
  ghostLoadingEstimation?: number; // in ms
  columns: TableColumns<T>;
  multiselect?: boolean;
  extraOptions?: TableOptions<I>[];
  deletable?: boolean | DeleteOptions;
  onDelete?: (ids: I[], callback: (del: boolean) => void) => void;
  className?: ClassNameValue;
  emptyMessage?: string;
  tableKey: string; // Unique key for the table used for storing things like column widths
  rowClassName?: string;
}

function TableInternal<
  I extends string | number,
  // eslint-disable-next-line
  T extends Record<string, any> & { id: I },
>({
  data,
  ghostData,
  acceptGhosts,
  rejectGhosts,
  ghostRows,
  setGhostRows,
  ghostLoadingEstimation,
  columns,
  multiselect,
  extraOptions,
  deletable,
  onDelete,
  className,
  emptyMessage,
  tableKey,
  rowClassName,
}: TableProps<I, T>) {
  // Make sure the tableKey exists
  if (!tableKey) {
    throw new Error(
      "Table key is required. Add the tableKey prop to the Table component.",
    );
  }

  const [sortColumnKey, setSortColumnKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selection, setSelection] = useState<Set<I>>(new Set());
  const [resizing, setResizing] = useState(false);
  const [loadedGhosts, setLoadedGhosts] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ghostDivRef = useRef<HTMLDivElement>(null);
  const lastSelectedIdRef = useRef<I>();

  const columnWidths = filterVisibleColumns(Object.entries(columns)).map(
    ([columnKey, column]) => {
      const storedWidth = localStorage.getItem(tableKey + ":" + columnKey);
      if (storedWidth) {
        return parseInt(storedWidth);
      }
      return column.width;
    },
  );

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

  const shiftClick = useShiftKey();

  const toggleSelect = (id: I) => {
    const newSelection = new Set(selection);
    const currentIndex = filteredData.findIndex((row) => row.id === id);
    const lastSelectedIndex = filteredData.findIndex(
      (row) => row.id === lastSelectedIdRef.current,
    );

    let min = currentIndex;
    let max = currentIndex;
    if (shiftClick && lastSelectedIndex !== -1) {
      min = Math.min(lastSelectedIndex, currentIndex);
      max = Math.max(lastSelectedIndex, currentIndex);
    }

    for (let i = min; i <= max; i++) {
      const row = filteredData[i];
      if (row) {
        const rowId = row.id;
        if (selection.has(id)) {
          newSelection.delete(rowId);
        } else {
          newSelection.add(rowId);
        }
      }
    }
    lastSelectedIdRef.current = id;
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

  useClickOutside(scrollContainerRef, () => {
    lastSelectedIdRef.current = undefined;
  });

  const showGhostRows =
    (ghostData !== undefined && ghostData.length > 0) || (ghostRows ?? 0) > 0;

  useEffect(() => {
    // Triggers when ghost rows are shown
    if (showGhostRows && ghostDivRef.current) {
      const height = ghostDivRef.current?.getBoundingClientRect().height;
      ghostDivRef.current.style.height = "0px";

      // Wait for the next frame to set the height
      requestAnimationFrame(() => {
        if (!ghostDivRef.current) return;
        ghostDivRef.current.style.height = `${height}px`;
        ghostDivRef.current.style.opacity = "1";
      });

      const onTransitionEnd = () => {
        if (!ghostDivRef.current) return;
        ghostDivRef.current.style.height = "auto";
      };

      ghostDivRef.current.addEventListener("transitionend", onTransitionEnd);
      return () =>
        ghostDivRef.current?.removeEventListener(
          "transitionend",
          onTransitionEnd,
        );
    }
  }, [showGhostRows]);

  useEffect(() => {
    if (ghostData && ghostData.length > 0) {
      const timeout = setTimeout(() => {
        setLoadedGhosts(true);
        setGhostRows?.(undefined);
      }, 700);
      return () => clearTimeout(timeout);
    } else {
      setLoadedGhosts(false);
    }
  }, [ghostData]);

  const acceptAllGhosts = () => {
    if (acceptGhosts && ghostData) {
      acceptGhosts(ghostData.map((row) => row.id));
    }
    setLoadedGhosts(false);
  };

  const rejectAllGhosts = () => {
    if (rejectGhosts && ghostData) {
      rejectGhosts(ghostData.map((row) => row.id));
    }
    setLoadedGhosts(false);
  };

  const acceptGhost = (id: I) => {
    if (acceptGhosts) {
      acceptGhosts([id]);
    }
    const newGhostData = ghostData?.filter((row) => row.id !== id);
    if (newGhostData?.length === 0) {
      setLoadedGhosts(false);
    }
  };

  const rejectGhost = (id: I) => {
    if (rejectGhosts) {
      rejectGhosts?.([id]);
    }
    const newGhostData = ghostData?.filter((row) => row.id !== id);
    if (newGhostData?.length === 0) {
      setLoadedGhosts(false);
    }
  };

  return (
    <div className={cn("w-full overflow-x-hidden", className)}>
      <div
        className="flex h-full flex-col overflow-x-auto"
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
          columnWidths={columnWidths}
          setResizing={setResizing}
          resizing={resizing}
          tableKey={tableKey}
          scrollContainerRef={scrollContainerRef}
          ghostRowContainerRef={ghostDivRef}
          showGhostActions={ghostData !== undefined && ghostData.length > 0}
          acceptAllGhosts={acceptAllGhosts}
          rejectAllGhosts={rejectAllGhosts}
        />
        <div
          className="relative min-w-fit shrink-0 overflow-hidden opacity-0 transition-[height,opacity] duration-500"
          ref={ghostDivRef}
        >
          {!loadedGhosts && (ghostRows ?? 0) > 0 && (
            <LoadingGhostTableRows
              columnWidths={columnWidths}
              columns={columns}
              finishedLoading={ghostData !== undefined && ghostData.length > 0}
              ghostRows={ghostRows ?? 0}
              deletable={deletable}
              extraOptions={extraOptions}
              multiselect={multiselect}
              timeEstimate={ghostLoadingEstimation}
              rowClassName={rowClassName}
            />
          )}
          {ghostData?.map((value) => (
            <GhostTableRow
              key={value.id}
              value={value}
              columns={columns}
              multiselect={multiselect}
              extraOptions={extraOptions}
              deletable={deletable}
              columnWidths={columnWidths}
              onAccept={() => acceptGhost(value.id)}
              onReject={() => rejectGhost(value.id)}
              className={cn(
                rowClassName,
                "last:border-b-2 last:border-app-secondary",
              )}
            />
          ))}
        </div>
        {filteredData.map((value) => (
          <TableRow
            key={value.id}
            value={value}
            columns={columns}
            multiselect={multiselect}
            selection={selection}
            setSelection={setSelection}
            toggleSelect={toggleSelect}
            extraOptions={extraOptions}
            deletable={deletable}
            onDelete={onDelete}
            scrollContainerRef={scrollContainerRef}
            columnWidths={columnWidths}
            className={rowClassName}
          />
        ))}
        {filteredData.length === 0 && !showGhostRows && emptyMessage && (
          <div className="flex w-full items-center justify-center border-b border-app-border p-3 text-gray-500">
            <span className="text-base">{emptyMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// This is a workaround to prevent server-side rendering issues (because we access localstorage in the component)
const Table = dynamic(() => Promise.resolve(TableInternal), {
  ssr: false,
}) as typeof TableInternal;

export default Table;
