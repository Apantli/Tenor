import type { AllBasicItemType } from "../types/firebaseSchemas";

export const collectionNameByType: Record<AllBasicItemType, string> = {
  TS: "tasks",
  IS: "issues",
  US: "userStories",
  EP: "epics",
  SP: "sprints",
  PJ: "projects",
  IT: "backlogItems",
};

export const displayNameByType: Record<AllBasicItemType, string> = {
  TS: "Task",
  IS: "Issue",
  US: "User Story",
  EP: "Epic",
  SP: "Sprint",
  PJ: "Project",
  IT: "Backlog item",
};
