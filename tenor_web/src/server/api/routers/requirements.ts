/**
 * Requirements Router - Tenor API Endpoints for Requirement Management
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for managing Requirements in the Tenor application.
 * It provides endpoints to create, modify, and retrieve requirement data within projects.
 *
 * @category API
 */

import type { Tag, WithId } from "~/lib/types/firebaseSchemas";
import { RequirementSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  roleRequiredProcedure,
} from "~/server/api/trpc";
import {
  backlogPermissions,
  tagPermissions,
} from "~/lib/defaultValues/permission";
import {
  getRequirement,
  getRequirementContext,
  getRequirementFocus,
  getRequirementFocuses,
  getRequirementFocusesRef,
  getRequirementFocusRef,
  getRequirementRef,
  getRequirementsRef,
  getRequirementTable,
  getRequirementType,
  getRequirementTypeRef,
  getRequirementTypes,
  getRequirementTypesRef,
} from "../shortcuts/requirements";
import { askAiToGenerate } from "~/lib/aiTools/aiGeneration";
import { generateRandomTagColor } from "~/lib/helpers/colorUtils";
import { getPriorityByNameOrId } from "../shortcuts/tags";
import type { RequirementCol } from "~/lib/types/columnTypes";
import { LogProjectActivity } from "../lib/projectEventLogger";

// Procedures are defined below as separate constants
// Each procedure has JSDoc documentation about its parameters, return values, and corresponding HTTP endpoint

/**
 * Retrieves all requirement types for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of requirement types for the specified project
 *
 * @http GET /api/trpc/requirements.getRequirementTypes
 */
export const getRequirementTypesProcedure = roleRequiredProcedure(
  tagPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getRequirementTypes(ctx.firestore, projectId);
  });

/**
 * Retrieves a specific requirement type by ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - requirementTypeId - String ID of the requirement type
 *
 * @returns Requirement type object or null if not found
 *
 * @http GET /api/trpc/requirements.getRequirementType
 */
export const getRequirementTypeProcedure = roleRequiredProcedure(
  tagPermissions,
  "read",
)
  .input(z.object({ projectId: z.string(), requirementTypeId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, requirementTypeId } = input;
    return await getRequirementType(
      ctx.firestore,
      projectId,
      requirementTypeId,
    );
  });

/**
 * Creates or modifies a requirement type.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - requirementTypeId - Optional string ID of the requirement type (for updates)
 * - tagData - Tag object with the requirement type data
 *
 * @returns Object containing the created or updated requirement type with its ID
 *
 * @http POST /api/trpc/requirements.createOrModifyRequirementType
 */
export const createOrModifyRequirementTypeProcedure = roleRequiredProcedure(
  tagPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      requirementTypeId: z.string().optional(),
      tagData: TagSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, requirementTypeId, tagData: requirementType } = input;

    if (requirementTypeId) {
      const requirementTypeDoc = await getRequirementTypeRef(
        ctx.firestore,
        projectId,
        requirementTypeId,
      ).get();
      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: requirementTypeId,
        type: "RE",
        action: "update",
      });
      await requirementTypeDoc?.ref.update(requirementType);
      return { id: requirementTypeId, ...requirementType };
    } else {
      const addedDoc = await getRequirementTypesRef(
        ctx.firestore,
        projectId,
      ).add(requirementType);
      const requirementTypeId = addedDoc.id;
      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: requirementTypeId,
        type: "RE",
        action: "update",
      });
      return { id: addedDoc.id, ...requirementType };
    }
  });

/**
 * Marks a requirement type as deleted.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - tagId - String ID of the requirement type to delete
 *
 * @returns void
 *
 * @http POST /api/trpc/requirements.deleteRequirementType
 */
export const deleteRequirementTypeProcedure = roleRequiredProcedure(
  tagPermissions,
  "write",
)
  .input(z.object({ projectId: z.string(), tagId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, tagId: requirementTypeId } = input;
    const requirementTypeDoc = await getRequirementTypeRef(
      ctx.firestore,
      projectId,
      requirementTypeId,
    ).get();

    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: requirementTypeId,
      type: "RE",
      action: "update",
    });

    await requirementTypeDoc?.ref.update({ deleted: true });
  });

/**
 * Retrieves all requirement focuses for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Array of requirement focuses for the specified project
 *
 * @http GET /api/trpc/requirements.getRequirementFocuses
 */
export const getRequirementFocusesProcedure = roleRequiredProcedure(
  tagPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    return await getRequirementFocuses(ctx.firestore, projectId);
  });

/**
 * Retrieves a specific requirement focus by ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - requirementFocusId - String ID of the requirement focus
 *
 * @returns Requirement focus object or null if not found
 *
 * @http GET /api/trpc/requirements.getRequirementFocus
 */
export const getRequirementFocusProcedure = roleRequiredProcedure(
  tagPermissions,
  "read",
)
  .input(z.object({ projectId: z.string(), requirementFocusId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, requirementFocusId } = input;
    return await getRequirementFocus(
      ctx.firestore,
      projectId,
      requirementFocusId,
    );
  });

