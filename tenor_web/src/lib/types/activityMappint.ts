import { useMemo } from "react";
import type { AllBasicItemType, ProjectActivity, WithId } from "./firebaseSchemas";
import { api } from "~/trpc/react";

export interface ActivityItem {
  id: string;
  name: string;
  type: AllBasicItemType;
  scrumId?: number
  activity: WithId<ProjectActivity>;
}

export function useActivityItemsMap(projectId: string) {
  const { data: activitiesDetails } = api.projects.getActivityDetails.useQuery({ projectId });

  return useMemo(() => {
    const map: Record<string, ActivityItem> = {};

    activitiesDetails?.tasksActivities.forEach((task) => {
      map[task.id] = {
        id: task.id,
        name: task.name,
        type: "TS",
        scrumId: task.scrumId,
        activity: task.activity,
      }
    })

    activitiesDetails?.userStoriesActivities.forEach((userStory) => {
      map[userStory.id] = {
        id: userStory.id,
        name: userStory.name,
        type: "US",
        scrumId: userStory.scrumId,
        activity: userStory.activity,
      }
    })

    activitiesDetails?.epicsActivities.forEach((epic) => {
      map[epic.id] = {
        id: epic.id,
        name: epic.name,
        type: "EP",
        scrumId: epic.scrumId,
        activity: epic.activity,
      }
    })

    activitiesDetails?.issuesActivities.forEach((issue) => {
      map[issue.id] = {
        id: issue.id,
        name: issue.name,
        type: "IS",
        scrumId: issue.scrumId,
        activity: issue.activity,
      }
    })

    activitiesDetails?.sprintsActivities.forEach((sprint) => {
      map[sprint.id] = {
        id: sprint.id,
        name: sprint.description,
        type: "SP",
        activity: sprint.activity,
      }
    })

    return map;
  }, [activitiesDetails]);
}