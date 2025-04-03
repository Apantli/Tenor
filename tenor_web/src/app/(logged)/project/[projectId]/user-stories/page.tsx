"use client";

import PrimaryButton from "~/app/_components/PrimaryButton";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import Popup from "~/app/_components/Popup";
import { useState } from "react";

export default function ProjectUserStories() {
  const { mutateAsync: createEpic } =
    api.epics.createOrModifyEpic.useMutation();

  const utils = api.useUtils();

  const [showSmallPopup, setShowSmallPopup] = useState(false);

  const { projectId } = useParams();

  const { data: epics } = api.epics.getProjectEpicsOverview.useQuery(
    {
      projectId: projectId as string,
    },
    { enabled: !!projectId },
  );

  console.log("ERpics size: ", epics?.length);

  const [newEpicName, setNewEpicName] = useState("");
  const [newEpicDescription, setNewEpicDescription] = useState("");

  const handleCreateEpic = async () => {
    const response = await createEpic({
      projectId: projectId as string,
      name: newEpicName,
      description: newEpicDescription,
    });
    await utils.epics.getProjectEpicsOverview.invalidate();

    setNewEpicDescription("");
    setNewEpicName("");

    console.log(response);
  };
  return (
    <div className="flex flex-row gap-4">
      <div className="h-[80vh] w-1/4 border-r-2 pr-5 pt-6">
        <div className="flex flex-row justify-between border-b-2 pb-2">
          <h1 className="text-2xl font-bold">Epics</h1>
          <PrimaryButton
            className={
              "h-full w-full max-w-[103px] self-center text-xs font-bold"
            }
            onClick={() => setShowSmallPopup(true)}
          >
            {" "}
            + New Epic{" "}
          </PrimaryButton>
        </div>
        <div className="flex flex-col gap-4 pt-4">
          {epics?.map((epic) => (
            <div key={epic.scrumId} className="border-b-2 py-2">
              <div className="flex flex-col gap-y-1">
                <h3 className="text-2xl font-bold">EP{epic.scrumId}</h3>
                <p className="">{epic.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <h1 className="text-2xl font-bold">User Stories</h1>
      <Popup
        show={showSmallPopup}
        size="small"
        dismiss={() => setShowSmallPopup(false)}
        footer={
          <div className="flex gap-2">
            <PrimaryButton
              onClick={async () => {
                await handleCreateEpic();
                setShowSmallPopup(false);
              }}
            >
              Create epic
            </PrimaryButton>
          </div>
        }
      >
        {/* Inside the popup, you can include whatever content you want */}
        <h1 className="mb-5 text-2xl">
          <strong>EP{(epics?.length ?? 0) + 1}:</strong>{" "}
          <input
            type="text"
            placeholder="Your epic name"
            value={newEpicName}
            onChange={(e) => setNewEpicName(e.target.value)}
          />
        </h1>

        <textarea
          value={newEpicDescription}
          onChange={(e) => setNewEpicDescription(e.target.value)}
          placeholder="Your epic descriptions"
          className="h-auto w-full"
        />
      </Popup>
    </div>
  );
}
