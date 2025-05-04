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
import { backlogPermissions, tagPermissions } from "~/lib/permission";
import {
  getRequirement,
  getRequirementFocus,
  getRequirementFocuses,
  getRequirementFocusesRef,
  getRequirementFocusRef,
  getRequirementNewId,
  getRequirementRef,
  getRequirementsRef,
  getRequirementTable,
  getRequirementType,
  getRequirementTypeRef,
  getRequirementTypes,
  getRequirementTypesRef,
} from "~/utils/helpers/shortcuts/requirements";
import { getProjectContextHeader } from "~/utils/helpers/shortcuts/ai";
import { askAiToGenerate } from "~/utils/aiTools/aiGeneration";
import { getSettingsRef } from "~/utils/helpers/shortcuts/general";
import { generateRandomTagColor } from "~/utils/helpers/colorUtils";
import { getPriority } from "~/utils/helpers/shortcuts/tags";

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
        await requirementTypeDoc?.ref.update(requirementType);
        return { id: requirementTypeId, ...requirementType };
      } else {
        const addedDoc = await getRequirementTypesRef(
          ctx.firestore,
          projectId,
        ).add(requirementType);
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
      } else {
        requirementData.scrumId = await getRequirementNewId(
          ctx.firestore,
          projectId,
        );
        await getRequirementsRef(ctx.firestore, projectId).add(requirementData);
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
      await requirementDoc?.ref.update({ deleted: true });
    }),

  generateRequirements: roleRequiredProcedure(
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

      const requirements = await getRequirementTable(ctx.firestore, projectId);
      const requirementFocuses = await getRequirementFocuses(
        ctx.firestore,
        projectId,
      );
      const requirementTypes = await getRequirementTypes(
        ctx.firestore,
        projectId,
      );

      let requirementsContext = "# EXISTING REQUIREMENTS\n\n";
      requirements.forEach((requirement) => {
        requirementsContext += `- id: ${requirement.id}\n- name: ${requirement.name}\n- description: ${requirement.description}\n- priorityId: ${requirement.priority}\n- typeId: ${requirement.requirementType}\n- focus: ${requirement.requirementFocus}\n\n`;
      });

      // const priorityTagContext = await collectPriorityTagContext(
      //   ctx.firestore,
      //   projectId,
      // );
      const priorities: WithId<Tag>[] = [];

      // Didn't include more information for the context so that the AI can generate it's own focus types (because initially there are none)
      const requirementFocusContext =
        "# FOCUS TYPES AVAILABLE\n\n" +
        requirementFocuses.map((focus) => `- ${focus.name}`).join("\n") +
        "\n\n";

      const passedInPrompt =
        prompt != ""
          ? `Consider that the user wants the user stories for the following: ${prompt}`
          : "";

      const completePrompt = `
${await getProjectContextHeader(ctx.firestore, projectId)}

Given the following context, follow the instructions below to the best of your ability.

${requirementsContext}
${priorities}
${requirementTypes}
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

      const settingsRef = getSettingsRef(ctx.firestore, projectId);

      // Create the generated focus tags if they don't exist
      for (const req of generatedRequirements) {
        const focusName = req.requirementFocus;
        if (!focusName) continue;

        if (!requirementFocuses.find((tag) => tag.name === focusName)) {
          const newFocusTag = {
            name: req.requirementFocus,
            color: generateRandomTagColor(),
            deleted: false,
          };
          const addedFocusTag = await settingsRef
            .collection("requirementFocus")
            .add(newFocusTag);

          // Prevent the same focus tag from being added multiple times
          requirementFocuses.push({
            id: addedFocusTag.id,
            ...newFocusTag,
          });
        }
      }

      const parsedRequirements = await Promise.all(
        generatedRequirements.map(async (req) => {
          let priority = undefined;
          if (req.priorityId && req.priorityId !== "") {
            priority = await getPriority(
              ctx.firestore,
              projectId,
              req.priorityId,
            );
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
            requirementFocus = requirementFocuses.find(
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
    }),
});
