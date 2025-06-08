[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyBacklogItemTagsProcedure

> `const` **modifyBacklogItemTagsProcedure**: `MutationProcedure`\<\{ `input`: \{ `backlogItemId`: `string`; `priorityId?`: `string`; `projectId`: `string`; `size?`: `string`; `statusId?`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/backlogItems.ts:281](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/backlogItems.ts#L281)

Modifies specific tag properties of an existing backlog item.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- backlogItemId - String ID of the backlog item to modify
- priorityId - Optional string ID of the priority tag to set
- size - Optional string size value to set
- statusId - Optional string ID of the status tag to set

## Returns

Void on success

## Http

POST /api/trpc/backlogItems.modifyBacklogItemTags
