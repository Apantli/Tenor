"use client";

import TasksKanban from "./TasksKanban";

export default function ProjectKanban() {
  return (
    <div className="h-full overflow-hidden">
      {/* Here goes the main view with the segmented control */}
      <h1 className="pb-4 text-3xl font-semibold">Kanban</h1>
      <TasksKanban></TasksKanban>
    </div>
  );
}
