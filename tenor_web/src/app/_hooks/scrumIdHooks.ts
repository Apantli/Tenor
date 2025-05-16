"use client";

const calculatePaddingNeeded = (maxNumber: number) => {
  // Minimum padding is 2 digits
  return Math.max(Math.floor(Math.log10(maxNumber)) + 1, 2);
};

export const useFormatUserStoryScrumId = () => {
  // FIXME: Id is not the counts, remove the 1
  return (scrumId: number) =>
    scrumId === -1
      ? "US"
      : `US${String(scrumId).padStart(calculatePaddingNeeded(1), "0")}`;
};

export const useFormatEpicScrumId = () => {
  // FIXME: Id is not the counts, remove the 1
  return (scrumId: number | undefined) =>
    scrumId == undefined || scrumId == 0
      ? "No Epic"
      : `EP${String(scrumId).padStart(calculatePaddingNeeded(1), "0")}`;
};

export const useFormatSprintNumber = () => {
  return (sprintNumber: number | undefined) => {
    if (sprintNumber === undefined) return "Unassigned";
    return `Sprint ${sprintNumber}`;
  };
};

export const useFormatTaskScrumId = () => {
  // FIXME: Id is not the counts, remove the 1
  return (scrumId: number) =>
    scrumId === -1
      ? "TS"
      : `TS${String(scrumId).padStart(calculatePaddingNeeded(1), "0")}`;
};

export const useFormatIssueScrumId = () => {
  // FIXME: Id is not the counts, remove the 1
  return (issueId: number) =>
    issueId === -1
      ? "IS"
      : `IS${String(issueId).padStart(calculatePaddingNeeded(1), "0")}`;
};
