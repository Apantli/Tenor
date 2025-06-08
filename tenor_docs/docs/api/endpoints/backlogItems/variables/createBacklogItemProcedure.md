[**Tenor API Documentation**](../../README.md)

***

# Variable: createBacklogItemProcedure

> `const` **createBacklogItemProcedure**: `MutationProcedure`\<\{ `input`: \{ `backlogItemData`: \{ `complete?`: `boolean`; `createdAt?`: `Timestamp`; `deleted?`: `boolean`; `description`: `string`; `name`: `string`; `priorityId?`: `string`; `size?`: `""` \| `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; \}; `projectId`: `string`; \}; `output`: `WithId`\<`BacklogItem`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/backlogItems.ts:99](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/backlogItems.ts#L99)

Creates a new backlog item with automatic scrum ID assignment.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- backlogItemData - Data for the backlog item to create

## Returns

The created backlog item with its newly assigned ID

## Http

POST /api/trpc/backlogItems.createBacklogItem
