"use client";

import { useEffect } from 'react';
import { api } from '~/trpc/react';
import ProgressBar from './ProgressBar';
import AssignUsersList from './specific-pickers/AssignUsersList';

function ProjectStatus({projectId}: {projectId: string}) {

  const {data: tasks, isLoading, refetch: refetchTasks} = api.tasks.getTasks.useQuery({ projectId }, {enabled: false});
  const {data: statuses, isLoading: isLoadingStatus, refetch: refetchStatuses} = api.settings.getStatusTypes.useQuery({ projectId}, {enabled: false});

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refetchTasks();
        await refetchStatuses();
      } catch (error) {
        console.error('Failed to fetch tasks', error);
      }
    };
    void fetchData();
  }, [refetchTasks, refetchStatuses]);

  const activeTasks = tasks?.filter((task) => task.deleted !== true) ?? [];

  const statusMap = statuses
    ? Object.fromEntries(statuses.map((status) => [status.id, status.marksTaskAsDone])) : {};

  const completedCount = activeTasks.reduce((count, task) => {
    return statusMap[task.statusId] ? count + 1 : count;
  }, 0);

  const taskCount = activeTasks.length;

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
      <div className="flex items-center gap-2 justify-between">
        <ProjectCollaborators projectId={projectId} />
        <RemaniningTimePeriod projectId={projectId} />
      </div>
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

  if (isLoading || isLoadingSprint) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      {message && (
        <p className="text-m font-semibold text-gray-500"><span className='text-overview-text-color'>On track •</span> {message}</p>
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

function ProjectCollaborators({projectId}: {projectId: string}) {
  const {data: projectCollaborators, isLoading} = api.users.getUsers.useQuery({ projectId });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Map projectCollaborators to the User type expected by AssignUsersList
  const mappedUsers = projectCollaborators?.map((u) => ({
    uid: u.id ?? u.id, // Use 'id' or fallback to 'uid' if available
    displayName: u.displayName,
    photoURL: u.photoURL,
  }));

  return (
    <AssignUsersList users={mappedUsers} />
  )
}

export default ProjectStatus;