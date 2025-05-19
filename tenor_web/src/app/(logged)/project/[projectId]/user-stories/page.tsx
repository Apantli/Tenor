"use client";

import { ProjectEpics } from "~/app/_components/sections/ProjectEpics";
import UserStoryDependencyTree from "~/app/_components/sections/UserStoryDependencyTree";
import UserStoryTable from "~/app/_components/sections/UserStoryTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { SelectedNodeProvider } from "~/app/_hooks/useSelectedNode";

export default function ProjectUserStories() {
  const [selectedView, setSelectedView] = useState(
    localStorage.getItem("user-stories-view") ?? "List",
  );
  const viewOptions = ["List", "Dependency Tree"];

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full flex-row items-center justify-between self-end">
        {selectedView != "List" && (
          <h1 className="text-3xl font-semibold">User Stories</h1>
        )}
        <SegmentedControl
          options={viewOptions}
          selectedOption={selectedView}
          onChange={(value) => {
            setSelectedView(value);
            localStorage.setItem("user-stories-view", value);
          }}
          className="ml-auto w-1/4 min-w-96"
        />
      </div>

      {selectedView === "List" ? (
        <div className="flex w-full flex-row gap-4">
          <div className="shrink-0 basis-[407px] border-r-2 pr-5 pt-0">
            <ProjectEpics />
          </div>
          <UserStoryTable />
        </div>
      ) : (
        <ReactFlowProvider>
          <SelectedNodeProvider>
            <UserStoryDependencyTree />
          </SelectedNodeProvider>
        </ReactFlowProvider>
      )}
    </div>
  );
}
