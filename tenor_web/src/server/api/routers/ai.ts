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
import { z } from "zod";
import { askAiToGenerate } from "~/utils/aiGeneration";

export const ContextObjectSchema = z.record(z.string(), z.any());
export type ContextObject = z.infer<typeof ContextObjectSchema>;

export const parseContext = ({
  contextObject,
  removeEmpty = true,
}: {
  contextObject: ContextObject;
  removeEmpty?: boolean;
}) => {
  let objectEntries = Object.entries(contextObject);
  if (removeEmpty)
    objectEntries = objectEntries.filter(([_, value]) => value !== null);

  return objectEntries
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
};

/**
 * Creates an autocompletion using AI based on user messages and related context.
 *
 * @param input Object containing procedure parameters  
 * Input object structure:  
 * - messages — An array of message objects, each containing:  
 *   - role — The role of the message sender (e.g., "user", "assistant")  
 *   - content — The content of the message  
 *   - explanation — An optional explanation of the message  
 * - relatedContext — An object containing related context for the AI to consider  
 *
 * @returns Object with AI explanation and its autocompletion.
 *
 * @http POST /api/trpc/ai.generateAutocompletion
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

Your task is to generate an assistant_message that includes:
1. A **brief explanation** of what changes were made based on the latest user message (e.g., additions, removals, rephrasings).
2. An **autocompletion**, which should be the assistant's direct response to the user's latest message.

Important requirements:
- If the user's message does **not** request a change, **leave the autocompletion with the same value as the value in the field**, and only answer back with an assistant_message to answer the inquiry.
- Be concise and relevant. Focus only on what was actually changed or requested.
- If the user requests a change or to create something, make sure to include the changes in the autocompletion.
- Address the user directly in the assistant_message, by using "you" or "your", or the user name if available and appropriate.
Here is the context you should consider:
${contextString}

And here is the message history:
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
