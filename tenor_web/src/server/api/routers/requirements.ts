import type { Requirement, Size, Tag, WithId } from "~/lib/types/firebaseSchemas";
import { RequirementSchema } from "~/lib/types/zodFirebaseSchema";
import { dbAdmin } from "~/utils/firebaseAdmin";
import { z } from "zod";
import { createRequire } from "module";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { title } from "process";

export interface RequirementCol {
  id: string;
  name: string;
  description: string;
  priorityId: string;
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

function getRandomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error("Min must be less than or equal to max");
  }

  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// TODO: Fetch from db
const getPriorityTag = () => {
  const rand = getRandomInt(1, 2);
  return {
    name: rand == 1 ? "High" : "Low",
    color: rand == 1 ? "#FF4C4C" : "#009719",
    deleted: false,
  } as Tag;
};

const createRequirementsTableData = (data: WithId<Requirement>[]) => {
  if (data.length === 0) return [];

  const fixedData = data.map((requirement) => ({
    id: requirement.id,
    name: requirement.name,
    description: requirement.description,
    priorityId: requirement.priorityId,
    requirementTypeId: requirement.requirementTypeId,
    requirementFocusId: requirement.requirementFocusId,
    size: requirement.size,
    scrumId: requirement.scrumId,
  })) as RequirementCol[];
  return fixedData;
}

export const requirementsRouter = createTRPCRouter({
  getRequirementsTableFriendly: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input}) => {
      const rawReq = await getRequirementsFromProject(ctx.firestore, input);
      const tableData = createRequirementsTableData(rawReq);
      return tableData;
    }),
});
  