"use client";

import type { Sprint, WithId } from "~/lib/types/firebaseSchemas";
import { useFormatSprintNumber } from "~/app/_hooks/scrumIdHooks";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import PillPickerComponent from "./PillPickerComponent";

interface EditableBoxProps {
  sprintId?: string;
  onChange: (option: WithId<Sprint> | undefined) => void;
  disabled?: boolean;
  noSelectionLabel?: string;
}

export function SprintPicker({
  sprintId: selectedOption = undefined,
  onChange,
  disabled = false,
  noSelectionLabel = "Unassgined",
}: EditableBoxProps) {
  const { projectId } = useParams();

  const formatSprintNumber = useFormatSprintNumber();

  const { data: sprints } = api.sprints.getProjectSprintsOverview.useQuery({
    projectId: projectId as string,
  });

  const selectedSprint = sprints?.find(
    (sprint) => sprint.id === selectedOption,
  );

  const sprintToItem = (sprint?: WithId<Sprint>) => ({
    id: sprint?.id.toString() ?? "",
    label: sprint?.number
      ? formatSprintNumber(sprint.number)
      : noSelectionLabel,
  });

  return (
    <PillPickerComponent
      disabled={disabled}
      label="Select a sprint"
      emptyLabel="No sprints available"
      noSelectionLabel={noSelectionLabel}
      selectedItem={sprintToItem(selectedSprint)}
      allItems={sprints?.map(sprintToItem) ?? []}
      allowClear={sprints?.length !== 0}
      onChange={(item) => {
        const sprint = sprints?.find(
          (sprint) => sprint.number.toString() === item.id,
        );
        onChange(sprint);
      }}
    />
  );
}
