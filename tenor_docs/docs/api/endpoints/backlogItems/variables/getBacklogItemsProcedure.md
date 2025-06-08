[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogItemsProcedure

> `const` **getBacklogItemsProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`BacklogItem`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/backlogItems.ts:50](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/backlogItems.ts#L50)

Retrieves all backlog items for a given project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to retrieve backlog items for

## Returns

Array of backlog items for the specified project

## Http

GET /api/trpc/backlogItems.getBacklogItems
