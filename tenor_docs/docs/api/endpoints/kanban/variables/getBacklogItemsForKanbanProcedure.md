[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogItemsForKanbanProcedure

> `const` **getBacklogItemsForKanbanProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `cardItems`: \{[`k`: `string`]: [`KanbanItemCard`](../interfaces/KanbanItemCard.md); \}; `columns`: `object`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/kanban.ts:248](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/kanban.ts#L248)

Retrieves backlog items for the Kanban board of a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch backlog items for

## Returns

Object containing columns and backlog items for the Kanban board:
- columns — Array of columns with their details and associated item IDs
- cardItems — Object mapping item IDs to their details

## Http

GET /api/trpc/kanban.getBacklogItemsForKanban
