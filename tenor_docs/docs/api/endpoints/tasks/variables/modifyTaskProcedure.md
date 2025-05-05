[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyTaskProcedure

> `const` **modifyTaskProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskData`: \{ `assigneeId`: `string`; `description`: `string`; `dueDate`: `null` \| `Timestamp`; `name`: `string`; `size?`: `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `statusId`: `string`; \}; `taskId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:343](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/tasks.ts#L343)

Updates a task with new data.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the task
- taskId — ID of the task to modify
- taskData — Updated data for the task, excluding certain fields

## Returns

Object containing success status.

## Http

PUT /api/trpc/tasks.modifyTask
