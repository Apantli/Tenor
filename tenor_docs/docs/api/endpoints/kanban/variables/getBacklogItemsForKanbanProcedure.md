[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogItemsForKanbanProcedure

> `const` **getBacklogItemsForKanbanProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `cardItems`: \{[`k`: `string`]: `KanbanItemCard`; \}; `columns`: `object`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/kanban.ts:165](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/kanban.ts#L165)

Retrieves backlog items (user stories, issues, items) formatted for kanban board display.

## Param

Object containing procedure parameters
Input object structure:
- projectId — The ID of the project to retrieve backlog items for

## Returns

Object containing columns and item cards organized for kanban view.

## Http

GET /api/trpc/kanban.getBacklogItemsForKanban
