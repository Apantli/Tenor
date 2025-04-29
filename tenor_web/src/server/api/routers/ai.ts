import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { parseContext } from "~/utils/aiContext";
import { z } from "zod";
import { askAiToGenerate } from "~/utils/aiGeneration";

export const aiRouter = createTRPCRouter({
  generateAutocompletion: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.string(),
            content: z.string(),
            explanation: z.string().optional(),
          }),
        ),
        relatedContext: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ input }) => {
      const contextString = parseContext({
        contextObject: input.relatedContext,
      });

      const prompt = `Help the user to the best of your ability.

      Your task is to return an assistant_message that provides A BRIEF DESCRIPTION OF THE CHANGES, and an autocompletion, WHICH SHOULD BE THE RESPONSE TO THE USERS' MESSAGE.
      
      Consider the following as context:
  
      ${contextString}

      Now, here is the list of messages:
      ${input.messages.map((message) => `"${message.role}": <content>"${message.content}"</content>\n<explanation>${message.explanation ?? "None"}</explanation>`).join(", ")}
      `;

      console.log("Prompt: ", prompt);

      const aiMessage = await askAiToGenerate(
        prompt,
        z.object({
          assistant_message: z.string(),
          autocompletion: z.string(),
        }),
      );

      return aiMessage;
    }),
});
