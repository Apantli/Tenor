import React, {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEventHandler,
} from "react";
import type { Tag } from "~/lib/types/firebaseSchemas";
import Dropdown, { DropdownButton, DropdownItem } from "../../Dropdown";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Check from "@mui/icons-material/Check";
import { cn } from "~/lib/helpers/utils";
import { generateRandomTagColor } from "~/lib/helpers/colorUtils";
import { noneSelectedTag } from "~/lib/defaultValues/tags";

interface Props {
  currentTag?: Tag;
  allTags: Tag[];
  callBack: (tag: Tag) => void;
  labelClassName: string;
  hideSearch?: boolean;
  addTag?: (tag: Tag) => Promise<Tag>;
  disabled?: boolean;
  nullable?: boolean;
}

export default function PillComponent({
  currentTag,
  allTags,
  callBack,
  labelClassName,
  hideSearch,
  className,
  addTag,
  disabled,
  nullable = false,
}: Props & ButtonHTMLAttributes<HTMLButtonElement>) {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
  };

  const areEqual = (t1: Tag, t2: Tag) => {
    return t1.name == t2.name && t1.color == t2.color;
  };

  const createOptionPill = (tag: Tag) => {
    return (
      <DropdownButton
        onClick={() => callBack(tag)}
        className="flex items-center gap-2 border-b border-app-border px-2 py-2 last:border-none"
        key={tag.name}
      >
        <Check
          fontSize="inherit"
          className={cn({
            "opacity-0": !areEqual(tag, currentTag ?? noneSelectedTag),
          })}
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
        <span className="truncate">{tag.name}</span>
      </DropdownButton>
    );
  };

  const createPillLabel = (tag: Tag) => {
    return (
      <div
        className={cn(
          "flex items-center justify-between truncate rounded-3xl border-solid py-1 pl-3 pr-2 font-medium transition-all",
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
        <span className={cn("basis-[5px]", disabled ? "opacity-0" : "")}>
          <ArrowDropDownIcon />
        </span>
      </div>
    );
  };

  return (
    <Dropdown
      label={createPillLabel(currentTag ?? noneSelectedTag)}
      className={className}
      onOpen={() => inputRef.current?.focus()}
      disabled={disabled}
    >
      {!hideSearch && (
        <DropdownItem className="flex w-52 flex-col">
          <span className="mb-2 text-sm text-gray-500">Select an item</span>
          <input
            ref={inputRef}
            type="text"
            className="mb-1 w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
            placeholder={
              addTag === undefined ? "Search..." : "Search or create..."
            }
            value={searchValue}
            onChange={handleUpdateSearch}
          />
        </DropdownItem>
      )}
      <div className="w-52 whitespace-nowrap text-left">
        <div className="flex max-h-48 flex-col overflow-y-auto rounded-b-lg">
          {nullable && createOptionPill(noneSelectedTag)}
          {filteredTags.map((tag) => createOptionPill(tag))}
          {addTag === undefined && filteredTags.length == 0 && (
            <span className="w-full px-2 py-1 text-sm text-gray-500">
              No items found
            </span>
          )}
        </div>
      </div>
      {addTag && filteredTags?.length === 0 && searchValue !== "" && (
        <DropdownButton
          onClick={async () => {
            const randomHexColor = generateRandomTagColor();

            const newTag = await addTag({
              name: searchValue,
              color: randomHexColor,
              deleted: false,
            });

            callBack(newTag);
            setSearchValue("");
          }}
          className="max-w-52 truncate"
        >
          Create Type &quot;{searchValue}&quot;
        </DropdownButton>
      )}
    </Dropdown>
  );
}
