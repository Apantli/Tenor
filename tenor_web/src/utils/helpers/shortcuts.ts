import { TRPCError } from "@trpc/server";
import { Firestore } from "firebase-admin/firestore";
import { get } from "node_modules/cypress/types/lodash";
import {
  doingTagName,
  doneTagName,
  noTag,
  todoTagName,
} from "~/lib/defaultProjectValues";
import {
  IssueCol,
  RequirementCol,
  UserStoryCol,
} from "~/lib/types/columnTypes";
import {
  ExistingUserStory,
  UserPreview,
  UserStoryDetail,
} from "~/lib/types/detailSchemas";
import {
  Epic,
  Issue,
  Requirement,
  StatusTag,
  Tag,
  Task,
  UserStory,
  WithId,
} from "~/lib/types/firebaseSchemas";
import {
  EpicOverviewSchema,
  EpicSchema,
  ExistingUserStorySchema,
  IssueSchema,
  ProjectSchema,
  RequirementSchema,
  SettingsSchema,
  SprintSchema,
  StatusTagSchema,
  TagSchema,
  TaskSchema,
  UserStorySchema,
} from "~/lib/types/zodFirebaseSchema";

//#region General Helpers
/**
 * @function getProjectRef
 * @description Gets a reference to the project document
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project document
 */
export const getProjectRef = (firestore: Firestore, projectId: string) => {
  return firestore.collection("projects").doc(projectId);
};

/**
 * @function getProjectSettingsRef
 * @description Gets a reference to the project settings document
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {FirebaseFirestore.DocumentReference} A reference to the project settings document
 */
export const getProjectSettingsRef = (
  firestore: Firestore,
  projectId: string,
) => {
  return firestore
    .collection("projects")
    .doc(projectId)
    .collection("settings")
    .doc("settings");
};

/**
 * @function getProjectUserRef
 * @description Gets a reference to the project user document
 * @param firestore
 * @param projectId
 * @param userId
 * @returns
 */
export const getProjectUserRef = (
  firestore: Firestore,
  projectId: string,
  userId: string,
) => {
  return firestore
    .collection("projects")
    .doc(projectId)
    .collection("users")
    .doc(userId);
};

/**
 * @function getProjectRoleRef
 * @description Gets a reference to the project role document
 * @param firestore
 * @param projectId
 * @param roleId
 * @returns
 */
export const getProjectRoleRef = (
  firestore: Firestore,
  projectId: string,
  roleId: string,
) => {
  return firestore
    .collection("projects")
    .doc(projectId)
    .collection("settings")
    .doc("settings")
    .collection("userTypes")
    .doc(roleId);
};

/**
 * @function getProjectSettings
 * @description Retrieves the settings for a specific project
 * @param {string} projectId - The ID of the project
 * @param {Firestore} firestore - The Firestore instance
 * @returns {Promise<any>} The project settings validated by SettingsSchema
 */
const getProjectSettings = async (projectId: string, firestore: Firestore) => {
  const settings = await getProjectSettingsRef(firestore, projectId).get();

  return SettingsSchema.parse(settings.data());
};
//#endregion

//#region Epics
/**
 * @function getEpicsRef
 * @description Gets a reference to the epics collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the epics collection
 */
export const getEpicsRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("epics");
};

/**
 * @function getEpicRef
 * @description Gets a reference to a specific epic document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param epicId The ID of the epic
 * @returns {FirebaseFirestore.DocumentReference} A reference to the epic document
 */
export const getEpicRef = (
  firestore: Firestore,
  projectId: string,
  epicId: string,
) => {
  return getEpicsRef(firestore, projectId).doc(epicId);
};

// FIXME: This may overlap, this isnt quite right
/**
 * @function getEpicNewId
 * @description Gets the next available epic ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available epic ID
 */
export const getEpicNewId = async (firestore: Firestore, projectId: string) => {
  const epicsRef = getEpicsRef(firestore, projectId).count().get();
  const epicsCount = (await epicsRef).data().count;
  return epicsCount + 1;
};

/**
 * @function getEpics
 * @description Retrieves all non-deleted epics associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve epics from
 * @returns {Promise<WithId<Epic>[]>} An array of epic objects with their IDs
 */
