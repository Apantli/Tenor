import { Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { DatePicker } from "~/app/_components/DatePicker";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import Popup from "~/app/_components/Popup";
import { type AlertFunction, useAlert } from "~/app/_hooks/useAlert";
import { api } from "~/trpc/react";

export interface SprintDates {
  id: string;
  number: number;
  startDate: Date;
  endDate: Date;
}

interface Props {
  showSmallPopup: boolean;
  setShowSmallPopup: (show: boolean) => void;
  otherSprints?: SprintDates[];
}

export function CheckNewSprintDates(
  startDate: Date,
  endDate: Date,
  otherSprints: SprintDates[],
  alert: AlertFunction,
) {
  if (endDate <= startDate) {
    alert("Oops...", "Start date must be before end date.", {
      type: "error",
      duration: 5000,
    });
    return false;
  }

  for (const sprint of otherSprints ?? []) {
    if (
      (sprint.startDate <= startDate && sprint.endDate >= startDate) ||
      (sprint.startDate <= endDate && sprint.endDate >= endDate) ||
      (startDate <= sprint.startDate && endDate >= sprint.startDate) ||
      (startDate <= sprint.endDate && endDate >= sprint.endDate)
    ) {
      alert("Oops...", `Dates collide with Sprint ${sprint.number}.`, {
        type: "error",
        duration: 5000,
      });
      return false;
    }
  }
  return true;
}

export default function CreateSprintPopup({
  showSmallPopup,
  setShowSmallPopup,
  otherSprints,
}: Props) {
  const { alert } = useAlert();
  const { projectId } = useParams();

  const { mutateAsync: createSprint, isPending } =
    api.sprints.createSprint.useMutation();

  const utils = api.useUtils();

  // New sprint variables
  const [newSprintDescription, setNewSprintDescription] = useState("");
  const [newSprintStartDate, setNewSprintStartDate] = useState<
    Date | undefined
  >(undefined);
  const [newSprintEndDate, setNewSprintEndDate] = useState<Date | undefined>(
    undefined,
  );

  const { data: scrumSettings, isLoading: isLoadingSprintDuration } =
    api.settings.fetchScrumSettings.useQuery({
      projectId: projectId as string,
    });

  let defaultSprintInitialDate: Date | undefined = undefined;
  let defaultSprintEndDate: Date | undefined = undefined;

  // update values once loaded
  useEffect(() => {
    if (
      !isLoadingSprintDuration &&
      scrumSettings !== undefined &&
      otherSprints != undefined
    ) {
      for (const sprint of otherSprints ?? []) {
        if (
          defaultSprintInitialDate == null ||
          sprint.endDate > defaultSprintInitialDate
        ) {
          defaultSprintInitialDate = sprint.endDate;
        }
      }

      // Set defaultSprintInitialDate to one day after the latest sprint endDate
      if (defaultSprintInitialDate != null) {
        defaultSprintInitialDate = new Date(
          defaultSprintInitialDate.getTime() + 24 * 60 * 60 * 1000,
        );
      } else {
        defaultSprintInitialDate = new Date();
      }

      defaultSprintEndDate = new Date(
        (defaultSprintInitialDate ?? new Date()).getTime() +
          scrumSettings.sprintDuration * 24 * 60 * 60 * 1000,
      );
      setNewSprintStartDate(defaultSprintInitialDate);
      setNewSprintEndDate(defaultSprintEndDate);
    }
  }, [isLoadingSprintDuration, scrumSettings, otherSprints]);

  const handleCreateSprint = async () => {
    if (newSprintStartDate === undefined || newSprintEndDate === undefined)
      return;

    // Validate dates
    if (newSprintStartDate >= newSprintEndDate) {
      alert("Oops...", "Dates are invalid.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
      return;
    }

    if (
      !CheckNewSprintDates(
        newSprintStartDate,
        newSprintEndDate,
        otherSprints ?? [],
        alert,
      )
    ) {
      return;
    }

    await createSprint({
      projectId: projectId as string,
      sprintData: {
        number: -1,
        description: newSprintDescription,
        startDate: Timestamp.fromDate(newSprintStartDate),
        endDate: Timestamp.fromDate(newSprintEndDate),
        // updatedData.dueDate ? Timestamp.fromDate(updatedData.dueDate) : null,
        userStoryIds: [],
        genericItemIds: [],
        issueIds: [],
      },
    });
    await utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
      projectId: projectId as string,
    });

    setNewSprintDescription("");
    setNewSprintStartDate(defaultSprintInitialDate);
    setNewSprintEndDate(defaultSprintEndDate);

    setShowSmallPopup(false);
  };

  return (
    <Popup
      show={showSmallPopup}
      reduceTopPadding
      size="small"
      className="min-h-[400px] min-w-[500px]"
      dismiss={() => setShowSmallPopup(false)}
      footer={
        <div className="flex gap-2">
          <PrimaryButton
            onClick={async () => {
              await handleCreateSprint();
            }}
            loading={isPending}
          >
            Create Sprint
          </PrimaryButton>
        </div>
      }
    >
      {" "}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl">
          <strong>New Sprint</strong>{" "}
        </h1>
        <InputTextAreaField
          height={15}
          label="Sprint description"
          value={newSprintDescription}
          onChange={(e) => setNewSprintDescription(e.target.value)}
          placeholder="Explain what will be done in this sprint..."
          className="h-[200px] w-full"
        />
        <div className="flex w-full justify-center gap-4">
          <div className="w-full">
            <h3 className="text-sm font-semibold">Start date</h3>
            <DatePicker
              selectedDate={newSprintStartDate}
              placeholder="Select date"
              className="w-full"
              onChange={(e) => {
                setNewSprintStartDate(e);
              }}
            />
          </div>
          <div className="w-full">
            <h3 className="text-sm font-semibold">End date</h3>
            <DatePicker
              selectedDate={newSprintEndDate}
              placeholder="Select date"
              className="w-full"
              onChange={(e) => {
                setNewSprintEndDate(e);
              }}
            />
          </div>
        </div>
      </div>
    </Popup>
  );
}
