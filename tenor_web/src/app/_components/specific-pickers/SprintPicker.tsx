"use client";

import type { Sprint, WithId } from "~/lib/types/firebaseSchemas";
import { useFormatSprintNumber } from "~/app/_hooks/scrumIdHooks";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import PillPickerComponent from "../PillPickerComponent";

interface EditableBoxProps {
  sprint?: WithId<Sprint> | undefined;
  onChange: (option: WithId<Sprint> | undefined) => void;
  disabled?: boolean;
}

export function SprintPicker({
  sprint: selectedOption = undefined,
  onChange,
  disabled = false,
}: EditableBoxProps) {
  const { projectId } = useParams();

  const formatSprintNumber = useFormatSprintNumber();

  const { data: sprints } = api.sprints.getProjectSprintsOverview.useQuery({
    projectId: projectId as string,
  });

  const sprintToItem = (sprint?: WithId<Sprint>) => ({
    id: sprint?.number.toString() ?? "",
    label: sprint?.number ? formatSprintNumber(sprint.number) : "Choose sprint",
  });
  return (
    <PillPickerComponent
      disabled={disabled}
      label="Select an epic"
      emptyLabel="No epics available"
      selectedItem={sprintToItem(selectedOption)}
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
