import type { ExistingUserStory, UserPreview } from "./detailSchemas";
import type { Size, Sprint, StatusTag, Tag } from "./firebaseSchemas";

export interface UserStoryCol {
  id: string;
  scrumId?: number;
  name: string;
  epicScrumId?: number;
  priority?: Tag;
  size: Size;
  sprintNumber?: number;
  taskProgress: [number | undefined, number | undefined];
}

/**
 * @interface TaskCol
 * @description Represents a task in a table-friendly format for the UI
 * @property {string} id - The unique identifier of the task
 * @property {number} [scrumId] - The optional scrum ID of the task
 * @property {string} title - The title/name of the task
 * @property {Tag} status - The status tag of the task
 * @property {object} [assignee] - The optional user assigned to the task
 * @property {string} assignee.uid - The user ID of the assignee
 * @property {string} assignee.displayName - The display name of the assignee
 * @property {string} assignee.photoURL - The photo URL of the assignee
 */
export interface TaskCol {
  id: string;
  scrumId?: number;
  name: string;
  status: StatusTag;
  assignee?: UserPreview;
}

/**
 * @interface RequirementCol
 * @description Represents a requirement in a table-friendly format for the UI
 * @property {string} id - The unique identifier of the requirement
 * @property {string} [name] - The optional name of the requirement
 * @property {string} description - The description of the requirement
 * @property {Tag} priorityId - The priority tag of the requirement
 * @property {Tag} requirementTypeId - The requirement type tag
 * @property {Tag} requirementFocusId - The requirement focus tag
 * @property {number} scrumId - The scrum ID of the requirement
 */
export interface RequirementCol {
  id: string;
  name: string;
  description: string;
  priority: Tag;
  requirementType: Tag;
  requirementFocus: Tag;
  scrumId: number;
}

export interface IssueCol {
  id: string;
  scrumId: number;
  name: string;
  description: string;
  priority?: Tag;
  relatedUserStory?: ExistingUserStory;
  tags: Tag[];
  stepsToRecreate?: string;
  size: Size;
  sprint?: Sprint;
  assignUsers: {
    uid: string;
    displayName?: string;
    photoURL?: string;
  }[];
}

export interface UserCol {
  id: string;
  photoURL?: string;
  displayName: string;
  email: string;
  roleId: string;
}
