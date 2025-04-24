"use client";

import TasksKanban from "./TasksKanban";

export default function ProjectKanban() {
  return (
    <div>
      {/* Here goes the main view with the segmented control */}
      <h1 className="text-3xl font-semibold">Kanban View</h1>
      <TasksKanban></TasksKanban>
    </div>
  )
}