export const getEpics = async (firestore: Firestore, projectId: string) => {
  const epicsRef = getEpicsRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const epicsSnapshot = await epicsRef.get();
  const epics: WithId<Epic>[] = epicsSnapshot.docs.map((epicData) => {
    return {
      id: epicData.id,
      ...EpicSchema.parse(epicData.data()),
    } as WithId<Epic>;
  });
  return epics;
};

/**
 * @function getEpic
 * @description Retrieves a specific epic from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param epicId The ID of the epic
 * @returns {Promise<WithId<Epic>>} The epic object validated by EpicSchema
 */
export const getEpic = async (
  firestore: Firestore,
  projectId: string,
  epicId: string,
) => {
  let epicData = await getEpicRef(firestore, projectId, epicId).get();
  if (!epicData.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Epic not found",
    });
  }
  return {
    id: epicData.id,
    ...EpicSchema.parse(epicData.data()),
  } as WithId<Epic>;
};

/**
 * @function getEpicsOverview
 * @description Retrieves all non-deleted epics associated with a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<WithId<EpicOverview>[]>} An array of epic overview objects with their IDs
 */
export const getEpicsOverview = async (
  firestore: Firestore,
  projectId: string,
) => {
  const epicsRef = getEpicsRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const epicsSnapshot = await epicsRef.get();
  const epics = epicsSnapshot.docs.map((epicData) => {
    return {
      id: epicData.id,
      ...EpicOverviewSchema.parse(epicData.data()),
    };
  });
  return epics;
};

/**
 * @function getEpicOverview
 * @description Retrieves a specific epic overview from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param epicId The ID of the epic
 * @returns {Promise<WithId<EpicOverview>>} The epic overview object validated by EpicOverviewSchema
 */
export const getEpicOverview = async (
  firestore: Firestore,
  projectId: string,
  epicId: string,
) => {
  const epicData = await getEpicRef(firestore, projectId, epicId).get();
  if (!epicData.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Epic not found",
    });
  }
  const epic = EpicOverviewSchema.parse(epicData.data());
  return {
    id: epicData.id,
    ...epic,
  };
};
//#endregion

//#region Requirements
/**
 * @function getRequirementsRef
 * @description Gets a reference to the requirements collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the requirements collection
 */
export const getRequirementsRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("requirements");
};

/**
 * @function getRequirementRef
 * @description Gets a reference to a specific requirement document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param requirementId The ID of the requirement
 * @returns {FirebaseFirestore.DocumentReference} A reference to the requirement document
 */
export const getRequirementRef = (
  firestore: Firestore,
  projectId: string,
  requirementId: string,
) => {
  return getRequirementsRef(firestore, projectId).doc(requirementId);
};

// FIXME: This may overlap, this isnt quite right
/**
 * @function getRequirementNewId
 * @description Gets the next available requirement ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available requirement ID
 */
export const getRequirementNewId = async (
  firestore: Firestore,
  projectId: string,
) => {
  const requirementsRef = getRequirementsRef(firestore, projectId)
    .count()
    .get();
  const requirementsCount = (await requirementsRef).data().count;
  return requirementsCount + 1;
};

/**
 * @function getRequirements
 * @description Retrieves all non-deleted requirements associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve requirements from
 * @returns {Promise<WithId<Requirement>[]>} An array of requirement objects with their IDs
 */
export const getRequirements = async (
  firestore: Firestore,
  projectId: string,
) => {
  const requirementsRef = getRequirementsRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const requirementsSnapshot = await requirementsRef.get();
  const requirements: WithId<Requirement>[] = requirementsSnapshot.docs.map(
    (doc) => {
      return {
        id: doc.id,
        ...RequirementSchema.parse(doc.data()),
      } as WithId<Requirement>;
    },
  );
  return requirements;
};

/**
 * @function getRequirement
 * @description Retrieves a specific requirement from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param requirementId The ID of the requirement
 * @returns {Promise<WithId<Requirement>>} The requirement object validated by RequirementSchema or undefined if not found
 */
export const getRequirement = async (
  firestore: Firestore,
  projectId: string,
  requirementId: string,
) => {
  const requirementRef = getRequirementRef(firestore, projectId, requirementId);
  const requirementSnapshot = await requirementRef.get();
  if (!requirementSnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Requirement not found",
    });
  }
  return {
    id: requirementSnapshot.id,
    ...RequirementSchema.parse(requirementSnapshot.data()),
  } as WithId<Requirement>;
};

