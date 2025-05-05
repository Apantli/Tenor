[**Tenor API Documentation**](../../README.md)

***

# Variable: getItemAutomaticStatusProcedure

> `const` **getItemAutomaticStatusProcedure**: `QueryProcedure`\<\{ `input`: \{ `itemId`: `string`; `projectId`: `string`; \}; `output`: `StatusTag`; \}\>

Defined in: [tenor\_web/src/server/api/routers/kanban.ts:441](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/kanban.ts#L441)

Retrieves the automatic status for a backlog item based on its tasks.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the backlog item
- itemId — ID of the backlog item to determine the status for

## Returns

Object containing the automatic status details for the backlog item.

## Http

GET /api/trpc/kanban.getItemAutomaticStatus
