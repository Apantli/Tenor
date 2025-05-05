[**Tenor API Documentation**](../../README.md)

***

# Variable: changeTaskStatusProcedure

> `const` **changeTaskStatusProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `statusId?`: `string`; `taskId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:380](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L380)

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
