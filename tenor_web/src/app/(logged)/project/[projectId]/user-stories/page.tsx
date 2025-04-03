"use client";

import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import Popup from "~/app/_components/Popup";
import { useState } from "react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { useEffect } from "react";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import InputTextField from "~/app/_components/inputs/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";

export default function ProjectUserStories() {
  const { mutateAsync: createEpic } =
    api.epics.createOrModifyEpic.useMutation();

  const utils = api.useUtils();
  const { projectId } = useParams();

  const [showSmallPopup, setShowSmallPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editEpic, setEditEpic] = useState(false);

  const [selectedEpic, setSelectedEpic] = useState<number | null>(null);

  const { data: epics } = api.epics.getProjectEpicsOverview.useQuery(
    {
      projectId: projectId as string,
    },
    { enabled: !!projectId },
  );

  const { data: epic, isLoading: epicLoading } = api.epics.getEpic.useQuery(
    {
      projectId: projectId as string,
      epicId: selectedEpic ?? 0,
    },
    {
      enabled: !!selectedEpic,
    },
  );

  useEffect(() => {
    if (selectedEpic && epic) {
      setEditEpicName(epic.name || "");
      setEditEpicDescription(epic.description || "");
    }
  }, [selectedEpic, epic]);

  const [newEpicName, setNewEpicName] = useState("");
  const [newEpicDescription, setNewEpicDescription] = useState("");
  const [editEpicName, setEditEpicName] = useState("");
  const [editEpicDescription, setEditEpicDescription] = useState("");

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
              "h-full w-full max-w-[103px] self-center text-xs font-bold hover:cursor-pointer"
            }
            onClick={() => setShowSmallPopup(true)}
          >
            {" "}
            + New Epic{" "}
          </PrimaryButton>
        </div>
        <div className="flex flex-col gap-4 pt-4">
          {epics?.map((epic) => (
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
          ))}
        </div>
      </div>
      <h1 className="text-2xl font-bold">User Stories</h1>
      <Popup
        show={showSmallPopup}
        size="small"
        className="min-h-[400px] min-w-[500px]"
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
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl">
            <strong>EP{(epics?.length ?? 0) + 1}:</strong>{" "}
          </h1>
          <InputTextField
            type="text"
            placeholder="Your epic name"
            label="Epic name"
            value={newEpicName}
            onChange={(e) => setNewEpicName(e.target.value)}
          />
          <InputTextAreaField
            label="Epic description"
            value={newEpicDescription}
            onChange={(e) => setNewEpicDescription(e.target.value)}
            placeholder="Your epic description"
            className="h-auto w-full"
          />
        </div>
      </Popup>
      <Popup
        show={showEditPopup}
        className="min-h-[400px] min-w-[500px]"
        showEdit
        size="small"
        onEdit={() => setEditEpic(!editEpic)}
        footer={
          <div className="flex gap-2">
            {editEpic && (
              <>
                <PrimaryButton
                  onClick={async () => {
                    if (epic?.scrumId) {
                      await createEpic({
                        projectId: projectId as string,
                        scrumId: epic?.scrumId,
                        name: editEpicName,
                        description: editEpicDescription,
                      });
                      await utils.epics.invalidate();
                    } else {
                      console.log("Warning: epic not found");
                    }
                    setEditEpic(false);
                  }}
                >
                  Modify Epic
                </PrimaryButton>
                <DeleteButton
                  onClick={async () => {
                    if (!epic?.scrumId) {
                      console.log("Warning: epic not found");
                      return;
                    }
                    await createEpic({
                      projectId: projectId as string,
                      scrumId: epic?.scrumId,
                      name: editEpicName,
                      description: editEpicDescription,
                      deleted: true,
                    });
                    await utils.epics.invalidate();
                    setShowEditPopup(false);
                  }}
                >
                  Delete epic
                </DeleteButton>
              </>
            )}
          </div>
        }
        dismiss={() => {
          setShowEditPopup(false);
          setSelectedEpic(null);
          setEditEpic(false);
        }}
      >
        <>
          {epicLoading ? (
            <div className="flex flex-col items-center gap-y-7">
              <h3 className="text-2xl font-bold">Loading...</h3>
              <LoadingSpinner color="dark" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-baseline gap-x-2">
                <div className="flex flex-row">
                  <h1 className="mb-5 text-2xl">
                    <strong>EP{epic?.scrumId}:</strong>{" "}
                  </h1>
                  {!editEpic && <p className="mr-5 text-2xl">{epic?.name}</p>}
                </div>
                {editEpic && (
                  <InputTextField
                    label="Epic name"
                    type="text"
                    placeholder="Your epic name"
                    value={editEpicName}
                    onChange={(e) => setEditEpicName(e.target.value)}
                  />
                )}
              </div>

              {editEpic ? (
                <InputTextAreaField
                  label="Epic description"
                  value={editEpicDescription}
                  onChange={(e) => setEditEpicDescription(e.target.value)}
                  placeholder="Your epic descriptions"
                  className="h-auto w-full"
                />
              ) : (
                <p>{epic?.description}</p>
              )}
            </div>
          )}
        </>
      </Popup>
    </div>
  );
}
