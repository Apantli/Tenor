[**Tenor API Documentation**](../../README.md)

***

# Variable: generateAutocompletion

> `const` **generateAutocompletion**: `MutationProcedure`\<\{ `input`: \{ `messages`: `object`[]; `relatedContext`: `Record`\<`string`, `any`\>; \}; `output`: \{ `assistant_message`: `string`; `autocompletion`: `string`; \}; \}\>

Defined in: [src/server/api/routers/ai.ts:33](https://github.com/Apantli/Tenor/blob/b645dd7f4e4de25285aef45710556dc56954d32f/tenor_web/src/server/api/routers/ai.ts#L33)

Creates an autocompletion using AI

## Param

Object containing procedure parameters
Input object structure:
- `messages` — An array of message objects, each containing:
  - `role` — The role of the message sender (e.g., "user", "assistant")
  - `content` — The content of the message
  - `explanation` — An optional explanation of the message
- `relatedContext` — An object containing related context for the AI to consider

## Returns

Object with AI explanation and its autocompletion.
