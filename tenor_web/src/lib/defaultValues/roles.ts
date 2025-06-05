import type { Role } from "../types/firebaseSchemas";
import { permissionNumbers } from "../types/firebaseSchemas";

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
    reviews: 2,
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
    reviews: 2,
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
    reviews: 0,
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
  reviews: 0,
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
  reviews: 2,
};

export const canRoleWrite = (role: Role) => {
  return (
    role.settings >= permissionNumbers.write ||
    role.performance >= permissionNumbers.write ||
    role.sprints >= permissionNumbers.write ||
    role.scrumboard >= permissionNumbers.write ||
    role.issues >= permissionNumbers.write ||
    role.backlog >= permissionNumbers.write ||
    role.reviews >= permissionNumbers.write ||
    role.retrospective >= permissionNumbers.write
  );
};
