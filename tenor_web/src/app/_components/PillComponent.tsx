import React, {
  useState,
  type ButtonHTMLAttributes,
  type ChangeEventHandler,
} from "react";
import type { Tag } from "~/lib/types/firebaseSchemas";
import Dropdown, { DropdownButton, DropdownItem } from "./Dropdown";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Check from "@mui/icons-material/Check";
import { cn } from "~/lib/utils";

interface Props {
  currentTag: Tag;
  allTags: Tag[];
  callBack: (tag: Tag) => void;
  labelClassName?: string;
}

export default function PillComponent({
  currentTag,
  allTags,
  callBack,
  labelClassName,
}: Props & ButtonHTMLAttributes<HTMLButtonElement>) {
  const [searchValue, setSearchValue] = useState("");

  const filteredTags = allTags.filter((tag) => {
    if (
      (searchValue !== "" &&
        !tag.name.toLowerCase().includes(searchValue.toLowerCase())) ||
      tag.deleted
    ) {
      return false;
    }
    return true;
  });

  const handleUpdateSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchValue(e.target.value);
    console.log(e.target.value);
  };

  const areEqual = (t1: Tag, t2: Tag) => {
    return t1.name == t2.name && t1.color == t2.color;
  };

  const createOptionPill = (tag: Tag) => {
    return (
      <DropdownButton
        onClick={() => callBack(tag)}
        className="flex items-center gap-2 border-b border-app-border px-2 py-1 last:border-none"
        key={tag.name}
      >
        <Check
          fontSize="inherit"
          className={cn({ "opacity-0": !areEqual(tag, currentTag) })}
        ></Check>
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{
            borderColor: `${tag.color}90`,
            borderWidth: "1.4px",
            backgroundColor: `${tag.color}3E`,
            color: tag.color,
          }}
        ></span>
        <span>{tag.name}</span>
      </DropdownButton>
    );
  };

  const createPillLabel = (tag: Tag) => {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-3xl border-solid py-1 pl-3 pr-2 font-medium",
          labelClassName,
        )}
        style={{
          borderColor: `${tag.color}40`,
          borderWidth: "1.4px",
          backgroundColor: `${tag.color}1E`,
          color: tag.color,
        }}
      >
        <span className="truncate">{tag.name}</span>
        <ArrowDropDownIcon />
      </div>
    );
  };

  return (
    <Dropdown label={createPillLabel(currentTag)}>
      <DropdownItem className="flex w-52 flex-col">
        <span className="mb-2 text-sm text-gray-500">Select an item</span>
        <input
          type="text"
          className="mb-1 w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
          placeholder="Search..."
          value={searchValue}
          onChange={handleUpdateSearch}
        />
      </DropdownItem>
      <div className="w-full whitespace-nowrap px-3 py-2 text-left">
        <div className="flex max-h-40 flex-col overflow-y-scroll rounded-b-lg">
          {filteredTags.map((tag) => createOptionPill(tag))}
          {filteredTags.length == 0 && (
            <span className="w-full px-2 py-1 text-sm text-gray-500">
              No items found
            </span>
          )}
        </div>
      </div>
    </Dropdown>
  );
}
