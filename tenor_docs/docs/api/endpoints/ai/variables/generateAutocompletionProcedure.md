[**Tenor API Documentation**](../../README.md)

***

# Variable: generateAutocompletionProcedure

> `const` **generateAutocompletionProcedure**: `MutationProcedure`\<\{ `input`: \{ `messages`: `object`[]; `projectId?`: `string`; `relatedContext`: `Record`\<`string`, `any`\>; \}; `output`: \{ `assistant_message`: `string`; `autocompletion`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/ai.ts:55](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/ai.ts#L55)

Creates an autocompletion using AI based on user messages and related context.

## Param

Object containing procedure parameters
Input object structure:
- messages — An array of message objects, each containing:
  - role — The role of the message sender (e.g., "user", "assistant")
  - content — The content of the message
  - explanation — An optional explanation of the message
- relatedContext — An object containing related context for the AI to consider

## Returns

Object with AI explanation and its autocompletion.

## Http

POST /api/trpc/ai.generateAutocompletion
