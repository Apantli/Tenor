"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillPickerComponent from "./PillPickerComponent";
import type { ExistingEpic } from "~/lib/types/detailSchemas";
import { useFormatEpicScrumId } from "~/app/_hooks/scrumIdHooks";

interface Props {
  epic?: ExistingEpic;
  onChange: (epic?: ExistingEpic) => void;
  disabled?: boolean;
}

export default function EpicPicker({ epic, onChange, disabled }: Props) {
  const { projectId } = useParams();

  const { data: epics } = api.epics.getEpics.useQuery({
    projectId: projectId as string,
  });

  const formatEpicScrumId = useFormatEpicScrumId(projectId as string);

  const getEpicId = (epic: ExistingEpic) => {
    return formatEpicScrumId(epic.scrumId);
  };

  const epicToItem = (epic?: ExistingEpic) => ({
    id: epic?.scrumId.toString() ?? "",
    label: epic?.name ?? "Choose epic",
    prefix: epic ? getEpicId(epic) : undefined,
  });

  return (
    <PillPickerComponent
      disabled={disabled}
      label="Select an epic"
      emptyLabel="No epics available"
      selectedItem={epicToItem(epic)}
      allItems={epics?.map(epicToItem) ?? []}
      allowClear={epics?.length !== 0}
      onChange={(item) => {
        const epic = epics?.find((epic) => epic.scrumId.toString() === item.id);
        onChange(epic);
      }}
    />
  );
}
