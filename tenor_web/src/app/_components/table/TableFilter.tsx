import React, { useState, useEffect, type ChangeEventHandler } from "react";
import { DropdownButton, DropdownItem } from "../Dropdown";
import CrossIcon from "@mui/icons-material/Close";

import { type VisibleColumn } from "./Table";

interface TableFilterProps<T> {
  column: VisibleColumn<T>;
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
    if (
      searchValue !== "" &&
      !String(row[columnKey]).toLowerCase().includes(searchValue.toLowerCase())
    ) {
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
              <div className="flex max-h-40 flex-col overflow-y-scroll rounded-b-lg border border-t-0 border-app-border">
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

export default TableFilter;
