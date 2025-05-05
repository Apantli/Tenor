[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteTaskProcedure

> `const` **deleteTaskProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:411](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/tasks.ts#L411)

Marks a task as deleted (soft delete).

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the task
- taskId — ID of the task to delete

## Returns

Object containing success status.

## Http

DELETE /api/trpc/tasks.deleteTask
