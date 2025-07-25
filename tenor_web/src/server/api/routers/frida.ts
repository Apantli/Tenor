/**
 * Frida Router - Tenor API Endpoints for AI Requirement Generation
 *
 * @packageDocumentation
 * This file defines the TRPC router and procedures for the Frida AI integration in the Tenor application.
 * It provides endpoints to generate software requirements from contextual information.
 * 
 * The router includes procedures for:
 * - Generating functional and non-functional requirements based on provided context
 *
 * Frida is the integration with external AI services that helps automate the creation of
 * software requirements documentation for projects.
 *
 * @category API
 */

import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

interface APIResponse {
  success: boolean;
  data: string;
  message: string;
  error: unknown;
}

/**
 * Generates a list of functional and non-functional requirements based on the provided context.
 *
 * @param input Object containing procedure parameters
 * Input object structure:
 * - context — Context for generating the requirements
 *
 * @returns Object containing the success status, generated data, message, and any error details.
 *
 * @http POST /api/trpc/frida.generateREQ
 */
export const generateREQProcedure = publicProcedure
  .input(z.string())
  .query(async ({ input }) => {
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
  });

export const fridaRouter = createTRPCRouter({
  generateREQ: generateREQProcedure,
});
