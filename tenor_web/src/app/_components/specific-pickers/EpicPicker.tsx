"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillPickerComponent from "../PillPickerComponent";
import { ExistingEpic } from "~/lib/types/detailSchemas";

interface Props {
  epic?: ExistingEpic;
  onChange: (epic?: ExistingEpic) => void;
}

export default function EpicPicker({ epic, onChange }: Props) {
  const { projectId } = useParams();

  const { data: epics } = api.epics.getProjectEpicsOverview.useQuery({
    projectId: projectId as string,
  });

  const getEpicId = (epic: ExistingEpic) => {
    return "EP" + epic.scrumId.toString().padStart(3, "0");
  };

  const epicToItem = (epic?: ExistingEpic) => ({
    id: epic?.scrumId.toString() ?? "",
    label: epic?.name ?? "Choose epic",
    prefix: epic ? getEpicId(epic) : undefined,
  });

  return (
    <PillPickerComponent
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
