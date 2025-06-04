import { type NextRequest } from "next/server";
import { fetchText } from "~/lib/helpers/filecontent";
import { z } from "zod";

const RequestBodySchema = z.object({
  base64: z.string().min(1, "Base64 content cannot be empty"),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const validation = RequestBodySchema.safeParse(body);

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

    const { base64 } = validation.data;
    const textContent = await fetchText(base64);

    return new Response(JSON.stringify({ text: textContent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error extracting text from file",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
