[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteTaskProcedure

> `const` **deleteTaskProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskId`: `string`; \}; `output`: \{ `modifiedTaskIds`: `string`[]; `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:506](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L506)

Marks a task as deleted (soft delete).

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- taskId - String ID of the task to delete

## Returns

Object with success status and array of modified task IDs

## Http

POST /api/trpc/tasks.deleteTask
