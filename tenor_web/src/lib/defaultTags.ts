import { RoleDetail } from "./types/detailSchemas";
import { Role } from "./types/firebaseSchemas";

// FIXME: Move all other defaults to this file
export const defaultRoleList: Role[] = [
  {
    id: "admin",
    label: "Admin",
    canViewPerformance: true,
    canControlSprints: true,
    tabs: {
      requirements: 2,
      userStories: 2,
      issues: 2,
      sprints: 2,
      kanban: 2,
      calendar: 2,
      performance: 2,
      projectSettings: 2,
      sprintReview: 2,
    },
  },
  {
    id: "developer",
    label: "Developer",
    canViewPerformance: true,
    canControlSprints: true,
    tabs: {
      requirements: 2,
      userStories: 2,
      issues: 2,
      sprints: 2,
      kanban: 2,
      calendar: 2,
      performance: 1,
      projectSettings: 1,
      sprintReview: 2,
    },
  },
  {
    id: "viewer",
    label: "Viewer",
    canViewPerformance: false,
    canControlSprints: false,
    tabs: {
      requirements: 0,
      userStories: 0,
      issues: 0,
      sprints: 0,
      kanban: 0,
      calendar: 0,
      performance: 0,
      projectSettings: 0,
      sprintReview: 1,
    },
  },
];

export const emptyRole: Role = {
  id: "none",
  label: "No role",
  canViewPerformance: false,
  canControlSprints: false,
  tabs: {
    requirements: 0,
    userStories: 0,
    issues: 0,
    sprints: 0,
    kanban: 0,
    calendar: 0,
    performance: 0,
    projectSettings: 0,
    sprintReview: 0,
  },
};
