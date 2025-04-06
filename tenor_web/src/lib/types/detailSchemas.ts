// Data types for returning detailed or preview information from the backend

import { Size, Tag, WithId } from "./firebaseSchemas";
import { ExistingEpicSchema } from "./zodFirebaseSchema";
import z from "zod";

export type ExistingEpic = WithId<z.infer<typeof ExistingEpicSchema>>;

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
  sprintNumber?: number;
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
