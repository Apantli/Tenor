import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { env } from "~/env";

interface SofttekResponse {
  success: boolean;
  data: string;
}

type GeminiResponse =
  | {
      candidates: {
        content: {
          parts: {
            text: string;
          }[];
        };
      }[];
    }
  | {
      error: {
        code: number;
        message: string;
        status: string;
      };
    };

async function promptAi(prompt: string, forceModel?: "softtek" | "gemini") {
  if (
    (env.GENERATIVE_AI === "softtek" || forceModel === "softtek") &&
    forceModel !== "gemini"
  ) {
    const preparedPrompt = prompt.replaceAll("{", "{{").replaceAll("}", "}}");

    const response = await fetch(
      "https://stk-formador-25.azurewebsites.net/epics/generate-from-prompt",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: preparedPrompt,
          data: {},
        }),
      },
    );
    const responseData = (await response.json()) as SofttekResponse;

    if (!responseData.success) {
      console.error("Error from AI:", responseData);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI generation failed",
      });
    }

    // Remove ```json from start and ``` from end// Remove ```json from start and ``` from end
    const jsonString = responseData.data
      .replace(/```json/g, "")
      .replace(/```/g, "");

    // eslint-disable-next-line
    const generatedJson: any = JSON.parse(jsonString);
    // eslint-disable-next-line
    return generatedJson;
  } else if (env.GENERATIVE_AI === "gemini" || forceModel === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );
    const responseData = (await response.json()) as GeminiResponse;

    if ("error" in responseData) {
      console.log("Gemini is unavailable, using softtek as backup");
      // eslint-disable-next-line
      return await promptAi(prompt, "softtek");
    }

    if (!responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("Error from AI:", responseData);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI generation failed, invalid response structure",
      });
    }

    // Remove ```json from start and ``` from end// Remove ```json from start and ``` from end
    const jsonString = responseData.candidates[0].content.parts[0].text
      .replace(/```json/g, "")
      .replace(/```/g, "");
    // eslint-disable-next-line
    const generatedJson: any = JSON.parse(jsonString);

    // eslint-disable-next-line
    return generatedJson;
  }
}

// eslint-disable-next-line
export async function askAiToGenerate<T extends z.ZodType<any>>(
  prompt: string,
  returnSchema: T,
  attempts = 0,
) {
  if (attempts > 3) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "AI generation failed after multiple attempts",
    });
  }

  const schemaJson = JSON.stringify(zodToJsonSchema(returnSchema), null, 2);

  const fullPrompt = `${prompt}

Please generate a JSON object that strictly conforms to the following schema:

${schemaJson}

⚠️ Important instructions:
- ✅ Only return valid JSON that exactly matches the schema.
- ❌ Do NOT include markdown, code blocks, comments, or any explanation.
- ❌ Do NOT include any line breaks or formatting — return a single-line JSON string only.
- ⚠️ All required fields must be present.
- ✅ Use realistic sample data for each field (don't use placeholders like "string" or "123").
- ❌ Do NOT include any additional fields or properties that are not in the schema.
- ❌ Do NOT add any top level keys or metadata such as a type, version or items array.
- ⚠️ IF the schema has an array as the root type, make sure to always return an array, do NOT return an object.

Return only the JSON on one line. Pay very close attention to make sure the JSON is valid and matches the schema exactly. If the schema doesn't match exactly, you WILL GET PUNISHED`;

  // eslint-disable-next-line
  const generatedJson = await promptAi(fullPrompt);

  try {
    const parsedData = returnSchema.parse(generatedJson) as z.infer<T>;
    // eslint-disable-next-line
    return parsedData;
  } catch (error) {
    console.log("Retrying AI generation due to schema mismatch:", error);
    return askAiToGenerate(prompt, returnSchema, attempts + 1);
  }
}
