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
import { createTRPCRouter, roleRequiredProcedure } from "~/server/api/trpc";
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

export const requirementsRouter = createTRPCRouter({
  getRequirementTypes: roleRequiredProcedure(tagPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getRequirementTypes(ctx.firestore, projectId);
    }),

  getRequirementType: roleRequiredProcedure(tagPermissions, "read")
    .input(z.object({ projectId: z.string(), requirementTypeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, requirementTypeId } = input;
      return await getRequirementType(
        ctx.firestore,
        projectId,
        requirementTypeId,
      );
    }),

  createOrModifyRequirementType: roleRequiredProcedure(tagPermissions, "write")
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
    }),

  deleteRequirementType: roleRequiredProcedure(tagPermissions, "write")
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
    }),

  getRequirementFocuses: roleRequiredProcedure(tagPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      return await getRequirementFocuses(ctx.firestore, projectId);
    }),
  getRequirementFocus: roleRequiredProcedure(tagPermissions, "read")
    .input(z.object({ projectId: z.string(), requirementFocusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, requirementFocusId } = input;
      return await getRequirementFocus(
        ctx.firestore,
        projectId,
        requirementFocusId,
      );
    }),
  createOrModifyRequirementFocus: roleRequiredProcedure(tagPermissions, "write")
    .input(
      z.object({
        projectId: z.string(),
        requirementFocusId: z.string().optional(),
        tagData: TagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        projectId,
        requirementFocusId,
        tagData: requirementFocus,
      } = input;
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
    }),

  deleteRequirementFocus: roleRequiredProcedure(tagPermissions, "write")
    .input(z.object({ projectId: z.string(), tagId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, tagId: requirementFocusId } = input;
      const requirementFocusDoc = await getRequirementFocusRef(
        ctx.firestore,
        projectId,
        requirementFocusId,
      ).get();
      await requirementFocusDoc?.ref.update({ deleted: true });
    }),

  getRequirementTable: roleRequiredProcedure(backlogPermissions, "read")
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getRequirementTable(ctx.firestore, input.projectId);
    }),

  getRequirement: roleRequiredProcedure(backlogPermissions, "read")
    .input(z.object({ projectId: z.string(), requirementId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId, requirementId } = input;
      return await getRequirement(ctx.firestore, projectId, requirementId);
    }),

  createOrModifyRequirement: roleRequiredProcedure(backlogPermissions, "write")
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
            const requirementsRef = getRequirementsRef(
              ctx.firestore,
              projectId,
            );

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
    }),

  deleteRequirement: roleRequiredProcedure(backlogPermissions, "write")
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
    }),

  /**
   * @function generateRequirements
   * @description Retrieves the context for generating requirements based on the project ID and amount.
   * @param projectId The ID of the project.
   * @param amount The number of requirements to generate.
   * @param prompt The prompt to use for generating requirements.
   * @returns {Promise<RequirementCol[]>} An array of generated requirements.
   */
  generateRequirements: roleRequiredProcedure(backlogPermissions, "write")
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
    }),

  getDefaultRequirementType: roleRequiredProcedure(backlogPermissions, "write")
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
    }),
});
