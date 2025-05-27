export interface FlagsRequired {
  flags: (
    | "settings"
    | "performance"
    | "sprints"
    | "scrumboard"
    | "issues"
    | "backlog"
    | "retrospective"
  )[];

  // false/null/pesimistic gets the lowest permission
  // true/optimistic gets the highest permission
  optimistic?: boolean;
}

export const tagPermissions: FlagsRequired = {
  flags: ["settings", "backlog", "issues"],
  optimistic: true,
};

export const generalPermissions: FlagsRequired = {
  flags: [
    "backlog",
    "settings",
    "issues",
    "scrumboard",
    "performance",
    "sprints",
    "retrospective",
  ],

  optimistic: true,
};

export const backlogPermissions: FlagsRequired = {
  flags: ["backlog"],
  optimistic: true,
};

export const issuePermissions: FlagsRequired = {
  flags: ["issues"],
  optimistic: true,
};

export const taskPermissions: FlagsRequired = {
  flags: ["issues", "backlog"],
  optimistic: true,
};

export const usersPermissions: FlagsRequired = {
  flags: [
    "backlog",
    "settings",
    "issues",
    "scrumboard",
    "performance",
    "sprints",
    "retrospective",
  ],

  optimistic: true,
};

export const settingsPermissions: FlagsRequired = {
  flags: ["settings"],
  optimistic: true,
};

export const performancePermissions: FlagsRequired = {
  flags: ["performance"],
  optimistic: true,
};

export const sprintPermissions: FlagsRequired = {
  flags: ["sprints", "settings"],
  optimistic: true,
};

export const reviewPermissions: FlagsRequired = {
  flags: ["retrospective"],
  optimistic: true,
};