/**
 * @function getRequirementTypesRef
 * @description Gets a reference to the requirement types collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the requirement types collection
 */
export const getRequirementTypesRef = (
  firestore: Firestore,
  projectId: string,
) => {
  return getProjectSettingsRef(firestore, projectId).collection(
    "requirementTypes",
  );
};

/**
 * @function getRequirementTypeRef
 * @description Gets a reference to a specific requirement type document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param requirementTypeId The ID of the requirement type
 * @returns {FirebaseFirestore.DocumentReference} A reference to the requirement type document
 */
export const getRequirementTypeRef = (
  firestore: Firestore,
  projectId: string,
  requirementTypeId: string,
) => {
  return getRequirementTypesRef(firestore, projectId).doc(requirementTypeId);
};

/**
 * @function getRequirementTypes
 * @description Retrieves all non-deleted requirement types associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve requirement types from
 * @returns {Promise<WithId<Tag>[]>} An array of requirement type objects with their IDs
 */
export const getRequirementTypes = async (
  firestore: Firestore,
  projectId: string,
) => {
  const requirementTypesRef = getRequirementTypesRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const requirementTypesSnapshot = await requirementTypesRef.get();
  const requirementTypes: WithId<Tag>[] = requirementTypesSnapshot.docs.map(
    (doc) => {
      return {
        id: doc.id,
        ...TagSchema.parse(doc.data()),
      } as WithId<Tag>;
    },
  );
  return requirementTypes;
};

/**
 * @function getRequirementType
 * @description Retrieves a specific requirement type from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param requirementTypeId The ID of the requirement type
 * @returns {Promise<WithId<Tag>>} The requirement type object validated by TagSchema or undefined if not found
 */
export const getRequirementType = async (
  firestore: Firestore,
  projectId: string,
  requirementTypeId: string,
) => {
  const requirementTypeRef = getRequirementTypeRef(
    firestore,
    projectId,
    requirementTypeId,
  );
  const requirementTypeSnapshot = await requirementTypeRef.get();
  if (!requirementTypeSnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Requirement type not found",
    });
  }
  return {
    id: requirementTypeSnapshot.id,
    ...TagSchema.parse(requirementTypeSnapshot.data()),
  } as WithId<Tag>;
};

/**
 * @function getRequirementFocusesRef
 * @description Gets a reference to the requirement focuses collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the requirement focuses collection
 */
export const getRequirementFocusesRef = (
  firestore: Firestore,
  projectId: string,
) => {
  return getProjectSettingsRef(firestore, projectId).collection(
    "requirementFocus",
  );
};

/**
 * @function getRequirementFocusRef
 * @description Gets a reference to a specific requirement focus document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param requirementFocusId The ID of the requirement focus
 * @returns {FirebaseFirestore.DocumentReference} A reference to the requirement focus document
 *
 */
export const getRequirementFocusRef = (
  firestore: Firestore,
  projectId: string,
  requirementFocusId: string,
) => {
  return getRequirementFocusesRef(firestore, projectId).doc(requirementFocusId);
};

/**
 * @function getRequirementFocuses
 * @description Retrieves all non-deleted requirement focuses associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve requirement focuses from
 * @returns {Promise<WithId<Tag>[]>} An array of requirement focus objects with their IDs
 */
export const getRequirementFocuses = async (
  firestore: Firestore,
  projectId: string,
) => {
  const requirementFocusesRef = getRequirementFocusesRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const requirementFocusesSnapshot = await requirementFocusesRef.get();
  const requirementFocuses: WithId<Tag>[] = requirementFocusesSnapshot.docs.map(
    (doc) => {
      return {
        id: doc.id,
        ...TagSchema.parse(doc.data()),
      } as WithId<Tag>;
    },
  );
  return requirementFocuses;
};

/**
 * @function getRequirementFocus
 * @description Retrieves a specific requirement focus from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param requirementFocusId The ID of the requirement focus
 * @returns {Promise<WithId<Tag>>} The requirement focus object validated by TagSchema or undefined if not found
 */
