"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import InputTextField from "~/app/_components/inputs/InputTextField";
import TimeMultiselect, {
  type TimeFrame,
  timeframeMultiplier,
} from "~/app/_components/inputs/TimeMultiselect";
import { useInvalidateQueriesScrumPreferences } from "~/app/_hooks/invalidateHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import { useModification } from "~/app/_hooks/useModification";
import {
  defaultMaximumSprintStoryPoints,
  defaultSprintDuration,
} from "~/lib/defaultProjectValues";
import { api } from "~/trpc/react";

export default function ProjectScrumPreferences() {
  // HOOKS
  const { projectId } = useParams();
  const { alert } = useAlert();
  const { setIsModified } = useModification();
  const invalidateQueriesScrumPreferences =
    useInvalidateQueriesScrumPreferences();
  const utils = api.useUtils();

  // TRPC
  const { data: scrumSettings } = api.settings.fetchScrumSettings.useQuery({
    projectId: projectId as string,
  });
  const sprintDuration = scrumSettings?.sprintDuration ?? defaultSprintDuration;
  const maximumSprintStoryPoints =
    scrumSettings?.maximumSprintStoryPoints ?? defaultMaximumSprintStoryPoints;

  const { mutateAsync: updateScrumSettings, isPending: isUpdatePending } =
    api.settings.updateScrumSettings.useMutation();

  // REACT
  const [form, setForm] = useState({
    sprintDuration: sprintDuration,
    maximumSprintStoryPoints: maximumSprintStoryPoints,
  });
  const hasBeenModified = () => {
    if (!sprintDuration || !maximumSprintStoryPoints) {
      return false;
    }
    return (
      form.sprintDuration !== sprintDuration ||
      form.maximumSprintStoryPoints !== maximumSprintStoryPoints
    );
  };

  useEffect(() => {
    if (sprintDuration && maximumSprintStoryPoints) {
      setForm({
        sprintDuration: sprintDuration,
        maximumSprintStoryPoints: maximumSprintStoryPoints,
      });
    }
  }, [sprintDuration, maximumSprintStoryPoints]);

  useEffect(() => {
    setIsModified(hasBeenModified());
  }, [
    form.sprintDuration,
    form.maximumSprintStoryPoints,
    sprintDuration,
    maximumSprintStoryPoints,
  ]);

  // HANDLES
  const handleDaysChange = (days: number, timeframe: TimeFrame) => {
    const multiplier = timeframeMultiplier[timeframe];
    const newDays = days * multiplier;
    setForm((prev) => ({
      ...prev,
      sprintDuration: newDays,
    }));
  };

  const handleSave = async () => {
    if (isUpdatePending) return;
    if (form.sprintDuration < 1 || form.sprintDuration > 365) {
      alert("Oops", "Sprint duration must be between 1 and 365 total days", {
        type: "error",
        duration: 5000,
      });
      return;
    }
    if (form.maximumSprintStoryPoints < 1) {
      alert("Oops", "Maximum sprint story points must be greater than 0", {
        type: "error",
        duration: 5000,
      });
      return;
    }

    // optimistic
    await utils.settings.fetchScrumSettings.cancel({
      projectId: projectId as string,
    });

    utils.settings.fetchScrumSettings.setData(
      {
        projectId: projectId as string,
      },
      () => {
        return {
          sprintDuration: form.sprintDuration,
          maximumSprintStoryPoints: form.maximumSprintStoryPoints,
        };
      },
    );

    await updateScrumSettings({
      projectId: projectId as string,
      days: form.sprintDuration,
      points: form.maximumSprintStoryPoints,
    });

    await invalidateQueriesScrumPreferences(projectId as string);
  };

  return (
    <div className="flex h-full max-w-[600px] flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <h1 className="mb-2 text-3xl font-semibold">Scrum Preferences</h1>
        {hasBeenModified() && (
          <PrimaryButton onClick={handleSave} loading={isUpdatePending}>
            Save
          </PrimaryButton>
        )}
      </div>
      <TimeMultiselect
        days={form.sprintDuration}
        setDays={handleDaysChange}
        label="Sprint duration"
        labelClassName="text-lg font-semibold"
      />

      <InputTextField
        label="Maximum sprint story points"
        labelClassName="text-lg font-semibold"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={form.maximumSprintStoryPoints}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            maximumSprintStoryPoints: parseInt(
              e.target.value === "" ? "0" : e.target.value,
              10,
            ),
          }))
        }
        // TODO: Make the dropdown start with week if sprint duration is divisible by 7
        // TODO: Alert for correct saving
        // TODO: Points table
      />
    </div>
  );
}
