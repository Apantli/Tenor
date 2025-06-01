"use client";

import { ProjectEpics } from "~/app/(logged)/project/[projectId]/user-stories/ProjectEpics";
import UserStoryDependencyTree from "~/app/(logged)/project/[projectId]/user-stories/UserStoryDependencyTree";
import UserStoryTable from "~/app/(logged)/project/[projectId]/user-stories/UserStoryTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import useConfirmation from "~/app/_hooks/useConfirmation";
import usePersistentState from "~/app/_hooks/usePersistentState";
import { cn } from "~/lib/utils";

const segmentedControlOptions = ["List", "Dependency Tree"];

export default function ProjectUserStories() {
  const confirm = useConfirmation();

  const [selectedView, setSelectedView] = usePersistentState(
    segmentedControlOptions[0],
    "userStoriesView",
  );

  const [showEpics, setShowEpics] = usePersistentState(true, "showEpics");

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
    <div className="relative flex h-full w-full flex-row gap-4">
      {selectedView === "List" && (
        <>
          <div
            className={cn(
              "shrink-0 basis-[407px] border-r-2 bg-white pr-5 pt-10 xl:relative",
              {
                "w-auto basis-[50px]": !showEpics,
                "absolute left-0 z-[100] h-full w-[407px]": showEpics,
              },
            )}
          >
            <ProjectEpics setShowEpics={setShowEpics} showEpics={showEpics} />
          </div>
          {showEpics && (
            <div
              className="absolute left-0 top-0 z-[99] h-full w-full bg-black/10 xl:hidden"
              onClick={() => setShowEpics(false)}
            />
          )}
        </>
      )}

      <div
        className={cn("flex flex-1 flex-col items-start gap-3 pr-10 pt-10", {
          "pl-[88px] xl:pl-0": showEpics,
          "pl-10": selectedView === "Dependency Tree",
        })}
      >
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
            showEpics={showEpics}
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
