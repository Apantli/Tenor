[**Tenor API Documentation**](../../README.md)

***

# Variable: generateUserStoriesProcedure

> `const` **generateUserStoriesProcedure**: `MutationProcedure`\<\{ `input`: \{ `amount`: `number`; `projectId`: `string`; `prompt`: `string`; \}; `output`: `UserStoryDetail`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:712](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/userStories.ts#L712)

Generates user stories based on a given prompt and context.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to generate user stories for
- amount — Number of user stories to generate
- prompt — Prompt to guide the generation of user stories

## Returns

Array of generated user stories.

## Http

POST /api/trpc/userStories.generateUserStories
