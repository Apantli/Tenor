[**Tenor API Documentation**](../../README.md)

***

# Variable: generateUserStoriesProcedure

> `const` **generateUserStoriesProcedure**: `MutationProcedure`\<\{ `input`: \{ `amount`: `number`; `projectId`: `string`; `prompt`: `string`; \}; `output`: `UserStoryDetail`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:550](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L550)

Generates user stories using AI based on a given prompt.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the user stories belong
- amount - Number of user stories to generate
- prompt - String prompt to use for generating user stories

## Returns

Array of generated user stories

## Http

POST /api/trpc/userStories.generateUserStories