/**
 * Creates or modifies a requirement focus.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - requirementFocusId - Optional string ID of the requirement focus (for updates)
 * - tagData - Tag object with the requirement focus data
 *
 * @returns Object containing the created or updated requirement focus with its ID
 *
 * @http POST /api/trpc/requirements.createOrModifyRequirementFocus
 */
export const createOrModifyRequirementFocusProcedure = roleRequiredProcedure(
  tagPermissions,
  "write",
)
  .input(
    z.object({
      projectId: z.string(),
      requirementFocusId: z.string().optional(),
      tagData: TagSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, requirementFocusId, tagData: requirementFocus } = input;
    if (requirementFocusId) {
      const requirementFocusDoc = await getRequirementFocusRef(
        ctx.firestore,
        projectId,
        requirementFocusId,
      ).get();
      await requirementFocusDoc?.ref.update(requirementFocus);
      return { id: requirementFocusId, ...requirementFocus } as WithId<Tag>;
    } else {
      const addedDoc = await getRequirementFocusesRef(
        ctx.firestore,
        projectId,
      ).add(requirementFocus);
      return { id: addedDoc.id, ...requirementFocus } as WithId<Tag>;
    }
  });

/**
 * Marks a requirement focus as deleted.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - tagId - String ID of the requirement focus to delete
 *
 * @returns void
 *
 * @http POST /api/trpc/requirements.deleteRequirementFocus
 */
export const deleteRequirementFocusProcedure = roleRequiredProcedure(
  tagPermissions,
  "write",
)
  .input(z.object({ projectId: z.string(), tagId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, tagId: requirementFocusId } = input;
    const requirementFocusDoc = await getRequirementFocusRef(
      ctx.firestore,
      projectId,
      requirementFocusId,
    ).get();
    await requirementFocusDoc?.ref.update({ deleted: true });
  });

/**
 * Retrieves a table of requirements for a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Requirement table data for the project
 *
 * @http GET /api/trpc/requirements.getRequirementTable
 */
export const getRequirementTableProcedure = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    return await getRequirementTable(ctx.firestore, input.projectId);
  });

/**
 * Retrieves a specific requirement by ID.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - requirementId - String ID of the requirement
 *
 * @returns Requirement object or null if not found
 *
 * @http GET /api/trpc/requirements.getRequirement
 */
export const getRequirementProcedure = roleRequiredProcedure(
  backlogPermissions,
  "read",
)
  .input(z.object({ projectId: z.string(), requirementId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId, requirementId } = input;
    return await getRequirement(ctx.firestore, projectId, requirementId);
  });

/**
 * Creates or modifies a requirement.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - requirementData - Object with requirement data
 * - projectId - String ID of the project
 * - requirementId - Optional string ID of the requirement (for updates)
 *
 * @returns Object containing the ID of the created or updated requirement
 *
 * @http POST /api/trpc/requirements.createOrModifyRequirement
 */
export const createOrModifyRequirementProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(
    z.object({
      requirementData: RequirementSchema,
      projectId: z.string(),
      requirementId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectId, requirementId, requirementData } = input;

    if (requirementId) {
      const requirementDoc = await getRequirementRef(
        ctx.firestore,
        projectId,
        requirementId,
      ).get();
      await requirementDoc?.ref.update(requirementData);
      await LogProjectActivity({
        firestore: ctx.firestore,
        projectId: input.projectId,
        userId: ctx.session.user.uid,
        itemId: requirementId,
        type: "RE",
        action: "update",
      });
      return { id: requirementId };
    } else {
      const { id: newRequirementId } = await ctx.firestore.runTransaction(
        async (transaction) => {
          const requirementsRef = getRequirementsRef(ctx.firestore, projectId);

          const requirementCount = await transaction.get(
            requirementsRef.count(),
          );

          const requirementDataUpdated = RequirementSchema.parse({
            ...requirementData,
            scrumId: requirementCount.data().count + 1,
          });
          const docRef = requirementsRef.doc();

          transaction.create(docRef, requirementDataUpdated);

          await LogProjectActivity({
            firestore: ctx.firestore,
            projectId: input.projectId,
            userId: ctx.session.user.uid,
            itemId: docRef.id,
            type: "RE",
            action: "create",
          });

          return {
            id: docRef.id,
          };
        },
      );

      return { id: newRequirementId };
    }
  });

/**
 * Marks a requirement as deleted.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 * - requirementId - String ID of the requirement to delete
 *
 * @returns void
 *
 * @http POST /api/trpc/requirements.deleteRequirement
 */
