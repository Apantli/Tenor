import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const logsRouter = createTRPCRouter({
  listLogs: publicProcedure.query(async () => {
    const result = {data: []};
    return result.data;
  })
});
