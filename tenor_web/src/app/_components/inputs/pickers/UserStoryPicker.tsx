"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillPickerComponent from "./PillPickerComponent";
import type { UserStoryPreview } from "~/lib/types/detailSchemas";
import { useFormatUserStoryScrumId } from "~/app/_hooks/scrumIdHooks";

interface Props {
  userStory?: UserStoryPreview;
  onChange: (userStory?: UserStoryPreview) => void;
  disabled?: boolean;
  noSelectionLabel?: string;
}

export default function UserStoryPicker({
  userStory,
  onChange,
  disabled,
  noSelectionLabel = "Unassigned",
}: Props) {
  const { projectId } = useParams();

  const { data: userStories } = api.userStories.getUserStories.useQuery({
    projectId: projectId as string,
  });

  const formatUserStoryScrumId = useFormatUserStoryScrumId(projectId as string);

  const getUserStoryId = (userStory: UserStoryPreview) => {
    return formatUserStoryScrumId(userStory.scrumId);
  };

  const userStoryToItem = (userStory?: UserStoryPreview) => ({
    id: userStory?.scrumId.toString() ?? "",
    label: userStory?.name ?? (disabled ? "None" : noSelectionLabel),
    prefix: userStory ? getUserStoryId(userStory) : undefined,
  });

  return (
    <PillPickerComponent
      disabled={disabled}
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
