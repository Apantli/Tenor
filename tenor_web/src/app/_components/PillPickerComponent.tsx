"use client";

import React, { useState } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Check from "@mui/icons-material/Check";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import Dropdown, { DropdownButton, DropdownItem } from "./Dropdown";

interface Item {
  id: string;
  label: string;
  prefix?: string;
}

interface Props {
  selectedItem: Item;
  allItems: Item[];
  onChange: (item: Item) => void;
  className?: ClassNameValue;
}

export default function PillPickerComponent({
  selectedItem,
  allItems,
  onChange,
  className,
}: Props) {
  const [searchValue, setSearchValue] = useState("");

  const filteredItems = allItems.filter((item) => {
    const fullItemName = `${item.prefix}: ${item.label}`;
    if (
      searchValue !== "" &&
      !fullItemName.toLowerCase().includes(searchValue.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <Dropdown
      label={
        <div
          className={cn(
            "flex w-full items-center justify-between truncate rounded-3xl border border-app-border bg-white py-1 pl-3 pr-2 transition-all",
            className,
          )}
        >
          <span className="truncate">
            {selectedItem.prefix !== undefined && (
              <span className="font-medium">{selectedItem.prefix}: </span>
            )}
            {selectedItem.label}
          </span>
          <span className="text-app-primary">
            <ArrowDropDownIcon />
          </span>
        </div>
      }
    >
      <DropdownItem className="flex w-52 flex-col">
        <span className="mb-2 text-sm text-gray-500">Select an item</span>
        <input
          type="text"
          className="mb-1 w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
          placeholder="Search..."
          value={searchValue}
          onChange={handleSearchChange}
        />
      </DropdownItem>
      <div className="whitespate-nowrap w-52 text-left">
        <div className="flex max-h-40 w-full flex-col overflow-y-scroll rounded-b-lg">
          {filteredItems.map((item) => (
            <DropdownButton
              onClick={() => onChange(item)}
              className="flex w-full items-center gap-2 border-b border-app-border px-2 py-2 last:border-none"
              key={item.id}
            >
              <Check
                fontSize="inherit"
                className={cn({ "opacity-0": item.id !== selectedItem.id })}
              ></Check>
              <div className="flex flex-col justify-start gap-0">
                <span className="w-full truncate text-xs font-semibold">
                  {item.prefix}:
                </span>
                <span className="w-full truncate">{item.label}</span>
              </div>
            </DropdownButton>
          ))}
        </div>
      </div>
    </Dropdown>
  );
}
