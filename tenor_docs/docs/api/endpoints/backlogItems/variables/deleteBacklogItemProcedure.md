[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteBacklogItemProcedure

> `const` **deleteBacklogItemProcedure**: `MutationProcedure`\<\{ `input`: \{ `backlogItemId`: `string`; `projectId`: `string`; \}; `output`: \{ `modifiedTaskIds`: `string`[]; `success`: `boolean`; `updatedBacklogItemIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/backlogItems.ts:231](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/backlogItems.ts#L231)

Deletes a backlog item by marking it as deleted and handling related tasks.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- backlogItemId - String ID of the backlog item to delete

## Returns

Object indicating success and IDs of modified items and tasks

## Http

POST /api/trpc/backlogItems.deleteBacklogItem
