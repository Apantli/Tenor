import type { Requirement, Tag, WithId } from "~/lib/types/firebaseSchemas";
import { RequirementSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { createTRPCRouter, roleRequiredProcedure } from "~/server/api/trpc";
import { getPriorityTag, getProjectSettingsRef } from "./settings";
import { FieldPath } from "firebase-admin/firestore";
import {
  collectPriorityTagContext,
  collectTagContext,
  getProjectContextHeader,
} from "~/utils/aiContext";
import { askAiToGenerate } from "~/utils/aiGeneration";
import { generateRandomTagColor } from "~/utils/colorUtils";

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
  name?: string;
  description: string;
  priorityId: Tag;
  requirementTypeId: Tag;
  requirementFocusId: Tag;
  scrumId?: number;
}

/**
 * @function getRequirementsFromProject
 * @description Retrieves all non-deleted requirements from a project, ordered by scrumId
 * @param {FirebaseFirestore.Firestore} dbAdmin - The Firestore database instance
 * @param {string} projectId - The ID of the project to retrieve requirements from
 * @returns {Promise<WithId<Requirement>[]>} An array of requirement objects with their IDs
 */
const getRequirementsFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const requirementsRef = dbAdmin
    .collection(`projects/${projectId}/requirements`)
    .orderBy("scrumId", "asc");
  const requirementsSnapshot = await requirementsRef.get();

  const requirements: WithId<Requirement>[] = [];
  requirementsSnapshot.forEach((doc) => {
    const data = doc.data() as Requirement;
    if (data.deleted !== true) {
      requirements.push({ id: doc.id, ...data });
    }
  });
  return requirements;
};

/**
 * @function createRequirementsTableData
 * @description Transforms requirement data into a table-friendly format with all necessary tag information
 * @param {WithId<Requirement>[]} data - The raw requirement data
 * @param {string} projectId - The ID of the project
 * @param {FirebaseFirestore.Firestore} dbAdmin - The Firestore database instance
 * @returns {Promise<{allTags: Tag[], fixedData: RequirementCol[], allRequirementTypeTags: Tag[], allRequirementFocusTags: Tag[]}>}
 *         Object containing the processed data and all tag collections
 */