export const getRequirementFocus = async (
  firestore: Firestore,
  projectId: string,
  requirementFocusId: string,
) => {
  const requirementFocusRef = getRequirementFocusRef(
    firestore,
    projectId,
    requirementFocusId,
  );
  const requirementFocusSnapshot = await requirementFocusRef.get();
  if (!requirementFocusSnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Requirement focus not found",
    });
  }
  return {
    id: requirementFocusSnapshot.id,
    ...TagSchema.parse(requirementFocusSnapshot.data()),
  } as WithId<Tag>;
};

// FIXME: Move defaults to another place
/**
 * @function getRequirementTable
 * @description Retrieves all requirements associated with a specific project and their details
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve requirements from
 * @returns {Promise<RequirementCol[]>} An array of requirement objects with their IDs and details
 * */
export const getRequirementTable = async (
  firestore: Firestore,
  projectId: string,
) => {
  const requirements = await getRequirements(firestore, projectId);

  const requierentCols: RequirementCol[] = await Promise.all(
    requirements.map(async (requirement): Promise<RequirementCol> => {
      const requirementType: Tag =
        (await getRequirementType(
          firestore,
          projectId,
          requirement.requirementTypeId,
        )) ?? noTag;

      const requirementFocus: Tag =
        (await getRequirementFocus(
          firestore,
          projectId,
          requirement.requirementFocusId,
        )) ?? noTag;

      const priority: Tag =
        (await getPriority(firestore, projectId, requirement.priorityId)) ??
        noTag;

      const requirementCol: RequirementCol = {
        ...requirement,
        priority,
        requirementType,
        requirementFocus,
      };

      return requirementCol;
    }),
  );

  return requierentCols;
};

//#endregion

//#region User Stories
/**
 * @function getUserStoriesRef
 * @description Gets a reference to the user stories collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the user stories collection
 */
export const getUserStoriesRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("userStories");
};

/**
 * @function getUserStoryRef
 * @description Gets a reference to a specific user story document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param userStoryId The ID of the user story
 * @returns {FirebaseFirestore.DocumentReference} A reference to the user story document
 */
export const getUserStoryRef = (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
) => {
  return getUserStoriesRef(firestore, projectId).doc(userStoryId);
};

// FIXME: This may overlap, this isnt quite right
/**
 * @function getUserStoryNewId
 * @description Gets the next available user story ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available user story ID
 */
export const getUserStoryNewId = async (
  firestore: Firestore,
  projectId: string,
) => {
  const userStoriesRef = getUserStoriesRef(firestore, projectId).count().get();
  const userStoriesCount = (await userStoriesRef).data().count;
  return userStoriesCount + 1;
};

/**
 * @function getUserStories
 * @description Retrieves all non-deleted user stories associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve user stories from
 * @returns {Promise<WithId<UserStory>[]>} An array of user story objects with their IDs
 */
export const getUserStories = async (
  firestore: Firestore,
  projectId: string,
) => {
  const userStoriesRef = getUserStoriesRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const userStoriesSnapshot = await userStoriesRef.get();
  const userStories: WithId<UserStory>[] = userStoriesSnapshot.docs.map(
    (doc) => {
      return {
        id: doc.id,
        ...UserStorySchema.parse(doc.data()),
      } as WithId<UserStory>;
    },
  );
  return userStories;
};

/**
 * @function getUserStory
 * @description Retrieves a specific user story from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param userStoryId The ID of the user story
 * @returns {Promise<WithId<UserStory>>} The user story object validated by UserStorySchema or undefined if not found
 */
export const getUserStory = async (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
) => {
  const userStoryRef = getUserStoryRef(firestore, projectId, userStoryId);
  const userStorySnapshot = await userStoryRef.get();
  if (!userStorySnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User story not found",
    });
  }
  return {
    id: userStorySnapshot.id,
    ...UserStorySchema.parse(userStorySnapshot.data()),
  } as WithId<UserStory>;
};

