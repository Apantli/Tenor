import React, { useState, useMemo } from "react";
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";
import { cn } from "~/lib/utils";
import { type ClassNameValue } from "tailwind-merge";
import DeleteIcon from "@mui/icons-material/DeleteOutline";

interface Column<T> {
  label: string;
  width: number;
  sortable?: boolean;
  filterable?: boolean;
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

// eslint-disable-next-line
export default function Table<
  I extends string | number,
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

  const filteredData = useMemo(() => {
    return sortedData.filter((row) => {
      for (const key in filters) {
        if (
          filters[key] &&
          !String(row[key]).toLowerCase().includes(filters[key].toLowerCase())
        ) {
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
    if (selection.size < data.length) {
      setSelection(new Set(data.map((value) => value.id)));
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

  return (
    <div
      className={cn(
        "flex h-full min-h-96 flex-col overflow-x-scroll",
        className,
      )}
      style={{
        paddingBottom: showThreeDots ? `${optionCount * 35 + 20}px` : 0,
      }}
    >
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
            checked={selection.size == data.length}
            onChange={toggleSelectAll}
          ></input>
        )}
        {/* Columns */}
        {columnEntries.map(([key, column]) => (
          <div key={key} className="text-gray-500">
            {column.label}
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
          className="grid w-fit min-w-full gap-2 border-b border-app-border p-2"
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
                className="flex h-full items-center justify-end text-sm font-semibold transition hover:text-app-primary"
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
