"use client";
import { api } from '~/trpc/react';
import ProgressBar from './ProgressBar';
import AssignUsersList from './specific-pickers/AssignUsersList';
import LoadingSpinner from './LoadingSpinner';

interface StatusType {
  id: string;
  name: string;
  marksTaskAsDone: boolean;
}

function ProjectStatus({projectId}: {projectId: string}) {
  const {data: tasks, isLoading: isLoadingTasks } = api.tasks.getTasks.useQuery({ projectId });
  const {data: statuses, isLoading: isLoadingStatus } = api.settings.getStatusTypes.useQuery({ projectId});
  const {data: issues } = api.issues.getAllIssues.useQuery({ projectId });
  const {data: userStory } = api.userStories.getUserStories.useQuery({ projectId });
  const {data: currentSpring, isPending} = api.sprints.getActiveSprint.useQuery({ projectId });

  // First filter the tasks, issues and US to get the active ones
  const activeTasks = tasks?.filter((task) => task.deleted !== true) ?? [];
  const activeIssues = issues?.filter((issue) => issue.deleted !== true) ?? [];
  const activeUserStories = userStory?.filter((us) => us.deleted !== true) ?? [];

  const sprintIssuesIds = new Set(activeIssues.filter((issue) => issue.sprintId === currentSpring?.id).map((issue) => issue.id));

  const sprintUserStoriesIds = new Set(activeUserStories.filter((us) => us.sprintId === currentSpring?.id).map((us) => us.id));
  
  const filteredTasks = activeTasks.filter(task =>
    sprintIssuesIds.has(task.itemId) || sprintUserStoriesIds.has(task.itemId)
  );

  // Get the statuses
  const statusMap = statuses?.reduce((acc, status) => {
    acc[status.id] = status;
    return acc;
  }, {} as Record<string, StatusType>) ?? {};

  // Get the completed tasks
  const completedTasks = filteredTasks.filter(task => 
    statusMap[task.statusId]?.marksTaskAsDone === true
  );

  if (isLoadingTasks || isLoadingStatus || isPending) {
    return <LoadingSpinner color="primary" />;
  }
  
  return (
    <>
      <ActiveSprint projectId={projectId} currentSprintId={currentSpring?.id} />
      <ProgressStatusBar
        taskCount={filteredTasks.length ?? 0}
        completedCount={completedTasks.length ?? 0}
      />
      <div className="flex items-center gap-2 justify-between">
        <ProjectCollaborators projectId={projectId} />
        <RemaniningTimePeriod projectId={projectId} currentSprintId={currentSpring?.id} />
      </div>
    </>
  )
}

function ActiveSprint({ projectId, currentSprintId }: { projectId: string; currentSprintId?: string }) {
  // Only fetch sprint if currentSprintId is provided
  const shouldFetchSprint = !!currentSprintId;
  const { data: sprint, isLoading: isLoadingSprint } = api.sprints.getSprint.useQuery(
    {projectId, sprintId: currentSprintId!},
    { enabled: shouldFetchSprint }
  );

  let sprintTitle = "";
  if (sprint) {
    if (sprint.description === "") {
      sprintTitle = "Sprint " + sprint.number;
    } else {
      sprintTitle = "Sprint " + sprint.number + ": " + sprint.description;
    }
  } else {
    sprintTitle = "No active sprint";
  }

  if (isLoadingSprint) {
    return <LoadingSpinner color="primary" />;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">Status</h2>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold truncate whitespace-nowrap overflow-hidden max-w-[90%]">
          {sprintTitle}
        </span>
      </div>
    </div>
  );
}

function RemaniningTimePeriod ({projectId, currentSprintId}: {projectId: string; currentSprintId?: string}) {
  // Only fetch sprint if currentSprintId is provided
  const shouldFetchSprint = !!currentSprintId;
  const { data: sprint, isLoading } = api.sprints.getSprint.useQuery(
    {projectId, sprintId: currentSprintId!},
    { enabled: shouldFetchSprint }
  );
  const {data: sprints, isLoading: isLoadingSprint} = api.sprints.getProjectSprintsOverview.useQuery({ projectId });

  //Check the active sprint from the current project from the project settings
  const currentSprint = sprint?.id.toString();

  let remainingDays: number | null = null;

  //Compare the sprints numbers with the sprint currentSprintId
  if (sprints && currentSprint != null) {
    for (const sprint of sprints) {
      if (sprint.id.toString() === currentSprint) {
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
    return <LoadingSpinner color="primary" />;
  }
  
  return (
    <>
      {message && (
        <p className="text-m font-semibold text-gray-500"><span className='text-app-primary'>On track •</span> {message}</p>
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
    return <LoadingSpinner color="primary" />;
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