const createRequirementsTableData = async (
  data: WithId<Requirement>[],
  projectId: string,
  dbAdmin: FirebaseFirestore.Firestore,
) => {
  if (data.length === 0) {
    return {
      allTags: [],
      fixedData: [],
      allRequirementTypeTags: [],
      allRequirementFocusTags: [],
    };
  }

  // Get all the unique requirementFocusId, requirementTypeIds and priorityIds from the requirements
  const uniqueRequirementTypeIds = Array.from(
    new Set(data.map((req) => req.requirementTypeId).filter(Boolean)),
  );

  const uniquePriorityIds = Array.from(
    new Set(data.map((req) => req.priorityId).filter(Boolean)),
  );

  const uniqueRequirementFocusIds = Array.from(
    new Set(data.map((req) => req.requirementFocusId).filter(Boolean)),
  );

  // Get the project settings reference
  const settingsRef = getProjectSettingsRef(projectId, dbAdmin);

  // Get all the tags from the collection "priorityTypes"
  const allTagsSnapshot = await settingsRef.collection("priorityTypes").get();
  const allTags: Tag[] = allTagsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Tag),
  }));

  // Get only the tags assign to the requirements
  const tagsData = await Promise.all(
    uniquePriorityIds.map(async (tagId) => {
      const tagSnap = await settingsRef
        .collection("priorityTypes")
        .doc(tagId)
        .get();
      if (!tagSnap.exists) return null;
      return { id: tagId, ...TagSchema.parse(tagSnap.data()) };
    }),
  );
  console.log(tagsData);

  // Get all the tags from the collection "requirementTypeTags"
  const allRequirementTypeTagsSnapshot = await settingsRef
    .collection("requirementTypes")
    .get();
  const allRequirementTypeTags: Tag[] = allRequirementTypeTagsSnapshot.docs.map(
    (doc) => ({
      id: doc.id,
      ...(doc.data() as Tag),
    }),
  );

  // Get only the tags assign to the requirements
  const requirementTypeTagsData = await Promise.all(
    uniqueRequirementTypeIds.map(async (tagId) => {
      const tagSnap = await settingsRef
        .collection("requirementTypes")
        .doc(tagId)
        .get();
      if (!tagSnap.exists) return null;
      return { id: tagId, ...TagSchema.parse(tagSnap.data()) };
    }),
  );
  console.log(requirementTypeTagsData);

  // Get all the tags from the collection "requirementFocusTags"
  const allRequirementFocusTagsSnapshot = await settingsRef
    .collection("requirementFocus")
    .get();
  const allRequirementFocusTags: Tag[] =
    allRequirementFocusTagsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Tag),
    }));

  // Get only the tags assign to the requirements
  const requirementFocusTagsData = await Promise.all(
    uniqueRequirementFocusIds.map(async (tagId) => {
      const tagSnap = await settingsRef
        .collection("requirementFocus")
        .doc(tagId)
        .get();
      if (!tagSnap.exists) return null;
      return { id: tagId, ...TagSchema.parse(tagSnap.data()) };
    }),
  );
  console.log(requirementFocusTagsData);

  // Map the tags to their ids
  const tagMap = new Map(
    tagsData
      .filter((tag): tag is Tag & { id: string } => tag !== null)
      .map((tag) => [tag.id, tag]),
  );

  const reqTypeTagMap = new Map(
    requirementTypeTagsData
      .filter((tag): tag is Tag & { id: string } => tag !== null)
      .map((tag) => [tag.id, tag]),
  );

  const reqFocusTagMap = new Map(
    requirementFocusTagsData
      .filter((tag): tag is Tag & { id: string } => tag !== null)
      .map((tag) => [tag.id, tag]),
  );

  const fixedData = data.map((requirement) => ({
    id: requirement.id,
    name: requirement.name,
    description: requirement.description,
    priorityId: tagMap.get(requirement.priorityId ?? "") ?? {
      id: "unknown",
      name: "Unknown",
      color: "#CCCCCC",
      deleted: false,
    },
    requirementTypeId: reqTypeTagMap.get(
      requirement.requirementTypeId ?? "",
    ) ?? {
      id: "unknown",
      name: "Unknown",
      color: "#CCCCCC",
      deleted: false,
    },
    requirementFocusId: reqFocusTagMap.get(
      requirement.requirementFocusId ?? "",
    ) ?? {
      id: "unknown",
      name: "Unknown",
      color: "#CCCCCC",
      deleted: false,
    },
    size: requirement.size,
    scrumId: requirement.scrumId,
  })) as RequirementCol[];

  return {
    allTags,
    fixedData,
    allRequirementTypeTags,
    allRequirementFocusTags,
  };
};

/**
 * Retrieves all non-deleted requirement type tags for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch requirement type tags from
 *
 * @returns Array of requirement type tags.
 *
 * @http GET /api/trpc/requirements.getRequirementTypeTags
 */
export const getRequirementTypeTagsProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);

    const tagsSnapshot = await settingsRef
      .collection("requirementTypes")
      .where("deleted", "==", false)
      .get();
    const tags: Tag[] = tagsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Tag),
    }));
    return tags;
  });

/**
 * Retrieves a specific requirement type tag by its ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the requirement type tag
 * - tagId — ID of the requirement type tag to fetch
 *
 * @returns Requirement type tag object with its details.
 *
 * @http GET /api/trpc/requirements.getRequirementTypeTagById
 */
export const getRequirementTypeTagByIdProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "read",
)
  .input(z.object({ projectId: z.string(), tagId: z.string() }))
  .query(async ({ ctx, input }) => {
    const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);
    const tagDoc = await settingsRef
      .collection("requirementTypes")
      .doc(input.tagId)
      .get();
    if (!tagDoc.exists) {
      throw new Error("Tag not found");
    }
    return { id: tagDoc.id, ...TagSchema.parse(tagDoc.data()) };
  });

/**
 * Creates a new requirement type tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create the requirement type tag in
 * - tag — Tag data conforming to TagSchema
 *
 * @returns Object containing the ID of the created requirement type tag.
 *
 * @http POST /api/trpc/requirements.createRequirementTypeTag
 */