export const getUserStoryDetail = async (
  firestore: Firestore,
  projectId: string,
  userStoryId: string,
) => {
  const userStory = await getUserStory(firestore, projectId, userStoryId);

  const priority: Tag =
    (await getPriority(firestore, projectId, userStory.priorityId)) ?? noTag;
  const epic: WithId<Epic> | undefined = userStory.epicId
    ? await getEpic(firestore, projectId, userStory.epicId)
    : undefined;

  // FIXME: Load Sprint, requiredBy, dependencies, tags, status, tasks
  const userStoryDetail: UserStoryDetail = {
    ...userStory,
    priority,
    epic,
    tags: [],
    dependencies: [],
    requiredBy: [],
  };

  return userStoryDetail;
};

/**
 * @function getUserStoryTable
 * @description Retrieves all non-deleted user story previews associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve user story previews from
 * @returns {Promise<WithId<UserStoryCol>[]>} An array of user story objects with their IDs
 */
export const getUserStoryTable = async (
  firestore: Firestore,
  projectId: string,
) => {
  const userStories = await getUserStories(firestore, projectId);
  const userStoryCols: UserStoryCol[] = await Promise.all(
    userStories.map(async (userStory): Promise<UserStoryCol> => {
      const priority: Tag =
        (await getPriority(firestore, projectId, userStory.priorityId)) ??
        noTag;

      const epicScrumId: number | undefined =
        userStory.epicId !== undefined
          ? ((await getEpic(firestore, projectId, userStory.epicId)).scrumId ??
            undefined)
          : undefined;

      // FIXME: Sprint, task progress
      const userStoryCol: UserStoryCol = {
        ...userStory,
        epicScrumId,
        priority,
        taskProgress: [0, 1],
      };
      return userStoryCol;
    }),
  );
  return userStoryCols;
};
//#endregion

//#region Issues
/**
 * @function getIssuesRef
 * @description Gets a reference to the issues collection for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {FirebaseFirestore.CollectionReference} A reference to the issues collection
 */
export const getIssuesRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId).collection("issues");
};

/**
 * @function getIssueRef
 * @description Gets a reference to a specific issue document
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param issueId The ID of the issue
 * @returns {FirebaseFirestore.DocumentReference} A reference to the issue document
 */
export const getIssueRef = (
  firestore: Firestore,
  projectId: string,
  issueId: string,
) => {
  return getIssuesRef(firestore, projectId).doc(issueId);
};

// TODO: This may overlap, this isnt quite right
/**
 * @function getIssueNewId
 * @description Gets the next available issue ID for a specific project
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @returns {Promise<number>} The next available issue ID
 */
export const getIssueNewId = async (
  firestore: Firestore,
  projectId: string,
) => {
  const issuesRef = getIssuesRef(firestore, projectId).count().get();
  const issuesCount = (await issuesRef).data().count;
  return issuesCount + 1;
};

/**
 * @function getIssues
 * @description Retrieves all non-deleted issues associated with a specific project
 * @param {Firestore} firestore - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve issues from
 * @returns {Promise<WithId<Issue>[]>} An array of issue objects with their IDs
 */
export const getIssues = async (firestore: Firestore, projectId: string) => {
  const issuesRef = getIssuesRef(firestore, projectId)
    .where("deleted", "==", false)
    .orderBy("scrumId", "desc");
  const issuesSnapshot = await issuesRef.get();
  const issues: WithId<Issue>[] = issuesSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...IssueSchema.parse(doc.data()),
    } as WithId<Issue>;
  });
  return issues;
};

/**
 * @function getIssue
 * @description Retrieves a specific issue from the Firestore database
 * @param firestore A Firestore instance
 * @param projectId The ID of the project
 * @param issueId The ID of the issue
 * @returns {Promise<WithId<Issue>>} The issue object validated by IssueSchema or undefined if not found
 */
export const getIssue = async (
  firestore: Firestore,
  projectId: string,
  issueId: string,
) => {
  const issueRef = getIssueRef(firestore, projectId, issueId);
  const issueSnapshot = await issueRef.get();
  if (!issueSnapshot.exists) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Issue not found",
    });
  }
  return {
    id: issueSnapshot.id,
    ...IssueSchema.parse(issueSnapshot.data()),
  } as WithId<Issue>;
};

