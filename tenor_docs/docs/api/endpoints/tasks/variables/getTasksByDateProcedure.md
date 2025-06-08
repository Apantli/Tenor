[**Tenor API Documentation**](../../README.md)

***

# Variable: getTasksByDateProcedure

> `const` **getTasksByDateProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `Record`\<`string`, `WithId`\<`Task`\>[]\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:87](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L87)

Retrieves tasks for a specific project grouped by their due dates.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Object with date strings as keys and arrays of tasks as values

## Http

GET /api/trpc/tasks.getTasksByDate
