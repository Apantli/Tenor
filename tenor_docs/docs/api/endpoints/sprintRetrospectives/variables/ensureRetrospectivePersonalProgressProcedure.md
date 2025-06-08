[**Tenor API Documentation**](../../README.md)

***

# Variable: ensureRetrospectivePersonalProgressProcedure

> `const` **ensureRetrospectivePersonalProgressProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintId`: `string`; `userId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:431](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L431)

Ensures personal progress metrics exist for an individual in a sprint, creating them if needed.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintId - String ID of the sprint
- userId - String ID of the user

## Returns

Object indicating success status

## Http

POST /api/trpc/sprintRetrospectives.ensureRetrospectivePersonalProgress
