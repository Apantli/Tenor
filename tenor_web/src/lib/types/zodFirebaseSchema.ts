import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import {
  defaultMaximumSprintStoryPoints,
  defaultSprintDuration,
} from "../defaultValues/project";

export const UserStoryZodType = z.literal("US");
export const IssueZodType = z.literal("IS");
export const BacklogItemType = z.literal("IT");
export const TaskZodType = z.literal("TS");
export const EpicZodType = z.literal("EP");
export const ProjectZodType = z.literal("PJ");
export const SprintZodType = z.literal("SP");

const maxLengthTransformation = (length: number) => (val: string) =>
  val.slice(0, length);

export const BacklogItemZodType = z.union([
  UserStoryZodType,
  IssueZodType,
  BacklogItemType,
]);
export const AllBasicItemZodType = z.union([
  BacklogItemZodType,
  TaskZodType,
  EpicZodType,
  ProjectZodType,
  SprintZodType,
]);
export const BacklogItemAndTaskZodType = z.union([
  BacklogItemZodType,
  TaskZodType,
]);

export const TaskDetailZodType = z.enum(["US-TS", "IS-TS"]);
export const BacklogItemAndTaskDetailZodType = z.union([
  BacklogItemZodType,
  TaskDetailZodType,
]);

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

export const StatusTagSchema = TagSchema.extend({
  orderIndex: z.number(),
  marksTaskAsDone: z.boolean(),
});

// FIXME: Remove optional once it's implemented
export const UserSchema = z.object({
  bio: z.string().optional(),
  jobTitle: z.string().optional(),
  projectIds: z.array(z.string()),
  isManager: z.boolean().optional(),
});

// Each number refers to 1 permission: "none" | "read" | "write"
export type Permission = 0 | 1 | 2;

export const PermissionSchema = z.number().min(0).max(2);

export const RoleSchema = z.object({
  label: z.string(),
  settings: PermissionSchema, // settings
  performance: PermissionSchema, // performance
  sprints: PermissionSchema, // sprints
  scrumboard: PermissionSchema, // scrumboard, tasks status, calendar
  issues: PermissionSchema, // issues, tasks
  backlog: PermissionSchema, // requirements, epics, user stories, tasks
  reviews: PermissionSchema, // sprint reviews
  retrospective: PermissionSchema, // sprint retrospective
});

export const BasicInfoSchema = z.object({
  scrumId: z.number(),
  name: z
    .string()
    .min(1, "Name is required")
    .transform(maxLengthTransformation(80)),
  description: z.string(),
  deleted: z.boolean().default(false),
  createdAt: TimestampType.default(() => Timestamp.fromDate(new Date())),
});

export const SizeSchema = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);

export const BacklogItemSchema = BasicInfoSchema.extend({
  sprintId: z.string().default(""),
  taskIds: z.array(z.string()).default([]),
  complete: z.boolean().default(false),
  tagIds: z.array(z.string()).describe("List of backlog tag ids"),
  size: z.union([SizeSchema, z.literal("")]).default(""),
  priorityId: z
    .string()
    .optional()
    .describe("Use a valid, existing priority id"),
  statusId: z.string().optional().describe("Use a valid, existing status id"),
});

export const EpicSchema = BasicInfoSchema;

export const EpicOverviewSchema = EpicSchema.omit({
  description: true,
  deleted: true,
});

export const UserStorySchema = BacklogItemSchema.extend({
  epicId: z
    .string()
    .describe(
      "Use a valid, existing epic id. May be empty if no related epic exists. Only include if this user story is directly related to an epic, as in it's part of the same functionality.\n Example if the epic is 'User login', only include user stories such as 'User can login with email and password' or 'User can login with Google'",
    ),
  acceptanceCriteria: z
    .string()
    .describe(
      "Can use valid markdown. Describe the acceptance criteria in detail and format it as a list using markdown dashes (-).",
    ),
  // Redundant fields, but useful for describing their purposes to the AI
  name: z
    .string()
    .describe("Small (5 word maximum) description of the user story")
    .transform(maxLengthTransformation(80)),
  // .min(1, "Name is required")
  description: z
    .string()
    .describe(
      "You can use valid markdown. Use the following format: As a [role], I want [goal] so that [reason].",
    ),
  dependencyIds: z
    .array(z.string())
    .default([])

    .describe(
      "List of user story ids. May be empty, only include them if this user story depends on them. If they are included, make sure that they are valid ids that exist. Do NOT make up fake ids.",
    ),
  requiredByIds: z
    .array(z.string())
    .default([])
    .describe(
      "List of user story ids. May be empty, only include them if this user story is required by them. If they are included, make sure that they are valid ids that exist. Do NOT make up fake ids.",
    ),
});

