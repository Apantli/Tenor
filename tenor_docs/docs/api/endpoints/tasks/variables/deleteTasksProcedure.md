[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteTasksProcedure

> `const` **deleteTasksProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskIds`: `string`[]; \}; `output`: \{ `modifiedTaskIds`: `string`[]; `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:549](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L549)

Marks multiple tasks as deleted (soft delete).

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- taskIds - Array of string IDs of tasks to delete

## Returns

Object with success status and array of modified task IDs

## Http

POST /api/trpc/tasks.deleteTasks
