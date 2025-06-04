"use client";

import type { AllBasicItemType } from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";

const calculatePaddingNeeded = (maxNumber: number) => {
  // Minimum padding is 2 digits
  return Math.max(Math.floor(Math.log10(maxNumber)) + 1, 2);
};

export const useFormatUserStoryScrumId = (projectId: string) => {
  const { data: userStoryCount } = api.userStories.getUserStoryCount.useQuery({
    projectId: projectId,
  });

  if (userStoryCount === undefined) {
    return (_: number) => "US...";
  }

  return (scrumId: number) =>
    scrumId === -1
      ? "US"
      : `US${String(scrumId).padStart(calculatePaddingNeeded(userStoryCount), "0")}`;
};

export const useFormatGenericBacklogItemScrumId = (projectId: string) => {
  const { data: backlogItemsCount } =
    api.backlogItems.getBacklogItemCount.useQuery({
      projectId: projectId,
    });

  if (backlogItemsCount === undefined) {
    return (_: number) => "IT...";
  }

  return (scrumId: number) =>
    scrumId === -1
      ? "IT"
      : `IT${String(scrumId).padStart(calculatePaddingNeeded(backlogItemsCount), "0")}`;
};

export const useFormatEpicScrumId = (projectId: string) => {
  const { data: epicCount } = api.epics.getEpicCount.useQuery({
    projectId: projectId,
  });

  if (epicCount === undefined) {
    return (scrumId: number | undefined) =>
      scrumId == undefined || scrumId == 0 ? "No Epic" : "EP...";
  }

  return (scrumId: number | undefined) =>
    scrumId == undefined || scrumId == 0
      ? "No Epic"
      : `EP${String(scrumId).padStart(calculatePaddingNeeded(epicCount), "0")}`;
};

export const useFormatSprintNumber = () => {
  return (sprintNumber: number | undefined) => {
    if (sprintNumber === undefined) return "Unassigned";
    return `Sprint ${sprintNumber}`;
  };
};

export const useFormatTaskScrumId = (projectId: string) => {
  const { data: taskCount } = api.tasks.getTaskCount.useQuery({
    projectId: projectId,
  });

  if (taskCount === undefined) {
    return (_: number) => "TS...";
  }

  return (scrumId: number) =>
    scrumId === -1
      ? "TS"
      : `TS${String(scrumId).padStart(calculatePaddingNeeded(taskCount), "0")}`;
};

export const useFormatIssueScrumId = (projectId: string) => {
  const { data: issueCount } = api.issues.getIssueCount.useQuery({
    projectId: projectId,
  });

  if (issueCount === undefined) {
    return (_: number) => "IS...";
  }

  return (issueId: number) =>
    issueId === -1
      ? "IS"
      : `IS${String(issueId).padStart(calculatePaddingNeeded(issueCount), "0")}`;
};

export const useFormatAnyScrumId = (projectId: string) => {
  const formatUserStoryScrumId = useFormatUserStoryScrumId(projectId);
  const formatEpicScrumId = useFormatEpicScrumId(projectId);
  const formatTaskScrumId = useFormatTaskScrumId(projectId);
  const formatIssueScrumId = useFormatIssueScrumId(projectId);
  const formatGenericBacklogItemScrumId =
    useFormatGenericBacklogItemScrumId(projectId);

  return (scrumId: number, type: AllBasicItemType) => {
    switch (type) {
      case "US":
        return formatUserStoryScrumId(scrumId);
      case "EP":
        return formatEpicScrumId(scrumId);
      case "TS":
        return formatTaskScrumId(scrumId);
      case "IS":
        return formatIssueScrumId(scrumId);
      case "IT":
        return formatGenericBacklogItemScrumId(scrumId);
      case "SP":
        return `Sprint ${scrumId}`; // Sprints are usually just numbers
    }
    // If we reach here, it means the type was not recognized, plase add a new case above
    throw new Error(`Unknown item type: ${type}`);
  };
};
