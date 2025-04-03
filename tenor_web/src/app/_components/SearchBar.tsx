"use client";

import React, { type ChangeEventHandler } from "react";
import SearchIcon from "@mui/icons-material/Search";

interface Props {
  searchValue: string;
  placeholder: string;
  handleUpdateSearch: ChangeEventHandler<HTMLInputElement>;
}

export default function SearchBar({
  searchValue,
  placeholder,
  handleUpdateSearch,
}: Props) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        className="h-10 w-full rounded-md border border-app-border px-2 pr-1 pl-8 outline-none"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleUpdateSearch}
      />
      <SearchIcon
        className="absolute left-2 top-1/4"
        fontSize="small"
        style={{fill: "#9BA3AF"}}
      ></SearchIcon>
    </div>
  );
}
