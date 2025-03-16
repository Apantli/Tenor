import { env } from "~/env";

import {
  createTRPCRouter,
  protectedProcedure,
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
    const result = await ctx.supabase.rpc("get_user_logs", {userid: ctx.session?.user.uid});
    return result.data as Log[];
  }),

  analyzeAndCreateLog: protectedProcedure.mutation(async ({ctx}) => {
    const analysisResult = await fetch(`http://${env.FIREBASE_EMULATOR_IP}:5001/tenor-1272a/us-central1/analyze_emotion`).then(r => r.json()) as AnalysisResult;

    const insertResult = await ctx.supabase.rpc("create_user_log", {userid: ctx.session?.user.uid, emotion: analysisResult.emotion, created_at: new Date(analysisResult.timestamp).toISOString()})

    return insertResult;
  })
});
