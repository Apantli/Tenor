"use client";

import { ProjectEpics } from "~/app/_components/sections/ProjectEpics";
import UserStoryDependencyTree from "~/app/_components/sections/UserStoryDependencyTree";
import UserStoryTable from "~/app/_components/sections/UserStoryTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";

const segmentedControlOptions = ["List", "Dependency Tree"];

export default function ProjectUserStories() {
  const [selectedView, setSelectedView] = useState(
    localStorage.getItem("user-stories-view") ?? segmentedControlOptions[0],
  );
  const onSegmentedControlChange = (value: string) => {
    setSelectedView(value);
    localStorage.setItem("user-stories-view", value);
  };

  return (
    <div className="flex w-full flex-row gap-4">
      {selectedView === "List" && (
        <div className="shrink-0 basis-[407px] border-r-2 pr-5 pt-0">
          <ProjectEpics />
        </div>
      )}

      <div className="flex flex-1 flex-col items-start gap-3">
        <div className="flex w-full flex-row items-center justify-between self-end">
          <h1 className="text-3xl font-semibold">User Stories</h1>
          <SegmentedControl
            options={segmentedControlOptions}
            selectedOption={selectedView}
            onChange={onSegmentedControlChange}
            className="ml-auto w-1/4 min-w-96"
          />
        </div>

        {selectedView === "List" && <UserStoryTable />}

        {selectedView === "Dependency Tree" && (
          <ReactFlowProvider>
            <UserStoryDependencyTree />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
