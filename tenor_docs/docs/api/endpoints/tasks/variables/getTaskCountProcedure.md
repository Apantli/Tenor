[**Tenor API Documentation**](../../README.md)

***

# Variable: getTaskCountProcedure

> `const` **getTaskCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:792](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L792)

Retrieves the number of tasks inside a given project, regardless of their deleted status.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Number indicating the count of tasks in the project

## Http

GET /api/trpc/tasks.getTaskCount
