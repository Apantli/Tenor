import type { Requirement, Tag, WithId } from "~/lib/types/firebaseSchemas";
import { RequirementSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getPriorityTag, getProjectSettingsRef } from "./settings";
import { FieldPath } from "firebase-admin/firestore";
import {
  collectPriorityTagContext,
  collectTagContext,
  getProjectContextHeader,
} from "~/utils/aiContext";
import { askAiToGenerate } from "~/utils/aiGeneration";
import { generateRandomTagColor } from "~/utils/colorUtils";

export interface RequirementCol {
  id: string;
  name?: string;
  description: string;
  priorityId: Tag;
  requirementTypeId: Tag;
  requirementFocusId: Tag;
  scrumId?: number;
}

// Get the tags for the requirements type

const getRequirementsFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const requirementsRef = dbAdmin
    .collection(`projects/${projectId}/requirements`)
    .orderBy("scrumId", "asc");
  const requirementsSnapshot = await requirementsRef.get();

  console.log("Requirements snapshot:", requirementsSnapshot.docs);

  const requirements: WithId<Requirement>[] = [];
  requirementsSnapshot.forEach((doc) => {
    const data = doc.data() as Requirement;
    if (data.deleted !== true) {
      requirements.push({ id: doc.id, ...data });
    }
  });
  return requirements;
};

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

export const requirementsRouter = createTRPCRouter({
  getRequirementTypeTags: protectedProcedure
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
    }),
  getRequirementFocusTags: protectedProcedure
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
    }),
  getRequirementsTableFriendly: protectedProcedure
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
    }),
  getRequirement: protectedProcedure
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
    }),

  createOrModifyRequirement: protectedProcedure
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
    }),

  deleteRequirement: protectedProcedure
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
    }),

  generateRequirements: protectedProcedure
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
      const allRequirementFocusTagsData: Tag[] =
        allRequirementFocusTags.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Tag),
        }));

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
        allRequirementFocusTagsData
          .map((focus) => `- ${focus.name}`)
          .join("\n") +
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

Generate ${amount} requirements for the mentioned software project. Do NOT include any identifier in the name like "Requirement 1", just use a normal title. For the requirement focus, use one of the available focus types, or create a new one if it makes sense, just give it a short name (maximum 3 words). Be extremely vague with the requirement focus so that it can apply to multiple requirements. Do NOT tie the requirement focus too tightly with the functionality. For example, a good requirement focus would be 'Core functionality', 'Security', 'Performance', or it could be related to the type of application such as 'Website', 'Mobile app', etc... For the requirement type, always use one of the available types. When creating the requirement description, make sure to use statistics if possible and if appropriate, and make sure they are as realistic as possible.
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

        if (
          !allRequirementFocusTagsData.find((tag) => tag.name === focusName)
        ) {
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
    }),
});
