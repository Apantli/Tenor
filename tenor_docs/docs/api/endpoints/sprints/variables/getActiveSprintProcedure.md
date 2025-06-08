[**Tenor API Documentation**](../../README.md)

***

# Variable: getActiveSprintProcedure

> `const` **getActiveSprintProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `null` \| `WithId`\<`Sprint`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:504](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprints.ts#L504)

Retrieves the currently active sprint for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Sprint object for the active sprint or null if no active sprint

## Http

GET /api/trpc/sprints.getActiveSprint
