[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogItemCountProcedure

> `const` **getBacklogItemCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/backlogItems.ts:158](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/backlogItems.ts#L158)

Retrieves the count of backlog items within a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

The total number of backlog items in the project

## Http

GET /api/trpc/backlogItems.getBacklogItemCount
