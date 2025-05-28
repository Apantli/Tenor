/*
IMPORTANTE:
- Checar duplicación de datos para operaciones en DB (es decir, datos que cuando se actualiza uno, se tiene que actualizar el otro)
  - Para esto está firebase_dependencies.drawio

TODO: 
- Agregar campo deleted a todos los correspondientes, si falta alguno
*/

import { type PerformanceTime } from "~/lib/types/zodFirebaseSchema";
import type z from "zod";
import type { Timestamp, Firestore } from "firebase-admin/firestore";
/// Big categories

export type WithId<T> = T & { id: string };

export interface SprintInfo {
  number: number;
  description: string;
  startDate: Date;
  endDate: Date;
}

// This sprint is modifiable
export interface Sprint extends SprintInfo {
  userStoryIds: string[];
  issueIds: string[];
  genericItemIds: string[];
}

export interface AIMessage {
  role: string;
  content: string;
  explanation?: string;
}

export interface SprintSnapshot extends SprintInfo {
  snapshot: {
    userStories: UserStory[];
    issues: Issue[];
    genericItems: BacklogItem[];
    // stats
    userStoryPercentage: number;
    tasksPerUser: {
      userId: string;
      taskPercentage: number;
    }[];
  };
}

export interface Project {
  name: string;
  description: string;
  logo: string;
  deleted: boolean;

  settings: Settings;

  users: {
    userId: string;
    roleId: string;
    stats: {
      completedTasks: {
        taskId: string;
        finishedDate: Date;
      }[];
      // reviewedTasks: number; // Scope creep. Ignore for now
      // contributed means finished a task within it
      contributedUserStories: number;
      contributedIssues: number;
    };
    active: boolean;
  }[];

  // requirements: Requirement[];
  userStories: UserStory[];
  issues: Issue[];
  epics: Epic[];
  genericItems: BacklogItem[];

  // sprints: Sprint[];
  // sprintSnapshots: SprintSnapshot[];

  currentSprintId: string;
}

export interface Settings {
  sprintDuration: number; // days
  maximumSprintStoryPoints: number;
  aiContext: {
    // embeddings maybe
    text: string;
    files: {
      name: string;
      type: "pdf" | "docx" | "xslx"; // mp4 maybe
      content: string;
    }[];
    links: string[];
  };
  // requirementFocusTags: Tag[];
  // requirementTypeTags: Tag[];
  // backlogTags: Tag[];
  // priorityTypes: Tag[];
  // statusTypes: StatusTag[];

  // roles: Role[];

  storyPointSizes?: number[];
}

export interface Tag {
  id?: string;
  name: string;
  color: string;
  deleted: boolean;
}

export interface StatusTag extends Tag {
  orderIndex: number;
  marksTaskAsDone: boolean;
}

/// User

export interface User {
  bio: string;
  jobTitle: string;
  projectIds: string[];
  isManager: boolean;
}

// Each number refers to 1 permission: 0 none | 1 read | 2 write
export type Permission = 0 | 1 | 2;
export const permissionLabels = {
  0: "none",
  1: "read",
  2: "write",
};
export const permissionNumbers = {
  none: 0,
  read: 1,
  write: 2,
};
export const permissionItems = [
  { id: "0", label: permissionLabels[0] },
  { id: "1", label: permissionLabels[1] },
  { id: "2", label: permissionLabels[2] },
];

export interface Role {
  id: string;
  label: string;
  settings: Permission; // settings
  performance: Permission; // performance
  sprints: Permission; // sprints
  scrumboard: Permission; // scrumboard, tasks status, calendar
  issues: Permission; // issues, tasks
  backlog: Permission; // requirements, epics, user stories, tasks
  reviews: Permission; // sprint reviews
  retrospective: Permission; // sprint retrospective
}

/// Backlog items

export interface BasicInfo {
  scrumId: number;
  name: string;
  description: string; // Markdown
  deleted: boolean;
  createdAt?: Timestamp;
}

// TODO: Make function to transform into number size (fibonacci)
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

// Any change in here, make sure to modify the zod firebase schemas too
export type UserStoryType = "US";
export type IssueType = "IS";
// export type GenericItemType = "IT"; // NOT IMPLEMENTED YET
export type TaskType = "TS";
export type EpicType = "EP";
export type ProjectType = "PJ"; // For project activities
export type SprintType = "SP"; // For requirements, not implemented yet

export type BacklogItemType = UserStoryType | IssueType;
export type AllBasicItemType =
  | BacklogItemType
  | TaskType
  | EpicType
  | ProjectType
  | SprintType;
export type BacklogItemAndTaskType = BacklogItemType | TaskType;

export type TaskDetailType = `${BacklogItemType}-${TaskType}`; // Used for simplification of moving info around
export type BacklogItemAndTaskDetailType = BacklogItemType | TaskDetailType;

export interface BacklogItem extends BasicInfo {
  sprintId: string;
  taskIds: string[];
  complete: boolean;
  tagIds: string[];
  size: Size;
  priorityId: string;
  statusId: string;
}

export type Epic = BasicInfo;

export interface UserStory extends BacklogItem {
  epicId: string;
  acceptanceCriteria: string; // Markdown
  dependencyIds: string[]; // US ID
  requiredByIds: string[]; // US ID
}

export interface Task extends BasicInfo {
  statusId: string;
  assigneeId: string;
  dueDate?: Date;
  finishedDate?: Date;
  size: Size;
  itemId: string;
  itemType: BacklogItemType;
  dependencyIds: string[];
  requiredByIds: string[];
}

export interface Issue extends BacklogItem {
  relatedUserStoryId: string;
  stepsToRecreate: string; // Markdown
}

export interface Requirement extends BasicInfo {
  size: Size;
  priorityId: string;
  requirementTypeId: string;
  requirementFocusId: string;
}

export interface ProductivityData {
  time: z.infer<typeof PerformanceTime>;
  userStoryCompleted: number;
  userStoryTotal: number;
  issueCompleted: number;
  issueTotal: number;
  fetchDate: Timestamp;
}

// Have as an array as there are maximum 3 time periods
export interface Productivity {
  cached: ProductivityData[];
}

export interface ProjectStatus {
  projectId: string;
  taskCount: number;
  completedCount: number;
  name?: string;
}

export interface ProjectStatusCache {
  fetchDate: Timestamp;
  topProjects: ProjectStatus[];
}

export type ActionType = "create" | "update" | "delete";

export interface LogProjectActivityParams {
  firestore: Firestore;
  projectId: string;
  itemId: string;
  userId: string;
  type: AllBasicItemType;
  action: ActionType;
}

export interface ProjectActivity {
  itemId: string;
  userId: string;
  type: AllBasicItemType;
  date?: Date;
  action: ActionType;
}

export interface ActivityItem {
  id: string;
  name: string;
  type: AllBasicItemType;
  scrumId?: number
  activity: WithId<ProjectActivity>;
}
