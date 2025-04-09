// FIXME: These padding numbers are temporary
// Decided to make these helper functions hooks to be able to call make an API call here (to query count)

export const useFormatUserStoryScrumId = () => {
  return (scrumId: number) => `US${String(scrumId).padStart(3, "0")}`;
};

export const useFormatEpicScrumId = () => {
  return (scrumId: number | undefined) =>
    (scrumId == undefined || scrumId == 0) ? "No Epic" : `EP${String(scrumId).padStart(2, "0")}`;
};

export const useFormatSprintNumber = () => {
  return (sprintNumber: number | undefined) => {
    if (sprintNumber === undefined) return "Unassigned";
    return "Sprint " + sprintNumber;
  };
};

export const useFormatTaskScrumId = () => {
  return (scrumId: number) => `TS${String(scrumId).padStart(3, "0")}`;
};
