[**Tenor API Documentation**](../../README.md)

***

# Variable: changeTaskStatusProcedure

> `const` **changeTaskStatusProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `statusId?`: `string`; `taskId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:468](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L468)

Updates the status of a task.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- taskId - String ID of the task to modify
- statusId - String ID of the new status

## Returns

void

## Http

POST /api/trpc/tasks.changeTaskStatus
