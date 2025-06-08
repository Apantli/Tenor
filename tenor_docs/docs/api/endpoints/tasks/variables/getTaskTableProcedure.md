[**Tenor API Documentation**](../../README.md)

***

# Variable: getTaskTableProcedure

> `const` **getTaskTableProcedure**: `QueryProcedure`\<\{ `input`: \{ `itemId`: `string`; `projectId`: `string`; \}; `output`: `TaskCol`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:226](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L226)

Gets tasks for a specific item in a table-friendly format.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- itemId - String ID of the item to get tasks for

## Returns

Array of tasks in a table-friendly format

## Http

GET /api/trpc/tasks.getTaskTable
