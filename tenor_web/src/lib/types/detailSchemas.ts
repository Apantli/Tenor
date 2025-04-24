// Data types for returning detailed or preview information from the backend

import type { Size, Tag, WithId } from "./firebaseSchemas";
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
  scrumId: number;
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
  scrumId: number;
  name: string;
  description: string;
  acceptanceCriteria: string;
  epic?: ExistingEpic;
  size?: Size;
  tags: Tag[];
  priority?: Tag;
  dependencies: UserStoryPreview[];
  requiredBy: UserStoryPreview[];
  tasks: TaskPreview[];
  sprint?: SprintPreview;
};

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
  relatedUserStory?: ExistingUserStory;
  tasks: TaskPreview[];
  sprint?: SprintPreview;
};

export type TaskDetail = {
  id: string;
  scrumId: number;
  name: string;
  description: string;
  status: Tag;
  size: Size;
  assignee?: UserPreview;
  dueDate?: Date;
};