export const getIssueTable = async (
  firestore: Firestore,
  projectId: string,
) => {
  const issues = await getIssues(firestore, projectId);
  const issueCols: IssueCol[] = await Promise.all(
    issues.map(async (issue): Promise<IssueCol> => {
      const priority: Tag =
        (await getPriority(firestore, projectId, issue.priorityId)) ?? noTag;
      const issueCol: IssueCol = {
        ...issue,
        priority,
        tags: [],
        assignUsers: [],
      };

      return issueCol;
    }),
  );
  return issueCols;
};

//#endregion

//#region Sprints
/**
 * @function getSprint
 * @description Retrieves a sprint from the Firestore database
 * @param firestore
 * @param projectId
 * @param sprintId
 * @returns Sprint object or undefined if not found
 */
export const getSprint = async (
  firestore: Firestore,
  projectId: string,
  sprintId: string,
) => {
  if (sprintId === undefined || sprintId === "") {
    return undefined;
  }
  const sprintRef = firestore
    .collection("projects")
    .doc(projectId)
    .collection("sprints")
    .doc(sprintId);
  const sprint = await sprintRef.get();

  if (!sprint.exists) {
    return undefined;
  }
  return { id: sprint.id, ...SprintSchema.parse(sprint.data()) };
};
//#endregion

//#region Tasks
export const getTasksRef = (firestore: Firestore, projectId: string) => {
  return getProjectRef(firestore, projectId)
    .collection("tasks")
    .where("deleted", "==", false);
};

/**
 * @function getTasksFromProject
 * @description Retrieves all non-deleted tasks from a project, ordered by scrumId
 * @param {Firestore} firestore - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve tasks from
 * @returns {Promise<WithId<Task>[]>} An array of task objects with their IDs
 */
export const getTasksFromProject = async (
  firestore: Firestore,
  projectId: string,
) => {
  const taskCollectionRef = getTasksRef(firestore, projectId).orderBy(
    "scrumId",
  );

  const snap = await taskCollectionRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  const tasks: WithId<Task>[] = docs.filter(
    (task): task is WithId<Task> => task !== null,
  );

  return tasks;
};

export const getTasksFromItem = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
) => {
  const taskCollectionRef = getTasksRef(firestore, projectId)
    .where("itemId", "==", itemId)
    .orderBy("scrumId");
  const snap = await taskCollectionRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  const tasks: WithId<Task>[] = docs.filter(
    (task): task is WithId<Task> => task !== null,
  );

  return tasks;
};

export const getTaskProgress = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
) => {
  const tasksRef = getTasksRef(firestore, projectId);

  const tasksSnapshot = await tasksRef.where("itemId", "==", itemId).get();

  const totalTasks = tasksSnapshot.size;

  const completedTasks = await Promise.all(
    tasksSnapshot.docs.map(async (taskDoc) => {
      const taskData = TaskSchema.parse(taskDoc.data());

      if (!taskData.statusId) return false;

      const statusTag = await getStatusTag(
        firestore,
        projectId,
        taskData.statusId,
      );
      return statusTag?.marksTaskAsDone;
    }),
  ).then((results) => results.filter(Boolean).length);

  return [completedTasks, totalTasks];
};

// TODO: This one needs admin access
export const getTasksAssignUsers = async (
  //   adminInstance: typeof admin,
  firestore: Firestore,
  projectId: string,
  itemId: string,
): Promise<UserPreview[]> => {
  if (!itemId) {
    return [];
  }
  const tasks = await getTasksFromItem(firestore, projectId, itemId);

  const userIds = tasks
    .map((task) => task.assigneeId)
    .filter((id): id is string => Boolean(id));

  //   const users = await Promise.all(
  //     userIds.map(async (userId) => {
  //       const userRecord = await adminInstance.auth().getUser(userId);
  //       return {
  //         uid: userRecord.uid,
  //         displayName: userRecord.displayName,
  //         photoURL: userRecord.photoURL,
  //       };
  //     }),
  //   );
  const users: UserPreview[] = [];

  const filteredUsers = users.filter((user): user is UserPreview =>
    Boolean(user?.uid),
  );

  const uniqueUsers: UserPreview[] = Array.from(
    new Map(filteredUsers.map((user) => [user.uid, user])).values(),
  );

  return uniqueUsers;
};
//#endregion

//#region Tags & Statuses
export const getPrioritiesRef = (firestore: Firestore, projectId: string) => {
  return getProjectSettingsRef(firestore, projectId).collection(
    "priorityTypes",
  );
};

