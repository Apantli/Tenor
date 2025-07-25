import { Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { DatePicker } from "~/app/_components/inputs/pickers/DatePicker";
import Popup from "~/app/_components/Popup";
import { api } from "~/trpc/react";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import { useAlert } from "~/app/_hooks/useAlert";
import { useInvalidateQueriesAllSprints } from "~/app/_hooks/invalidateHooks";
import useValidateDate from "~/app/_hooks/useValidateDates";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";

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

export default function CreateSprintPopup({
  showSmallPopup,
  setShowSmallPopup,
  otherSprints,
}: Props) {
  const { predefinedAlerts } = useAlert();
  const { projectId } = useParams();

  const { mutateAsync: createSprint, isPending } =
    api.sprints.createSprint.useMutation();

  const invalidateQueriesAllSprints = useInvalidateQueriesAllSprints();
  const isValidDates = useValidateDate();

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
    if (
      !newSprintStartDate ||
      !newSprintEndDate ||
      !isValidDates({
        startDate: newSprintStartDate,
        endDate: newSprintEndDate,
        otherSprints: otherSprints,
      })
    ) {
      return;
    }

    const response = await createSprint({
      projectId: projectId as string,
      sprintData: {
        number: -1,
        description: newSprintDescription,
        startDate: Timestamp.fromDate(newSprintStartDate),
        endDate: Timestamp.fromDate(newSprintEndDate),
        userStoryIds: [],
        genericItemIds: [],
        issueIds: [],
      },
    });
    if (response.reorderedSprints) {
      predefinedAlerts.sprintReordered();
    }

    await invalidateQueriesAllSprints(projectId as string);

    setNewSprintDescription("");
    setNewSprintStartDate(defaultSprintInitialDate);
    setNewSprintEndDate(defaultSprintEndDate);

    setShowSmallPopup(false);
  };

  const checkDescriptionLimit = useCharacterLimit("Sprint description", 200);

  return (
    <Popup
      show={showSmallPopup}
      reduceTopPadding
      size="small"
      className="h-[470px] w-[500px]"
      dismiss={() => setShowSmallPopup(false)}
      footer={
        <div className="flex gap-2">
          <PrimaryButton
            onClick={async () => {
              await handleCreateSprint();
            }}
            loading={isPending}
            disabled={isPending || !newSprintStartDate || !newSprintEndDate}
          >
            Create Sprint
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl">
          <strong>New Sprint</strong>
        </h1>
        <InputTextAreaField
          id="sprint-description-field"
          height={15}
          label="Sprint description"
          value={newSprintDescription}
          onChange={(e) => {
            if (checkDescriptionLimit(e.target.value)) {
              setNewSprintDescription(e.target.value);
            }
          }}
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
              assignDataAt="beginOfDay"
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
              assignDataAt="endOfDay"
            />
          </div>
        </div>
      </div>
    </Popup>
  );
}
