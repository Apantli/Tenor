[**Tenor API Documentation**](../../README.md)

***

# Variable: generateTasksProcedure

> `const` **generateTasksProcedure**: `MutationProcedure`\<\{ `input`: \{ `amount`: `number`; `itemId`: `string`; `itemType`: `"US"` \| `"IS"` \| `"IT"`; `projectId`: `string`; `prompt`: `string`; \} \| \{ `amount`: `number`; `itemDetail`: \{ `description`: `string`; `extra`: `string`; `name`: `string`; `priorityId?`: `string`; `size?`: `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; `tasks`: `object`[]; \}; `itemType`: `"US"` \| `"IS"` \| `"IT"`; `projectId`: `string`; `prompt`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:444](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/tasks.ts#L444)

Generates tasks for an item using AI.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to generate tasks for
- itemId — ID of the item to generate tasks for
- itemType — Type of the item (e.g., "US", "IS", "IT")
- amount — Number of tasks to generate
- prompt — Additional user prompt for task generation

## Returns

Array of generated tasks with Todo status.

## Http

POST /api/trpc/tasks.generateTasks
