[**Tenor API Documentation**](../../README.md)

***

# Variable: getTaskDetailProcedure

> `const` **getTaskDetailProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskId`: `string`; \}; `output`: `TaskDetail`; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:252](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L252)

Gets detailed information about a specific task.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- taskId - String ID of the task

## Returns

Detailed task information

## Throws

If the task is not found

## Http

GET /api/trpc/tasks.getTaskDetail
