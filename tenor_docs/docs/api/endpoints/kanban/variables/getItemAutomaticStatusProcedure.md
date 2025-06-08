[**Tenor API Documentation**](../../README.md)

***

# Variable: getItemAutomaticStatusProcedure

> `const` **getItemAutomaticStatusProcedure**: `QueryProcedure`\<\{ `input`: \{ `itemId`: `string`; `projectId`: `string`; \}; `output`: `StatusTag`; \}\>

Defined in: [tenor\_web/src/server/api/routers/kanban.ts:277](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/kanban.ts#L277)

Determines the automatic status for a specific item based on its tasks and current state.

## Param

Object containing procedure parameters
Input object structure:
- projectId — The ID of the project containing the item
- itemId — The ID of the item to determine status for

## Returns

The automatically determined status ID for the item.

## Http

GET /api/trpc/kanban.getItemAutomaticStatus
