[**Tenor API Documentation**](../../README.md)

***

# Variable: getTasksTableFriendlyProcedure

> `const` **getTasksTableFriendlyProcedure**: `QueryProcedure`\<\{ `input`: \{ `itemId`: `string`; `projectId`: `string`; \}; `output`: [`TaskCol`](../interfaces/TaskCol.md)[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:234](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/tasks.ts#L234)

Retrieves tasks for a specific item in a table-friendly format.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch tasks from
- itemId — ID of the item to fetch tasks for

## Returns

Array of tasks formatted for table display.

## Http

GET /api/trpc/tasks.getTasksTableFriendly
