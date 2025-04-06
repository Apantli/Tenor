export const useFormatUserStoryScrumId = () => {
  return (scrumId: number) => `US${String(scrumId).padStart(3, "0")}`;
};

export const useFormatEpicScrumId = () => {
  return (scrumId: number) => `EP${String(scrumId).padStart(2, "0")}`;
};

export const useFormatTaskScrumId = () => {
  return (scrumId: number) => `TS${String(scrumId).padStart(3, "0")}`;
};
