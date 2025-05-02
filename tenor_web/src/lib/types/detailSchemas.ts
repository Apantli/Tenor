// Data types for returning detailed or preview information from the backend

import type {
  Permission,
  Size,
  StatusTag,
  Tag,
  WithId,
} from "./firebaseSchemas";
import type {
  ExistingEpicSchema,
  ExistingUserStorySchema,
  SprintSchema,
  UserStorySchema,
} from "./zodFirebaseSchema";
import type z from "zod";

export type ExistingEpic = WithId<z.infer<typeof ExistingEpicSchema>>;
export type ExistingUserStory = WithId<z.infer<typeof ExistingUserStorySchema>>;

export type UserStoryPreview = {
  id: string;
  scrumId: number;
  name: string;
};

export type UserPreview = {
  uid: string;
  displayName: string;
  photoURL: string;
};

export type TaskPreview = {
  id: string;
  scrumId?: number;
  name: string;
  status: Tag;
  assignee?: UserPreview;
};

export type SprintPreview = {
  id: string;
  number: number;
};

export type UserStoryDetail = {
  id: string;
  scrumId?: number;
  name: string;
  description: string;
  acceptanceCriteria: string;
  epic?: ExistingEpic;
  size?: Size;
  tags: Tag[];
  priority?: Tag;
  status?: Tag; // It is a statusTag, but in the detail we don't need the detail info!
  dependencies: UserStoryPreview[];
  requiredBy: UserStoryPreview[];
  sprint?: SprintPreview;
};

export interface UserStoryDetailWithTasks extends UserStoryDetail {
  tasks: TaskDetail[];
}

export type IssueDetail = {
  id: string;
  scrumId: number;
  name: string;
  description: string;
  completed: boolean;
  stepsToRecreate: string;
  tags: Tag[];
  priority?: Tag;
  size?: Size;
  status?: Tag; // It is a statusTag, but in the detail we don't need the detail info!
  relatedUserStory?: ExistingUserStory;
  tasks: TaskPreview[];
  sprint?: SprintPreview;
};

export type TaskDetail = {
  id: string;
  scrumId?: number;
  name: string;
  description: string;
  status: Tag;
  size?: Size;
  assignee?: UserPreview;
  dueDate?: Date;
};

export type RoleDetail = {
  id: string;
  label: string;
  settings: Permission; // settings
  performance: Permission; // performance
  sprints: Permission; // sprints
  scrumboard: Permission; // scrumboard, tasks status, calendar
  issues: Permission; // issues, tasks
  backlog: Permission; // requirements, epics, user stories, tasks
};