export const createRequirementTypeTagProcedure = roleRequiredProcedure(
  {
    flags: ["backlog", "settings"],
  },
  "write",
)
  .input(z.object({ projectId: z.string(), tag: TagSchema }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, tag } = input;
    const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const newTag = await settingsRef.collection("requirementTypes").add(tag);
    return { id: newTag.id };
  });

/**
 * Modifies an existing requirement type tag in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the requirement type tag
 * - tagId — ID of the requirement type tag to modify
 * - tag — Updated tag data conforming to TagSchema
 *
 * @returns Object containing the ID of the modified requirement type tag.
 *
 * @http PUT /api/trpc/requirements.modifyRequirementTypeTag
 */
export const modifyRequirementTypeTagProcedure = roleRequiredProcedure(
  {
    flags: ["backlog", "settings"],
  },
  "write",
)
  .input(z.object({ projectId: z.string(), tagId: z.string(), tag: TagSchema }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, tagId, tag } = input;
    const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const tagRef = settingsRef.collection("requirementTypes").doc(tagId);
    const tagDoc = await tagRef.get();
    if (!tagDoc.exists) {
      throw new Error("Tag not found");
    }
    await tagRef.update(tag);
    return { id: tagId };
  });

/**
 * Deletes a requirement type tag from a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the requirement type tag
 * - tagId — ID of the requirement type tag to delete
 *
 * @returns Object containing the ID of the deleted requirement type tag.
 *
 * @http DELETE /api/trpc/requirements.deleteRequirementTypeTag
 */
export const deleteRequirementTypeTagProcedure = roleRequiredProcedure(
  {
    flags: ["backlog", "settings"],
  },
  "write",
)
  .input(z.object({ projectId: z.string(), tagId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, tagId } = input;
    const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const tagRef = settingsRef.collection("requirementTypes").doc(tagId);
    const tagDoc = await tagRef.get();
    if (!tagDoc.exists) {
      throw new Error("Tag not found");
    }
    await tagRef.update({ deleted: true });
    return { id: tagId };
  });

/**
 * Retrieves all non-deleted requirement focus tags for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch requirement focus tags from
 *
 * @returns Array of requirement focus tags.
 *
 * @http GET /api/trpc/requirements.getRequirementFocusTags
 */
export const getRequirementFocusTagsProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);
    const tagsSnapshot = await settingsRef
      .collection("requirementFocus")
      .where("deleted", "==", false)
      .get();
    const tags: Tag[] = tagsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Tag),
    }));
    return tags;
  });

/**
 * Retrieves a specific requirement focus tag by its ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the requirement focus tag
 * - tagId — ID of the requirement focus tag to fetch
 *
 * @returns Requirement focus tag object with its details.
 *
 * @http GET /api/trpc/requirements.getRequirementFocusTagById
 */
export const getRequirementFocusTagByIdProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "read",
)
  .input(z.object({ projectId: z.string(), tagId: z.string() }))
  .query(async ({ ctx, input }) => {
    const settingsRef = getProjectSettingsRef(input.projectId, ctx.firestore);
    const tagDoc = await settingsRef
      .collection("requirementFocus")
      .doc(input.tagId)
      .get();
    if (!tagDoc.exists) {
      throw new Error("Tag not found");
    }
    return { id: tagDoc.id, ...TagSchema.parse(tagDoc.data()) };
  });

/**
 * Creates a new requirement focus tag for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create the requirement focus tag in
 * - tag — Tag data conforming to TagSchema
 *
 * @returns Object containing the ID of the created requirement focus tag.
 *
 * @http POST /api/trpc/requirements.createRequirementFocusTag
 */
export const createRequirementFocusTagProcedure = roleRequiredProcedure(
  {
    flags: ["backlog", "settings"],
  },
  "write",
)
  .input(z.object({ projectId: z.string(), tag: TagSchema }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, tag } = input;
    const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const newTag = await settingsRef.collection("requirementFocus").add(tag);
    return { id: newTag.id };
  });

