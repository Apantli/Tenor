[**Tenor API Documentation**](../../README.md)

***

# Variable: changeTaskStatusProcedure

> `const` **changeTaskStatusProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `statusId?`: `string`; `taskId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:380](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/tasks.ts#L380)

Updates the status of a task.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the task
- taskId — ID of the task to modify
- statusId — ID of the new status

## Returns

Object containing success status.

## Http

PUT /api/trpc/tasks.changeTaskStatus
