[**Tenor API Documentation**](../../README.md)

***

# Variable: getTaskCountProcedure

> `const` **getTaskCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:715](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/tasks.ts#L715)

Retrieves the count of tasks in a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to count tasks in

## Returns

Number of tasks in the project.

## Http

GET /api/trpc/tasks.getTaskCount
