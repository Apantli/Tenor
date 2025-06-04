// Data types for returning detailed or preview information from the backend

import type {
  AnyBacklogItemType,
  Permission,
  Size,
  Sprint,
  StatusTag,
  Tag,
  WithId,
} from "./firebaseSchemas";
import type { EpicSchema, ExistingUserStorySchema } from "./zodFirebaseSchema";
import type z from "zod";

export type ExistingEpic = WithId<z.input<typeof EpicSchema>>;
export type ExistingUserStory = WithId<z.input<typeof ExistingUserStorySchema>>;

export type ProjectPreview = {
  name: string;
  description: string;
  logo: string;
};

export type UserStoryPreview = {
  id: string;
  scrumId: number;
  name: string;
};

export type UserPreview = {
  displayName: string;
  email: string;
  photoURL: string;
};

export type TaskPreview = {
  id: string;
  scrumId?: number;
  name: string;
  status: StatusTag;
  assignee?: UserPreview;
};

export type SprintPreview = {
  id: string;
  number: number;
};

export type UserStoryDetail = {
  id: string;
  scrumId: number;
  name: string;
  description: string;
  acceptanceCriteria: string;
  epic?: ExistingEpic;
  size: Size | "";
  tags: Tag[];
  priority?: Tag;
  status?: StatusTag; // It is a statusTag, but in the detail we don't need the detail info!
  dependencies: UserStoryPreview[];
  requiredBy: UserStoryPreview[];
  sprint?: WithId<Sprint>;
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
  size: Size | "";
  status?: StatusTag;
  relatedUserStory?: UserStoryPreview;
  tasks: TaskPreview[];
  sprint?: WithId<Sprint>;
};

export type TaskDetail = {
  id: string;
  scrumId: number;
  name: string;
  description: string;
  status: StatusTag;
  size: Size | "";
  assignee?: WithId<UserPreview>;
  dueDate?: Date;
  dependencies: TaskPreview[];
  requiredBy: TaskPreview[];
};

export type RoleDetail = {
  label: string;
  settings: Permission; // settings
  performance: Permission; // performance
  sprints: Permission; // sprints
  scrumboard: Permission; // scrumboard, tasks status, calendar
  issues: Permission; // issues, tasks
  backlog: Permission; // requirements, epics, user stories, tasks
  reviews: Permission; // sprint reviews
  retrospective: Permission; // sprint retrospective
};

export type BacklogItemPreview = {
  id: string;
  scrumId: number;
  name: string;
  sprintId: string;
  size: Size | "";
  tagIds: string[];
  itemType: AnyBacklogItemType;
  priorityId: string;
};

export type BacklogItemDetail = {
  id: string;
  scrumId: number;
  name: string;
  sprintId: string;
  size: Size | "";
  tags: WithId<Tag>[];
  itemType: AnyBacklogItemType;
  assigneeIds: string[];
  priorityId: string;
};

export type BacklogItemFullDetail = {
  id: string;
  scrumId: number;
  name: string;
  description: string;
  size: Size | "";
  tags: Tag[];
  priority?: Tag;
  status?: StatusTag;
  sprint?: WithId<Sprint>;
};
export interface BacklogItemFullDetailWithTasks extends BacklogItemFullDetail {
  tasks: TaskDetail[];
}
