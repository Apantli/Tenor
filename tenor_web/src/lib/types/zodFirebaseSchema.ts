import type { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export const TimestampType = z.custom<Timestamp>((value) => value as Timestamp);

export const SprintInfoSchema = z.object({
  number: z.number(),
  description: z.string(),
  startDate: TimestampType,
  endDate: TimestampType,
  deleted: z.boolean().default(false),
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
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  deleted: z.boolean().default(false),
});

export const SizeSchema = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);

export const BacklogItemSchema = BasicInfoSchema.extend({
  sprintId: z.string().default(""),
  taskIds: z.array(z.string()).default([]),
  complete: z.boolean().default(false),
  tagIds: z.array(z.string()),
  size: SizeSchema.optional(),
  priorityId: z.string().optional(),
});

export const EpicSchema = BasicInfoSchema;

// Mark the id as mandatorty
export const ExistingEpicSchema = EpicSchema.merge(
  z.object({
    scrumId: z.number(),
    description: z.string().optional(),
  }),
);

export const EpicOverviewSchema = EpicSchema.omit({
  description: true,
  deleted: true,
});

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
  sprintDuration: z.number().default(7),
  maximumSprintStoryPoints: z.number().default(10000),
  aiContext: z.object({
    text: z.string().default(""),
    files: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          content: z.string(),
        }),
      )
      .default([]),
    links: z.array(z.string()).default([]),
  }),
  // Removed because they should be in subcollections

  // requirementFocusTags: z.array(TagSchema).default([]),
  // requirementTypeTags: z.array(TagSchema).default([]),
  // backlogTags: z.array(TagSchema).default([]),
  // priorityTypes: z.array(TagSchema).default([]),
  // statusTabs: z.array(TagSchema).default([]),
  // roles: z.array(RoleSchema).default([]),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  logo: z.string(),
  deleted: z.boolean().default(false),

  // FIXME: This should be a subcollection
  settings: SettingsSchema,

  // Will users also be in their subcollection?
  users: z.array(
    z.object({
      userId: z.string(),
      roleId: z.string(),
      stats: z
        .object({
          completedTasks: z.array(
            z.object({
              taskId: z.string(),
              finishedDate: z.date(),
            }),
          ),
          contributedUserStories: z.number(),
          contributedIssues: z.number(),
        })
        .optional(),
      active: z.boolean().default(true),
    }),
  ),
  // FIXME: Same as the normal schemas, I think these need to be removed and be their own subcollections instead
  // requirements: z.array(RequirementSchema).default([]),
  // userStories: z.array(UserStorySchema).default([]),
  // issues: z.array(IssueSchema).default([]),
  // epics: z.array(EpicSchema).default([]),
  // genericItems: z.array(BacklogItemSchema).default([]),
  // sprints: z.array(SprintSchema).default([]),
  // sprintSnapshots: z.array(SprintSnapshotSchema).default([]),
  currentSprintId: z.string().default("1"),
  activities: z
    .array(
      z.object({
        title: z.string(),
        activityId: z.string(),
        type: z.enum(["US", "TS", "IS", "ITEM"]),
        newStatusId: z.string(),
        userId: z.string(),
        date: z.date(),
      }),
    )
    .default([]),
});
