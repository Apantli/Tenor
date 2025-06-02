"use client";

import { ReactFlowProvider } from "@xyflow/react";
import TaskDependencyTree from "./TaskDependencyTree";

export default function ProjectTasks() {
  return (
    <div className="h-full flex-1">
      <div className="flex h-full flex-1 flex-col items-start gap-3">
        <ReactFlowProvider>
          <TaskDependencyTree />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
