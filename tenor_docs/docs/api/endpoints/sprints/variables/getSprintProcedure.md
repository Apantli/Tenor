[**Tenor API Documentation**](../../README.md)

***

# Variable: getSprintProcedure

> `const` **getSprintProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintId`: `string`; \}; `output`: `WithId`\<`Sprint`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:86](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprints.ts#L86)

Retrieves a specific sprint by ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintId - String ID of the sprint to retrieve

## Returns

Sprint object containing sprint details

## Http

GET /api/trpc/sprints.getSprint
