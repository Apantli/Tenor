[**Tenor API Documentation**](../../README.md)

***

# Variable: getTasksForKanbanProcedure

> `const` **getTasksForKanbanProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `cardTasks`: \{[`k`: `string`]: [`KanbanTaskCard`](../interfaces/KanbanTaskCard.md); \}; `columns`: `object`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/kanban.ts:181](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/kanban.ts#L181)

Retrieves tasks for the Kanban board of a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch tasks for

## Returns

Object containing columns and tasks for the Kanban board:
- columns — Array of columns with their details and associated task IDs
- cardTasks — Object mapping task IDs to their details

## Http

GET /api/trpc/kanban.getTasksForKanban
