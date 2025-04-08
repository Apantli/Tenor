/*
IMPORTANTE:
- Checar duplicación de datos para operaciones en DB (es decir, datos que cuando se actualiza uno, se tiene que actualizar el otro)
  - Para esto está firebase_dependencies.drawio

TODO: 
- Agregar campo deleted a todos los correspondientes, si falta alguno
*/

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

  activities: {
    // TODO: Make configuration to delete these after X amount of time
    title: string;
    activityId: string;
    type: "US" | "TS" | "IS" | "ITEM";
    newStatusId: string;
    userId: string; // who changed it
    date: Date;
  }[];
}

export interface Settings {
  sprintDuration: number;
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
  // statusTabs: Tag[];

  // roles: Role[];
}

export interface Tag {
  id?: string;
  name: string;
  color: string;
  deleted: boolean;
}

/// User

export interface User {
  bio: string;
  jobTitle: string;
  projectIds: string[];
  isManager: boolean;
}

// Each number refers to 1 permission: "can't view" | "view" | "view-details" | "modify" | "create" | "delete"
export type Permission = 0 | 1 | 2 | 3 | 4 | 5;

export interface Role {
  name: string;
  canViewPerformance: boolean;
  canControlSprints: boolean;
  tabs: {
    requirements: Permission;
    userStories: Permission;
    issues: Permission;
    sprints: Permission;
    kanban: Permission;
    calendar: Permission;
    performance: Permission;
    projectSettings: Permission;
    sprintReview: Permission;
  };
}

/// Backlog items

export interface BasicInfo {
  scrumId: number;
  name?: string;
  description: string; // Markdown
  deleted: boolean;
}

// TODO: Make function to transform into number size (fibonacci)
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface BacklogItem extends BasicInfo {
  sprintId: string;
  taskIds: string[];
  complete: boolean;
  tagIds: string[];
  size: Size;
  priorityId: string;
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
  // reviewerId: string; // Scope creep. Ignore for now
  dueDate: Date | null;
  finishedDate: Date | null;
  size: Size;
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
