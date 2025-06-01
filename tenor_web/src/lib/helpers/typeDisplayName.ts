import type { AllBasicItemType } from "../types/firebaseSchemas";

export const displayNameByType: Record<AllBasicItemType, string> = {
  TS: "Task",
  IS: "Issue",
  US: "User Story",
  EP: "Epic",
  SP: "Sprint",
  PJ: "Project",
  IT: "Backlog item",
};
