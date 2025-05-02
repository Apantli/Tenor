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
import SettingsSizeTable from "~/app/_components/sections/SizeTable";
import { useInvalidateQueriesScrumPreferences } from "~/app/_hooks/invalidateHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import useConfirmation from "~/app/_hooks/useConfirmation";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import {
  defaultMaximumSprintStoryPoints,
  defaultSprintDuration,
} from "~/lib/defaultProjectValues";
import { Size } from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";

const maxInputNumber = 10000000000;

const maxInputSizeNumber = 1000;

interface SizeCol {
  id: string; // id debe ser obligatorio
  name: Size;
  value: number;
  color: string;
}

const sizeOrder: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const sizeColor: Record<Size, string> = {
  XS: "#4A90E2",
  S: "#2c9659",
  M: "#a38921",
  L: "#E67E22",
  XL: "#E74C3C",
  XXL: "#8E44AD",
};

export default function ProjectScrumPreferences() {
  // HOOKS
  const { projectId } = useParams();
  const { alert } = useAlert();
  const confirm = useConfirmation();
  const invalidateQueriesScrumPreferences =
    useInvalidateQueriesScrumPreferences();
  const utils = api.useUtils();
  const initialLoadRef = useRef(true);
  const [sizeData, setSizeData] = useState<SizeCol[]>([]);
  const [originalSizeData, setOriginalSizeData] = useState<SizeCol[]>([]);

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

  const changeSizeMutation = api.settings.changeSize.useMutation();

  const { data: projectSettings } = api.settings.getSizeTypes.useQuery({
    projectId: projectId as string,
  }) as { data: number[] | undefined };

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

    const sizeChanged = sizeData.some((item, index) => 
      item.value !== originalSizeData?.[index]?.value
    );

    return (
      form.sprintDuration !== sprintDuration ||
      form.maximumSprintStoryPoints !== maximumSprintStoryPoints || sizeChanged
    );
  };

  useNavigationGuard(
    async () => {
      if (hasBeenModified()) {
        return !(await confirm(
          "Are you sure?",
          "You have unsaved changes. Do you want to leave?",
          "Discard changes",
          "Keep editing",
        ));
      }
      return false;
    },
    hasBeenModified(),
    "Are you sure you want to leave? You have unsaved changes.",
  );

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
    if (Array.isArray(projectSettings)) {
      const list = projectSettings;
      const mapped = sizeOrder.map((sizeName, index) => ({
        id: `${sizeName}-${index}`,
        name: sizeName,
        color: sizeColor[sizeName],
        value: list[index] ?? index,
      }));
      setSizeData(mapped);
      setOriginalSizeData(mapped);
    }
  }, [projectSettings]);

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

    // Validation for size data between sizes
    for (let i = 0; i < sizeData.length; i++) {
      const current = sizeData[i];
      if (current && current.value <= 0) {
        alert(
          "Invalid size values",
          `The value of ${current.name} must be greater than 0.`,
          {
            type: "error",
            duration: 5000,
          }
        );
        return;
      }
      if (i > 0 && current && current.value <= (sizeData[i - 1]?.value ?? 0)) {
        alert(
          "Invalid order",
          `${current.name} must be greater than or equal to ${(sizeData[i - 1]?.name ?? "previous size")}.`,
          {
            type: "error",
            duration: 5000,
          }
        );
        return;
      }
      if(i <= sizeData.length - 1 && current && current.value > (sizeData[i + 1]?.value ?? maxInputSizeNumber)) {
        alert(
          "Invalid order",
          `${(sizeData[i + 1]?.name ?? " size")} must be more than to ${current.name}.`,
          {
            type: "error",
            duration: 5000,
          }
        );
        return;
      }
    }

    if ((sizeData[sizeData.length - 1]?.value ?? 0) > maxInputSizeNumber) {
      alert(
        "Number too large",
        `Please only input numbers less or equal than ${maxInputSizeNumber.toLocaleString()}.`,
        {
          type: "warning",
          duration: 5000,
        },
      );
      return;
    }

    // Map sizeData to only the values
    // This is a workaround to avoid the type error in the mutation
    const newSize = sizeData.map((s) => s.value);

    await updateScrumSettings({
      projectId: projectId as string,
      days: form.sprintDuration,
      points: form.maximumSprintStoryPoints,
    });

    // Optimistic update for size data
    await changeSizeMutation.mutateAsync({
      projectId: projectId as string,
      size: newSize,
    });

    setOriginalSizeData([...sizeData]);

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

    alert("Success", "Scrum settings have been updated successfully", {
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
            disableAI={true}
          />
          <SettingsSizeTable
            sizeData={sizeData}
            setSizeData={setSizeData}
          />
        </>
      )}
      {settingFetchLoading && (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg">Loading...</p>
        </div>
      )}
    </div>
  );
}
// TODO: Points table
// TODO: Use new useModification that Luis made
