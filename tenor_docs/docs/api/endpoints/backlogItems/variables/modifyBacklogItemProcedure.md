[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyBacklogItemProcedure

> `const` **modifyBacklogItemProcedure**: `MutationProcedure`\<\{ `input`: \{ `backlogItemData`: \{ `complete?`: `boolean`; `createdAt?`: `Timestamp`; `description`: `string`; `name`: `string`; `priorityId?`: `string`; `size?`: `""` \| `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; \}; `backlogItemId`: `string`; `projectId`: `string`; \}; `output`: \{ `updatedBacklogItemIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/backlogItems.ts:180](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/backlogItems.ts#L180)

Modifies an existing backlog item with provided data.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- backlogItemId - String ID of the backlog item to modify
- backlogItemData - Updated data for the backlog item

## Returns

Object containing IDs of updated backlog items

## Http

POST /api/trpc/backlogItems.modifyBacklogItem
