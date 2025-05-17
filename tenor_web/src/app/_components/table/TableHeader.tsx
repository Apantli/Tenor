import React, { useEffect, useRef, useState } from "react";
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
import InputCheckbox from "../inputs/InputCheckbox";
import { cn } from "~/lib/utils";
import useShiftKey from "~/app/_hooks/useShiftKey";

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
  onDelete?: (ids: I[], callback: (del: boolean) => void) => void;
  columnWidths: number[];
  setResizing: React.Dispatch<React.SetStateAction<boolean>>;
  resizing: boolean;
  tableKey: string;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  ghostRowContainerRef: React.RefObject<HTMLDivElement>;
  showGhostActions?: boolean;
  acceptAllGhosts?: () => void;
  rejectAllGhosts?: () => void;
  disableSelection?: boolean;
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
  columnWidths,
  setResizing,
  resizing,
  tableKey,
  scrollContainerRef,
  ghostRowContainerRef,
  showGhostActions,
  acceptAllGhosts,
  rejectAllGhosts,
  disableSelection,
}: TableHeaderProps<I, T>) {
  const showThreeDots = extraOptions !== undefined || deletable !== undefined;
  const columnEntries = React.useMemo(
    () => filterVisibleColumns(Object.entries(columns)),
    [columns],
  );

  const [temporaryColumnWidths, setTemporaryColumnWidths] =
    useState<number[]>(columnWidths);
  const columnWidthsRef = useRef<number[]>(columnWidths);
  const headerRef = useRef<HTMLDivElement>(null);

  const addedSpace = showGhostActions ? "120px" : "50px";
  const gridTemplateColumns =
    (multiselect ? "20px " : "") +
    columnWidths.map((width) => `${width}px`).join(" ") +
    (showThreeDots ? ` 1fr ${addedSpace}` : "");

  const startXRef = useRef<number>();
  const startWidthRef = useRef<number>();
  const resizingIndexRef = useRef<number>();

  const onResizeMouseDown = (index: number, e: MouseEvent) => {
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    startXRef.current = e.clientX;
    startWidthRef.current = temporaryColumnWidths[index]!;
    resizingIndexRef.current = index;

    scrollContainerRef.current?.childNodes.forEach((child) => {
      const element = child as HTMLElement;
      element.style.transition = "";
    });
    ghostRowContainerRef.current?.childNodes.forEach((child) => {
      const element = child as HTMLElement;
      element.style.transition = "";
    });
  };

  function onResizeMouseMove(e: MouseEvent) {
    if (
      startXRef.current === undefined ||
      resizingIndexRef.current === undefined ||
      startWidthRef.current === undefined ||
      headerRef.current === null
    )
      return;
    setResizing(true);

    document.body.style.cursor = "col-resize";
    const delta = e.clientX - startXRef.current;
    const index = resizingIndexRef.current;

    const newColumnWidths = [...columnWidthsRef.current];
    let newWidth = startWidthRef.current + delta;
    if (newWidth < (columnEntries[index]![1].minWidth ?? 70)) {
      newWidth = columnEntries[index]![1].minWidth ?? 70;
    }
    newColumnWidths[index] = newWidth;
    setTemporaryColumnWidths(newColumnWidths);
    columnWidthsRef.current = newColumnWidths;

    const newTemplateColumns =
      (multiselect ? "20px " : "") +
      newColumnWidths.map((width) => `${width}px`).join(" ") +
      (showThreeDots ? ` 1fr ${addedSpace}` : "");
    console.log(addedSpace);

    scrollContainerRef.current?.childNodes.forEach((child) => {
      (child as HTMLElement).style.gridTemplateColumns = newTemplateColumns;
    });
    ghostRowContainerRef.current?.childNodes.forEach((child) => {
      (child as HTMLElement).style.gridTemplateColumns = newTemplateColumns;
    });
  }

  const onResizeMouseUp = () => {
    if (
      startXRef.current === undefined ||
      resizingIndexRef.current === undefined
    )
      return;

    const index = resizingIndexRef.current;

    updateStoredWidth(
      columnEntries[index]![0],
      columnWidthsRef.current[index]!,
    );
    setResizing(false);
    startWidthRef.current = undefined;
    startXRef.current = undefined;
    resizingIndexRef.current = undefined;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";
  };

  useEffect(() => {
    window.addEventListener("mouseup", onResizeMouseUp);
    window.addEventListener("mousemove", onResizeMouseMove);
    return () => {
      window.removeEventListener("mouseup", onResizeMouseUp);
      window.removeEventListener("mousemove", onResizeMouseMove);
    };
  }, [showGhostActions]);

  const shiftClick = useShiftKey();

  const updateStoredWidth = (key: string, value: number) => {
    if (value === -1) {
      localStorage.removeItem(tableKey + ":" + key);
      return;
    }
    localStorage.setItem(tableKey + ":" + key, value.toString());
  };

  const setFullWidth = (index: number) => {
    if (headerRef.current === null) return;
    const newColumnWidths = [...temporaryColumnWidths];
    if (shiftClick) {
      columnEntries.forEach(([key, column], i) => {
        newColumnWidths[i] = column.width;
        updateStoredWidth(key, -1);
      });
    } else {
      newColumnWidths[index] = columnEntries[index]![1].width;
      updateStoredWidth(columnEntries[index]![0], -1);
    }

    setTemporaryColumnWidths(newColumnWidths);
    columnWidthsRef.current = newColumnWidths;

    const newTemplateColumns =
      (multiselect ? "20px " : "") +
      newColumnWidths.map((width) => `${width}px`).join(" ") +
      (showThreeDots ? ` 1fr ${addedSpace}` : "");

    scrollContainerRef.current?.childNodes.forEach((child) => {
      const element = child as HTMLElement;
      element.style.gridTemplateColumns = newTemplateColumns;
      element.style.transition = "grid-template-columns 0.2s ease-in-out";
    });
    ghostRowContainerRef.current?.childNodes.forEach((child) => {
      const element = child as HTMLElement;
      element.style.gridTemplateColumns = newTemplateColumns;
      element.style.transition = "grid-template-columns 0.2s ease-in-out";
    });
  };

  const getTooltipMessage = (key: string) => {
    const messages: string[] = [];
    if (sortColumnKey === key) {
      messages.push("Sorting");
    }
    if (filters[key] !== undefined) {
      messages.push("Filtering");
    }
    return messages.join("<br>");
  };

  return (
    <div
      className="group sticky top-0 z-[60] grid h-8 min-w-fit shrink-0 items-center gap-3 border-b border-app-border bg-white pl-2"
      style={{ gridTemplateColumns }}
      ref={headerRef}
    >
      {multiselect && (
        <InputCheckbox
          checked={
            selection.size == filteredData.length && filteredData.length > 0
          }
          onChange={toggleSelectAll}
          disabled={disableSelection}
        />
      )}
      {columnEntries.map(([key, column], index) => (
        <div
          key={key}
          className="flex items-center justify-between overflow-hidden text-gray-500"
        >
          <span
            className={cn("truncate text-sm", {
              "text-app-light":
                temporaryColumnWidths[index]! <= 120 &&
                (sortColumnKey === key || filters[key] !== undefined),
            })}
            data-tooltip-id="tooltip"
            data-tooltip-html={getTooltipMessage(key)}
            data-tooltip-hidden={
              !(
                temporaryColumnWidths[index]! <= 120 &&
                (sortColumnKey === key || filters[key] !== undefined)
              )
            }
          >
            {column.label}
          </span>
          <div className="flex items-center">
            {(!!column.sortable || column.filterable) && (
              <div className="flex items-center justify-end gap-2 pl-2">
                {sortColumnKey === key &&
                  sortDirection === "asc" &&
                  temporaryColumnWidths[index]! > 120 && (
                    <button onClick={stopSorting} className="text-app-light">
                      <UpArrowIcon />
                    </button>
                  )}
                {sortColumnKey === key &&
                  sortDirection === "desc" &&
                  temporaryColumnWidths[index]! > 120 && (
                    <button onClick={stopSorting} className="text-app-light">
                      <DownArrowIcon />
                    </button>
                  )}
                {filters[key] !== undefined &&
                  temporaryColumnWidths[index]! > 120 && (
                    <button
                      onClick={() => clearFilter(key)}
                      className="text-app-light"
                    >
                      <CrossFilterIcon />
                    </button>
                  )}
                <Dropdown
                  label={
                    <span className="text-nowrap pr-3 font-bold text-app-light">
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
            <div
              className="flex h-[25px] cursor-col-resize items-center justify-center pl-1"
              onMouseDown={(e) => onResizeMouseDown(index, e.nativeEvent)}
              onDoubleClick={() => setFullWidth(index)}
            >
              <div
                className={cn(
                  "h-full w-[1px] bg-app-border opacity-0 transition group-hover:opacity-100",
                  {
                    "opacity-100": resizing,
                  },
                )}
              ></div>
            </div>
          </div>
        </div>
      ))}
      {showThreeDots && (
        <>
          <div></div>
          <div className="sticky right-0 flex h-full w-full items-center bg-red-500 pr-3">
            <TableActions
              selection={selection}
              setSelection={setSelection}
              extraOptions={extraOptions}
              deletable={deletable}
              onDelete={onDelete}
              showGhostActions={showGhostActions}
              onAcceptAllGhosts={acceptAllGhosts}
              onRejectAllGhosts={rejectAllGhosts}
            />
            <div className="absolute left-0 top-0 -z-10 h-full w-full bg-white"></div>
            <div className="absolute left-[-20px] top-0 -z-10 h-full w-[20px] bg-gradient-to-r from-transparent to-white"></div>
          </div>
        </>
      )}
    </div>
  );
}

export default TableHeader;
