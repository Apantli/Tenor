[**Tenor API Documentation**](../../README.md)

***

# Variable: ensureRetrospectiveTeamProgressProcedure

> `const` **ensureRetrospectiveTeamProgressProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:399](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L399)

Ensures team progress metrics exist for a sprint, creating them if needed.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintId - String ID of the sprint

## Returns

Object indicating success status

## Http

POST /api/trpc/sprintRetrospectives.ensureRetrospectiveTeamProgress
