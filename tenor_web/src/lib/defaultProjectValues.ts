import type { z } from "zod";
import type { Role, Settings, Size, Tag } from "./types/firebaseSchemas";
import type { Permission, RoleSchema } from "./types/zodFirebaseSchema";

export const emptySettings: Settings = {
  sprintDuration: 0,
  maximumSprintStoryPoints: 0,
  aiContext: {
    text: "",
    files: [],
    links: [],
  },
  storyPointSizes: [
    1, // XS
    2, // S
    3, // M
    4, // L
    5, // XL
    6, // XXL
  ],
  // requirementFocusTags: [],
  // requirementTypeTags: [],
  // backlogTags: [],
  // priorityTypes: [],
  // statusTabs: [],
  // roles: [],
};

export const sizeToColor: Record<Size, string> = {
  XS: "#4A90E2", // Light Blue
  S: "#2c9659", // Green
  M: "#a38921", // Yellow
  L: "#E67E22", // Orange
  XL: "#E74C3C", // Red
  XXL: "#8E44AD", // Purple
};

export const sizeTags: Tag[] = [
  { name: "XS", color: sizeToColor.XS, deleted: false }, // Light Blue
  { name: "S", color: sizeToColor.S, deleted: false }, // Green
  { name: "M", color: sizeToColor.M, deleted: false }, // Yellow
  { name: "L", color: sizeToColor.L, deleted: false }, // Orange
  { name: "XL", color: sizeToColor.XL, deleted: false }, // Red
  { name: "XXL", color: sizeToColor.XXL, deleted: false }, // Purple
] as const;

export const sizeToInt = (size: Size): 0 | 1 | 2 | 3 | 4 | 5 => {
  switch (size) {
    case "XS":
      return 0;
    case "S":
      return 1;
    case "M":
      return 2;
    case "L":
      return 3;
    case "XL":
      return 4;
    case "XXL":
      return 5;
  }
};

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

// FIXME: Move all other defaults to this file
export const defaultRoleList: Role[] = [
  {
    id: "admin",
    label: "Admin",
    settings: 2,
    performance: 2,
    sprints: 2,
    scrumboard: 2,
    issues: 2,
    backlog: 2,
    retrospective: 2,
  },
  {
    id: "developer",
    label: "Developer",
    settings: 0,
    performance: 0,
    sprints: 1,
    scrumboard: 1,
    issues: 1,
    backlog: 1,
    retrospective: 2,
  },
  {
    id: "viewer",

    label: "Viewer",
    settings: 0,
    performance: 0,
    sprints: 0,
    scrumboard: 0,
    issues: 0,
    backlog: 0,
    retrospective: 0,
  },
];

export const emptyRole: Role = {
  id: "none",
  label: "No role",
  settings: 0,
  performance: 0,
  sprints: 0,
  scrumboard: 0,
  issues: 0,
  backlog: 0,
  retrospective: 0,
};

export const ownerRole: Role = {
  id: "owner",
  label: "Owner",
  settings: 2,
  performance: 2,
  sprints: 2,
  scrumboard: 2,
  issues: 2,
  backlog: 2,
  retrospective: 2,
};

export const todoTagName = "Todo";
export const doingTagName = "Doing";
export const doneTagName = "Done";

export const defaultStatusTags = [
  {
    name: todoTagName,
    color: "#0737E3",
    deleted: false,
    marksTaskAsDone: false,
    orderIndex: 0,
  },
  {
    name: doingTagName,
    color: "#AD7C00",
    deleted: false,
    marksTaskAsDone: false,
    orderIndex: 1,
  },
  {
    name: doneTagName,
    color: "#009719",
    deleted: false,
    marksTaskAsDone: true,
    orderIndex: 2,
  },
];

export const defaultRequerimentTypes = [
  {
    name: "Functional",
    color: "#24A5BC",
    deleted: false,
  },
  {
    name: "Non Functional",
    color: "#CD4EC0",
    deleted: false,
  },
];

export const defaultPriorityTypes = [
  {
    name: "P0",
    color: "#FF0000",
    deleted: false,
  },
  {
    name: "P1",
    color: "#d1b01d",
    deleted: false,
  },
  {
    name: "P2",
    color: "#2c7817",
    deleted: false,
  },
];

export const defaultMaximumSprintStoryPoints = 300;
export const defaultSprintDuration = 7;

export const noTag: Tag = {
  id: "unknown",
  name: "Unknown",
  color: "#CCCCCC",
  deleted: false,
};

export const defaultActivity = [
  {
    itemId: "new project created",
    user: "",
    completitionDate: "",
    resolved: false,
  },
];
