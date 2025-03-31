import { settings } from ".eslintrc.cjs";
import { z } from "zod";

export const SprintInfoSchema = z.object({
  number: z.number(),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
});

export const SprintSchema = SprintInfoSchema.extend({
  userStoryIds: z.array(z.string()),
  issueIds: z.array(z.string()),
  genericItemIds: z.array(z.string()),
});

export const SprintSnapshotSchema = SprintInfoSchema.extend({
  snapshot: z.object({
    userStories: z.array(z.object({})), // TODO: Define UserStory schema
    issues: z.array(z.object({})), // TODO: Define Issue schema
    genericItems: z.array(z.object({})), // TODO: Define BacklogItem schema
    userStoryPercentage: z.number(),
    tasksPerUser: z.array(
      z.object({
        userId: z.string(),
        taskPercentage: z.number(),
      }),
    ),
  }),
});

export const TagSchema = z.object({
  name: z.string(),
  color: z.string(),
  deleted: z.boolean(),
});

export const UserSchema = z.object({
  bio: z.string(),
  jobTitle: z.string(),
  projectIds: z.array(z.string()),
  isManager: z.boolean(),
});

// Each number refers to 1 permission: "can't view" | "view" | "view-details" | "modify" | "create" | "delete"
export type Permission = 0 | 1 | 2 | 3 | 4 | 5;

export const PermissionSchema = z.number().min(0).max(5);

export const RoleSchema = z.object({
  name: z.string(),
  canViewPerformance: z.boolean(),
  canControlSprints: z.boolean(),
  tabs: z.object({
    requirements: PermissionSchema,
    userStories: PermissionSchema,
    issues: PermissionSchema,
    sprints: PermissionSchema,
    kanban: PermissionSchema,
    calendar: PermissionSchema,
    performance: PermissionSchema,
    projectSettings: PermissionSchema,
    sprintReview: PermissionSchema,
  }),
});

export const BasicInfoSchema = z.object({
  scrumId: z.number(),
  name: z.string(),
  description: z.string(),
  deleted: z.boolean(),
});

export const SizeSchema = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);

export const BacklogItemSchema = BasicInfoSchema.extend({
  sprintId: z.string(),
  tasks: z.array(z.object({})), // TODO: Define Task schema
  complete: z.boolean(),
  tagIds: z.array(z.string()),
  size: SizeSchema,
  priorityId: z.string(),
});

export const EpicSchema = BasicInfoSchema;

export const UserStorySchema = BacklogItemSchema.extend({
  epicId: z.string(),
  acceptanceCriteria: z.string(),
  dependencyIds: z.array(z.string()),
  requiredByIds: z.array(z.string()),
});

export const TaskSchema = BasicInfoSchema.extend({
  statusId: z.string(),
  assigneeId: z.string(),
  // reviewerId: z.string(), // Scope creep. Ignore for now
  dueDate: z.date().nullable(),
  finishedDate: z.date().nullable(),
  size: SizeSchema,
});

export const IssueSchema = BacklogItemSchema.extend({
  relatedUserStoryId: z.string(),
  stepsToRecreate: z.string(),
});

export const RequirementSchema = BasicInfoSchema.extend({
  size: SizeSchema,
  priorityId: z.string(),
  requirementTypeId: z.string(),
  requirementFocusId: z.string(),
});

export const SettingsSchema = z.object({
  sprintDuration: z.number(),
  maximumSprintStoryPoints: z.number(),
  aiContext: z.object({
    text: z.string(),
    files: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["pdf", "docx", "xlsx", "mp4"]),
        content: z.string(),
      }),
    ),
    links: z.array(z.string()),
  }),
  requirementFocusTags: z.array(TagSchema),
  requirementTypeTags: z.array(TagSchema),
  backlogTags: z.array(TagSchema),
  priorityTypes: z.array(TagSchema),
  statusTabs: z.array(TagSchema),
  roles: z.array(RoleSchema),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  logoUrl: z.string(),
  deleted: z.boolean(),
  settings: SettingsSchema,
  users: z.array(
    z.object({
      userId: z.string(),
      roleId: z.string(),
      stats: z.object({
        completedTasks: z.array(
          z.object({
            taskId: z.string(),
            finishedDate: z.date(),
          }),
        ),
        contributedUserStories: z.number(),
        contributedIssues: z.number(),
      }),
      active: z.boolean(),
    }),
  ),
  requirements: z.array(RequirementSchema),
  userStories: z.array(UserStorySchema),
  issues: z.array(IssueSchema),
  epics: z.array(EpicSchema),
  genericItems: z.array(BacklogItemSchema),
  sprints: z.array(SprintSchema),
  sprintSnapshots: z.array(SprintSnapshotSchema),
  currentSprintId: z.string(),
  activities: z.array(
    z.object({
      title: z.string(),
      activityId: z.string(),
      type: z.enum(["US", "TS", "IS", "ITEM"]),
      newStatusId: z.string(),
      userId: z.string(),
      date: z.date(),
    }),
  ),
});
