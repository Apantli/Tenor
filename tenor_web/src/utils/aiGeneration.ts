import { TRPCError } from "@trpc/server";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { env } from "~/env";

async function promptAi(prompt: string) {
  if (env.GENERATIVE_AI === "softtek") {
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
    const responseData = await response.json();

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
    const generatedJson = JSON.parse(jsonString);

    return generatedJson;
  } else if (env.GENERATIVE_AI === "gemini") {
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
    const responseData = await response.json();

    // Remove ```json from start and ``` from end// Remove ```json from start and ``` from end
    const jsonString = responseData.candidates[0].content.parts[0].text
      .replace(/```json/g, "")
      .replace(/```/g, "");
    const generatedJson = JSON.parse(jsonString);

    return generatedJson;
  }
}

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

Return only the JSON on one line.`;

  const generatedJson = await promptAi(fullPrompt);

  try {
    const parsedData = returnSchema.parse(generatedJson);
    return parsedData as z.infer<T>;
  } catch (error) {
    console.log("Retrying AI generation due to schema mismatch:", error);
    return askAiToGenerate(prompt, returnSchema, attempts + 1);
  }
}
