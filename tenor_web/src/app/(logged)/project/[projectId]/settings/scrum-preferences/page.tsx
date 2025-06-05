"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef, useMemo } from "react";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import TimeMultiselect, {
  type TimeFrame,
  timeframeMultiplier,
} from "~/app/_components/inputs/TimeMultiselect";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import SettingsSizeTable from "~/app/(logged)/project/[projectId]/settings/scrum-preferences/SettingsSizeTable";
import { useInvalidateQueriesScrumPreferences } from "~/app/_hooks/invalidateHooks";
import { useAlert } from "~/app/_hooks/useAlert";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { checkPermissions } from "~/lib/defaultValues/permission";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import { defaultSprintDuration } from "~/lib/defaultValues/project";
import { emptyRole } from "~/lib/defaultValues/roles";
import {
  permissionNumbers,
  type Permission,
  type Size,
} from "~/lib/types/firebaseSchemas";
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
  const { predefinedAlerts } = useAlert();
  const confirm = useConfirmation();
  const invalidateQueriesScrumPreferences =
    useInvalidateQueriesScrumPreferences();
  const utils = api.useUtils();
  const initialLoadRef = useRef(true);
  const [sizeData, setSizeData] = useState<SizeCol[]>([]);
  const [originalSizeData, setOriginalSizeData] = useState<SizeCol[]>([]);

  // TRPC
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["settings"],
      },
      role ?? emptyRole,
    );
  }, [role]);
  const { data: scrumSettings, isLoading: settingFetchLoading } =
    api.settings.fetchScrumSettings.useQuery({
      projectId: projectId as string,
    });
  const sprintDuration = scrumSettings?.sprintDuration ?? defaultSprintDuration;

  const { mutateAsync: updateScrumSettings, isPending: isUpdatePending } =
    api.settings.updateScrumSettings.useMutation();

  const changeSizeMutation = api.settings.changeSize.useMutation();

  const { data: projectSettings } = api.settings.getSizeTypes.useQuery({
    projectId: projectId as string,
  }) as { data: number[] | undefined };

  // REACT
  const [form, setForm] = useState({
    sprintDuration: sprintDuration,
  });

  const [timeForm, setTimeForm] = useState<[number, TimeFrame]>([
    form.sprintDuration % 7 === 0
      ? form.sprintDuration / 7
      : form.sprintDuration,
    form.sprintDuration % 7 === 0 ? "Weeks" : "Days",
  ]);

  const [numberWarningShown, setNumberWarningShown] = useState(false);

  const hasBeenModified = () => {
    if (!sprintDuration) {
      return false;
    }

    const sizeChanged = sizeData.some(
      (item, index) => item.value !== originalSizeData?.[index]?.value,
    );

    return form.sprintDuration !== sprintDuration || sizeChanged;
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

    predefinedAlerts.sizePointsUpperBoundError(maxInputSizeNumber);
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

  const handleSave = async () => {
    if (isUpdatePending) return;
    if (form.sprintDuration < 1 || form.sprintDuration > 365) {
      predefinedAlerts.sprintDurationError();
      return;
    }

    // Validation for size data between sizes
    for (let i = 0; i < sizeData.length; i++) {
      const current = sizeData[i];
      if (current && current.value <= 0) {
        predefinedAlerts.sizePointsLowerBoundError(current.name);
        return;
      }
      if (i > 0 && current && current.value <= (sizeData[i - 1]?.value ?? 0)) {
        predefinedAlerts.sizeOrderError(
          current.name,
          sizeData[i - 1]?.name ?? "previous size",
        );
        return;
      }
      if (
        i <= sizeData.length - 1 &&
        current &&
        current.value > (sizeData[i + 1]?.value ?? maxInputSizeNumber)
      ) {
        predefinedAlerts.sizeOrderError(
          current.name,
          sizeData[i + 1]?.name ?? "next size",
        );
        return;
      }
    }

    if ((sizeData[sizeData.length - 1]?.value ?? 0) > maxInputSizeNumber) {
      predefinedAlerts.sizePointsUpperBoundError(maxInputSizeNumber);
      return;
    }

    // Map sizeData to only the values
    // This is a workaround to avoid the type error in the mutation
    const newSize = sizeData.map((s) => s.value);

    await updateScrumSettings({
      projectId: projectId as string,
      days: form.sprintDuration,
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
        };
      },
    );

    await invalidateQueriesScrumPreferences(projectId as string);

    predefinedAlerts.scrumSettingsSuccess();
  };

  return (
    <div className="flex h-full flex-col gap-4 lg:max-w-[600px]">
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
            disabled={permission < permissionNumbers.write}
            timeNumber={timeForm[0]}
            timeFrame={timeForm[1]}
            onTimeNumberChange={handleTimeNumberChange}
            onTimeFrameChange={handleTimeFrameChange}
            label="Sprint duration"
            data-cy="sprint-duration"
            labelClassName="text-lg font-semibold"
          />

          <SettingsSizeTable
            disabled={permission < permissionNumbers.write}
            sizeData={sizeData}
            setSizeData={setSizeData}
          />
        </>
      )}
      {settingFetchLoading && (
        <div className="flex h-full w-full flex-col items-center">
          <LoadingSpinner color="primary" />
        </div>
      )}
    </div>
  );
}
// TODO: Points table
// TODO: Use new useModification that Luis made
