"use client";
import { api } from '~/trpc/react';
import ProgressBar from './ProgressBar';
import AssignUsersList from './specific-pickers/AssignUsersList';
import LoadingSpinner from './LoadingSpinner';

function ProjectStatus({projectId}: {projectId: string}) {

  const {data: ProjectStatus, isLoading } = api.projects.getProjectStatus.useQuery({ projectId });
  const {data: sprints, isLoading: isLoadingSprint} = api.sprints.getProjectSprintsOverview.useQuery({ projectId });

  if (isLoading || isLoadingSprint) {
    return <LoadingSpinner color="primary" />;
  }

  let sprintTitle = "";
  if (ProjectStatus?.currentSprintId) {
    if (ProjectStatus?.currentSprintDescription === "") {
      sprintTitle = "Sprint " + ProjectStatus?.currentSprintNumber;
    } else {
      sprintTitle = "Sprint " + ProjectStatus?.currentSprintNumber + ": " + ProjectStatus?.currentSprintDescription;
    }
  } else {
    sprintTitle = "No active sprint";
  }

  let remainingDays: number | null = null;

  //Compare the sprints numbers with the sprint currentSprintId
  if (sprints && ProjectStatus?.currentSprintId != null) {
    for (const sprint of sprints) {
      if (sprint.id.toString() === ProjectStatus?.currentSprintId) {
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
    if (remainingDays <= 0) {
      message = "The sprint is complete.";
    } else {
      const months = Math.floor(remainingDays / 30);
      const weeks = Math.floor((remainingDays % 30) / 7);
      const days = remainingDays % 7;

      const parts = [];
      if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
      if (weeks > 0) parts.push(`${weeks} week${weeks !== 1 ? 's' : ''}`);
      if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

      message = `${parts.join(', ')} left.`;
    }
  }
  
  return (
    <div className='w-full h-full flex flex-col gap-5'>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Status</h2>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold truncate whitespace-nowrap overflow-hidden max-w-[90%]">
            {sprintTitle}
          </span>
        </div>
      </div>
      <ProgressStatusBar
        taskCount={ProjectStatus?.taskCount ?? 0}
        completedCount={ProjectStatus?.completedCount ?? 0}
      />
      <div className="flex flex-col md:flex-row md:items-start items-center gap-2 justify-between mt-4">
        <div className='w-full'>
          <AssignUsersList users={ProjectStatus?.assignedUssers} />
        </div>
        <div className='w-full justify-start md:justify-end flex md:mt-0 mt-4'>
          {message && (
            <p className="text-m font-semibold text-gray-500"><span className='text-app-primary'>On track •</span> {message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ProgressStatusBar({ 
  taskCount,
  completedCount,
 }: { 
  taskCount: number,
  completedCount: number,
}) {

  const displayValue = `of tasks completed`;
  const progressBarColor = '#13918A';
  const emptyBarColor = '#B1B8BE';

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
  )
}

export default ProjectStatus;