export const getPriotityRef = (
  firestore: Firestore,
  projectId: string,
  priorityId: string,
) => {
  return getPrioritiesRef(firestore, projectId).doc(priorityId);
};

/**
 * @function getPriorityTag
 * @description Retrieves a priority tag from the priorityTypes collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} priorityId - The ID of the priority tag to retrieve
 * @returns {Promise<Tag | undefined>} The priority tag object or undefined if not found
 */
export const getPriority = async (
  firestore: Firestore,
  projectId: string,
  priorityId: string,
) => {
  const tag = await getPriotityRef(firestore, projectId, priorityId).get();
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as Tag;
};

export const getStatusTypesRef = (firestore: Firestore, projectId: string) => {
  return getProjectSettingsRef(firestore, projectId).collection("statusTypes");
};

export const getStatusTags = async (
  firestore: Firestore,
  projectId: string,
) => {
  const statusesRef = getStatusTypesRef(firestore, projectId).where(
    "deleted",
    "==",
    false,
  );

  const snap = await statusesRef.get();

  const docs = snap.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  return docs as WithId<StatusTag>[];
};

/**
 * @function getStatusTag
 * @description Retrieves a status tag from the settings collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} statusId - The ID of the status tag to retrieve
 * @returns {Promise<Tag | undefined>} The status tag object or undefined if not found
 */
export const getStatusTag = async (
  firestore: Firestore,
  projectId: string,
  statusId: string,
) => {
  if (statusId === undefined || statusId === "") {
    return undefined;
  }

  const tag = await getStatusTypesRef(firestore, projectId).doc(statusId).get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...StatusTagSchema.parse(tag.data()) } as StatusTag;
};

// FIXME: This function is kind of weird, why is there always a TODO tag?
/**
 * @function getTodoStatusTag
 * @description Retrieves the "Todo" status tag from the settings collection
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @returns {Promise<Tag>} The Todo status tag object
 * @throws {TRPCError} If the Todo status tag is not found
 */
export const getTodoStatusTag = async (
  firestore: Firestore,
  projectId: string,
) => {
  const todoTag = await getStatusTypesRef(firestore, projectId)
    .where("name", "==", todoTagName)
    .limit(1)
    .get();

  console.log("Todo tag:", todoTag.docs);
  if (todoTag.empty || todoTag.docs.length !== 1) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "To Do status tag not found",
    });
  }
  return {
    id: todoTag.docs[0]!.id,
    ...StatusTagSchema.parse(todoTag.docs[0]!.data()),
  };
};

export const getBacklogTagsRef = (firestore: Firestore, projectId: string) => {
  return getProjectSettingsRef(firestore, projectId).collection("backlogTags");
};

/**
 * @function getBacklogTag
 * @description Retrieves a backlog tag from the backlogTags collection based on its ID
 * @param {FirebaseFirestore.DocumentReference} settingsRef - Reference to the settings document
 * @param {string} taskId - The ID of the backlog tag to retrieve
 * @returns {Promise<Tag | undefined>} The backlog tag object or undefined if not found
 */
export const getBacklogTag = async (
  firestore: Firestore,
  projectId: string,
  taskId: string,
) => {
  if (taskId === undefined) {
    return undefined;
  }
  const tag = await getBacklogTagsRef(firestore, projectId).doc(taskId).get();
  if (!tag.exists) {
    return undefined;
  }
  return { id: tag.id, ...TagSchema.parse(tag.data()) } as WithId<Tag>;
};

