import React, { useState } from "react";
import type { Tag } from "~/lib/types/firebaseSchemas";
import Dropdown from "./Dropdown";
import { cn } from "~/lib/utils";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

interface Props<T extends string> {
  currentTag: Tag;
  callback: (option: T) => void;
  options: Tag[];
  pillClassName?: string;
}

export default function PillComponent<T extends string>({
  currentTag,
  callback,
  options,
  pillClassName,
}: Props<T>) {
  const drowpdownOptions = {} as Record<string, React.ReactNode>;

  const createPill = (tag: Tag) => {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-3xl border-solid py-1 pl-3 pr-2 font-medium",
          pillClassName,
        )}
        style={{
          borderColor: `${tag.color}40`,
          borderWidth: "1.4px",
          backgroundColor: `${tag.color}1E`,
          color: tag.color,
        }}
      >
        {tag.name}
        <PlayArrowIcon fontSize="small" className="rotate-90" />
      </div>
    );
  };

  options.forEach((option) => {
    drowpdownOptions[option.name] = createPill(option);
  });

  return (
    <div className="flex w-40 items-center gap-4">
      <Dropdown options={drowpdownOptions} callback={callback} menuClassName="">
        {createPill(currentTag)}
      </Dropdown>
    </div>
  );
}

export function SamplePillComponent() {
  const tags = [
    {
      name: "Green",
      color: "#009719",
      deleted: false,
    },
    {
      name: "Pink",
      color: "#CD4EC0",
      deleted: false,
    },
    {
      name: "Blue",
      color: "#0737E3",
      deleted: false,
    },
  ];

  const [tag, setTag] = useState(tags[0] as Tag);

  const nameToTag = (name: string) => {
    const tag = tags.find((tag) => tag.name === name);
    if (!tag) {
      throw new Error(`Tag ${name} not found`);
    }
    return tag;
  };

  const dropdownCallback = async (option: string) => {
    try {
      setTag(nameToTag(option));
    } catch (error) {
      console.error("Error in pill dropdown callback", error);
    }
  };

  return (
    <PillComponent
      currentTag={tag}
      options={tags}
      pillClassName="w-40"
      callback={dropdownCallback}
    />
  );
}
