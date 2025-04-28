"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import InputTextField from "~/app/_components/inputs/InputTextField";
import TimeMultiselect, {
  type TimeFrame,
  timeframeMultiplier,
} from "~/app/_components/inputs/TimeMultiselect";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useInvalidateQueriesScrumPreferences } from "~/app/_hooks/invalidateHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import { useModification } from "~/app/_hooks/useModification";
import {
  defaultMaximumSprintStoryPoints,
  defaultSprintDuration,
} from "~/lib/defaultProjectValues";
import { api } from "~/trpc/react";

const maxInputNumber = 10000000000;

export default function ProjectScrumPreferences() {
  // HOOKS
  const { projectId } = useParams();
  const { alert } = useAlert();
  const { setIsModified } = useModification();
  const invalidateQueriesScrumPreferences =
    useInvalidateQueriesScrumPreferences();
  const utils = api.useUtils();
  const initialLoadRef = useRef(true);

  // TRPC
  const { data: scrumSettings, isLoading: settingFetchLoading } =
    api.settings.fetchScrumSettings.useQuery({
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

  const [timeForm, setTimeForm] = useState<[number, TimeFrame]>([
    form.sprintDuration % 7 === 0
      ? form.sprintDuration / 7
      : form.sprintDuration,
    form.sprintDuration % 7 === 0 ? "Weeks" : "Days",
  ]);

  const [numberWarningShown, setNumberWarningShown] = useState(false);

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
    if (scrumSettings) {
      setForm({
        sprintDuration: sprintDuration,
        maximumSprintStoryPoints: maximumSprintStoryPoints,
      });

      // Only automatically convert to weeks on initial load
      if (initialLoadRef.current) {
        setTimeForm([
          sprintDuration % 7 === 0 ? sprintDuration / 7 : sprintDuration,
          sprintDuration % 7 === 0 ? "Weeks" : "Days",
        ]);
        initialLoadRef.current = false;
      } else {
        if (timeForm[1] === "Weeks") {
          setTimeForm([Math.floor(sprintDuration / 7), "Weeks"]);
        } else {
          setTimeForm([sprintDuration, "Days"]);
        }
      }
    }
  }, [scrumSettings]);

  useEffect(() => {
    setIsModified(hasBeenModified());
  }, [
    timeForm,
    form.maximumSprintStoryPoints,
    sprintDuration,
    maximumSprintStoryPoints,
  ]);

  // HANDLES
  const checkLargeNumber = (value: number) => {
    if (value < maxInputNumber) return false;
    if (numberWarningShown) return true;

    alert(
      "Number too large",
      `Please only input numbers less or equal than ${maxInputNumber.toLocaleString()}.`,
      {
        type: "warning",
        duration: 3000,
      },
    );
    return true;
  };

  const handleTimeNumberChange = (value: number) => {
    if (checkLargeNumber(value)) {
      setTimeForm([maxInputNumber, timeForm[1]]);
      setNumberWarningShown(true);
      return;
    }
    setNumberWarningShown(false);

    const timeFrame = timeForm[1];
    const multiplier = timeframeMultiplier[timeFrame];
    const newDays = value * multiplier;

    setTimeForm([value, timeFrame]);
    setForm((prev) => ({
      ...prev,
      sprintDuration: newDays,
    }));
  };

  const handleTimeFrameChange = (timeFrame: TimeFrame) => {
    const timeNumber = timeForm[0];
    const currentTotalDays = timeNumber * timeframeMultiplier[timeFrame];

    setTimeForm([timeNumber, timeFrame]);
    setForm((prev) => ({
      ...prev,
      sprintDuration: currentTotalDays,
    }));
  };

  const handleStoryPointsChange = (valueString: string) => {
    const value = parseInt(valueString === "" ? "0" : valueString, 10);
    if (checkLargeNumber(value)) {
      setForm((prev) => ({
        ...prev,
        maximumSprintStoryPoints: maxInputNumber,
      }));
      setNumberWarningShown(true);
      return;
    }
    setNumberWarningShown(false);

    setForm((prev) => ({
      ...prev,
      maximumSprintStoryPoints: value,
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

    await updateScrumSettings({
      projectId: projectId as string,
      days: form.sprintDuration,
      points: form.maximumSprintStoryPoints,
    });

    // optimistic for button
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

    await invalidateQueriesScrumPreferences(projectId as string);

    alert("Success", "Scrum settings updated successfully", {
      type: "success",
      duration: 5000,
    });
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
      {!settingFetchLoading && (
        <>
          <TimeMultiselect
            timeNumber={timeForm[0]}
            timeFrame={timeForm[1]}
            onTimeNumberChange={handleTimeNumberChange}
            onTimeFrameChange={handleTimeFrameChange}
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
            onChange={(e) => {
              handleStoryPointsChange(e.target.value);
            }}
          />
        </>
      )}
      {settingFetchLoading && (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      )}
    </div>
  );
}
// TODO: Points table
// TODO: Use new useModification that Luis made