import type { Requirement, Size, Tag, WithId } from "~/lib/types/firebaseSchemas";
import { RequirementSchema, TagSchema } from "~/lib/types/zodFirebaseSchema";
import { dbAdmin } from "~/utils/firebaseAdmin";
import { boolean, z } from "zod";
import { createRequire } from "module";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { title } from "process";
import TagComponent from "~/app/_components/TagComponent";
import { getProjectSettingsRef } from "./settings";

export interface RequirementCol {
  id: string;
  name?: string;
  description: string;
  priorityId: Tag;
  requirementTypeId: string;
  requirementFocusId: string;
  size: Size;
  scrumId: number;
}

const getRequirementsFromProject = async (
  dbAdmin: FirebaseFirestore.Firestore,
  projectId: string,
) => {
  const requirementsRef = dbAdmin
    .collection(`projects/${projectId}/requirements`)
    .orderBy("scrumId", "asc");
  const requirementsSnapshot = await requirementsRef.get();

  console.log("Requirements snapshot:", requirementsSnapshot.docs);

  const docs = requirementsSnapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    }
  });

  const requirements: WithId<Requirement>[] = [];
  requirementsSnapshot.forEach((doc) => {
    const requirement = { id: doc.id, ...(doc.data() as Requirement) };
    requirements.push(requirement);
  });
  return requirements;
}

const createRequirementsTableData = async (
  data: WithId<Requirement>[],
  projectId: string,
  dbAdmin: FirebaseFirestore.Firestore,
) => {
  if (data.length === 0) return [];

  const uniquePriorityIds = Array.from(
    new Set(data.map((req) => req.priorityId).filter(Boolean)),
  );

  const settingsRef = getProjectSettingsRef(projectId, dbAdmin);
  const tagsData = await Promise.all(
    uniquePriorityIds.map(async (tagId) => {
      const tagSnap = await settingsRef.collection("priorityTypes").doc(tagId).get();
      if (!tagSnap.exists) return null;
      return { id: tagId, ...TagSchema.parse(tagSnap.data()) };
    }),
  );

  const tagMap = new Map(
    tagsData
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
    requirementTypeId: requirement.requirementTypeId,
    requirementFocusId: requirement.requirementFocusId,
    size: requirement.size,
    scrumId: requirement.scrumId,
  })) as RequirementCol[];

  return fixedData;
};

export const requirementsRouter = createTRPCRouter({
  getRequirementsTableFriendly: protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const rawRequirements = await getRequirementsFromProject(ctx.firestore, input.projectId);
    const tableData = await createRequirementsTableData(
      rawRequirements,
      input.projectId,
      ctx.firestore,
    );
    return tableData;
  }),
});
  