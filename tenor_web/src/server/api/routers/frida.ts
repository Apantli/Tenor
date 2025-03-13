import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

interface APIResponse {
  success: boolean,
  data: string,
  message: string,
  error: unknown,
}

export const fridaRouter = createTRPCRouter({
  generateREQ: publicProcedure.input(z.string()).query(async ({input}) => {
    const result = await fetch('https://stk-formador-25.azurewebsites.net/epics/generate-from-prompt/', 
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Generate only a list of 10 functional requirements and 3 non-functional requirements for software development based on the following context: ${context}. Provide only the list, without any comments, opinions, explanations, or introductions.',
        data: {
          context : input
        }
      }),
    });
    return await result.json() as APIResponse;
  })
});
