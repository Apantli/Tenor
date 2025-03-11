import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

interface Log {
  id: number,
  userid: string,
  emotion: string,
  created_at: string
}

interface AnalysisResult {
  emotion: string,
  timestamp: number,
};

export const logsRouter = createTRPCRouter({
  listLogs: protectedProcedure.query(async ({ctx}) => {
    const result = await ctx.supabase.rpc("get_user_logs", {userid: ctx.session?.user.id});
    return result.data as Log[];
  }),

  analyzeAndCreateLog: protectedProcedure.mutation(async ({ctx}) => {
    const analysisResult = await fetch("http://127.0.0.1:5001/tenor-1272a/us-central1/analyze_emotion").then(r => r.json()) as AnalysisResult;

    const insertResult = await ctx.supabase.rpc("create_user_log", {userid: ctx.session?.user.id, emotion: analysisResult.emotion, created_at: new Date(analysisResult.timestamp).toISOString()})

    return insertResult;
  })
});
