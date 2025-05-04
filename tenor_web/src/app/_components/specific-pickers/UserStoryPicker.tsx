"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillPickerComponent from "../PillPickerComponent";
import type { ExistingUserStory } from "~/lib/types/detailSchemas";
import {
  useFormatEpicScrumId,
  useFormatUserStoryScrumId,
} from "~/app/_hooks/scrumIdHooks";

interface Props {
  userStory?: ExistingUserStory;
  onChange: (userStory?: ExistingUserStory) => void;
}

export default function UserStoryPicker({ userStory, onChange }: Props) {
  const { projectId } = useParams();

  const { data: userStories } = api.userStories.getUserStories.useQuery({
    projectId: projectId as string,
  });

  const formatUserStoryScrumId = useFormatUserStoryScrumId();

  const getUserStoryId = (userStory: ExistingUserStory) => {
    return formatUserStoryScrumId(userStory.scrumId);
  };

  const userStoryToItem = (userStory?: ExistingUserStory) => ({
    id: userStory?.scrumId.toString() ?? "",
    label: userStory?.name ?? "Choose user story",
    prefix: userStory ? getUserStoryId(userStory) : undefined,
  });

  return (
    <PillPickerComponent
      label="Select a user story"
      emptyLabel="No user stories available"
      selectedItem={userStoryToItem(userStory)}
      allItems={userStories?.map(userStoryToItem) ?? []}
      allowClear={userStories?.length !== 0}
      onChange={(item) => {
        const userStory = userStories?.find(
          (userStory) => userStory.scrumId.toString() === item.id,
        );
        onChange(userStory);
      }}
    />
  );
}
