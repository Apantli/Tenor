[**Tenor API Documentation**](../../README.md)

***

# Variable: generateTasksProcedure

> `const` **generateTasksProcedure**: `MutationProcedure`\<\{ `input`: \{ `amount`: `number`; `itemId`: `string`; `itemType`: `"US"` \| `"IS"` \| `"IT"`; `projectId`: `string`; `prompt`: `string`; \} \| \{ `amount`: `number`; `itemDetail`: \{ `createdAt?`: `Timestamp`; `description`: `string`; `extra`: `string`; `name`: `string`; `priorityId?`: `string`; `size?`: `""` \| `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; `tasks`: `object`[]; \}; `itemType`: `"US"` \| `"IS"` \| `"IT"`; `projectId`: `string`; `prompt`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:622](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L622)

Generates tasks for an item using AI.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- itemId - String ID of the item to generate tasks for (if included)
- itemType - The type of the item (US, IS, IT)
- amount - The number of tasks to generate
- prompt - Additional user prompt for task generation
- itemDetail - Optional details about the backlog item for which to generate tasks

## Returns

Array of generated tasks with Todo status

## Http

POST /api/trpc/tasks.generateTasks
