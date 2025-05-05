import { Firestore } from "firebase-admin/firestore";
import { getProjectRef, getSettingsRef } from "./general";
import { Requirement, Tag, WithId } from "~/lib/types/firebaseSchemas";
import { RequirementSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { TRPCError } from "@trpc/server";
import { RequirementCol } from "~/lib/types/columnTypes";
import { noTag } from "~/lib/defaultProjectValues";
import { getPriority, getPriorityContext } from "./tags";
import { getProjectContext } from "./ai";

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
  return getSettingsRef(firestore, projectId).collection("requirementTypes");
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
    .orderBy("name", "desc");
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
  return getSettingsRef(firestore, projectId).collection("requirementFocus");
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
    .orderBy("name", "desc");
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

/**
 * @function getRequirementContext
 * @description Generates a context string for all requirements associated with a specific project
 * @param {Firestore} firestore - The Firestore instance
 * @param {string} projectId - The ID of the project to retrieve requirements from
 * @returns {Promise<string>} A string containing the context of all requirements
 */
export const getRequirementsContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const requirements = await getRequirementTable(firestore, projectId);
  let requirementsContext = "# EXISTING REQUIREMENTS\n\n";
  requirements.forEach((requirement) => {
    requirementsContext += `- id: ${requirement.id}\n- name: ${requirement.name}\n- description: ${requirement.description}\n- priorityId: ${requirement.priority.name}\n- typeId: ${requirement.requirementType.name}\n- focus: ${requirement.requirementFocus.name}\n\n`;
  });
  return requirementsContext;
};

export const getRequirementTypeContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const requirementTypes = await getRequirementTypes(firestore, projectId);
  let requirementTypesContext = "# EXISTING REQUIREMENT TYPES\n\n";
  requirementTypes.forEach((requirementType) => {
    requirementTypesContext += `- id: ${requirementType.id}\n- name: ${requirementType.name}\n\n`;
  });
  return requirementTypesContext;
};

export const getRequirementFocusContext = async (
  firestore: Firestore,
  projectId: string,
) => {
  const requirementFocuses = await getRequirementFocuses(firestore, projectId);
  let requirementFocusesContext = "# EXISTING REQUIREMENT FOCUS\n\n";
  requirementFocuses.forEach((requirementFocus) => {
    requirementFocusesContext += `- id: ${requirementFocus.id}\n- name: ${requirementFocus.name}\n\n`;
  });
  return requirementFocusesContext;
};

export const getRequirementContext = async (
  firestore: Firestore,
  projectId: string,
  amount: number,
  prompt: string,
) => {
  // load all contexts simultaneously
  const [
    projectContext,
    requirementContext,
    prioritiesContext,
    requirementFocusContext,
    requirementTypesContext,
  ] = await Promise.all([
    getProjectContext(firestore, projectId),
    getRequirementsContext(firestore, projectId),
    getPriorityContext(firestore, projectId),
    getRequirementFocusContext(firestore, projectId),
    getRequirementTypeContext(firestore, projectId),
  ]);

  const passedInPrompt = prompt
    ? `Consider that the user wants the user stories for the following: ${prompt}`
    : "";

  // Context for the AI ---------------------------
  const completePrompt = `
${projectContext}

Given the following context, follow the instructions below to the best of your ability.

${requirementContext}
${prioritiesContext}
${requirementFocusContext}
${requirementTypesContext}

${passedInPrompt}

Generate ${amount} requirements for the mentioned software project. Do NOT include any identifier in the name like "Requirement 1", just use a normal title. For the requirement focus, use one of the available focus types, or create a new one if it makes sense, just give it a short name (maximum 3 words). Be extremely vague with the requirement focus so that it can apply to multiple requirements. Do NOT tie the requirement focus too tightly with the functionality. For example, a good requirement focus would be 'Core functionality', 'Security', 'Performance', or it could be related to the type of application such as 'Website', 'Mobile app', etc... For the requirement type, always use one of the available types. When creating the requirement description, make sure to use statistics if possible and if appropriate, and make sure they are as realistic as possible. Don't make the requirement description too long, maximum 4 sentences.
`;
  // ---------------------------------------------

  return completePrompt;
};
