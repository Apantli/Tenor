/**
 * AI Router - Tenor API Endpoints for AI-related functionality
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for AI-powered features in the Tenor application.
 * It provides endpoints to generate text completions based on user prompts and context.
 *
 * The main procedure ({@link generateAutocompletion}) takes user messages and related context,
 * formats them into a prompt for an AI model, and returns both a brief description
 * of changes and an autocompletion response.
 *
 * @category API
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { parseContext } from "~/utils/aiContext";
import { z } from "zod";
import { askAiToGenerate } from "~/utils/aiGeneration";

/**
 * Creates an autocompletion using AI
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - `messages` — An array of message objects, each containing:
 *   - `role` — The role of the message sender (e.g., "user", "assistant")
 *   - `content` — The content of the message
 *   - `explanation` — An optional explanation of the message
 * - `relatedContext` — An object containing related context for the AI to consider
 * @returns Object with AI explanation and its autocompletion.
 */

export const generateAutocompletion = protectedProcedure
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

    const aiMessage = await askAiToGenerate(
      prompt,
      z.object({
        assistant_message: z.string(),
        autocompletion: z.string(),
      }),
    );

    return aiMessage;
  });

export const aiRouter = createTRPCRouter({
  generateAutocompletion: generateAutocompletion,
});
