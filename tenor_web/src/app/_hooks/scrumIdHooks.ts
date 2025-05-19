"use client";

const calculatePaddingNeeded = (maxNumber: number) => {
  // Minimum padding is 2 digits
  return Math.max(Math.floor(Math.log10(maxNumber)) + 1, 2);
};

export const useFormatUserStoryScrumId = () => {
  // FIXME: Id is not the counts, remove the 1
  return (scrumId: number) =>
    `US${String(scrumId).padStart(calculatePaddingNeeded(1), "0")}`;
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
    `TS${String(scrumId).padStart(calculatePaddingNeeded(1), "0")}`;
};

export const useFormatIssueScrumId = () => {
  // FIXME: Id is not the counts, remove the 1
  return (issueId: number) =>
    `IS${String(issueId).padStart(calculatePaddingNeeded(1), "0")}`;
};

export const useFormatAnyScrumId = () => {
  const formatUserStoryScrumId = useFormatUserStoryScrumId();
  const formatEpicScrumId = useFormatEpicScrumId();
  const formatTaskScrumId = useFormatTaskScrumId();
  const formatIssueScrumId = useFormatIssueScrumId();

  return (scrumId: number, type: "US" | "EP" | "TS" | "IS") => {
    switch (type) {
      case "US":
        return formatUserStoryScrumId(scrumId);
      case "EP":
        return formatEpicScrumId(scrumId);
      case "TS":
        return formatTaskScrumId(scrumId);
      case "IS":
        return formatIssueScrumId(scrumId);
    }
  };
};
