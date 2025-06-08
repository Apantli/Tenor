[**Tenor API Documentation**](../../README.md)

***

# Variable: getTasksProcedure

> `const` **getTasksProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`Task`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:66](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L66)

Retrieves tasks for a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Array of tasks for the specified project

## Http

GET /api/trpc/tasks.getTasks
