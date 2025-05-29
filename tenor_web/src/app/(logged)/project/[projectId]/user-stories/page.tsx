"use client";

import { ProjectEpics } from "~/app/(logged)/project/[projectId]/user-stories/ProjectEpics";
import UserStoryDependencyTree from "~/app/(logged)/project/[projectId]/user-stories/UserStoryDependencyTree";
import UserStoryTable from "~/app/(logged)/project/[projectId]/user-stories/UserStoryTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import useConfirmation from "~/app/_hooks/useConfirmation";
import usePersistentState from "~/app/_hooks/usePersistentState";

const segmentedControlOptions = ["List", "Dependency Tree"];

export default function ProjectUserStories() {
  const confirm = useConfirmation();

  const [selectedView, setSelectedView] = usePersistentState(
    segmentedControlOptions[0],
    "userStoriesView",
  );
  const [allowSegmentedControlChange, setAllowSegmentedControlChange] =
    useState(true);

  const onSegmentedControlChange = async (value: string) => {
    // Do not proceed if the user has unsaved changes
    // and the user has not confirmed to discard them
    if (
      !allowSegmentedControlChange &&
      !(await confirm(
        "Are you sure?",
        "You have unsaved AI generated user stories. To save them, please accept them first.",
        "Discard",
        "Keep editing",
      ))
    ) {
      return;
    }
    setAllowSegmentedControlChange(true);
    setSelectedView(value);
  };

  return (
    <div className="flex w-full flex-row gap-4">
      {selectedView === "List" && (
        <div className="shrink-0 basis-[407px] border-r-2 pr-5 pt-0">
          <ProjectEpics />
        </div>
      )}

      <div className="flex flex-1 flex-col items-start gap-3">
        <div className="flex w-full flex-row flex-wrap items-start justify-between self-end">
          <h1 className="text-3xl font-semibold">User Stories</h1>
          <SegmentedControl
            options={segmentedControlOptions}
            selectedOption={selectedView}
            onChange={onSegmentedControlChange}
            className="min-w-96 max-w-96 xl:ml-auto"
          />
        </div>

        {selectedView === "List" && (
          <UserStoryTable
            setAllowSegmentedControlChange={setAllowSegmentedControlChange}
          />
        )}

        {selectedView === "Dependency Tree" && (
          <ReactFlowProvider>
            <UserStoryDependencyTree />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