/**
 * Modifies an existing requirement focus tag in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the requirement focus tag
 * - tagId — ID of the requirement focus tag to modify
 * - tag — Updated tag data conforming to TagSchema
 *
 * @returns Object containing the ID of the modified requirement focus tag.
 *
 * @http PUT /api/trpc/requirements.modifyRequirementFocusTag
 */
export const modifyRequirementFocusTagProcedure = roleRequiredProcedure(
  {
    flags: ["backlog", "settings"],
  },
  "write",
)
  .input(z.object({ projectId: z.string(), tagId: z.string(), tag: TagSchema }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, tagId, tag } = input;
    const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const tagRef = settingsRef.collection("requirementFocus").doc(tagId);
    const tagDoc = await tagRef.get();
    if (!tagDoc.exists) {
      throw new Error("Tag not found");
    }
    await tagRef.update(tag);
    return { id: tagId };
  });

/**
 * Deletes a requirement focus tag from a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the requirement focus tag
 * - tagId — ID of the requirement focus tag to delete
 *
 * @returns Object containing the ID of the deleted requirement focus tag.
 *
 * @http DELETE /api/trpc/requirements.deleteRequirementFocusTag
 */
export const deleteRequirementFocusTagProcedure = roleRequiredProcedure(
  {
    flags: ["backlog", "settings"],
  },
  "write",
)
  .input(z.object({ projectId: z.string(), tagId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, tagId } = input;
    const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);
    const tagRef = settingsRef.collection("requirementFocus").doc(tagId);
    const tagDoc = await tagRef.get();
    if (!tagDoc.exists) {
      throw new Error("Tag not found");
    }
    await tagRef.update({ deleted: true });
    return { id: tagId };
  });

/**
 * Retrieves requirements for a project in a table-friendly format.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to fetch requirements for
 *
 * @returns Object containing formatted requirement data and all tag collections:
 * - fixedData — Array of requirements in a table-friendly format
 * - allTags — Array of all priority tags
 * - allRequirementTypeTags — Array of all requirement type tags
 * - allRequirementFocusTags — Array of all requirement focus tags
 *
 * @http GET /api/trpc/requirements.getRequirementsTableFriendly
 */
export const getRequirementsTableFriendlyProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const rawRequirements = await getRequirementsFromProject(
      ctx.firestore,
      input.projectId,
    );
    const {
      fixedData,
      allTags,
      allRequirementTypeTags,
      allRequirementFocusTags,
    } = await createRequirementsTableData(
      rawRequirements,
      input.projectId,
      ctx.firestore,
    );
    return {
      fixedData,
      allTags,
      allRequirementTypeTags,
      allRequirementFocusTags,
    };
  });

/**
 * Retrieves a specific requirement by ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the requirement
 * - requirementId — ID of the requirement to retrieve
 *
 * @returns Requirement object with its details.
 *
 * @http GET /api/trpc/requirements.getRequirement
 */
export const getRequirementProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "read",
)
  .input(z.object({ projectId: z.string(), requirementId: z.string() }))
  .query(async ({ ctx, input }) => {
    const requirement = (
      await ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("requirements")
        .doc(input.requirementId)
        .get()
    ).data();
    if (!requirement) {
      throw new Error("Requirement not found");
    }
    return {
      id: input.requirementId,
      ...RequirementSchema.parse(requirement),
    };
  });

/**
 * Creates a new requirement or updates an existing one.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to create or update the requirement in
 * - scrumId — Scrum ID of the requirement (use -1 for new requirements)
 * - name — Name of the requirement
 * - description — Description of the requirement
 * - priorityId — ID of the priority tag
 * - requirementTypeId — ID of the requirement type tag
 * - requirementFocusId — ID of the requirement focus tag
 * - size — Size of the requirement
 *
 * @returns Success message indicating whether the requirement was created or updated.
 *
 * @http POST /api/trpc/requirements.createOrModifyRequirement
 */