// Get the status ID based on tasks for a backlog item with undefined status
export const getAutomaticStatusId = async (
  firestore: Firestore,
  projectId: string,
  itemId: string,
  statusTags: WithId<StatusTag>[],
) => {
  // Get all tasks for this item
  const tasks = await getTasksFromItem(firestore, projectId, itemId);

  // Rule 1: No tasks? Item is set to TODO
  if (tasks.length === 0) {
    // Find the "Todo" status tag
    const todoStatus = statusTags.find(
      (status) => status.name.toLowerCase() === todoTagName.toLowerCase(),
    );
    if (todoStatus) return todoStatus.id;

    // If no "Todo" status exists, use the first status in order
    const orderedStatuses = [...statusTags].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    if (orderedStatuses.length > 0) {
      const firstStatus = orderedStatuses[0] ?? { id: "" }; // Weird, but TypeScript needs this
      return firstStatus.id;
    } else {
      return "";
    }
  }

  // Rule 2: All tasks have the same status? The item takes that status
  const taskStatusIds = tasks
    .map((task) => task.statusId)
    .filter((id) => id !== "");
  if (
    taskStatusIds.length > 0 &&
    taskStatusIds.every((id) => id === taskStatusIds[0])
  ) {
    return taskStatusIds[0];
  }

  // Rule 3: All tasks are resolved? The item is set to Done
  const doneStatusIds = statusTags
    .filter((status) => status.marksTaskAsDone)
    .map((status) => status.id);

  if (
    tasks.length > 0 &&
    tasks.every(
      (task) => task.statusId && doneStatusIds.includes(task.statusId),
    )
  ) {
    // Find the "Done" status tag
    const doneStatus = statusTags.find(
      (status) => status.name.toLowerCase() === doneTagName.toLowerCase(),
    );
    if (doneStatus) return doneStatus.id;

    // If no specific "Done" status exists, use the first status that marks tasks as done
    return doneStatusIds.length > 0 ? doneStatusIds[0] : "";
  }

  // Rule 4: Otherwise, the item is set to Doing
  const doingStatus = statusTags.find(
    (status) => status.name.toLowerCase() === doingTagName.toLowerCase(),
  );
  if (doingStatus) return doingStatus.id;

  // If no "Doing" status exists, use a middle status based on order index
  const orderedStatuses = [...statusTags].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  if (orderedStatuses.length > 0) {
    const middleIndex = Math.floor((orderedStatuses.length - 1) / 2);
    return (orderedStatuses[middleIndex] ?? { id: "" }).id;
  }

  return "";
};
//#endregion

//#region Articial Intelligence
export const getProjectContextHeader = async (
  firestore: Firestore,
  projectId: string,
) => {
  const projectDoc = await firestore
    .collection("projects")
    .doc(projectId)
    .get();
  const projectData = ProjectSchema.parse(projectDoc.data());

  const aiContextDoc = await getProjectSettingsRef(firestore, projectId).get();
  const aiContext = SettingsSchema.parse(aiContextDoc.data()).aiContext;

  return `
  The following is some context for a software project that is being developed. Your job is to help the user organize their project in different ways. Read the following context and then answer the required question.
  
  ###### BEGINNING OF PROJECT CONTEXT
  
  # PROJECT NAME
  ${projectData.name}
  
  # PROJECT DESCRIPTION
  ${projectData.description}
  
  # TEXTUAL CONTEXT
  ${aiContext.text}
  
  ## THE FOLLOWING ARE SOME FILES THE USER HAS UPLOADED TO IMPROVE YOUR UNDERSTANDING
  
  ${aiContext.files.map((file) => `# FILE: ${file.name}\n\n${file.content}`).join("\n\n")}
  
  ## THE FOLLOWING ARE SOME WEBSITES THE USER HAS UPLOADED TO IMPROVE YOUR UNDERSTANDING
  
  ${aiContext.links.map((link) => `# LINK: ${link.link}\n\n${link.content}`).join("\n\n")}
  
  ###### END OF PROJECT CONTEXT
    `;
};

export const collectTagContext = async (
  firestore: Firestore,
  projectId: string,
  title: string,
  collectionName: string,
) => {
  const settingsRef = getProjectSettingsRef(firestore, projectId);
  const tags = await settingsRef
    .collection(collectionName)
    .where("deleted", "==", false)
    .get();

  let context = `# ${title.toUpperCase()}\n\n`;
  tags.forEach((tag) => {
    const tagData = TagSchema.parse(tag.data());
    context += `- id: ${tag.id}\n- name: ${tagData.name}\n\n`;
  });

  return context;
};

export const collectPriorityTagContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  return await collectTagContext(
    firestore,
    projectId,
    "PRIORITY TAGS",
    "priorityTypes",
  );
};

export const collectBacklogTagsContext = async (
  projectId: string,
  firestore: Firestore,
) => {
  return await collectTagContext(
    firestore,
    projectId,
    "BACKLOG TAGS",
    "backlogTags",
  );
};
//#endregion
