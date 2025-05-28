import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { DatePicker } from "~/app/_components/inputs/pickers/DatePicker";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import Popup from "~/app/_components/Popup";
import {
  useInvalidateQueriesAllSprints,
  useInvalidateQueriesSingleSprint,
} from "~/app/_hooks/invalidateHooks";
import { type AlertFunction, useAlert } from "~/app/_hooks/useAlert";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { api } from "~/trpc/react";
import { type SprintDates } from "./CreateSprintPopup";
import { Timestamp } from "firebase/firestore";
import DeleteButton from "~/app/_components/inputs/buttons/DeleteButton";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
interface Props {
  sprintId: string;
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  otherSprints: SprintDates[] | undefined;
}

export const showReorderAlert = (alert: AlertFunction) => {
  alert(
    "Sprints updated",
    "The remaining sprints have been renumbered to stay in order.",
    {
      type: "success",
      duration: 8000,
    },
  );
};

export default function EditSprintPopup({
  sprintId,
  showPopup,
  setShowPopup,
  otherSprints,
}: Props) {
  const { projectId } = useParams();
  const confirm = useConfirmation();
  const { predefinedAlerts } = useAlert();

  const invalidateQueriesAllSprints = useInvalidateQueriesAllSprints();
  const invalidateQueriesSingleSprint = useInvalidateQueriesSingleSprint();

  const { data: sprintData } = api.sprints.getSprint.useQuery({
    projectId: projectId as string,
    sprintId,
  });

  const { mutateAsync: modifySprint, isPending: isModifying } =
    api.sprints.modifySprint.useMutation();
  const { mutateAsync: deleteSprint, isPending: isDeleting } =
    api.sprints.deleteSprint.useMutation();

  const [editForm, setEditForm] = useState<{
    description: string;
    startDate?: Date;
    endDate?: Date;
  }>({
    description: "",
    startDate: new Date(),
    endDate: new Date(),
  });

  const changesMade =
    editForm.description !== sprintData?.description ||
    editForm.startDate?.valueOf() !== sprintData?.startDate.valueOf() ||
    editForm.endDate?.valueOf() !== sprintData?.endDate.valueOf();

  useEffect(() => {
    if (sprintData) {
      setEditForm({
        description: sprintData.description,
        startDate: new Date(sprintData.startDate),
        endDate: new Date(sprintData.endDate),
      });
    }
  }, [sprintData]);

  const handleUpdateSprint = async () => {
    if (!sprintData) return;

    if (!editForm.startDate || !editForm.endDate) {
      predefinedAlerts.sprintDatesError();
      return;
    }

    for (const sprint of otherSprints ?? []) {
      if (
        (sprint.startDate <= editForm.startDate &&
          sprint.endDate >= editForm.startDate) ||
        (sprint.startDate <= editForm.endDate &&
          sprint.endDate >= editForm.endDate) ||
        (editForm.startDate <= sprint.startDate &&
          editForm.endDate >= sprint.startDate) ||
        (editForm.startDate <= sprint.endDate &&
          editForm.endDate >= sprint.endDate)
      ) {
        predefinedAlerts.sprintDateCollideError(sprint.number);
        return;
      }
    }

    const result = await modifySprint({
      projectId: projectId as string,
      sprintId: sprintData?.id,
      sprintData: {
        description: editForm.description,
        startDate: Timestamp.fromDate(editForm.startDate),
        endDate: Timestamp.fromDate(editForm.endDate),
      },
    });
    if (result.reorderedSprints) {
      showReorderAlert(alert);
    }
    setShowPopup(false);
    await invalidateQueriesSingleSprint(projectId as string, sprintData.id);
    await invalidateQueriesAllSprints(projectId as string);
  };

  const handleDeleteSprint = async () => {
    if (!sprintData) return;

    if (
      await confirm(
        "Are you sure?",
        "You are about to delete the sprint. All assigned backlog items will be moved back to the product backlog.",
        "Delete sprint",
        "Cancel",
      )
    ) {
      const result = await deleteSprint({
        projectId: projectId as string,
        sprintId: sprintData.id,
      });
      if (result.reorderedSprints) {
        showReorderAlert(alert);
      }
      setShowPopup(false);
      await invalidateQueriesAllSprints(projectId as string);
    }
  };

  return (
    <Popup
      show={showPopup}
      reduceTopPadding
      size="small"
      className="h-[470px] w-[500px]"
      dismiss={async () => {
        if (changesMade) {
          const confirmed = await confirm(
            "Are you sure?",
            "You have unsaved changes. Are you sure you want to discard them?",
            "Discard changes",
            "Keep editing",
          );
          if (!confirmed) return;
        }
        setShowPopup(false);
      }}
      disablePassiveDismiss={changesMade}
      footer={
        <>
          {sprintData && (
            <div className="flex gap-2">
              <DeleteButton onClick={handleDeleteSprint} loading={isDeleting}>
                Delete sprint
              </DeleteButton>
              <PrimaryButton
                onClick={handleUpdateSprint}
                loading={isModifying}
                disabled={!changesMade || isModifying}
              >
                Save changes
              </PrimaryButton>
            </div>
          )}
        </>
      }
      title={
        <>
          {sprintData && (
            <h1 className="text-2xl">
              <strong>Edit Sprint {sprintData.number}</strong>
            </h1>
          )}
        </>
      }
    >
      {!sprintData ? (
        <div className="flex h-full w-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 pt-4">
          <InputTextAreaField
            id="sprint-description-field"
            height={15}
            label="Sprint description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            placeholder="Explain what will be done in this sprint..."
            className="h-[200px] w-full"
          />
          <div className="flex w-full justify-center gap-4">
            <div className="w-full">
              <h3 className="text-sm font-semibold">Start date</h3>
              <DatePicker
                selectedDate={editForm.startDate}
                placeholder="Select date"
                className="w-full"
                assignDataAt="beginOfDay"
                onChange={(newDate) =>
                  setEditForm({ ...editForm, startDate: newDate })
                }
              />
            </div>
            <div className="w-full">
              <h3 className="text-sm font-semibold">End date</h3>
              <DatePicker
                selectedDate={editForm.endDate}
                placeholder="Select date"
                className="w-full"
                onChange={(newDate) =>
                  setEditForm({ ...editForm, endDate: newDate })
                }
              />
            </div>
          </div>
        </div>
      )}
    </Popup>
  );
}