export const createOrModifyRequirementProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "write",
)
  .input(RequirementSchema.extend({ projectId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const projectCount = (
      await ctx.firestore
        .collection("projects")
        .where(FieldPath.documentId(), "==", input.projectId)
        .count()
        .get()
    ).data().count;

    if (projectCount === 0) {
      throw new Error("Project not found");
    }

    const requirementsRef = ctx.firestore
      .collection("projects")
      .doc(input.projectId)
      .collection("requirements");

    if (input.scrumId !== -1) {
      const requirementDocs = await requirementsRef
        .where("scrumId", "==", input.scrumId)
        .get();

      if (requirementDocs.empty) {
        throw new Error("Requirement not found");
      }

      const requirementDoc = requirementDocs.docs[0];
      await requirementDoc?.ref.update(input);
      return "Requirement updated successfully";
    } else {
      const existingRequirementCount = (
        await requirementsRef.count().get()
      ).data().count;
      input.scrumId = existingRequirementCount + 1;
      await requirementsRef.add(input);
      return "Requirement created successfully";
    }
  });

/**
 * Deletes a requirement from a project (soft delete).
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project containing the requirement
 * - requirementId — ID of the requirement to delete
 *
 * @returns Object indicating success status.
 *
 * @http DELETE /api/trpc/requirements.deleteRequirement
 */
export const deleteRequirementProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      requirementId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const requirementsRef = ctx.firestore
      .collection("projects")
      .doc(input.projectId)
      .collection("requirements")
      .doc(input.requirementId);

    const requirementDoc = await requirementsRef.get();
    if (!requirementDoc.exists) {
      throw new Error("Requirement not found");
    }

    await requirementsRef.update({ deleted: true });
    return { success: true };
  });

/**
 * Generates requirements using AI based on existing requirements and project context.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId — ID of the project to generate requirements for
 * - amount — Number of requirements to generate
 * - prompt — Additional prompt for the AI to consider
 *
 * @returns Array of generated requirements with their details.
 *
 * @http POST /api/trpc/requirements.generateRequirements
 */
