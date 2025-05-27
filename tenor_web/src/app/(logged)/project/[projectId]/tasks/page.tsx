"use client";

import { ReactFlowProvider } from "@xyflow/react";
import TaskDependencyTree from "./TaskDependencyTree";

export default function ProjectTasks() {
  return (
    <div className="flex flex-1 flex-col items-start gap-3">
      <h1 className="text-3xl font-semibold">Tasks</h1>
      <ReactFlowProvider>
        <TaskDependencyTree />
      </ReactFlowProvider>
    </div>
  );
}
