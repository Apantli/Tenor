import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { zodToJsonSchema } from "zod-to-json-schema";

interface APIResponse {
  success: boolean;
  data: string;
  message: string;
  error: unknown;
}

export const fridaRouter = createTRPCRouter({
  generateREQ: publicProcedure.input(z.string()).query(async ({ input }) => {
    const result = await fetch(
      "https://stk-formador-25.azurewebsites.net/epics/generate-from-prompt/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt:
            "Generate only a list of 10 functional requirements and 3 non-functional requirements for software development based on the following context: ${context}. Provide only the list, without any comments, opinions, explanations, or introductions.",
          data: {
            context: input,
          },
        }),
      },
    );
    return (await result.json()) as APIResponse;
  }),
  genericAIResponse: publicProcedure
    .input(
      z.object({
        schema: z.string(),
        context: z.string(),
        messages: z.array(z.string()),
        prompt: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const schema = z.object({
        response: z.string(),
      });
      const jsonSchema = zodToJsonSchema(schema, "Response");
      console.log(jsonSchema);

      // const result = await fetch(
      //   "https://stk-formador-25.azurewebsites.net/epics/generate-from-prompt/",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       prompt: input.prompt,
      //       data: {
      //         context: input,
      //       },
      //     }),
      //   },
      // );

      // const res = (await result.json()) as APIResponse;
      // console.log(res);
      return "res";
    }),
});
