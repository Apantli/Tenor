"use client";

import React, { useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { cn } from "~/lib/utils";
import { type ClassNameValue } from "tailwind-merge";
import useClickOutside from "~/app/_hooks/useClickOutside";

interface Props {
  className?: ClassNameValue;
  searchText: string;
  setSearchText: (text: string) => void;
}

export default function CollapsableSearchBar({
  searchText,
  setSearchText,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside([ref.current], () => {
    if (searchText === "") setExpanded(false);
  });

  return (
    <div
      className="relative flex w-full"
      ref={ref}
      data-cy="collapsable-search-bar"
    >
      <input
        ref={inputRef}
        type="text"
        className={cn(
          "pointer-events-none w-full origin-right scale-x-0 rounded-lg border border-app-border p-2 pl-8 pr-7 text-app-text opacity-0 transition",
          {
            "pointer-events-auto scale-x-100 opacity-100": expanded,
          },
        )}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search..."
        data-cy="collapsable-search-bar"
      />
      <button
        onClick={() => {
          setExpanded(true);
          inputRef.current?.focus();
        }}
        className={cn(
          "absolute left-full top-1/2 -translate-x-6 -translate-y-1/2 transition-all",
          {
            "left-2 translate-x-0": expanded,
          },
        )}
        data-cy="collapsable-search-bar-icon"
      >
        <SearchIcon className="text-gray-600" />
      </button>
      <button
        className={cn(
          "pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 p-3 text-2xl font-thin opacity-0 transition-opacity",
          {
            "pointer-events-auto opacity-100": expanded,
          },
        )}
        onClick={() => {
          setSearchText("");
          setExpanded(false);
        }}
        data-cy="collapsable-search-bar-close"
      >
        &times;
      </button>
    </div>
  );
}
