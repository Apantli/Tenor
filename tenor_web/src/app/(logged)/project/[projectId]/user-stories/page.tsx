"use client";

import { ProjectEpics } from "~/app/(logged)/project/[projectId]/user-stories/ProjectEpics";
import UserStoryDependencyTree from "~/app/(logged)/project/[projectId]/user-stories/UserStoryDependencyTree";
import UserStoryTable from "~/app/(logged)/project/[projectId]/user-stories/UserStoryTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import useConfirmation from "~/app/_hooks/useConfirmation";
import usePersistentState from "~/app/_hooks/usePersistentState";
import { cn } from "~/lib/helpers/utils";
import { useWindowRect } from "~/app/_hooks/windowHooks";

const segmentedControlOptions = ["List", "Dependency Tree"];

export default function ProjectUserStories() {
  const confirm = useConfirmation();

  const [selectedView, setSelectedView] = usePersistentState(
    segmentedControlOptions[0],
    "userStoriesView",
  );
  // State to control the visibility of the segmented control for smooth animations:
  // ensures the correct view is displayed when switching between views.
  const [selectedViewState, setSelectedViewState] = useState(selectedView);

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
    setSelectedViewState(value);
  };

  useEffect(() => {
    if (selectedView === selectedViewState) {
      return;
    }
    // Update segmented control view only after the new segmented control is rendered
    setTimeout(() => {
      setSelectedView(selectedViewState);
    }, 10);
  }, [selectedViewState]);

  const { isTablet } = useWindowRect();

  return (
    <div className="relative flex h-full w-full flex-row gap-0">
      {selectedViewState === "List" && (
        <>
          <div
            className={cn(
              "shrink-0 basis-[426px] border-r-2 bg-white pr-5 pt-10 xl:relative",
              {
                "w-auto basis-[50px]": !showEpics,
                "absolute left-0 z-[100] h-full w-[426px] min-w-[426px]":
                  showEpics,
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
        className={cn("flex flex-1 flex-col items-start gap-3", {
          "pl-[72px] xl:pl-0": showEpics && selectedViewState === "List",
          "overflow-hidden pb-10 pt-10": selectedViewState === "List",
        })}
      >
        {selectedViewState === "List" && (
          <div
            className={cn("flex w-full flex-1 flex-col pl-5 pr-10", {
              "lg:px-10 lg:pr-10 xl:px-20": !showEpics || isTablet,
            })}
          >
            <div className="flex w-full flex-row flex-wrap items-start justify-between self-end pb-3">
              <h1 className="text-3xl font-semibold">User Stories</h1>
              <SegmentedControl
                options={segmentedControlOptions}
                selectedOption={selectedView}
                onChange={onSegmentedControlChange}
                className="min-w-96 max-w-96 xl:ml-auto"
              />
            </div>
            <UserStoryTable
              showEpics={showEpics}
              setAllowSegmentedControlChange={setAllowSegmentedControlChange}
            />
          </div>
        )}

        {selectedViewState === "Dependency Tree" && (
          <ReactFlowProvider>
            <UserStoryDependencyTree
              segmentedControl={
                <SegmentedControl
                  options={segmentedControlOptions}
                  selectedOption={selectedView}
                  onChange={onSegmentedControlChange}
                  className={cn(
                    "mr-[8px] min-w-96 max-w-96 xl:ml-auto xl:mr-[48px]",
                    {
                      "xl:mr-[8px]": showEpics,
                    },
                  )}
                />
              }
            />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
