"use client";

import React, { useRef, useState } from "react";
import { cn } from "~/lib/utils";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";
import Dropdown, { DropdownItem, DropdownButton } from "../Dropdown";
import type { Sprint, WithId } from "~/lib/types/firebaseSchemas";
import Check from "@mui/icons-material/Check";
import { useFormatSprintNumber } from "~/app/_hooks/scrumIdHooks";

interface EditableBoxProps {
  options: WithId<Sprint>[];
  selectedOption?: WithId<Sprint> | undefined;
  onChange: (option: WithId<Sprint> | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  close?: boolean;
}

export function SprintPicker({
  options,
  selectedOption = undefined,
  onChange,
  className,
  placeholder = "Select an option",
  disabled = false,
  close = true,
}: EditableBoxProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const formatSprintNumber = useFormatSprintNumber();

  const filteredOptions = options.filter((option) =>
    option.number.toString()?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (option: WithId<Sprint>) => {
    onChange(option);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearchTerm("");
  };

  const renderDropdownLabel = () => {
    return (
      <div
        className={cn(
          "relative flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 p-2 transition-colors",
          !disabled && "cursor-pointer hover:bg-gray-200",
        )}
      >
        {selectedOption ? (
          <>
            <div className="flex flex-grow items-center gap-2">
              <span className="font-medium text-gray-700">
                {formatSprintNumber(selectedOption.number)}
              </span>
            </div>
            <div
              onClick={handleClear}
              className="ml-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              {!disabled && <CloseIcon className="h-5 w-5" />}
            </div>
          </>
        ) : (
          <>
            <span className="font-medium text-gray-700">
              {disabled ? "None" : placeholder}
            </span>
            {!disabled && (
              <ArrowDropDownIcon className="h-5 w-5 text-gray-700" />
            )}
          </>
        )}
      </div>
    );
  };

  const createOption = (option: WithId<Sprint>) => {
    return (
      <DropdownButton
        onClick={() => handleSelect(option)}
        className="relative flex items-center gap-2 border-b border-app-border px-2 py-2 pl-8 last:border-none"
        key={option.id}
      >
        {option.id === selectedOption?.id && (
          <div className="absolute left-2 text-lg">
            <Check fontSize="inherit" />
          </div>
        )}
        <span className="font-medium text-gray-700">
          {formatSprintNumber(option.number)}
        </span>
      </DropdownButton>
    );
  };

  const inputRef = useRef<HTMLInputElement>(null);

  // Perhaps apply cn in renderDropdownLabel instead of here to make it cleaner
  return (
    <div className={cn("w-full", className)}>
      <Dropdown
        close={close}
        disabled={disabled}
        label={renderDropdownLabel()}
        onOpen={() => inputRef.current?.focus()}
        menuClassName="w-56"
      >
        <DropdownItem className="flex w-full flex-col">
          <span className="mb-2 text-sm text-gray-500">
            {disabled ? "None" : "Select a sprint"}
          </span>
          <input
            type="text"
            className="mb-1 w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            ref={inputRef}
          />
        </DropdownItem>
        <div className="w-full whitespace-nowrap text-left">
          <div className="flex max-h-40 flex-col overflow-y-auto rounded-b-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => createOption(option))
            ) : (
              <span className="w-full px-2 py-1 text-sm text-gray-500">
                No options found
              </span>
            )}
          </div>
        </div>
      </Dropdown>
    </div>
  );
}
