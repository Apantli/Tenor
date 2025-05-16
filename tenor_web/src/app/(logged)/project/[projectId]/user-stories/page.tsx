"use client";

import { ProjectEpics } from "~/app/_components/sections/ProjectEpics";
import UserStoryDependencyTree from "~/app/_components/sections/UserStoryDependencyDiagram";
import UserStoryTable from "~/app/_components/sections/UserStoryTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";

export default function ProjectUserStories() {
  const [selectedView, setSelectedView] = useState("List");
  const viewOptions = ["List", "Dependency Tree"];

  return (
    <div className="flex w-full flex-col">
      <SegmentedControl
        options={viewOptions}
        selectedOption={selectedView}
        onChange={setSelectedView}
        className="w-1/4 min-w-96 self-end"
      />

      {selectedView === "List" ? (
        <div className="flex w-full flex-row gap-4">
          <div className="shrink-0 basis-[407px] border-r-2 pr-5 pt-0">
            <ProjectEpics />
          </div>
          <UserStoryTable />
        </div>
      ) : (
        <ReactFlowProvider>
          <UserStoryDependencyTree />
        </ReactFlowProvider>
      )}
    </div>
  );
}
