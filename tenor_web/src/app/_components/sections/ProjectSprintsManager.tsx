"use client";

import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { api } from "~/trpc/react";
import Popup from "~/app/_components/Popup";
import { useState } from "react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useEffect } from "react";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import { DatePicker } from "~/app/_components/DatePicker";
import { Timestamp } from "firebase-admin/firestore";
import { TimestampType } from "~/lib/types/zodFirebaseSchema";

export const ProjectSprintsManager = ({ projectId }: { projectId: string }) => {
  const { mutateAsync: createSprint } =
    api.sprints.createOrModifySprint.useMutation();
  const utils = api.useUtils();
  const [showSmallPopup, setShowSmallPopup] = useState(false);

  // New sprint vairables
  // export const TimestampType = z.custom<Timestamp>(
  //   (value) => value instanceof Timestamp,
  // );
  const [newSprintDescription, setNewSprintDescription] = useState("");
  const [newSprintStartDate, setNewSprintStartDate] = useState(new Date());
  const [newSprintEndDate, setNewSprintEndDate] = useState(new Date());

  const handleCreateSprint = async () => {
    const response = await createSprint({
      projectId: projectId,
      number: -1,
      description: newSprintDescription,
      startDate: newSprintStartDate,
      endDate: newSprintEndDate,
    });
    await utils.sprints.getProjectSprintsOverview.invalidate();

    setNewSprintDescription("");
    setNewSprintStartDate(new Date());
    setNewSprintEndDate(new Date());

    console.log(response);
  };

  const { data: sprints } = api.sprints.getProjectSprintsOverview.useQuery(
    {
      projectId: projectId,
    },
    { enabled: !!projectId },
  );
  console.log(sprints);

  return (
    <div className="w-full">
      <div className="flex flex-row flex-wrap justify-between gap-2 border-b-2 pb-2">
        <h1 className="text-2xl font-bold">Sprints</h1>
        <PrimaryButton
          className={
            "h-full w-full max-w-[120px] self-center hover:cursor-pointer"
          }
          onClick={() => setShowSmallPopup(true)}
        >
          {" "}
          + New Sprint{" "}
        </PrimaryButton>
      </div>
      <div className="flex flex-col gap-4 pt-4">
        {/* {epics?.map((epic) => (
          <div
            onClick={() => {
              setSelectedEpic(epic.scrumId);
              setShowEditPopup(true);
            }}
            key={epic.scrumId}
            className="border-b-2 py-2 hover:cursor-pointer"
          >
            <div className="flex flex-col gap-y-1">
              <h3 className="text-2xl font-bold">EP{epic.scrumId}</h3>
              <p className="">{epic.name}</p>
            </div>
          </div>
        ))} */}
        {sprints?.map((sprint) => (
          <div key={sprint.id}>Sprint {sprint.number}</div>
        ))}
      </div>
      <div>
        {/* Popup to create epic */}
        <Popup
          show={showSmallPopup}
          size="small"
          className="min-h-[400px] min-w-[500px]"
          dismiss={() => setShowSmallPopup(false)}
          footer={
            <div className="flex gap-2">
              <PrimaryButton
                onClick={async () => {
                  await handleCreateSprint();
                  setShowSmallPopup(false);
                }}
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
              placeholder="Your sprint description"
              className="h-[200px] w-full"
            />
            <div className="flex w-full flex-row justify-center gap-4">
              <DatePicker
                selectedDate={newSprintStartDate}
                placeholder="Start Date"
                className="w-full"
                onChange={(e) => {
                  if (e) {
                    setNewSprintStartDate(e);
                  }
                }}
              />
              <DatePicker
                selectedDate={newSprintEndDate}
                placeholder="End Date"
                className="w-full"
                onChange={(e) => {
                  if (e) {
                    setNewSprintEndDate(e);
                  }
                }}
              />
            </div>
          </div>
        </Popup>
      </div>
    </div>
  );
};
