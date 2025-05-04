import { FlagsRequired } from "~/lib/defaultProjectValues";

export const tagPermissions: FlagsRequired = {
  flags: ["settings", "backlog"],
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

export const usersPermissions: FlagsRequired = {
  flags: [
    "backlog",
    "settings",
    "issues",
    "scrumboard",
    "performance",
    "sprints",
  ],

  optimistic: true,
};

export const settingsPermissions: FlagsRequired = {
  flags: ["settings"],
  optimistic: true,
};
