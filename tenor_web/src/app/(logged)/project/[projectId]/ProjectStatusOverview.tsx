"use client";
import { api } from "~/trpc/react";
import ProgressBar from "../../../_components/ProgressBar";
import AssignUsersList from "../../../_components/inputs/pickers/AssignUsersList";
import LoadingSpinner from "../../../_components/LoadingSpinner";

function projectStatusOverview({ projectId }: { projectId: string }) {
  const { data: projectStatus, isLoading } =
    api.projects.getProjectStatus.useQuery({ projectId });
  const { data: sprints, isLoading: isLoadingSprint } =
    api.sprints.getProjectSprintsOverview.useQuery({ projectId });

  let sprintTitle = "";
  if (projectStatus?.currentSprintId) {
    if (projectStatus?.currentSprintDescription === "") {
      sprintTitle = "Sprint " + projectStatus?.currentSprintNumber;
    } else {
      sprintTitle =
        "Sprint " +
        projectStatus?.currentSprintNumber +
        ": " +
        projectStatus?.currentSprintDescription;
    }
  } else {
    sprintTitle = "No active sprint";
  }

  let remainingDays: number | null = null;

  //Compare the sprints numbers with the sprint currentSprintId
  if (sprints && projectStatus?.currentSprintId != null) {
    for (const sprint of sprints) {
      if (sprint.id.toString() === projectStatus?.currentSprintId) {
        const endDate = new Date(sprint.endDate);
        const today = new Date();

        const diffTime = endDate.getTime() - today.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        break;
      }
    }
  }

  let message = null;

  if (remainingDays !== null) {

    // Calculate if the total tasks are below half
    const isBelowHalf = projectStatus?.completedCount !== undefined && projectStatus?.taskCount > 0
    ? projectStatus.completedCount < projectStatus?.taskCount * 0.5
    : false;

    if (remainingDays <= 0) {
      message = "The sprint is complete.";
    } else {
      const months = Math.floor(remainingDays / 30);
      const weeks = Math.floor((remainingDays % 30) / 7);
      const days = remainingDays % 7;

      const parts = [];
      if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
      if (weeks > 0) parts.push(`${weeks} week${weeks !== 1 ? "s" : ""}`);
      if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);

      if (remainingDays <= 3 && isBelowHalf) {
        message = (
          <>
            <span className="text-app-primary">Running behind •</span> {parts.join(", ")} left.
          </>
      )} else {
        message = (
          <>
            <span className="text-app-primary">On track •</span> {parts.join(", ")} left.
          </>
        );
      }
    }
  }

  if (isLoading || isLoadingSprint) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Status</h2>
        <div className="flex items-center gap-2">
          <span className="max-w-[90%] overflow-hidden truncate whitespace-nowrap text-lg font-semibold">
            {sprintTitle}
          </span>
        </div>
      </div>
      <ProgressStatusBar
        taskCount={projectStatus?.taskCount ?? 0}
        completedCount={projectStatus?.completedCount ?? 0}
      />
      <div className="mt-4 flex flex-col items-center justify-between gap-2 md:flex-row md:items-start">
        <div className="w-full">
          <AssignUsersList users={projectStatus?.assignedUssers} />
        </div>
        <div className="mt-4 flex w-full justify-start md:mt-0 md:justify-end">
          <p className="text-m font-semibold text-gray-500">
            {message && (
              <>
                {message}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressStatusBar({
  taskCount,
  completedCount,
}: {
  taskCount: number;
  completedCount: number;
}) {
  const displayValue = `of tasks completed`;
  const progressBarColor = "#13918A";
  const emptyBarColor = "#B1B8BE";

  return (
    // contianer of the project status
    <div>
      <ProgressBar
        min={0}
        max={taskCount}
        value={completedCount}
        progressBarColor={progressBarColor}
        emptyBarColor={emptyBarColor}
        displayValue={displayValue}
      />
    </div>
  );
}

export default projectStatusOverview;
