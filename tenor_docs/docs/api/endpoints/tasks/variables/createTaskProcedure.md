[**Tenor API Documentation**](../../README.md)

***

# Variable: createTaskProcedure

> `const` **createTaskProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskData`: \{ `assigneeId`: `string`; `deleted?`: `boolean`; `description`: `string`; `dueDate`: `null` \| `Timestamp`; `itemId`: `string`; `itemType`: `"US"` \| `"IS"` \| `"IT"`; `name`: `string`; `size?`: `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `statusId`: `string`; \}; \}; `output`: \{ `success`: `boolean`; `taskId`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:192](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L192)

Creates a new task in the specified project and assigns it a scrumId.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project where the task will be created
- taskData — Data for the new task, excluding the scrumId field

## Returns

Object containing success status and the ID of the created task.

## Http

POST /api/trpc/tasks.createTask