export const deleteRequirementProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(z.object({ projectId: z.string(), requirementId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { projectId, requirementId } = input;
    const requirementDoc = await getRequirementRef(
      ctx.firestore,
      projectId,
      requirementId,
    ).get();
    await LogProjectActivity({
      firestore: ctx.firestore,
      projectId: input.projectId,
      userId: ctx.session.user.uid,
      itemId: requirementId,
      type: "RE",
      action: "delete",
    });
    await requirementDoc?.ref.update({ deleted: true });
  });

/**
 * @function generateRequirements
 * @description Retrieves the context for generating requirements based on the project ID and amount.
 * @param projectId The ID of the project.
 * @param amount The number of requirements to generate.
 * @param prompt The prompt to use for generating requirements.
 * @returns {Promise<RequirementCol[]>} An array of generated requirements.
 */
export const generateRequirementsProcedure = roleRequiredProcedure(
  backlogPermissions,
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

    const completePrompt = await getRequirementContext(
      ctx.firestore,
      projectId,
      amount,
      prompt,
    );

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

    // Create the generated focus tags if they don't exist
    const requirementFocuses = await getRequirementFocuses(
      ctx.firestore,
      projectId,
    );
    for (const req of generatedRequirements) {
      const focusName = req.requirementFocus;
      if (!focusName) continue;

      if (!requirementFocuses.find((tag) => tag.name === focusName)) {
        const newFocusTag = {
          name: req.requirementFocus,
          color: generateRandomTagColor(),
          deleted: false,
        };
        const addedFocusTag = await getRequirementFocusesRef(
          ctx.firestore,
          projectId,
        ).add(newFocusTag);

        // Prevent the same focus tag from being added multiple times
        requirementFocuses.push({
          id: addedFocusTag.id,
          ...newFocusTag,
        });
      }
    }

    const parsedRequirements: RequirementCol[] = await Promise.all(
      generatedRequirements.map(async (req) => {
        const priority = req.priorityId
          ? await getPriorityByNameOrId(
              ctx.firestore,
              projectId,
              req.priorityId, // Assuming this is a name or ID because the AI is dumb and doesn't always return the ID
            )
          : undefined;

        const requirementType = req.requirementTypeId
          ? await getRequirementType(
              ctx.firestore,
              projectId,
              req.requirementTypeId,
            )
          : undefined;

        const requirementFocus = requirementFocuses.find(
          (tag) => tag.name === req.requirementFocus,
        );

        if (!requirementFocus || !requirementType || !priority) {
          throw new Error("Requirement focus, type, or priority not found");
        }

        // generate a random uuid
        const newRequirement: WithId<RequirementCol> = {
          id: crypto.randomUUID(),
          scrumId: -1, // Assign a valid scrumId here
          ...req,
          requirementFocus: requirementFocus,
          requirementType: requirementType,
          priority: priority,
        };

        return newRequirement;
      }),
    );

    return parsedRequirements;
  });

/**
 * Retrieves the default requirement type for a project.
 * Returns "Functional" if it exists, otherwise the first type alphabetically.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Default requirement type object
 *
 * @http GET /api/trpc/requirements.getDefaultRequirementType
 */
export const getDefaultRequirementTypeProcedure = roleRequiredProcedure(
  backlogPermissions,
  "write",
)
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const requirementTypes = await getRequirementTypes(
      ctx.firestore,
      projectId,
    );
    // Default type is functional unless it doesn't exist, in which case we return the first one alphabetically
    const functional = requirementTypes.find(
      (type) => type.name === "Functional",
    );
    if (functional) {
      return functional;
    } else {
      const sortedRequirementTypes = requirementTypes.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      return sortedRequirementTypes[0];
    }
  });

/**
 * Gets the count of requirements in a project.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - projectId - String ID of the project
 *
 * @returns Number indicating the count of requirements
 *
 * @http GET /api/trpc/requirements.getRequirementsCount
 */
export const getRequirementsCountProcedure = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { projectId } = input;
    const requirementRef = getRequirementsRef(ctx.firestore, projectId);
    const countSnapshot = await requirementRef.count().get();
    return countSnapshot.data().count;
  });

/**
 * Requirements Router - Centralizes all requirement-related procedures.
 * Provides a structured interface for requirement management across the application.
 */
export const requirementsRouter = createTRPCRouter({
  getRequirementTypes: getRequirementTypesProcedure,
  getRequirementType: getRequirementTypeProcedure,
  createOrModifyRequirementType: createOrModifyRequirementTypeProcedure,
  deleteRequirementType: deleteRequirementTypeProcedure,
  getRequirementFocuses: getRequirementFocusesProcedure,
  getRequirementFocus: getRequirementFocusProcedure,
  createOrModifyRequirementFocus: createOrModifyRequirementFocusProcedure,
  deleteRequirementFocus: deleteRequirementFocusProcedure,
  getRequirementTable: getRequirementTableProcedure,
  getRequirement: getRequirementProcedure,
  createOrModifyRequirement: createOrModifyRequirementProcedure,
  deleteRequirement: deleteRequirementProcedure,
  generateRequirements: generateRequirementsProcedure,
  getDefaultRequirementType: getDefaultRequirementTypeProcedure,
  getRequirementsCount: getRequirementsCountProcedure,
});
