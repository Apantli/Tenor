import { type NextRequest } from "next/server";
import { countTokens } from "~/lib/aiTools/aiGeneration";
import { z } from "zod";

const RequestBodySchema = z.object({
  text: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const validation = RequestBodySchema.safeParse(await req.json());

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { text } = validation.data;

    const tokenCount = await countTokens(text);

    return new Response(JSON.stringify({ tokenCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error counting tokens",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
