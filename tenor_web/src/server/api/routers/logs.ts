import { listLogs } from '@firebasegen/tenor-muse';
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const logsRouter = createTRPCRouter({
  listLogs: publicProcedure.query(async () => {
    const result = await listLogs();
    return result.data;
  })
});
