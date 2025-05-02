"use client";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";

const calculatePaddingNeeded = (maxNumber: number) => {
  // Minimum padding is 2 digits
  return Math.max(Math.floor(Math.log10(maxNumber)) + 1, 2);
};

export const useFormatUserStoryScrumId = () => {
  const { projectId } = useParams();
  const { data: userStoryCount } = api.userStories.getUserStoryCount.useQuery({
    projectId: projectId as string,
  });

  if (userStoryCount === undefined) {
    return (_: number) => "";
  }

  return (scrumId: number) =>
    `US${String(scrumId).padStart(calculatePaddingNeeded(userStoryCount), "0")}`;
};

export const useFormatEpicScrumId = () => {
  const { projectId } = useParams();
  const { data: epicCount } = api.epics.getEpicCount.useQuery({
    projectId: projectId as string,
  });

  if (epicCount === undefined) {
    return (scrumId: number | undefined) =>
      scrumId == undefined || scrumId == 0 ? "No Epic" : "";
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

export const useFormatTaskScrumId = () => {
  const { projectId } = useParams();
  const { data: taskCount } = api.tasks.getTaskCount.useQuery({
    projectId: projectId as string,
  });
  if (taskCount === undefined) {
    return (_: number) => "";
  }

  return (scrumId: number) =>
    `TS${String(scrumId).padStart(calculatePaddingNeeded(taskCount), "0")}`;
};

export const useFormatIssueScrumId = () => {
  const { projectId } = useParams();
  const { data: issueCount } = api.issues.getIssueCount.useQuery({
    projectId: projectId as string,
  });
  if (issueCount === undefined) {
    return (_: number) => "";
  }

  return (issueId: number) =>
    `IS${String(issueId).padStart(calculatePaddingNeeded(issueCount), "0")}`;
};
