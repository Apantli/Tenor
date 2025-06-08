[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogItemDetailProcedure

> `const` **getBacklogItemDetailProcedure**: `QueryProcedure`\<\{ `input`: \{ `backlogItemId`: `string`; `projectId`: `string`; \}; `output`: `BacklogItemFullDetail` & `object`; \}\>

Defined in: [tenor\_web/src/server/api/routers/backlogItems.ts:72](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/backlogItems.ts#L72)

Retrieves detailed information about a specific backlog item.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- backlogItemId - String ID of the backlog item to retrieve

## Returns

Detailed backlog item object with relationships and metadata

## Http

GET /api/trpc/backlogItems.getBacklogItemDetail
