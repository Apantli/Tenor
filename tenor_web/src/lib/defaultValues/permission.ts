import type { z } from "zod";
import type { RoleSchema } from "../types/zodFirebaseSchema";
import type { Permission } from "../types/firebaseSchemas";

export interface FlagsRequired {
  flags: (
    | "settings"
    | "performance"
    | "sprints"
    | "scrumboard"
    | "issues"
    | "backlog"
    | "retrospective"
    | "overview"
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
    "overview",
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
    "overview",
  ],

  optimistic: true,
};

export const activityPermissions: FlagsRequired = {
  flags: ["backlog"],
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

export const retrospectivePermissions: FlagsRequired = {
  flags: ["retrospective"],
  optimistic: true,
};

export const checkPermissions = (
  flags: FlagsRequired,
  roleSchema: z.infer<typeof RoleSchema>,
) => {
  let userPermission: Permission = flags.optimistic ? 0 : 2;
  // Go through the flags and get the minimum permission
  flags.flags.forEach((flag) => {
    if (flags.optimistic) {
      userPermission = Math.max(
        userPermission,
        roleSchema[flag as keyof typeof roleSchema] as Permission,
      ) as Permission;
    } else {
      userPermission = Math.min(
        userPermission,
        roleSchema[flag as keyof typeof roleSchema] as Permission,
      ) as Permission;
    }
  });
  return userPermission;
};
