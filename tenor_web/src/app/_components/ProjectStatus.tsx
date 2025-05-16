"use client";

import { useState, useEffect } from 'react';
import { api } from '~/trpc/react';
import ProgressBar from './ProgressBar';

function ProjectStatus({projectId}: {projectId: string}) {

  const [completedCount, setCompletedCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  const {data: tasks, isLoading} = api.tasks.getTasks.useQuery({ projectId });
  const {data: statuses, isLoading: isLoadingStatus} = api.settings.getStatusTypes.useQuery({ projectId });

  //1. Need to call all the tasks from the project
  //2. Then filter the tasks by their status, if the task is deleted, then ignore it
  //3. Then filter the tasks by their status, if the task is completed, make a counter
  //4. Then take the counter and divide it by the total number of tasks
  //5. Then multiply it by 100 to get the percentage
  //6. Then set the progress to the percentage

  useEffect(() => {
    const calculateProgress = async () => {
      try {
        if (!tasks || tasks.length === 0) {
          setCompletedCount(0);
          setTaskCount(0);
          console.log("No tasks found for this project.");
          return;
        }

        console.log("Tasks:", tasks);

        // Ignore deleted tasks
        const activeTasks = (tasks).filter((task) => task.deleted !== true);

        if (activeTasks.length === 0) {
          setCompletedCount(0);
          setTaskCount(0);
          console.log("No active tasks.");
          return;
        }

        const statusMap = statuses
          ? Object.fromEntries(
              statuses.map((status) => [status.id, status.marksTaskAsDone])
            )
          : {};

        let completedCount = 0;

        for (const task of activeTasks) {
          if (statusMap[task.statusId]) {
            completedCount++;
          }
        }

        setCompletedCount(completedCount);
        setTaskCount(activeTasks.length);
        const percentage = ((completedCount / activeTasks.length) * 100).toFixed(1);
        console.log(`Progress: ${completedCount}/${activeTasks.length} (${percentage}%)`);}
      catch (error) {
        console.error("Error calculating progress:", error);
      }
    };
    void calculateProgress();
  }, [tasks, projectId]);

  if (isLoading || isLoadingStatus) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      <ActiveSprint projectId={projectId} />
      <ProgressStatusBar
        taskCount={taskCount}
        completedCount={completedCount}
      />
      <RemaniningTimePeriod projectId={projectId} />
    </>
  )
}

function ActiveSprint ({projectId}: {projectId: string}) {
  const {data: ActiveSprint, isLoading} = api.projects.getGeneralConfig.useQuery({ projectId });
  const {data: sprints, isLoading: isLoadingSprint} = api.sprints.getProjectSprintsOverview.useQuery({ projectId });

  const sprintId = ActiveSprint?.currentSprintId;

  const sprint = sprints?.find((sprint) => sprint.number.toString() === sprintId);

  if (isLoading || isLoadingSprint) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">Status</h2>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold truncate whitespace-nowrap overflow-hidden max-w-[90%]">Sprint {sprintId}: {sprint?.description} </span>
      </div>
    </div>
  )
}

function RemaniningTimePeriod ({projectId}: {projectId: string}) {
  const {data: activeSprintConfig, isLoading} = api.projects.getGeneralConfig.useQuery({ projectId });
  const {data: sprints, isLoading: isLoadingSprint} = api.sprints.getProjectSprintsOverview.useQuery({ projectId });

  //Check the active sprint from the current project from the project settings
  const currentSprintNumber = activeSprintConfig?.currentSprintId;

  let remainingDays: number | null = null;

  //Compare the sprints numbers with the sprint currentSprintId
  if (sprints && currentSprintNumber != null) {
    for (const sprint of sprints) {
      if (sprint.number.toString() === currentSprintNumber) {
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
      message = "El sprint ha finalizado.";
    } else {
      const months = Math.floor(remainingDays / 30);
      const weeks = Math.floor((remainingDays % 30) / 7);
      const days = remainingDays % 7;

      const parts = [];
      if (months > 0) parts.push(`${months} months${months !== 1 ? 'es' : ''}`);
      if (weeks > 0) parts.push(`${weeks} weeks${weeks !== 1 ? 's' : ''}`);
      if (days > 0) parts.push(`${days} days${days !== 1 ? 's' : ''}`);

      message = `On track • ${parts.join(', ')} left.`;
    }
  }

  if (isLoading || isLoadingSprint) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </>
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
  const emptyBarColor = '#D4DDE4';

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