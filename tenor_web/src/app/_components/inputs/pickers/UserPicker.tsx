"use client";

import React, { useRef, useState } from "react";
import { cn } from "~/lib/helpers/utils";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";
import Dropdown, { DropdownItem, DropdownButton } from "../../Dropdown";
import ProfilePicture from "../../ProfilePicture";
import type { UserPreview } from "~/lib/types/detailSchemas";
import type { WithId } from "~/lib/types/firebaseSchemas";
import Check from "@mui/icons-material/Check";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";

interface EditableBoxProps {
  selectedOption?: WithId<UserPreview> | undefined;
  onChange: (option: WithId<UserPreview> | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  close?: boolean;
  allowSetSelf?: boolean;
  removeDelete?: boolean;
}

export function UserPicker({
  selectedOption = undefined,
  onChange,
  className,
  placeholder = "Select an option",
  disabled = false,
  close = true,
  allowSetSelf,
  removeDelete = false,
}: EditableBoxProps) {
  const { projectId } = useParams();
  const { data: userCols } = api.users.getTeamMembers.useQuery({
    projectId: projectId as string,
  });
  const options = (userCols ?? []) as WithId<UserPreview>[];

  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useFirebaseAuth();

  let filteredOptions = options
    ?.filter((option) =>
      option.displayName?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .map((val) => ({
      ...val,
      isYou: false,
    }));

  if (allowSetSelf && user) {
    const selfOption = filteredOptions?.find(
      (option) => option.id === user.uid,
    );
    if (selfOption) {
      filteredOptions = [
        {
          ...selfOption,
          isYou: true,
        },
        ...(filteredOptions ?? []).filter((option) => option.id !== user.uid),
      ];
    }
  }

  const handleSelect = (option: WithId<UserPreview>) => {
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
          className,
        )}
      >
        {selectedOption ? (
          <>
            <div className="flex flex-grow items-center gap-2 overflow-hidden py-1">
              <ProfilePicture user={selectedOption} hideTooltip />

              <span className="flex-1 truncate text-left font-medium text-gray-700">
                {selectedOption.displayName}
              </span>
            </div>
            <div
              onClick={handleClear}
              className="ml-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              {!disabled && !removeDelete && <CloseIcon className="h-5 w-5" />}
            </div>
          </>
        ) : (
          <>
            <span className="pl-1 text-app-text">
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

  const createOption = (option: WithId<UserPreview> & { isYou: boolean }) => {
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
        <ProfilePicture user={option} hideTooltip />
        <span className="w-full truncate">
          {option.isYou ? "You" : option.displayName}
        </span>
      </DropdownButton>
    );
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Perhaps apply cn in renderDropdownLabel instead of here to make it cleaner
  return (
    <div className={cn("w-full", className)}>
      <Dropdown
        close={close}
        disabled={disabled}
        label={renderDropdownLabel()}
        onOpen={() => {
          inputRef.current?.focus();
          scrollRef.current?.scrollTo({
            top: 0,
            behavior: "instant",
          });
        }}
        menuClassName="w-56"
      >
        <DropdownItem className="flex w-full flex-col">
          <span className="mb-2 text-sm text-gray-500">
            {disabled ? "None" : "Select a person"}
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
          <div
            className="flex max-h-40 flex-col overflow-y-auto rounded-b-lg"
            ref={scrollRef}
          >
            {(filteredOptions?.length ?? 0 > 0) ? (
              filteredOptions?.map((option) => createOption(option))
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
