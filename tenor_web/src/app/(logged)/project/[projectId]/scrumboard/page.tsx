"use client";

import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import TasksKanban from "./TasksKanban";
import { usePopupVisibilityState } from "~/app/_components/Popup";
import { useInvalidateQueriesAllTasks } from "~/app/_hooks/invalidateHooks";
import { useParams } from "next/navigation";
import CreateKanbanListPopup from "./CreateKanbanListPopup";

export default function ProjectKanban() {
  const { projectId } = useParams();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  // REACT
  const [renderNewList, showNewList, setShowNewList] =
    usePopupVisibilityState();

  // HANDLES
  const onListAdded = async () => {
    await invalidateQueriesAllTasks(projectId as string);
    setShowNewList(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Here goes the main view with the segmented control */}
      <div className="flex justify-between">
        <h1 className="pb-4 text-3xl font-semibold">Scrum Board</h1>
        <PrimaryButton onClick={() => setShowNewList(true)}>
          + Add list
        </PrimaryButton>
      </div>
      <TasksKanban></TasksKanban>

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
