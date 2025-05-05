[**Tenor API Documentation**](../../README.md)

***

# Variable: getTaskDetailProcedure

> `const` **getTaskDetailProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskId`: `string`; \}; `output`: `TaskDetail`; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:280](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L280)

Retrieves detailed information about a specific task.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the task
- taskId — ID of the task to fetch details for

## Returns

Detailed information about the task.

## Http

GET /api/trpc/tasks.getTaskDetail