export const generateRequirementsProcedure = roleRequiredProcedure(
  {
    flags: ["backlog"],
  },
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      amount: z.number(),
      prompt: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, amount, prompt } = input;

    const requirements = await ctx.firestore
      .collection("projects")
      .doc(projectId)
      .collection("requirements")
      .where("deleted", "==", false)
      .get();
    const requirementsData = requirements.docs.map((doc) => ({
      id: doc.id,
      ...RequirementSchema.parse(doc.data()),
    }));

    // Gather all the focus tags for the ai context
    const allRequirementFocusTags = await getProjectSettingsRef(
      projectId,
      ctx.firestore,
    )
      .collection("requirementFocus")
      .where("deleted", "==", false)
      .get();
    const allRequirementFocusTagsData: Tag[] = allRequirementFocusTags.docs.map(
      (doc) => ({
        id: doc.id,
        ...(doc.data() as Tag),
      }),
    );

    const getFocusName = (focusId: string) => {
      const focusTag = allRequirementFocusTagsData.find(
        (tag) => tag.id === focusId,
      );
      return focusTag ? focusTag.name : "No focus";
    };

    let requirementsContext = "# EXISTING REQUIREMENTS\n\n";
    requirementsData.forEach((requirement) => {
      requirementsContext += `- id: ${requirement.id}\n- name: ${requirement.name}\n- description: ${requirement.description}\n- priorityId: ${requirement.priorityId}\n- typeId: ${requirement.requirementTypeId}\n- focus: ${getFocusName(requirement.requirementFocusId)}\n\n`;
    });

    const priorityTagContext = await collectPriorityTagContext(
      projectId,
      ctx.firestore,
    );

    const requirementTypeTagContext = await collectTagContext(
      "REQUIREMENT TYPES",
      "requirementTypes",
      projectId,
      ctx.firestore,
    );

    // Didn't include more information for the context so that the AI can generate it's own focus types (because initially there are none)
    const requirementFocusContext =
      "# FOCUS TYPES AVAILABLE\n\n" +
      allRequirementFocusTagsData.map((focus) => `- ${focus.name}`).join("\n") +
      "\n\n";

    const passedInPrompt =
      prompt != ""
        ? `Consider that the user wants the user stories for the following: ${prompt}`
        : "";

    const completePrompt = `
${await getProjectContextHeader(projectId, ctx.firestore)}

Given the following context, follow the instructions below to the best of your ability.

${requirementsContext}
${priorityTagContext}
${requirementTypeTagContext}
${requirementFocusContext}

${passedInPrompt}

Generate ${amount} requirements for the mentioned software project. Do NOT include any identifier in the name like "Requirement 1", just use a normal title. For the requirement focus, use one of the available focus types, or create a new one if it makes sense, just give it a short name (maximum 3 words). Be extremely vague with the requirement focus so that it can apply to multiple requirements. Do NOT tie the requirement focus too tightly with the functionality. For example, a good requirement focus would be 'Core functionality', 'Security', 'Performance', or it could be related to the type of application such as 'Website', 'Mobile app', etc... For the requirement type, always use one of the available types. When creating the requirement description, make sure to use statistics if possible and if appropriate, and make sure they are as realistic as possible. Don't make the requirement description too long, maximum 4 sentences.
    `;

    const generatedRequirements = await askAiToGenerate(
      completePrompt,
      z.array(
        RequirementSchema.omit({
          requirementFocusId: true,
          scrumId: true,
          deleted: true,
        }).extend({ requirementFocus: z.string() }),
      ),
    );

    const settingsRef = getProjectSettingsRef(projectId, ctx.firestore);

    // Create the generated focus tags if they don't exist
    for (const req of generatedRequirements) {
      const focusName = req.requirementFocus;
      if (!focusName) continue;

      if (!allRequirementFocusTagsData.find((tag) => tag.name === focusName)) {
        const newFocusTag = {
          name: req.requirementFocus,
          color: generateRandomTagColor(),
          deleted: false,
        };
        const addedFocusTag = await settingsRef
          .collection("requirementFocus")
          .add(newFocusTag);

        // Prevent the same focus tag from being added multiple times
        allRequirementFocusTagsData.push({
          id: addedFocusTag.id,
          ...newFocusTag,
        });
      }
    }

    const parsedRequirements = await Promise.all(
      generatedRequirements.map(async (req) => {
        let priority = undefined;
        if (req.priorityId && req.priorityId !== "") {
          priority = await getPriorityTag(settingsRef, req.priorityId);
        }

        let requirementType = undefined;
        if (req.requirementTypeId && req.requirementTypeId !== "") {
          const requirementTypeDoc = await settingsRef
            .collection("requirementTypes")
            .doc(req.requirementTypeId)
            .get();
          requirementType = {
            id: req.requirementTypeId,
            ...TagSchema.parse(requirementTypeDoc.data()),
          } as Tag;
        }

        let requirementFocus = undefined;
        if (req.requirementFocus && req.requirementFocus !== "") {
          requirementFocus = allRequirementFocusTagsData.find(
            (tag) => tag.name === req.requirementFocus,
          );
        }

        return {
          ...req,
          priorityId: priority,
          requirementTypeId: requirementType,
          requirementFocusId: requirementFocus,
        };
      }),
    );

    return parsedRequirements;
  });

export const requirementsRouter = createTRPCRouter({
  getRequirementTypeTags: getRequirementTypeTagsProcedure,
  getRequirementTypeTagById: getRequirementTypeTagByIdProcedure,
  createRequirementTypeTag: createRequirementTypeTagProcedure,
  modifyRequirementTypeTag: modifyRequirementTypeTagProcedure,
  deleteRequirementTypeTag: deleteRequirementTypeTagProcedure,
  getRequirementFocusTags: getRequirementFocusTagsProcedure,
  getRequirementFocusTagById: getRequirementFocusTagByIdProcedure,
  createRequirementFocusTag: createRequirementFocusTagProcedure,
  modifyRequirementFocusTag: modifyRequirementFocusTagProcedure,
  deleteRequirementFocusTag: deleteRequirementFocusTagProcedure,
  getRequirementsTableFriendly: getRequirementsTableFriendlyProcedure,
  getRequirement: getRequirementProcedure,
  createOrModifyRequirement: createOrModifyRequirementProcedure,
  deleteRequirement: deleteRequirementProcedure,
  generateRequirements: generateRequirementsProcedure,
});
