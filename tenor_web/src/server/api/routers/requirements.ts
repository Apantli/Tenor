import type {
  Requirement,
  Size,
  Tag,
  WithId,
} from "~/lib/types/firebaseSchemas";
import { RequirementSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getProjectSettingsRef } from "./settings";
import { FieldPath } from "firebase-admin/firestore";

export interface RequirementCol {
  id: string;
  name?: string;
  description: string;
  priorityId: Tag;
  requirementTypeId: Tag;
  requirementFocusId: Tag;
  scrumId: number;
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
    const requirement = { id: doc.id, ...(doc.data() as Requirement) };
    requirements.push(requirement);
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

      const requierementsRef = ctx.firestore
        .collection("projects")
        .doc(input.projectId)
        .collection("requirements");

      if (input.scrumId !== -1) {
        const requierementDocs = await requierementsRef
          .where("scrumId", "==", input.scrumId)
          .get();

        if (requierementDocs.empty) {
          throw new Error("Requirement not found");
        }

        const requierementDoc = requierementDocs.docs[0];
        await requierementDoc?.ref.update(input);
        return "Requirement updated successfully";
      } else {
        const existingRequirementCount = (
          await requierementsRef.count().get()
        ).data().count;
        input.scrumId = existingRequirementCount + 1;
        await requierementsRef.add(input);
        return "Requirement created successfully";
      }
    }),
});
