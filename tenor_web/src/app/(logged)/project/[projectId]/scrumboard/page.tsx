"use client";

import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import TasksKanban from "./TasksKanban";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import { useInvalidateQueriesAllTasks } from "~/app/_hooks/invalidateHooks";
import { useParams } from "next/navigation";
import CreateKanbanListPopup from "./CreateKanbanListPopup";
import { useState } from "react";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import ItemsKanban from "./ItemsKanban";

type ScrumboardSections = "Tasks" | "Backlog Items";

export default function ProjectKanban() {
  const { projectId } = useParams();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  // REACT
  const [renderNewList, showNewList, setShowNewList] =
    usePopupVisibilityState();
  const [section, setSection] = useState<ScrumboardSections>("Tasks");

  // HANDLES
  const onListAdded = async () => {
    await invalidateQueriesAllTasks(projectId as string);
    setShowNewList(false);
  };

  return (
    <div className="flex h-full flex-col justify-start overflow-hidden pt-0">
      <div className="flex items-baseline justify-between gap-3 pb-4">
        <h1 className="grow-[1] text-3xl font-semibold">Scrum Board</h1>
        <div className="min-w-[300px]">
          <SegmentedControl
            options={["Tasks", "Backlog Items"]}
            selectedOption={section}
            onChange={(value) => {
              setSection(value as ScrumboardSections);
            }}
          />
        </div>
        <PrimaryButton onClick={() => setShowNewList(true)}>
          + Add list
        </PrimaryButton>
      </div>

      {section === "Tasks" && <TasksKanban></TasksKanban>}
      {section === "Backlog Items" && <ItemsKanban></ItemsKanban>}

      {renderNewList && (
        <CreateKanbanListPopup
          onListAdded={onListAdded}
          showPopup={showNewList}
          setShowPopup={setShowNewList}
        />
      )}
    </div>
  );
}
