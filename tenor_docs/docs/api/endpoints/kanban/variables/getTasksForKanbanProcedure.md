[**Tenor API Documentation**](../../README.md)

***

# Variable: getTasksForKanbanProcedure

> `const` **getTasksForKanbanProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `cardTasks`: \{[`k`: `string`]: `KanbanTaskCard`; \}; `columns`: `object`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/kanban.ts:52](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/kanban.ts#L52)

Retrieves tasks formatted for kanban board display.

## Param

Object containing procedure parameters
Input object structure:
- projectId — The ID of the project to retrieve tasks for

## Returns

Object containing columns and task cards organized for kanban view.

## Http

GET /api/trpc/kanban.getTasksForKanban