export const ExistingUserStorySchema = BasicInfoSchema.merge(
  z.object({
    scrumId: z.number(),
    description: z.string().optional(),
  }),
);

export const TaskSchema = BasicInfoSchema.extend({
  statusId: z.string(),
  assigneeId: z.string(),
  dueDate: TimestampType.optional(),
  // FIXME: Finished date should be added to show on calendar
  // finishedDate: TimestampType.nullable(),z
  itemId: z.string(),
  itemType: BacklogItemZodType,
  statusChangeDate: TimestampType.optional(),
  name: z
    .string()
    .describe("Small (5 word maximum) description of the task")
    .transform(maxLengthTransformation(80)),
  description: z
    .string()
    .describe(
      "You can use valid markdown. Describe what needs to be done to complete the task in detail.",
    ),
  size: z.union([SizeSchema, z.literal("")]).default(""),
  // reviewerId: z.string(), // Scope creep. Ignore for now
  dependencyIds: z
    .array(z.string())
    .default([])
    .describe(
      "List of task ids. May be empty, only include them if this user story depends on them. If they are included, make sure that they are valid ids that exist. Do NOT make up fake ids.",
    ),
  requiredByIds: z
    .array(z.string())
    .default([])
    .describe(
      "List of task ids. May be empty, only include them if this user story is required by them. If they are included, make sure that they are valid ids that exist. Do NOT make up fake ids.",
    ),
});

export const IssueSchema = BacklogItemSchema.extend({
  relatedUserStoryId: z.string(),
  stepsToRecreate: z.string(),
});

export const RequirementSchema = BasicInfoSchema.extend({
  priorityId: z.string().describe("Use a valid, existing priority id"),
  requirementTypeId: z
    .string()
    .describe("Use a valid, existing requirement type id"),
  requirementFocusId: z.string(),
  name: z
    .string()
    .describe("Small (5 word maximum) description of the requirement")
    .transform(maxLengthTransformation(80)),
  description: z
    .string()
    .describe(
      "You can use valid markdown. Describe in detail what the requirement is, why it exists. Also include any relevant information that is needed to understand the requirement. Finally, you may include relevant implementation suggestions, only if you have sufficient knowledge about the tech stack. Otherwise, leave it to the developers to figure it out.",
    ),
});

export const SettingsSchema = z.object({
  sprintDuration: z.number().default(defaultSprintDuration),
  maximumSprintStoryPoints: z.number().default(defaultMaximumSprintStoryPoints),
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
    links: z
      .array(
        z.object({
          content: z.string().nullable(),
          link: z.string(),
        }),
      )
      .default([]),
  }),

  Size: z.array(z.number()).default([1, 2, 3, 5, 8, 13]),
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

  // Will users also be in their subcollection?
  // FIXME: Same as the normal schemas, I think these need to be removed and be their own subcollections instead
  // requirements: z.array(RequirementSchema).default([]),
  // userStories: z.array(UserStorySchema).default([]),
  // issues: z.array(IssueSchema).default([]),
  // epics: z.array(EpicSchema).default([]),
  // genericItems: z.array(BacklogItemSchema).default([]),
  // sprints: z.array(SprintSchema).default([]),
  // sprintSnapshots: z.array(SprintSnapshotSchema).default([]),
  // FIXME: This should be a subcollection
  // settings: SettingsSchema.optional(),

  currentSprintId: z.string().default("1"),
  activities: z
    .array(
      z.object({
        title: z.string(),
        activityId: z.string(),
        type: BacklogItemAndTaskZodType,
        newStatusId: z.string(),
        userId: z.string(),
        date: z.date(),
      }),
    )
    .default([]),
});

export const ProjectSchemaCreator = z.object({
  name: z.string(),
  description: z.string(),
  logo: z.string(),
  deleted: z.boolean().default(false),

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
  // FIXME: This should be a subcollection
  // settings: SettingsSchema.optional(),

  currentSprintId: z.string().default("1"),
  activities: z
    .array(
      z.object({
        title: z.string(),
        activityId: z.string(),
        type: BacklogItemAndTaskZodType,
        newStatusId: z.string(),
        userId: z.string(),
        date: z.date(),
      }),
    )
    .default([]),
});

export const PerformanceTime = z.enum(["Week", "Month", "Sprint"]);

export const ActionType = z.enum(["create", "update", "delete"]);

export const ActivitySchema = z.object({
  itemId: z.string(),
  userId: z.string(),
  type: AllBasicItemZodType.optional(),
  date: TimestampType.optional(),
  action: ActionType.optional(),
});
