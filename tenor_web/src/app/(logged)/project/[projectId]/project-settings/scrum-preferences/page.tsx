"use client";

import { useParams } from "next/navigation";
import React, { useState } from "react";
import InputTextField from "~/app/_components/inputs/InputTextField";
import TimeMultiselect, {
  TimeFrame,
  timeframeMultiplier,
} from "~/app/_components/inputs/TimeMultiselect";
import { useAlert } from "~/app/_hooks/useAlert";
import { api } from "~/trpc/react";

export default function ProjectScrumPreferences() {
  // HOOKS
  const { projectId } = useParams();
  const { alert } = useAlert();

  // TRPC
  const { data: defaultSprintDuration } =
    api.settings.fetchDefaultSprintDuration.useQuery({
      projectId: projectId as string,
    });
  const { mutateAsync: updateSprintDuration } =
    api.settings.updateDefaultSprintDuration.useMutation();

  // REACT
  const [form, setForm] = useState({
    sprintDuration: defaultSprintDuration ?? 0,
    maximumStoryPoints: 25, // TODO: add
  });
  // const [days, setDays] = useState(defaultSprintDuration ?? 0);

  // HANDLES
  const handleDaysChange = (days: number, timeframe: TimeFrame) => {
    // if (days < 1 || days > 100) {
    //   alert("Please enter a valid number", "Number must be between 1 and 100");
    //   return;
    // }
    const multiplier = timeframeMultiplier[timeframe];
    const newDays = days * multiplier;
    setForm((prev) => ({
      ...prev,
      sprintDuration: newDays,
    }));
  };

  const hasBeenModified = form.sprintDuration !== defaultSprintDuration;

  return (
    <div className="flex h-full max-w-[600px] flex-col gap-3">
      <h1 className="mb-4 text-3xl font-semibold">Scrum Preferences</h1>
      <TimeMultiselect
        days={form.sprintDuration}
        setDays={handleDaysChange}
        label="Sprint Duration"
        labelClassName="text-lg font-semibold"
      />
    </div>
  );
}
