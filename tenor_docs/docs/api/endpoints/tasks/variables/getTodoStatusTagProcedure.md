[**Tenor API Documentation**](../../README.md)

***

# Variable: getTodoStatusTagProcedure

> `const` **getTodoStatusTagProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:600](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L600)

Retrieves the Todo status tag for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Todo status tag or null

## Http

GET /api/trpc/tasks.getTodoStatusTag
