"use client";

import { useParams } from "next/navigation";
import React, { useRef, useState } from "react";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";
import Dropdown, {
  DropdownButton,
  DropdownItem,
} from "~/app/_components/Dropdown";
import TagComponent from "~/app/_components/TagComponent";
import type { UserStoryPreview } from "~/lib/types/detailSchemas";
import { api } from "~/trpc/react";
import Check from "@mui/icons-material/Check";
import { cn } from "~/lib/utils";
import { useFormatUserStoryScrumId } from "~/app/_hooks/scrumIdHooks";

interface Props {
  userStories: UserStoryPreview[];
  onChange: (userStories: UserStoryPreview[]) => void;
  userStoryId?: string;
  label: string;
  onClick?: (userStoryId: string) => void;
  disabled?: boolean;
}

export default function DependencyList({
  userStories,
  onChange,
  label,
  userStoryId,
  onClick,
  disabled = false,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { projectId } = useParams();

  const { data: allUserStories } = api.userStories.getUserStories.useQuery({
    projectId: projectId as string,
  });
  const allUserStoriesExceptCurrent = allUserStories?.filter(
    (userStory) => userStory.id !== userStoryId,
  );

  const formatUserStoryScrumId = useFormatUserStoryScrumId();

  const filteredUserStories = allUserStoriesExceptCurrent?.filter(
    (userStory) => {
      const scrumId = formatUserStoryScrumId(userStory.scrumId);
      const fullUserStoryName = `${scrumId}: ${userStory.name}`;
      if (
        searchValue !== "" &&
        !fullUserStoryName.toLowerCase().includes(searchValue.toLowerCase())
      ) {
        return false;
      }
      return true;
    },
  );

  const areEqual = (us1: UserStoryPreview, us2: UserStoryPreview) => {
    return us1.id === us2.id;
  };

  const isSelected = (us: UserStoryPreview) => {
    if (userStories.length === 0) return false;

    for (const selectedUserStory of userStories) {
      if (areEqual(us, selectedUserStory)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div>
      <div className="mt-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1 text-lg font-semibold">
          {label}
          {userStories.length > 0 && (
            <span className="text-sm font-normal">({userStories.length})</span>
          )}
        </h3>
        <Dropdown
          label={!disabled && <span className="text-2xl">+</span>}
          onOpen={() => inputRef.current?.focus()}
        >
          <DropdownItem className="flex w-52 flex-col">
            <span className="mb-2 text-sm text-gray-500">Add a dependency</span>
            <input
              ref={inputRef}
              type="text"
              className="mb-1 w-full rounded-md border border-app-border px-2 py-1 text-sm outline-none"
              placeholder="Search user stories..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </DropdownItem>
          <div className="w-full whitespace-nowrap text-left">
            <div className="flex max-h-40 flex-col overflow-y-auto rounded-b-lg">
              {filteredUserStories?.map((userStory) => (
                <DropdownButton
                  key={userStory.id}
                  onClick={() => {
                    if (isSelected(userStory)) {
                      onChange(
                        userStories.filter((us) => !areEqual(us, userStory)),
                      );
                    } else {
                      onChange([...userStories, userStory]);
                    }
                  }}
                  className="flex max-w-52 items-center border-b border-app-border px-2 py-2 last:border-none"
                  data-tooltip-id="tooltip"
                  data-tooltip-content={userStory.name}
                  data-tooltip-delay-show={500}
                >
                  <Check
                    fontSize="inherit"
                    className={cn({
                      "opacity-0": !isSelected(userStory),
                    })}
                  ></Check>
                  <span className="flex w-full gap-1 px-2">
                    <span className="font-medium">
                      US{userStory.scrumId.toString().padStart(3, "0")}:
                    </span>
                    <span className="flex-1 truncate">{userStory.name}</span>
                  </span>
                </DropdownButton>
              ))}
              {allUserStoriesExceptCurrent?.length === 0 && (
                <span className="w-full p-2 text-center text-sm text-gray-600">
                  No user stories exist
                </span>
              )}
            </div>
          </div>
        </Dropdown>
      </div>
      <div className="grid grid-flow-row grid-cols-2 gap-2">
        {userStories
          ?.slice(
            0,
            showAll ? undefined : (userStories.length ?? 0) === 6 ? 6 : 5, // Only show 6 if there are exactly 6, otherwise show 5 to make room for the show more button
          )
          .map((userStory) => (
            <TagComponent
              disabled={disabled}
              key={userStory.id}
              onDelete={() =>
                onChange(userStories.filter((us) => !areEqual(us, userStory)))
              }
              className="text-left"
              data-tooltip-id="tooltip"
              data-tooltip-content={userStory.name}
              onClick={() => onClick?.(userStory.id)}
            >
              {formatUserStoryScrumId(userStory.scrumId)}
            </TagComponent>
          ))}
        {(userStories.length ?? 0) > 6 && (
          <SecondaryButton
            className="flex h-8 items-center rounded-full text-sm text-app-primary"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : "Show all"}
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
