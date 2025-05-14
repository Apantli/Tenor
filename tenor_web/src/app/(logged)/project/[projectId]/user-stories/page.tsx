"use client";

import { ProjectEpics } from "~/app/_components/sections/ProjectEpics";
import UserStoryDependencyDiagram from "~/app/_components/sections/UserStoryDependencyDiagram";
import UserStoryTable from "~/app/_components/sections/UserStoryTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";

export default function ProjectUserStories() {
  const [selectedView, setSelectedView] = useState("table");
  const viewOptions = ["table", "diagram"];

  return (
    <div className="flex w-full flex-col gap-4">
      <SegmentedControl
        options={viewOptions}
        selectedOption={selectedView}
        onChange={setSelectedView}
        className="w-fit"
      />

      {selectedView === "table" ? (
        <div className="flex w-full flex-row gap-4">
          <div className="shrink-0 basis-[407px] border-r-2 pr-5 pt-0">
            <ProjectEpics />
          </div>
          <UserStoryTable />
        </div>
      ) : (
        <ReactFlowProvider>
          <UserStoryDependencyDiagram />
        </ReactFlowProvider>
      )}
    </div>
  );
}
