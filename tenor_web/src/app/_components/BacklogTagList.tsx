import React, { useRef, useState } from "react";
import type { Tag } from "~/lib/types/firebaseSchemas";
import TagComponent from "./TagComponent";
import Dropdown, { DropdownButton, DropdownItem } from "./Dropdown";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import Check from "@mui/icons-material/Check";
import { cn } from "~/lib/utils";

interface Props {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
}

function generateRandomColor(): string {
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);

  const toHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const redHex = toHex(red);
  const greenHex = toHex(green);
  const blueHex = toHex(blue);

  return `#${redHex}${greenHex}${blueHex}`;
}

export default function BacklogTagList({ tags, onChange }: Props) {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { projectId } = useParams();

  const { data: allTags, refetch } = api.settings.getBacklogTags.useQuery({
    projectId: projectId as string,
  });
  const { mutateAsync: createTag } =
    api.settings.createBacklogTag.useMutation();

  const filteredTags = allTags?.filter((tag) => {
    if (
      (searchValue !== "" &&
        !tag.name.toLowerCase().includes(searchValue.toLowerCase())) ||
      tag.deleted
    ) {
      return false;
    }
    return true;
  });

  const areEqual = (t1: Tag, t2: Tag) => {
    return t1.name == t2.name && t1.color == t2.color;
  };

  const isSelected = (tag: Tag) => {
    if (tags.length === 0) return false;

    for (const selectedTag of tags) {
      if (areEqual(selectedTag, tag)) {
        return true;
      }
    }
    return false;
  };

  const handleCreateTag = async () => {
    if (searchValue === "") return;
    const newTagValue = {
      name: searchValue,
      color: generateRandomColor(),
      deleted: false,
    };
    const addedTag = await createTag({
      projectId: projectId as string,
      tag: newTagValue,
    });
    await refetch();
    setSearchValue("");
    onChange([...tags, addedTag]);
  };

  const handleTagClick = async (tag: Tag) => {
    if (isSelected(tag)) {
      onChange(tags.filter((t) => !areEqual(t, tag)));
    } else {
      onChange([...tags, tag]);
    }
  };

  return (
    <div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-lg font-semibold">Tags</div>
        <Dropdown
          label={<span className="text-2xl">+</span>}
          onOpen={() => inputRef.current?.focus()}
        >
          <DropdownItem className="flex w-52 flex-col">
            <span className="mb-2 text-sm text-gray-500">Add a tag</span>
            <input
              ref={inputRef}
              type="text"
              className="mb-1 w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
              placeholder="Search or create new..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </DropdownItem>
          <div className="w-full whitespace-nowrap text-left">
            <div className="flex max-h-40 flex-col overflow-y-scroll rounded-b-lg">
              {filteredTags?.map((tag) => (
                <DropdownButton
                  onClick={() => handleTagClick(tag)}
                  className="flex max-w-52 items-center gap-2 border-b border-app-border px-2 py-2 last:border-none"
                  key={tag.name}
                >
                  <Check
                    fontSize="inherit"
                    className={cn({
                      "opacity-0": !isSelected(tag),
                    })}
                  ></Check>
                  <span
                    className="inline-block h-3 min-w-3 rounded-full"
                    style={{
                      borderColor: `${tag.color}90`,
                      borderWidth: "1.4px",
                      backgroundColor: `${tag.color}3E`,
                      color: tag.color,
                    }}
                  ></span>
                  <span className="truncate">{tag.name}</span>
                </DropdownButton>
              ))}
              {allTags?.length === 0 && searchValue === "" && (
                <div className="p-2 text-center text-sm text-gray-600">
                  No tags exist
                </div>
              )}
              {filteredTags?.length === 0 && searchValue !== "" && (
                <DropdownButton
                  onClick={handleCreateTag}
                  className="max-w-52 truncate"
                >
                  Create tag &quot;{searchValue}&quot;
                </DropdownButton>
              )}
            </div>
          </div>
        </Dropdown>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-scroll">
        {tags.map((tag) => (
          <TagComponent
            color={tag.color}
            onDelete={() => handleTagClick(tag)}
            expanded
            key={tag.name}
          >
            {tag.name}
          </TagComponent>
        ))}
      </div>
    </div>
  );
}
